import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "app.maintenance_mode",
      "app.maintenance_message",
      "app.maintenance_until",
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({
    maintenance_mode: settings["app.maintenance_mode"] === "true",
    maintenance_message: settings["app.maintenance_message"] || "",
    maintenance_until: settings["app.maintenance_until"] || "",
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { maintenance_mode, maintenance_message, maintenance_until } = body;

  const supabase = await createClient();

  const updates = [
    { key: "app.maintenance_mode", value: maintenance_mode ? "true" : "false" },
    {
      key: "app.maintenance_message",
      value: maintenance_message || "",
    },
    {
      key: "app.maintenance_until",
      value: maintenance_until || "",
    },
  ];

  for (const { key, value } of updates) {
    const { error } = await supabase.from("app_settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.telegram_id,
      },
      { onConflict: "key" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
