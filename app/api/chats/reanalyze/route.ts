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

    if (!["admin", "supervisor"].includes(user.role)) {
      return NextResponse.json(
        { error: "Hanya admin/supervisor yang bisa re-analyze" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { chat_id } = body;

    if (!chat_id) {
      return NextResponse.json({ error: "chat_id required" }, { status: 400 });
    }

    // Cek chat ada & status fail
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("chat_id, outcome, agent_score, root_cause, analysis_json")
      .eq("chat_id", chat_id)
      .is("deleted_at", null)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: "Chat tidak ditemukan" },
        { status: 404 }
      );
    }

    const isFailed =
      chat.outcome === "error" ||
      (!chat.outcome && !chat.analysis_json) ||
      (chat.agent_score === 0 && !chat.root_cause);

    if (!isFailed) {
      return NextResponse.json(
        { error: "Chat ini tidak dalam status gagal analisis" },
        { status: 400 }
      );
    }

    // Cek queue existing
    const { data: existing } = await supabase
      .from("reanalyze_queue")
      .select("id, status")
      .eq("chat_id", chat_id)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "Chat ini sudah dalam antrian re-analyze",
          queue_id: existing.id,
          status: existing.status,
        },
        { status: 409 }
      );
    }

    // Insert queue
    const { data: queue, error: queueError } = await supabase
      .from("reanalyze_queue")
      .insert({
        chat_id,
        requested_by: user.telegram_id,
        status: "pending",
      })
      .select()
      .single();

    if (queueError || !queue) {
      console.error("Queue insert error:", queueError);
      return NextResponse.json(
        { error: queueError?.message || "Gagal insert queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      queue_id: queue.id,
      message:
        "Chat dijadwalkan untuk re-analyze. Akan diproses dalam ≤30 detik.",
    });
  } catch (e) {
    console.error("Reanalyze error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
