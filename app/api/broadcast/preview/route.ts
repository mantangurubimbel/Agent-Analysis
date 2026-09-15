import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || !["admin", "supervisor"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { filter_role, filter_team, filter_active } = body;

    // Query penerima
    let query = supabase
      .from("users")
      .select("id, telegram_id, full_name, role, team", { count: "exact" })
      .gt("telegram_id", 0);

    if (filter_role && filter_role !== "all") {
      query = query.eq("role", filter_role);
    }

    if (filter_team && filter_team !== "all") {
      query = query.eq("team", filter_team);
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
