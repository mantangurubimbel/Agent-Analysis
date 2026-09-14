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
      id,
      full_name,
      username,
      email,
      role,
      team,
      leader_id,
      supervisor_id,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Ambil data lama untuk track history
    const { data: oldUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name,
        username: username || null,
        email: email || null,
        role,
        team: team || null,
        leader_id: leader_id || null,
        supervisor_id: supervisor_id || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track perubahan
    const changes: { type: string; old: string | null; new: string | null }[] = [];

    if (oldUser.role !== role) {
      changes.push({ type: "role_change", old: oldUser.role, new: role });
    }
    if (oldUser.leader_id !== leader_id) {
      changes.push({
        type: "leader_change",
        old: oldUser.leader_id ? String(oldUser.leader_id) : null,
        new: leader_id ? String(leader_id) : null,
      });
    }
    if (oldUser.supervisor_id !== supervisor_id) {
      changes.push({
        type: "supervisor_change",
        old: oldUser.supervisor_id ? String(oldUser.supervisor_id) : null,
        new: supervisor_id ? String(supervisor_id) : null,
      });
    }
    if (oldUser.full_name !== full_name) {
      changes.push({
        type: "name_change",
        old: oldUser.full_name,
        new: full_name,
      });
    }

    for (const change of changes) {
      await supabase.from("team_history").insert({
        user_id: id,
        change_type: change.type,
        old_value: change.old,
        new_value: change.new,
        changed_by: user.telegram_id,
        notes: "Update via dashboard",
      });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (e) {
    console.error("Update user error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
