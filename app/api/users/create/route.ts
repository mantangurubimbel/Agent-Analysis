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
    const {
      telegram_id,
      full_name,
      username,
      email,
      role,
      team,
      leader_id,
      supervisor_id,
    } = body;

    // Validasi
    if (!telegram_id || !full_name || !role) {
      return NextResponse.json(
        { error: "telegram_id, full_name, role wajib diisi" },
        { status: 400 }
      );
    }

    // Cek telegram_id unik
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegram_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Telegram ID sudah terdaftar" },
        { status: 400 }
      );
    }

    // Validasi email unik (case-insensitive)
    if (email && email.trim()) {
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id, full_name")
        .ilike("email", email.trim())
        .maybeSingle();

      if (existingEmail) {
        return NextResponse.json(
          {
            error: `Email sudah dipakai oleh ${existingEmail.full_name}`,
          },
          { status: 400 }
        );
      }
    }

    // Insert
    const { data, error } = await supabase
      .from("users")
      .insert({
        telegram_id,
        full_name,
        username: username || null,
        email: email || null,
        role,
        team: team || null,
        leader_id: leader_id || null,
        supervisor_id: supervisor_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track history
    await supabase.from("team_history").insert({
      user_id: data.id,
      change_type: "create",
      old_value: null,
      new_value: `${role} | ${full_name}`,
      changed_by: user.telegram_id,
      notes: "User dibuat via dashboard",
    });

    return NextResponse.json({ success: true, user: data });
  } catch (e) {
    console.error("Create user error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
