import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["admin", "supervisor"].includes(user.role)) return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  const supabase = await createClient();
  let query = supabase.from("invoices").select("*, users!invoices_supervisor_id_fkey(id, full_name)").order("period_month", { ascending: false });
  if (user.role === "supervisor") query = query.eq("supervisor_id", user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Gagal mengambil invoice" }, { status: 500 });
  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat membuat invoice" }, { status: 403 });
  const body = await request.json();
  const period = typeof body.period === "string" && /^\d{4}-\d{2}$/.test(body.period) ? body.period : "";
  const supervisorId = Number(body.supervisor_id);
  if (!period || !Number.isInteger(supervisorId)) return NextResponse.json({ error: "Periode atau supervisor tidak valid" }, { status: 400 });
  const supabase = await createClient();
  const periodDate = `${period}-01`;
  const { data: settings } = await supabase.from("invoice_settings").select("*").eq("id", 1).maybeSingle();
  const { data: override } = await supabase.from("invoice_supervisor_rates").select("rate").eq("supervisor_id", supervisorId).maybeSingle();
  const rate = Number(override?.rate ?? settings?.global_rate ?? 0);
  const dueDays = Number(settings?.due_days ?? 14);
  const due = new Date(); due.setUTCDate(due.getUTCDate() + dueDays);
  const number = `INV-${period.replace("-", "")}-S${supervisorId}-${Date.now().toString().slice(-5)}`;
  const { data: invoice, error } = await supabase.from("invoices").insert({ invoice_number: number, supervisor_id: supervisorId, period_month: periodDate, due_at: due.toISOString(), rate, subtotal: 0, total: 0 }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Invoice periode tersebut sudah ada" : "Gagal membuat invoice" }, { status: 400 });
  return NextResponse.json({ invoice }, { status: 201 });
}
