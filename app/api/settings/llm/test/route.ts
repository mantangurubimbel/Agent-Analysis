import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const provider = body.provider as string;

  if (!provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [`llm.${provider}.model`, `llm.${provider}.api_key`]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  const apiKey = settings[`llm.${provider}.api_key`];
  const model = settings[`llm.${provider}.model`];

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "API key belum di-set untuk provider ini",
    });
  }

  if (!model) {
    return NextResponse.json({
      success: false,
      error: "Model belum di-set untuk provider ini",
    });
  }

  // Test dengan request kecil
  try {
    let url = "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let bodyReq: Record<string, unknown> = {};

    if (provider === "groq") {
      url = "https://api.groq.com/openai/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      bodyReq = {
        model: model.replace("groq/", ""),
        messages: [{ role: "user", content: "Say hi" }],
        max_tokens: 10,
      };
    } else if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model.replace("gemini/", "")}:generateContent?key=${apiKey}`;
      bodyReq = {
        contents: [{ parts: [{ text: "Say hi" }] }],
      };
    } else if (provider === "openrouter") {
      url = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      bodyReq = {
        model: model.replace("openrouter/", ""),
        messages: [{ role: "user", content: "Say hi" }],
        max_tokens: 10,
      };
    } else {
      return NextResponse.json({
        success: false,
        error: `Provider ${provider} tidak dikenal`,
      });
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyReq),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        success: false,
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: `✅ ${provider} connection OK`,
      sample: JSON.stringify(data).slice(0, 100),
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
