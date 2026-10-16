import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !["admin", "supervisor"].includes(user.role)) return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  let query = supabase.from("invoices").select("*, invoice_items(*), users!invoices_supervisor_id_fkey(id, full_name)").eq("id", id);
  if (user.role === "supervisor") query = query.eq("supervisor_id", user.id);
  const { data, error } = await query.single();
  if (error || !data) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  const { data: settings } = await supabase.from("invoice_settings").select("payment_instructions").eq("id", 1).maybeSingle();
  return NextResponse.json({ invoice: { ...data, invoice_settings: settings } });
}
