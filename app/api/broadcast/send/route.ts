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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hanya admin, supervisor, dan leader yang bisa broadcast sesuai cakupannya
    if (!["admin", "supervisor", "leader"].includes(user.role)) {
      return NextResponse.json(
        { error: "Hanya admin/supervisor yang bisa broadcast" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, filter_active } = body;
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

    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Pesan minimal 5 karakter" },
        { status: 400 }
      );
    }

    if (message.length > 4096) {
      return NextResponse.json(
        { error: "Pesan maksimal 4096 karakter (limit Telegram)" },
        { status: 400 }
      );
    }

    // Cari penerima berdasarkan filter
    let query = supabase
      .from("users")
      .select("id, telegram_id, full_name, role, team")
      .gt("telegram_id", 0); // telegram_id > 0

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

    const { data: recipients, error: recipientError } = await query;

    if (recipientError) {
      return NextResponse.json(
        { error: recipientError.message },
        { status: 500 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada penerima yang cocok dengan filter" },
        { status: 400 }
      );
    }

    // Insert broadcast
    const { data: broadcast, error: broadcastError } = await supabase
      .from("broadcasts")
      .insert({
        message: message.trim(),
        filter_role: filterRoles.length > 0 ? filterRoles.join(",") : null,
        filter_team: filterTeams.length > 0 ? filterTeams.join(",") : null,
        filter_active: filter_active !== false,
        recipient_count: recipients.length,
        sent_by: user.telegram_id,
        status: "pending",
      })
      .select()
      .single();

    if (broadcastError || !broadcast) {
      return NextResponse.json(
        { error: broadcastError?.message || "Gagal insert broadcast" },
        { status: 500 }
      );
    }

    // Insert recipients
    const recipientRows = recipients.map((r) => ({
      broadcast_id: broadcast.id,
      user_id: r.id,
      telegram_id: r.telegram_id,
      status: "pending",
    }));

    const { error: recError } = await supabase
      .from("broadcast_recipients")
      .insert(recipientRows);

    if (recError) {
      // Rollback broadcast
      await supabase.from("broadcasts").delete().eq("id", broadcast.id);
      return NextResponse.json(
        { error: recError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
      recipient_count: recipients.length,
      message: "Broadcast dijadwalkan. Akan diproses oleh bot.",
    });
  } catch (e) {
    console.error("Broadcast error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
