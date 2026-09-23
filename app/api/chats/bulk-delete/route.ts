import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleUserIds } from "@/lib/hierarchy";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "supervisor") {
      return NextResponse.json(
        { error: "Hanya admin/supervisor yang bisa menghapus chat" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { days, reason, preview } = body;

    if (!days || typeof days !== "number" || days < 1) {
      return NextResponse.json({ error: "days required" }, { status: 400 });
    }

    // Hitung cutoff date
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const visibleIds = await getVisibleUserIds(user);

    // Preview: hitung berapa chat yang akan dihapus
    let countQuery = supabase
      .from("chats")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .lt("created_at", cutoff.toISOString());
    if (visibleIds.length > 0) {
      countQuery = countQuery.in("user_id", visibleIds);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (preview) {
      return NextResponse.json({
        count: count ?? 0,
        cutoff: cutoff.toISOString(),
      });
    }

    // Soft delete semua yang lebih tua dari cutoff
    let deleteQuery = supabase
      .from("chats")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        delete_reason: reason || `Bulk delete > ${days} hari`,
      })
      .is("deleted_at", null)
      .lt("created_at", cutoff.toISOString());
    if (visibleIds.length > 0) {
      deleteQuery = deleteQuery.in("user_id", visibleIds);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: count ?? 0 });
  } catch (e) {
    console.error("Bulk delete error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
