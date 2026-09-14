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

    if (reactivate) {
      // Reactivate
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

      return NextResponse.json({ success: true, action: "reactivated" });
    }

    // Deactivate
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

    return NextResponse.json({ success: true, action: "deactivated" });
  } catch (e) {
    console.error("Deactivate user error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
