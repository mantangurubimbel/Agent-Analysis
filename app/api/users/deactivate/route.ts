import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, reason, reactivate } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // === Ambil target user ===
    const { data: targetUser, error: fetchError } = await supabase
      .from("users")
      .select("id, full_name, role, is_active, telegram_id")
      .eq("id", id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cegah admin nonaktifkan diri sendiri
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: "Tidak bisa menonaktifkan akun sendiri" },
        { status: 400 }
      );
    }

    // === REACTIVATE ===
    if (reactivate) {
      const { error } = await supabase
        .from("users")
        .update({
          is_active: true,
          deactivated_at: null,
          deactivated_reason: null,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await supabase.from("team_history").insert({
        user_id: id,
        change_type: "reactivate",
        old_value: "inactive",
        new_value: "active",
        changed_by: user.telegram_id,
        notes: "Reactivated via dashboard",
      });

      // === Notif ke user via Telegram ===
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken && targetUser.telegram_id > 0) {
        try {
          await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: targetUser.telegram_id,
                text:
                  `✅ <b>Akun Kamu Sudah Aktif!</b>\n\n` +
                  `Halo <b>${targetUser.full_name}</b>! 👋\n\n` +
                  `Akun kamu sudah di-approve admin. Sekarang kamu bisa upload chat via bot.\n\n` +
                  `Ketik /start untuk mulai. 🚀`,
                parse_mode: "HTML",
              }),
            }
          );
        } catch (e) {
          console.error("Gagal kirim notif approval:", e);
        }
      }

      return NextResponse.json({
        success: true,
        action: "reactivated",
        is_active: true,
      });
    }

    // === DEACTIVATE ===
    const { error } = await supabase
      .from("users")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_reason: reason || null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("team_history").insert({
      user_id: id,
      change_type: "deactivate",
      old_value: "active",
      new_value: "inactive",
      changed_by: user.telegram_id,
      notes: reason || "Deactivated via dashboard",
    });

    return NextResponse.json({
      success: true,
      action: "deactivated",
      is_active: false,
    });
  } catch (e) {
    console.error("Deactivate user error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
