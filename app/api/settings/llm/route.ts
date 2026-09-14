import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value, value_type")
    .like("key", "llm.%")
    .order("key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format jadi object
  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  const config = {
    active_provider: settings["llm.active_provider"] || "groq",
    fallback_order: JSON.parse(
      settings["llm.fallback_order"] || '["groq","gemini","openrouter"]'
    ),
    max_tokens: parseInt(settings["llm.max_tokens"] || "2500"),
    temperature: parseFloat(settings["llm.temperature"] || "1.0"),
    providers: {
      groq: {
        model: settings["llm.groq.model"] || "",
        api_key_set: !!settings["llm.groq.api_key"],
        enabled: settings["llm.groq.enabled"] === "true",
      },
      gemini: {
        model: settings["llm.gemini.model"] || "",
        api_key_set: !!settings["llm.gemini.api_key"],
        enabled: settings["llm.gemini.enabled"] === "true",
      },
      openrouter: {
        model: settings["llm.openrouter.model"] || "",
        api_key_set: !!settings["llm.openrouter.api_key"],
        enabled: settings["llm.openrouter.enabled"] === "true",
      },
    },
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

  if (body.active_provider) {
    updates.push({
      key: "llm.active_provider",
      value: body.active_provider,
    });
  }

  if (body.fallback_order) {
    updates.push({
      key: "llm.fallback_order",
      value: JSON.stringify(body.fallback_order),
    });
  }

  if (body.max_tokens) {
    updates.push({
      key: "llm.max_tokens",
      value: String(body.max_tokens),
    });
  }

  if (body.temperature !== undefined) {
    updates.push({
      key: "llm.temperature",
      value: String(body.temperature),
    });
  }

  // Providers
  if (body.providers) {
    for (const [name, pcfg] of Object.entries(body.providers)) {
      const pc = pcfg as Record<string, unknown>;
      if (pc.model) {
        updates.push({
          key: `llm.${name}.model`,
          value: String(pc.model),
        });
      }
      if (pc.api_key) {
        updates.push({
          key: `llm.${name}.api_key`,
          value: String(pc.api_key),
        });
      }
      if (pc.enabled !== undefined) {
        updates.push({
          key: `llm.${name}.enabled`,
          value: pc.enabled ? "true" : "false",
        });
      }
    }
  }

  // Update satu per satu
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
