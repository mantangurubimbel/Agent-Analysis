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

    // Hanya admin/supervisor yang bisa delete
    if (user.role !== "admin" && user.role !== "supervisor") {
      return NextResponse.json(
        { error: "Hanya admin yang bisa menghapus chat" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { chatId, reason } = body;

    if (!chatId) {
      return NextResponse.json({ error: "chatId required" }, { status: 400 });
    }

    // Soft delete: set deleted_at, deleted_by, delete_reason
    const { error } = await supabase
      .from("chats")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        delete_reason: reason || null,
      })
      .eq("chat_id", chatId)
      .is("deleted_at", null);

    if (error) {
      console.error("Error deleting chat:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chatId });
  } catch (e) {
    console.error("Delete error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
