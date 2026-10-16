import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleUserIds } from "@/lib/hierarchy";

type UserRow = {
  id: number;
  full_name: string;
  role: string;
  leader_id: number | null;
  supervisor_id: number | null;
};

function getRange(value: string | null): { start: Date; end: Date } | null {
  const today = new Date();
  const fallback = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(today);
  const [year, month] = (value && /^\d{4}-\d{2}$/.test(value) ? value : fallback)
    .split("-")
    .map(Number);
  const from = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const to = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : `${year}-${String(month).padStart(2, "0")}-${String(endDate.getUTCDate()).padStart(2, "0")}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return null;
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(`${to}T00:00:00+07:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return null;
  return { start, end };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !["admin", "supervisor", "leader"].includes(user.role)) {
    return NextResponse.json({ error: "Anda tidak memiliki akses ke laporan upload" }, { status: 403 });
  }
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  let range = getRange(null);
  if (fromParam && toParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) && /^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
    const start = new Date(`${fromParam}T00:00:00+07:00`);
    const end = new Date(`${toParam}T00:00:00+07:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    range = { start, end };
  }
  if (!range || range.start >= range.end) {
    return NextResponse.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
  }
  const supabase = await createClient();
  const visibleIds = await getVisibleUserIds(user);
  let logsQuery = supabase
    .from("upload_logs")
    .select("chat_id, user_id, uploaded_at")
    .gte("uploaded_at", range.start.toISOString())
    .lt("uploaded_at", range.end.toISOString())
    .order("uploaded_at", { ascending: true });
  if (visibleIds.length > 0) logsQuery = logsQuery.in("user_id", visibleIds);
  const { data: logs, error: logsError } = await logsQuery;
  if (logsError) return NextResponse.json({ error: "Gagal mengambil data upload" }, { status: 500 });

  const firstByChat = new Map<string, { user_id: number; uploaded_at: string }>();
  for (const log of logs ?? []) {
    if (log.chat_id && !firstByChat.has(log.chat_id)) firstByChat.set(log.chat_id, log);
  }
  const chatIds = [...firstByChat.keys()];
  const { data: chats, error: chatsError } = chatIds.length
    ? await supabase.from("chats").select("chat_id, analysis_json, outcome, deleted_at").in("chat_id", chatIds)
    : { data: [], error: null };
  if (chatsError) return NextResponse.json({ error: "Gagal memeriksa status analisis" }, { status: 500 });
  const successful = new Set((chats ?? [])
    .filter((chat) => !chat.deleted_at && chat.analysis_json && chat.outcome !== "error")
    .map((chat) => chat.chat_id));
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, full_name, role, leader_id, supervisor_id");
  if (usersError) return NextResponse.json({ error: "Gagal mengambil struktur tim" }, { status: 500 });
  const userMap = new Map((users ?? []).map((row) => [row.id, row as UserRow]));
  const supervisors = new Map<number, { id: number; name: string; total: number; uploaders: Map<number, { id: number; name: string; role: string; total: number }> }>();
  for (const [chatId, log] of firstByChat) {
    if (!successful.has(chatId)) continue;
    const uploader = userMap.get(log.user_id);
    if (!uploader) continue;
    const leader = uploader.role === "leader" ? uploader : uploader.leader_id ? userMap.get(uploader.leader_id) : undefined;
    const supervisor = uploader.role === "supervisor"
      ? uploader
      : uploader.supervisor_id
        ? userMap.get(uploader.supervisor_id)
        : leader?.supervisor_id
          ? userMap.get(leader.supervisor_id)
          : undefined;
    const supervisorId = supervisor?.id ?? 0;
    const supervisorEntry = supervisors.get(supervisorId) ?? { id: supervisorId, name: supervisor?.full_name ?? "Supervisor belum ditetapkan", total: 0, uploaders: new Map() };
    supervisorEntry.total++;
    const uploaderEntry = supervisorEntry.uploaders.get(uploader.id) ?? { id: uploader.id, name: uploader.full_name, role: uploader.role, total: 0 };
    uploaderEntry.total++;
    supervisorEntry.uploaders.set(uploader.id, uploaderEntry);
    supervisors.set(supervisorId, supervisorEntry);
  }
  const rows = [...supervisors.values()].map((supervisor) => ({
    supervisor_id: supervisor.id || null,
    supervisor_name: supervisor.name,
    total: supervisor.total,
    uploaders: [...supervisor.uploaders.values()].sort((a, b) => b.total - a.total),
  }));
  return NextResponse.json({ from: range.start.toISOString(), to: range.end.toISOString(), total: rows.reduce((sum, row) => sum + row.total, 0), supervisors: rows });
}
