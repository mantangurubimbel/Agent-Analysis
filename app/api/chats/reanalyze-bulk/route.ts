import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

const MAX_BULK = 10;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || !["admin", "supervisor"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { chat_ids } = body;

    if (!Array.isArray(chat_ids) || chat_ids.length === 0) {
      return NextResponse.json(
        { error: "chat_ids harus array non-empty" },
        { status: 400 }
      );
    }

    if (chat_ids.length > MAX_BULK) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_BULK} chat per request` },
        { status: 400 }
      );
    }

    const { data: chats, error: chatError } = await supabase
      .from("chats")
      .select("chat_id, outcome, agent_score, root_cause, analysis_json")
      .in("chat_id", chat_ids)
      .is("deleted_at", null);

    if (chatError) {
      return NextResponse.json({ error: chatError.message }, { status: 500 });
    }

    const failedChats = (chats ?? []).filter((c) => {
      return (
        c.outcome === "error" ||
        (!c.outcome && !c.analysis_json) ||
        (c.agent_score === 0 && !c.root_cause)
      );
    });

    if (failedChats.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada chat yang dalam status gagal" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("reanalyze_queue")
      .select("chat_id")
      .in(
        "chat_id",
        failedChats.map((c) => c.chat_id)
      )
      .in("status", ["pending", "processing"]);

    const existingIds = new Set((existing ?? []).map((e) => e.chat_id));

    const toInsert = failedChats
      .filter((c) => !existingIds.has(c.chat_id))
      .map((c) => ({
        chat_id: c.chat_id,
        requested_by: user.telegram_id,
        status: "pending",
      }));

    if (toInsert.length === 0) {
      return NextResponse.json(
        { error: "Semua chat sudah dalam antrian" },
        { status: 409 }
      );
    }

    const { data: queues, error: queueError } = await supabase
      .from("reanalyze_queue")
      .insert(toInsert)
      .select();

    if (queueError) {
      return NextResponse.json({ error: queueError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      queued: queues?.length ?? 0,
      queue_ids: (queues ?? []).map((q) => q.id),
      skipped: failedChats.length - toInsert.length,
    });
  } catch (e) {
    console.error("Bulk reanalyze error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
