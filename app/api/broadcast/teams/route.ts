import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["admin", "supervisor"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("team")
    .not("team", "is", null)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ambil unique team
  const teamsSet = new Set<string>();
  for (const row of data ?? []) {
    if (row.team && row.team.trim()) {
      teamsSet.add(row.team.trim());
    }
  }

  const teams = Array.from(teamsSet).sort();

  return NextResponse.json({ teams });
}
