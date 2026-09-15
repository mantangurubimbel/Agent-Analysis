import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Ambil info hierarki (leader & supervisor)
  let leaderName: string | null = null;
  let supervisorName: string | null = null;

  if (user.leader_id) {
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.leader_id)
      .single();
    leaderName = data?.full_name ?? null;
  }

  if (user.supervisor_id) {
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.supervisor_id)
      .single();
    supervisorName = data?.full_name ?? null;
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      telegram_id: user.telegram_id,
      role: user.role,
      team: user.team,
      leader_name: leaderName,
      supervisor_name: supervisorName,
      created_at: user.created_at,
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, username, email, telegram_id } = body;

  // Validasi
  if (!full_name || full_name.trim().length < 2) {
    return NextResponse.json(
      { error: "Nama lengkap minimal 2 karakter" },
      { status: 400 }
    );
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Format email tidak valid" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Cek kalau telegram_id diubah, harus unik
  if (telegram_id && telegram_id !== user.telegram_id) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegram_id)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Telegram ID sudah dipakai user lain" },
        { status: 400 }
      );
    }
  }

  // Validasi email unik (case-insensitive)
  if (email && email.trim()) {
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id, full_name")
      .ilike("email", email.trim())
      .neq("id", user.id)
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

  // Update
  const { error } = await supabase
    .from("users")
    .update({
      full_name: full_name.trim(),
      username: username?.trim() || null,
      email: email?.trim() || null,
      telegram_id: telegram_id || user.telegram_id,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
