import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  isBroadcastRole,
  normalizeFilterValues,
} from "@/lib/broadcast-filters";
import { getBroadcastScope, validateBroadcastFilters } from "@/lib/broadcast-access";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || !["admin", "supervisor", "leader"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { filter_active } = body;
    const filterRoles = normalizeFilterValues(body.filter_role);
    const filterTeams = normalizeFilterValues(body.filter_team);

    if (filterRoles.some((role) => !isBroadcastRole(role))) {
      return NextResponse.json({ error: "Filter role tidak valid" }, { status: 400 });
    }

    const scope = await getBroadcastScope(supabase, user);
    const scopeError = validateBroadcastFilters(filterRoles, filterTeams, scope);
    if (scopeError) {
      return NextResponse.json({ error: scopeError }, { status: 403 });
    }

    // Query penerima
    let query = supabase
      .from("users")
      .select("id, telegram_id, full_name, role, team", { count: "exact" })
      .gt("telegram_id", 0);

    if (scope.userIds) {
      query = scope.userIds.length > 0 ? query.in("id", scope.userIds) : query.eq("id", -1);
    }

    if (filterRoles.length > 0) {
      query = query.in("role", filterRoles);
    }

    if (filterTeams.length > 0) {
      query = query.in("team", filterTeams);
    }

    if (filter_active !== false) {
      query = query.eq("is_active", true);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by role untuk info tambahan
    const byRole: Record<string, number> = {};
    for (const r of data ?? []) {
      byRole[r.role] = (byRole[r.role] || 0) + 1;
    }

    return NextResponse.json({
      count: count ?? 0,
      by_role: byRole,
      sample: (data ?? []).slice(0, 3).map((r) => ({
        full_name: r.full_name,
        role: r.role,
        team: r.team,
      })),
    });
  } catch (e) {
    console.error("Preview error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
