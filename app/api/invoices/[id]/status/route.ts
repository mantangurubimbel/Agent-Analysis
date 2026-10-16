import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat mengubah status" }, { status: 403 });
  const { id } = await params;
  const { status } = await request.json();
  if (!["issued", "paid", "cancelled"].includes(status)) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  const supabase = await createClient();
  const update = status === "paid" ? { status, paid_at: new Date().toISOString(), paid_by: user.id } : { status, paid_at: null, paid_by: null };
  const { data, error } = await supabase.from("invoices").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Gagal mengubah status invoice" }, { status: 500 });
  return NextResponse.json({ invoice: data });
}
