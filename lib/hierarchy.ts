import { createClient } from "@/lib/supabase/server";
import type { User, TeamStructure } from "@/types/database";

/**
 * Ambil semua user_id yang "visible" untuk current user.
 * Return [] artinya lihat semua (untuk admin).
 */
export async function getVisibleUserIds(user: User): Promise<number[]> {
  const supabase = await createClient();

  // Admin → lihat semua (return empty = no filter)
  if (user.role === "admin") {
    return [];
  }

  // Supervisor → lihat semua leader + agent di bawahnya
  if (user.role === "supervisor") {
    const { data: leaders } = await supabase
      .from("users")
      .select("id")
      .eq("supervisor_id", user.id)
      .eq("is_active", true);

    const leaderIds = (leaders ?? []).map((l) => l.id);

    if (leaderIds.length === 0) return [user.id];

    const { data: agents } = await supabase
      .from("users")
      .select("id")
      .in("leader_id", leaderIds)
      .eq("is_active", true);

    const agentIds = (agents ?? []).map((a) => a.id);

    return [user.id, ...leaderIds, ...agentIds];
  }

  // Leader → lihat agent di bawahnya
  if (user.role === "leader") {
    const { data: agents } = await supabase
      .from("users")
      .select("id")
      .eq("leader_id", user.id)
      .eq("is_active", true);

    const agentIds = (agents ?? []).map((a) => a.id);

    return [user.id, ...agentIds];
  }

  // Agent → hanya diri sendiri
  return [user.id];
}

/**
 * Ambil struktur tim lengkap (untuk halaman Team).
 */
export async function getTeamStructure(user: User): Promise<TeamStructure> {
  const supabase = await createClient();

  if (user.role === "leader") {
    const { data: agents } = await supabase
      .from("users")
      .select("id, full_name, telegram_id, is_active, leader_id, supervisor_id, role")
      .eq("leader_id", user.id)
      .eq("is_active", true)
      .order("full_name");

    return {
      agents: (agents ?? []) as User[],
      leaders: [],
      supervisors: [],
    };
  }

  if (user.role === "supervisor") {
    const { data: leaders } = await supabase
      .from("users")
      .select("id, full_name, telegram_id, is_active, leader_id, supervisor_id, role")
      .eq("supervisor_id", user.id)
      .eq("is_active", true)
      .order("full_name");

    const leaderIds = (leaders ?? []).map((l) => l.id);

    const { data: agents } =
      leaderIds.length > 0
        ? await supabase
            .from("users")
            .select("id, full_name, telegram_id, is_active, leader_id, supervisor_id, role")
            .in("leader_id", leaderIds)
            .eq("is_active", true)
            .order("full_name")
        : { data: [] };

    return {
      agents: (agents ?? []) as User[],
      leaders: (leaders ?? []) as User[],
      supervisors: [],
    };
  }

  if (user.role === "admin") {
    const { data: supervisors } = await supabase
      .from("users")
      .select("id, full_name, telegram_id, is_active, role")
      .eq("role", "supervisor")
      .eq("is_active", true)
      .order("full_name");

    const { data: leaders } = await supabase
      .from("users")
      .select("id, full_name, telegram_id, is_active, supervisor_id, role")
      .eq("role", "leader")
      .eq("is_active", true)
      .order("full_name");

    const { data: agents } = await supabase
      .from("users")
      .select("id, full_name, telegram_id, is_active, leader_id, role")
      .eq("role", "agent")
      .eq("is_active", true)
      .order("full_name");

    return {
      agents: (agents ?? []) as User[],
      leaders: (leaders ?? []) as User[],
      supervisors: (supervisors ?? []) as User[],
    };
  }

  return { agents: [], leaders: [], supervisors: [] };
}
