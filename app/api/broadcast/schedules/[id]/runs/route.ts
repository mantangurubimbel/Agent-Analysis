import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessBroadcastSender, canManageBroadcast, getBroadcastScope } from "@/lib/broadcast-access";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user || !canManageBroadcast(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const id = Number((await context.params).id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID jadwal tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();
    const scope = await getBroadcastScope(supabase, user);
    const { data: schedule, error: scheduleError } = await supabase
      .from("broadcast_schedules")
      .select("id, created_by")
      .eq("id", id)
      .maybeSingle();
    if (scheduleError || !schedule || !canAccessBroadcastSender(scope, schedule.created_by)) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan atau tidak dapat diakses" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("broadcast_schedule_runs")
      .select("id, broadcast_id, scheduled_for, executed_at, status, error_message, created_at")
      .eq("schedule_id", id)
      .order("scheduled_for", { ascending: false });
    if (error) {
      console.error("Gagal mengambil riwayat jadwal:", error.message);
      return NextResponse.json({ error: "Gagal mengambil riwayat jadwal" }, { status: 500 });
    }
    return NextResponse.json({ runs: data ?? [] });
  } catch (error) {
    console.error("Broadcast schedule runs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
