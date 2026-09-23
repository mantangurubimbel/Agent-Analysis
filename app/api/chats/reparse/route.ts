import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang bisa parse ulang" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const chatId = typeof body?.chat_id === "string" ? body.chat_id.trim() : "";
    if (!chatId || chatId.length > 64) {
      return NextResponse.json({ error: "chat_id tidak valid" }, { status: 400 });
    }

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("chat_id, storage_path_txt")
      .eq("chat_id", chatId)
      .is("deleted_at", null)
      .maybeSingle();

    if (chatError) {
      console.error("Reparse chat lookup error:", chatError);
      return NextResponse.json({ error: "Gagal memeriksa chat" }, { status: 500 });
    }
    if (!chat) {
      return NextResponse.json({ error: "Chat tidak ditemukan" }, { status: 404 });
    }
    if (!chat.storage_path_txt) {
      return NextResponse.json(
        { error: "File sumber TXT chat tidak tersedia" },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("reparse_queue")
      .select("id, status")
      .eq("chat_id", chatId)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Reparse queue lookup error:", existingError);
      return NextResponse.json({ error: "Gagal memeriksa antrian parse ulang" }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json(
        {
          error: "Chat ini sudah dalam antrian parse ulang",
          queue_id: existing.id,
          status: existing.status,
        },
        { status: 409 }
      );
    }

    const { data: queue, error: queueError } = await supabase
      .from("reparse_queue")
      .insert({
        chat_id: chatId,
        requested_by: user.telegram_id,
        status: "pending",
      })
      .select("id")
      .single();

    if (queueError || !queue) {
      console.error("Reparse queue insert error:", queueError);
      return NextResponse.json({ error: "Gagal menjadwalkan parse ulang" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queue_id: queue.id,
      message: "Chat dijadwalkan untuk parse ulang.",
    });
  } catch (error) {
    console.error("Reparse error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
