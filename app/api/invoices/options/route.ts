import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  const supabase = await createClient();
  const [{ data: supervisors }, { data: logs }] = await Promise.all([
    supabase.from("users").select("id, full_name").eq("role", "supervisor").order("full_name"),
    supabase.from("upload_logs").select("uploaded_at").order("uploaded_at", { ascending: false }),
  ]);
  const current = new Date();
  const currentMonth = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`;
  const periods = [...new Set((logs ?? []).map((row) => String(row.uploaded_at).slice(0, 7)).filter((period) => period < currentMonth))];
  return NextResponse.json({ supervisors: supervisors ?? [], periods });
}
