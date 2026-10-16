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
  const start = new Date(`${period}-01T00:00:00+07:00`);
  const end = new Date(`${period}-01T00:00:00+07:00`); end.setUTCMonth(end.getUTCMonth() + 1);
  const [{ data: logs }, { data: users }] = await Promise.all([
    supabase.from("upload_logs").select("chat_id, user_id").gte("uploaded_at", start.toISOString()).lt("uploaded_at", end.toISOString()),
    supabase.from("users").select("id, full_name, role, leader_id, supervisor_id"),
  ]);
  const userMap = new Map((users ?? []).map((row) => [row.id, row]));
  const chatIds = [...new Set((logs ?? []).map((row) => row.chat_id).filter(Boolean))];
  const { data: chats } = chatIds.length ? await supabase.from("chats").select("chat_id, analysis_json, outcome, deleted_at").in("chat_id", chatIds) : { data: [] };
  const successful = new Set((chats ?? []).filter((chat) => !chat.deleted_at && chat.analysis_json && chat.outcome !== "error").map((chat) => chat.chat_id));
  const counts = new Map<number, number>();
  const countedChats = new Set<string>();
  for (const log of logs ?? []) {
    if (!successful.has(log.chat_id) || countedChats.has(log.chat_id)) continue;
    countedChats.add(log.chat_id);
    const uploader = userMap.get(log.user_id);
    const leader = uploader?.role === "leader" ? uploader : uploader?.leader_id ? userMap.get(uploader.leader_id) : undefined;
    const supervisor = uploader?.role === "supervisor" ? uploader : uploader?.supervisor_id ? userMap.get(uploader.supervisor_id) : leader?.supervisor_id ? userMap.get(leader.supervisor_id) : undefined;
    if (supervisor?.id === supervisorId) counts.set(log.user_id, (counts.get(log.user_id) ?? 0) + 1);
  }
  const totalChats = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const { data: invoice, error } = await supabase.from("invoices").insert({ invoice_number: number, supervisor_id: supervisorId, period_month: periodDate, due_at: due.toISOString(), rate, total_chats: totalChats, subtotal: totalChats * rate, total: totalChats * rate }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Invoice periode tersebut sudah ada" : "Gagal membuat invoice" }, { status: 400 });
  if (invoice && counts.size > 0) {
    await supabase.from("invoice_items").insert([...counts.entries()].map(([uploaderId, count]) => ({ invoice_id: invoice.id, uploader_id: uploaderId, uploader_name_snapshot: userMap.get(uploaderId)?.full_name ?? "Uploader", uploader_role: userMap.get(uploaderId)?.role ?? "unknown", chat_count: count, rate, amount: count * rate })));
  }
  return NextResponse.json({ invoice }, { status: 201 });
}
