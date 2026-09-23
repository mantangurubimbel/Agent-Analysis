import type { User } from "@/types/database";

export const BROADCAST_MANAGERS = ["admin", "supervisor", "leader"] as const;

export interface BroadcastScope {
  allowedRoles: User["role"][];
  userIds: number[] | null;
  teams: string[];
  senderIds: number[] | null;
}

interface ScopeUser {
  id: number;
  telegram_id: number;
  role: User["role"];
  team: string | null;
  leader_id: number | null;
  supervisor_id: number | null;
  is_active: boolean | null;
}

export function canManageBroadcast(role: string): boolean {
  return BROADCAST_MANAGERS.includes(role as (typeof BROADCAST_MANAGERS)[number]);
}

/**
 * Menghasilkan cakupan penerima sesuai hierarki user yang sedang login.
 */
export async function getBroadcastScope(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  user: User
): Promise<BroadcastScope> {
  const { data, error } = await supabase
    .from("users")
    .select("id, telegram_id, role, team, leader_id, supervisor_id, is_active");

  if (error) throw new Error(error.message);

  const users = (data ?? []) as ScopeUser[];
  if (user.role === "admin") {
    return {
      allowedRoles: ["agent", "leader", "supervisor", "admin"],
      userIds: null,
      teams: uniqueActiveTeams(users),
      senderIds: null,
    };
  }

  let scopedUsers: ScopeUser[];
  let allowedRoles: User["role"][];

  if (user.role === "supervisor") {
    const leaderIds = users
      .filter((candidate) => candidate.role === "leader" && candidate.supervisor_id === user.id)
      .map((candidate) => candidate.id);
    scopedUsers = users.filter(
      (candidate) =>
        (candidate.role === "leader" && candidate.supervisor_id === user.id) ||
        (candidate.role === "agent" &&
          (candidate.supervisor_id === user.id ||
            (candidate.leader_id !== null && leaderIds.includes(candidate.leader_id))))
    );
    allowedRoles = ["leader", "agent"];
  } else {
    scopedUsers = users.filter(
      (candidate) => candidate.role === "agent" && candidate.leader_id === user.id
    );
    allowedRoles = ["agent"];
  }

  return {
    allowedRoles,
    userIds: scopedUsers.map((candidate) => candidate.id),
    teams: uniqueActiveTeams(scopedUsers),
    senderIds: [user.telegram_id, ...scopedUsers.map((candidate) => candidate.telegram_id)],
  };
}

export function canAccessBroadcastSender(scope: BroadcastScope, sentBy: number): boolean {
  return scope.senderIds === null || scope.senderIds.includes(sentBy);
}

export function validateBroadcastFilters(
  filterRoles: string[],
  filterTeams: string[],
  scope: BroadcastScope
): string | null {
  if (filterRoles.some((role) => !scope.allowedRoles.includes(role as User["role"]))) {
    return "Filter role tidak sesuai dengan cakupan hierarki Anda";
  }

  if (filterTeams.some((team) => !scope.teams.includes(team))) {
    return "Filter team tidak sesuai dengan cakupan hierarki Anda";
  }

  return null;
}

function uniqueActiveTeams(users: ScopeUser[]): string[] {
  return Array.from(
    new Set(
      users
        .filter((user) => user.is_active !== false)
        .map((user) => user.team?.trim())
        .filter((team): team is string => Boolean(team))
    )
  ).sort();
}
