import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const supabase = await createClient();
  const [{ data: settings }, { data: rates }, { data: supervisors }] = await Promise.all([
    supabase.from("invoice_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("invoice_supervisor_rates").select("supervisor_id, rate"),
    supabase.from("users").select("id, full_name").eq("role", "supervisor").order("full_name"),
  ]);
  return NextResponse.json({ settings: settings ?? { global_rate: 0, due_days: 14, grace_days: 0, currency: "IDR", payment_instructions: "" }, rates: rates ?? [], supervisors: supervisors ?? [] });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const body = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoice_settings").upsert({ id: 1, global_rate: Number(body.global_rate) || 0, due_days: Number(body.due_days) || 14, grace_days: Number(body.grace_days) || 0, currency: String(body.currency || "IDR"), payment_instructions: String(body.payment_instructions || ""), updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "id" }).select().single();
  if (error) return NextResponse.json({ error: "Gagal menyimpan pengaturan invoice" }, { status: 500 });
  if (Array.isArray(body.rates)) for (const item of body.rates) if (Number.isInteger(Number(item.supervisor_id)) && Number(item.rate) >= 0) await supabase.from("invoice_supervisor_rates").upsert({ supervisor_id: Number(item.supervisor_id), rate: Number(item.rate), updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "supervisor_id" });
  return NextResponse.json({ settings: data });
}
