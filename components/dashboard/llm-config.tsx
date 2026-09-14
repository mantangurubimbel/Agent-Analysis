"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Save, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProviderConfig {
  model: string;
  api_key_set: boolean;
  enabled: boolean;
}

interface LLMConfigData {
  active_provider: string;
  fallback_order: string[];
  max_tokens: number;
  temperature: number;
  providers: {
    groq: ProviderConfig;
    gemini: ProviderConfig;
    openrouter: ProviderConfig;
  };
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function LLMConfig() {
  const [config, setConfig] = useState<LLMConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // API key input (temporary, tidak di-load dari server)
  const [apiKeys, setApiKeys] = useState({
    groq: "",
    gemini: "",
    openrouter: "",
  });

  // Test results per provider
  const [testResults, setTestResults] = useState<
    Record<string, TestResult | null>
  >({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/llm");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal load config");
      setConfig(data.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        active_provider: config.active_provider,
        fallback_order: config.fallback_order,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        providers: {},
      };

      for (const [name, pcfg] of Object.entries(config.providers)) {
        const providerPayload: Record<string, unknown> = {
          model: pcfg.model,
          enabled: pcfg.enabled,
        };
        // Hanya kirim API key kalau diisi
        if (apiKeys[name as keyof typeof apiKeys]) {
          providerPayload.api_key = apiKeys[name as keyof typeof apiKeys];
        }
        (payload.providers as Record<string, unknown>)[name] = providerPayload;
      }

      const res = await fetch("/api/settings/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal save");

      setSuccess("✅ Config berhasil disimpan");
      setApiKeys({ groq: "", gemini: "", openrouter: "" });
      await loadConfig();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(provider: string) {
    setTestingProvider(provider);
    setTestResults((prev) => ({ ...prev, [provider]: null }));

    try {
      const res = await fetch("/api/settings/llm/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [provider]: data }));
    } catch (e) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          error: e instanceof Error ? e.message : "Error",
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Gagal load config
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {error && (
        <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          {success}
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="active_provider">Provider Aktif</Label>
            <select
              id="active_provider"
              value={config.active_provider}
              onChange={(e) =>
                setConfig({ ...config, active_provider: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background"
            >
              <option value="groq">Groq</option>
              <option value="gemini">Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Provider yang dipakai pertama kali
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={config.max_tokens}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    max_tokens: parseInt(e.target.value) || 2500,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={config.temperature}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    temperature: parseFloat(e.target.value) || 1.0,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Configs */}
      {(["groq", "gemini", "openrouter"] as const).map((provider) => {
        const pcfg = config.providers[provider];
        const testResult = testResults[provider];

        return (
          <Card
            key={provider}
            className={pcfg.enabled ? "border-primary/30" : ""}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{provider}</span>
                <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pcfg.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        providers: {
                          ...config.providers,
                          [provider]: { ...pcfg, enabled: e.target.checked },
                        },
                      })
                    }
                    className="rounded"
                  />
                  Aktifkan
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Model</Label>
                <Input
                  value={pcfg.model}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      providers: {
                        ...config.providers,
                        [provider]: { ...pcfg, model: e.target.value },
                      },
                    })
                  }
                  placeholder={`${provider}/model-name`}
                />
              </div>

              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={apiKeys[provider]}
                  onChange={(e) =>
                    setApiKeys({ ...apiKeys, [provider]: e.target.value })
                  }
                  placeholder={
                    pcfg.api_key_set
                      ? "•••••••••• (sudah di-set, isi untuk ganti)"
                      : "Belum di-set"
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(provider)}
                  disabled={testingProvider === provider}
                >
                  {testingProvider === provider ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                {testResult && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      testResult.success
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-md">
                      {testResult.success
                        ? testResult.message
                        : testResult.error}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Config
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
