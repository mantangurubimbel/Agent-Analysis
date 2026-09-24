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
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID user tidak valid" }, { status: 400 });
    }

    if (id === user.id) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id, full_name, role, telegram_id")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error("Gagal mengambil user yang akan dihapus:", targetError);
      return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      const { count, error: adminCountError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true);

      if (adminCountError) {
        console.error("Gagal menghitung admin aktif:", adminCountError);
        return NextResponse.json({ error: "Gagal memvalidasi akun admin" }, { status: 500 });
      }

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Admin terakhir tidak boleh dihapus" },
          { status: 400 }
        );
      }
    }

    const [
      { count: chatCount, error: chatError },
      { count: recipientCount, error: recipientError },
      { count: uploadCount, error: uploadError },
      { count: leaderCount, error: leaderError },
      { count: supervisorCount, error: supervisorError },
    ] = await Promise.all([
      supabase.from("chats").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase
        .from("broadcast_recipients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
      supabase
        .from("upload_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("leader_id", id),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("supervisor_id", id),
    ]);

    const dependencyError =
      chatError || recipientError || uploadError || leaderError || supervisorError;
    if (dependencyError) {
      console.error("Gagal memeriksa relasi user:", dependencyError);
      return NextResponse.json({ error: "Gagal memeriksa data terkait user" }, { status: 500 });
    }

    if (
      (chatCount ?? 0) > 0 ||
      (recipientCount ?? 0) > 0 ||
      (uploadCount ?? 0) > 0 ||
      (leaderCount ?? 0) > 0 ||
      (supervisorCount ?? 0) > 0
    ) {
      return NextResponse.json(
        {
          error:
            "User memiliki riwayat data atau bawahan. Gunakan Nonaktifkan agar riwayat dan struktur tim tetap aman.",
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await supabase.from("users").delete().eq("id", id);
    if (deleteError) {
      console.error("Gagal menghapus user:", deleteError);
      return NextResponse.json(
        { error: "User tidak dapat dihapus karena masih memiliki data terkait" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.full_name} berhasil dihapus`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
