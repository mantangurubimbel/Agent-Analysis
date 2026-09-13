import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ChatRecord } from "@/types/database";

export async function getChatsForCurrentUser(limit = 50): Promise<ChatRecord[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase.from("chats").select("*").order("created_at", { ascending: false }).limit(limit);

  if (user.role === "agent") {
    query = query.eq("user_id", user.id);
  } else if (user.role === "leader" && user.team) {
    const { data: teamUsers } = await supabase.from("users").select("id").eq("team", user.team);
    const teamIds = (teamUsers ?? []).map((u) => u.id);
    if (teamIds.length > 0) query = query.in("user_id", teamIds);
  }

  const { data, error } = await query;
  if (error) { console.error("Error fetching chats:", error); return []; }
  return (data ?? []) as ChatRecord[];
}

export async function getStatsForCurrentUser() {
  const chats = await getChatsForCurrentUser(1000);
  const total = chats.length;
  const closed = chats.filter((c) => c.outcome === "closed").length;
  const noResponse = chats.filter((c) => c.outcome === "no_response").length;
  const rejected = chats.filter((c) => c.outcome === "rejected").length;
  const pending = chats.filter((c) => c.outcome === "pending").length;
  const scoredChats = chats.filter((c) => c.agent_score !== null);
  const avgScore = scoredChats.length > 0 ? scoredChats.reduce((s, c) => s + (c.agent_score ?? 0), 0) / scoredChats.length : 0;

  return {
    total, closed, noResponse, rejected, pending,
    closingRate: total > 0 ? Math.round((closed / total) * 100) : 0,
    avgScore: Math.round(avgScore),
  };
}

export async function getChatById(chatId: string): Promise<ChatRecord | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("chat_id", chatId)
    .single();

  if (error || !data) {
    console.error("Error fetching chat:", error);
    return null;
  }

  // Cek akses
  if (user.role === "agent" && data.user_id !== user.id) {
    return null;
  }

  return data as ChatRecord;
}

export async function getTranscript(chatId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chats")
    .select("analysis_json")
    .eq("chat_id", chatId)
    .single();

  // Transcript tidak disimpan di DB, hanya di file .txt asli
  // Kita reconstruct dari analysis_json kalau ada
  return "";
}


export interface LeaderboardEntry {
  agent_id: number;
  agent_name: string;
  team: string | null;
  total: number;
  closed: number;
  no_response: number;
  rejected: number;
  pending: number;
  closing_rate: number;
  avg_score: number;
  avg_engagement: number;
}

export async function getLeaderboard(days = 30): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("chats")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  // Filter berdasarkan role
  if (user.role === "agent") {
    query = query.eq("user_id", user.id);
  } else if (user.role === "leader" && user.team) {
    const { data: teamUsers } = await supabase
      .from("users")
      .select("id")
      .eq("team", user.team);
    const teamIds = (teamUsers ?? []).map((u) => u.id);
    if (teamIds.length > 0) {
      query = query.in("user_id", teamIds);
    }
  }

  const { data: chats } = await query;
  if (!chats || chats.length === 0) return [];

  // Ambil semua user untuk mapping
  const { data: users } = await supabase.from("users").select("id, full_name, team");
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  // Group by user_id
  const byAgent = new Map<number, ChatRecord[]>();
  for (const c of chats as ChatRecord[]) {
    if (!byAgent.has(c.user_id)) byAgent.set(c.user_id, []);
    byAgent.get(c.user_id)!.push(c);
  }

  // Hitung stats per agent
  const entries: LeaderboardEntry[] = [];
  for (const [agentId, recs] of byAgent.entries()) {
    const total = recs.length;
    const closed = recs.filter((r) => r.outcome === "closed").length;
    const no_response = recs.filter((r) => r.outcome === "no_response").length;
    const rejected = recs.filter((r) => r.outcome === "rejected").length;
    const pending = recs.filter((r) => r.outcome === "pending").length;

    const scoredChats = recs.filter((r) => r.agent_score !== null);
    const avg_score =
      scoredChats.length > 0
        ? scoredChats.reduce((s, r) => s + (r.agent_score ?? 0), 0) /
          scoredChats.length
        : 0;

    const engagedChats = recs.filter((r) => r.engagement_score !== null);
    const avg_engagement =
      engagedChats.length > 0
        ? engagedChats.reduce((s, r) => s + (r.engagement_score ?? 0), 0) /
          engagedChats.length
        : 0;

    const userInfo = userMap.get(agentId);
    entries.push({
      agent_id: agentId,
      agent_name: userInfo?.full_name ?? recs[0].agent_name,
      team: userInfo?.team ?? null,
      total,
      closed,
      no_response,
      rejected,
      pending,
      closing_rate: total > 0 ? Math.round((closed / total) * 100) : 0,
      avg_score: Math.round(avg_score),
      avg_engagement: Math.round(avg_engagement),
    });
  }

  // Sort by closing rate
  entries.sort((a, b) => b.closing_rate - a.closing_rate || b.avg_score - a.avg_score);
  return entries;
}

export interface TrendPoint {
  date: string;
  total: number;
  closed: number;
  closing_rate: number;
}

export async function getTrendData(days = 14): Promise<TrendPoint[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("chats")
    .select("created_at, outcome")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (user.role === "agent") {
    query = query.eq("user_id", user.id);
  } else if (user.role === "leader" && user.team) {
    const { data: teamUsers } = await supabase
      .from("users")
      .select("id")
      .eq("team", user.team);
    const teamIds = (teamUsers ?? []).map((u) => u.id);
    if (teamIds.length > 0) {
      query = query.in("user_id", teamIds);
    }
  }

  const { data: chats } = await query;
  if (!chats || chats.length === 0) return [];

  // Group by date (YYYY-MM-DD)
  const byDate = new Map<string, { total: number; closed: number }>();
  for (const c of chats) {
    const date = new Date(c.created_at).toISOString().slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { total: 0, closed: 0 });
    const entry = byDate.get(date)!;
    entry.total++;
    if (c.outcome === "closed") entry.closed++;
  }

  // Build trend array
  const result: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = byDate.get(key) ?? { total: 0, closed: 0 };
    result.push({
      date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      total: entry.total,
      closed: entry.closed,
      closing_rate:
        entry.total > 0 ? Math.round((entry.closed / entry.total) * 100) : 0,
    });
  }

  return result;
}

export interface ObjectionStat {
  type: string;
  count: number;
}

export async function getObjectionStats(days = 30): Promise<ObjectionStat[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("chats")
    .select("analysis_json")
    .gte("created_at", since.toISOString())
    .not("analysis_json", "is", null);

  if (user.role === "agent") {
    query = query.eq("user_id", user.id);
  } else if (user.role === "leader" && user.team) {
    const { data: teamUsers } = await supabase
      .from("users")
      .select("id")
      .eq("team", user.team);
    const teamIds = (teamUsers ?? []).map((u) => u.id);
    if (teamIds.length > 0) {
      query = query.in("user_id", teamIds);
    }
  }

  const { data } = await query;
  if (!data) return [];

  // Count objections per type
  const counts: Record<string, number> = {};
  for (const row of data) {
    try {
      const analysis = JSON.parse(row.analysis_json ?? "{}");
      for (const obj of analysis.objections ?? []) {
        counts[obj.type] = (counts[obj.type] ?? 0) + 1;
      }
    } catch {}
  }

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}
