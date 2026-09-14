import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .like("key", "analysis.%")
    .order("key");

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  const config = {
    confidence_threshold: parseFloat(
      settings["analysis.confidence_threshold"] || "0.8"
    ),
    max_messages: parseInt(settings["analysis.max_messages"] || "200"),
    keep_head: parseInt(settings["analysis.keep_head"] || "120"),
    keep_tail: parseInt(settings["analysis.keep_tail"] || "80"),
    company_keywords: JSON.parse(
      settings["analysis.company_keywords"] || '["Ruangguru","RGP"]'
    ),
    agent_keywords: JSON.parse(
      settings["analysis.agent_keywords"] || '["saya","kami dari"]'
    ),
    no_response_hours: parseInt(
      settings["analysis.no_response_hours"] || "48"
    ),
  };

  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const updates: { key: string; value: string }[] = [];

  const numFields = [
    "confidence_threshold",
    "max_messages",
    "keep_head",
    "keep_tail",
    "no_response_hours",
  ];

  for (const field of numFields) {
    if (body[field] !== undefined) {
      updates.push({
        key: `analysis.${field}`,
        value: String(body[field]),
      });
    }
  }

  if (body.company_keywords) {
    updates.push({
      key: "analysis.company_keywords",
      value: JSON.stringify(body.company_keywords),
    });
  }

  if (body.agent_keywords) {
    updates.push({
      key: "analysis.agent_keywords",
      value: JSON.stringify(body.agent_keywords),
    });
  }

  for (const { key, value } of updates) {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
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

  return NextResponse.json({ success: true, updated: updates.length });
}
