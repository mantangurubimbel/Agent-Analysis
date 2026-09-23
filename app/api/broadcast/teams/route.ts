import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageBroadcast, getBroadcastScope } from "@/lib/broadcast-access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageBroadcast(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const scope = await getBroadcastScope(supabase, user);
    return NextResponse.json({ teams: scope.teams, roles: scope.allowedRoles });
  } catch (error) {
    console.error("Gagal mengambil cakupan broadcast:", error);
    return NextResponse.json({ error: "Gagal mengambil cakupan broadcast" }, { status: 500 });
  }
}
