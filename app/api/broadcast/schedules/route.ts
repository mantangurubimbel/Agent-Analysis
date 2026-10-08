import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  canManageBroadcast,
  canAccessBroadcastSender,
  getBroadcastScope,
  validateBroadcastFilters,
} from "@/lib/broadcast-access";
import { isBroadcastRole, normalizeFilterValues } from "@/lib/broadcast-filters";

type ScheduleType = "once" | "daily" | "weekly";

function parseWibDateTime(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDbTimestamp(date: Date): string {
  return date.toISOString().replace("Z", "");
}

function nextWeeklyDate(start: Date, weekday: number, localValue: string): Date {
  // Hitung hari berdasarkan kalender WIB, bukan tanggal UTC (yang bisa mundur
  // satu hari untuk jam 00:00–06:59 WIB).
  const calendarDate = localValue.slice(0, 10);
  const currentWeekday = new Date(`${calendarDate}T00:00:00Z`).getUTCDay() || 7;
  const daysUntil = (weekday - currentWeekday + 7) % 7;
  return new Date(start.getTime() + daysUntil * 24 * 60 * 60 * 1000);
}

async function authorize() {
  const user = await getCurrentUser();
  if (!user || !canManageBroadcast(user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }
  return { user, response: null };
}

export async function GET() {
  try {
    const { user, response } = await authorize();
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = await createClient();
    const scope = await getBroadcastScope(supabase, user);
    let query = supabase
      .from("broadcast_schedules")
      .select("*")
      .order("next_run_at", { ascending: true });

    if (scope.senderIds) {
      query = scope.senderIds.length
        ? query.in("created_by", scope.senderIds)
        : query.eq("created_by", -1);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Gagal mengambil jadwal broadcast:", error.message);
      return NextResponse.json({ error: "Gagal mengambil jadwal broadcast" }, { status: 500 });
    }

    const creatorIds = [...new Set((data ?? []).map((schedule) => schedule.created_by))];
    const { data: creators, error: creatorError } = creatorIds.length
      ? await supabase.from("users").select("telegram_id, full_name, username, role").in("telegram_id", creatorIds)
      : { data: [], error: null };
    if (creatorError) {
      console.error("Gagal mengambil creator jadwal:", creatorError.message);
      return NextResponse.json({ error: "Gagal mengambil informasi creator" }, { status: 500 });
    }

    const creatorsById = new Map((creators ?? []).map((creator) => [creator.telegram_id, creator]));
    return NextResponse.json({
      schedules: (data ?? []).map((schedule) => ({
        ...schedule,
        creator: creatorsById.get(schedule.created_by) ?? null,
      })),
    });
  } catch (error) {
    console.error("Broadcast schedules GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await authorize();
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const scheduleType = body.schedule_type as ScheduleType;
    const filterRoles = normalizeFilterValues(body.filter_role);
    const filterTeams = normalizeFilterValues(body.filter_team);
    const filterActive = body.filter_active !== false;
    const weekday = Number(body.weekday);
    const scope = await getBroadcastScope(await createClient(), user);

    if (name.length < 1 || name.length > 200) {
      return NextResponse.json({ error: "Nama jadwal wajib diisi dan maksimal 200 karakter" }, { status: 400 });
    }
    if (message.length < 5 || message.length > 4096) {
      return NextResponse.json({ error: "Pesan harus berisi 5–4096 karakter" }, { status: 400 });
    }
    if (!["once", "daily", "weekly"].includes(scheduleType)) {
      return NextResponse.json({ error: "Tipe jadwal tidak valid" }, { status: 400 });
    }
    if (filterRoles.some((role) => !isBroadcastRole(role))) {
      return NextResponse.json({ error: "Filter role tidak valid" }, { status: 400 });
    }
    const scopeError = validateBroadcastFilters(filterRoles, filterTeams, scope);
    if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });

    if (scheduleType === "weekly" && (!Number.isInteger(weekday) || weekday < 1 || weekday > 7)) {
      return NextResponse.json({ error: "Hari dalam minggu wajib dipilih" }, { status: 400 });
    }

    const startInput = parseWibDateTime(body.start_at);
    if (!startInput) {
      return NextResponse.json({ error: "Tanggal dan jam mulai tidak valid" }, { status: 400 });
    }
    const nextRun =
      scheduleType === "weekly"
        ? nextWeeklyDate(startInput, weekday, body.start_at as string)
        : startInput;
    if (nextRun.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Jadwal mulai harus berada di masa depan" }, { status: 400 });
    }

    const endInput = body.end_at ? parseWibDateTime(body.end_at) : null;
    if (body.end_at && !endInput) {
      return NextResponse.json({ error: "Tanggal dan jam berakhir tidak valid" }, { status: 400 });
    }
    if (endInput && endInput.getTime() < nextRun.getTime()) {
      return NextResponse.json({ error: "Tanggal berakhir harus setelah jadwal mulai" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("broadcast_schedules")
      .insert({
        name,
        message,
        filter_role: filterRoles.length ? filterRoles.join(",") : null,
        filter_team: filterTeams.length ? filterTeams.join(",") : null,
        filter_active: filterActive,
        schedule_type: scheduleType,
        next_run_at: toDbTimestamp(nextRun),
        end_at: endInput ? toDbTimestamp(endInput) : null,
        weekday: scheduleType === "weekly" ? weekday : null,
        is_active: true,
        created_by: user.telegram_id,
        last_run_status: null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Gagal membuat jadwal broadcast:", error?.message);
      return NextResponse.json({ error: "Gagal menyimpan jadwal broadcast" }, { status: 500 });
    }
    return NextResponse.json({ success: true, schedule: data }, { status: 201 });
  } catch (error) {
    console.error("Broadcast schedules POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, response } = await authorize();
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID jadwal tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();
    const scope = await getBroadcastScope(supabase, user);
    const { data: existing, error: fetchError } = await supabase
      .from("broadcast_schedules")
      .select("id, created_by, is_active")
      .eq("id", id)
      .maybeSingle();
    if (fetchError || !existing || !canAccessBroadcastSender(scope, existing.created_by)) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan atau tidak dapat diakses" }, { status: 404 });
    }
    if (typeof body.is_active === "boolean" && Object.keys(body).length <= 2) {
      const { data, error } = await supabase
        .from("broadcast_schedules")
        .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return NextResponse.json({ error: "Gagal mengubah status jadwal" }, { status: 500 });
      return NextResponse.json({ success: true, schedule: data });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const scheduleType = body.schedule_type as ScheduleType;
    const filterRoles = normalizeFilterValues(body.filter_role);
    const filterTeams = normalizeFilterValues(body.filter_team);
    const filterActive = body.filter_active !== false;
    const weekday = Number(body.weekday);
    if (name.length < 1 || name.length > 200) {
      return NextResponse.json({ error: "Nama jadwal wajib diisi dan maksimal 200 karakter" }, { status: 400 });
    }
    if (message.length < 5 || message.length > 4096) {
      return NextResponse.json({ error: "Pesan harus berisi 5–4096 karakter" }, { status: 400 });
    }
    if (!["once", "daily", "weekly"].includes(scheduleType)) {
      return NextResponse.json({ error: "Tipe jadwal tidak valid" }, { status: 400 });
    }
    if (filterRoles.some((role) => !isBroadcastRole(role))) {
      return NextResponse.json({ error: "Filter role tidak valid" }, { status: 400 });
    }
    const scopeError = validateBroadcastFilters(filterRoles, filterTeams, scope);
    if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
    if (scheduleType === "weekly" && (!Number.isInteger(weekday) || weekday < 1 || weekday > 7)) {
      return NextResponse.json({ error: "Hari dalam minggu wajib dipilih" }, { status: 400 });
    }
    const startInput = parseWibDateTime(body.start_at);
    if (!startInput) return NextResponse.json({ error: "Tanggal dan jam mulai tidak valid" }, { status: 400 });
    const nextRun = scheduleType === "weekly"
      ? nextWeeklyDate(startInput, weekday, body.start_at as string)
      : startInput;
    if (nextRun.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Jadwal mulai harus berada di masa depan" }, { status: 400 });
    }
    const endInput = body.end_at ? parseWibDateTime(body.end_at) : null;
    if (body.end_at && !endInput) {
      return NextResponse.json({ error: "Tanggal dan jam berakhir tidak valid" }, { status: 400 });
    }
    if (endInput && endInput.getTime() < nextRun.getTime()) {
      return NextResponse.json({ error: "Tanggal berakhir harus setelah jadwal mulai" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("broadcast_schedules")
      .update({
        name,
        message,
        filter_role: filterRoles.length ? filterRoles.join(",") : null,
        filter_team: filterTeams.length ? filterTeams.join(",") : null,
        filter_active: filterActive,
        schedule_type: scheduleType,
        next_run_at: toDbTimestamp(nextRun),
        end_at: endInput ? toDbTimestamp(endInput) : null,
        weekday: scheduleType === "weekly" ? weekday : null,
        is_active: typeof body.is_active === "boolean" ? body.is_active : existing.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return NextResponse.json({ error: "Gagal memperbarui jadwal broadcast" }, { status: 500 });
    return NextResponse.json({ success: true, schedule: data });
  } catch (error) {
    console.error("Broadcast schedules PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, response } = await authorize();
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID jadwal tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();
    const scope = await getBroadcastScope(supabase, user);
    const { data: existing } = await supabase
      .from("broadcast_schedules")
      .select("id, created_by")
      .eq("id", id)
      .maybeSingle();
    if (!existing || !canAccessBroadcastSender(scope, existing.created_by)) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan atau tidak dapat diakses" }, { status: 404 });
    }
    const { error } = await supabase.from("broadcast_schedules").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Broadcast schedules DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
