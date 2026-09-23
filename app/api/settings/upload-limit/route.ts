import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getTodayRangeUtc } from "@/lib/timezone";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["upload.daily_limit_enabled", "upload.daily_limit_default"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }

  const enabled = map["upload.daily_limit_enabled"] !== "false";
  const defaultLimit = parseInt(map["upload.daily_limit_default"] ?? "1", 10);

  const { startUtc, endUtc } = getTodayRangeUtc();
  const { count: totalUpload } = await supabase
    .from("upload_logs")
    .select("id", { count: "exact", head: true })
    .gte("uploaded_at", startUtc)
    .lt("uploaded_at", endUtc);

  return NextResponse.json({
    enabled,
    default_limit: defaultLimit,
    stats: {
      total_upload_today: totalUpload ?? 0,
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const updates: { key: string; value: string }[] = [];

  if (typeof body.enabled === "boolean") {
    updates.push({
      key: "upload.daily_limit_enabled",
      value: body.enabled ? "true" : "false",
    });
  }

  if (typeof body.default_limit === "number" && body.default_limit >= 0) {
    updates.push({
      key: "upload.daily_limit_default",
      value: String(body.default_limit),
    });
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada perubahan yang dikirim" },
      { status: 400 }
    );
  }

  for (const { key, value } of updates) {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        {
          key,
          value,
          value_type: key.endsWith("enabled") ? "boolean" : "number",
          updated_at: new Date().toISOString(),
          updated_by: user.telegram_id,
        },
        { onConflict: "key" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, updated: updates.length });
}
