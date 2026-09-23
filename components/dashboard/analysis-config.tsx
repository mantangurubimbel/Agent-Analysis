"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalysisConfigData {
  confidence_threshold: number;
  max_messages: number;
  keep_head: number;
  keep_tail: number;
  company_keywords: string[];
  agent_keywords: string[];
  no_response_hours: number;
}

export function AnalysisConfig() {
  const [config, setConfig] = useState<AnalysisConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newCompanyKeyword, setNewCompanyKeyword] = useState("");
  const [newAgentKeyword, setNewAgentKeyword] = useState("");

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/analysis");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal load config");
      setConfig(data.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadConfig(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/settings/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal save");

      setSuccess("✅ Config berhasil disimpan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
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

      {/* Threshold & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Threshold & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="confidence_threshold">
                Confidence Threshold
              </Label>
              <Input
                id="confidence_threshold"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.confidence_threshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    confidence_threshold: parseFloat(e.target.value) || 0.8,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Kalau confidence &lt; nilai ini, minta konfirmasi agent
              </p>
            </div>
            <div>
              <Label htmlFor="no_response_hours">No Response (jam)</Label>
              <Input
                id="no_response_hours"
                type="number"
                value={config.no_response_hours}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    no_response_hours: parseInt(e.target.value) || 48,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Jam sebelum dianggap no response
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max_messages">Max Messages</Label>
              <Input
                id="max_messages"
                type="number"
                value={config.max_messages}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    max_messages: parseInt(e.target.value) || 200,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="keep_head">Keep Head</Label>
              <Input
                id="keep_head"
                type="number"
                value={config.keep_head}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    keep_head: parseInt(e.target.value) || 120,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="keep_tail">Keep Tail</Label>
              <Input
                id="keep_tail"
                type="number"
                value={config.keep_tail}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    keep_tail: parseInt(e.target.value) || 80,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Company Keywords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Kalau nama sender mengandung keyword ini, dianggap agent
          </p>
          <div className="flex flex-wrap gap-2">
            {config.company_keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded bg-accent"
              >
                {kw}
                <button
                  onClick={() =>
                    setConfig({
                      ...config,
                      company_keywords: config.company_keywords.filter(
                        (_, idx) => idx !== i
                      ),
                    })
                  }
                  className="text-muted-foreground hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Tambah keyword..."
              value={newCompanyKeyword}
              onChange={(e) => setNewCompanyKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCompanyKeyword.trim()) {
                  setConfig({
                    ...config,
                    company_keywords: [
                      ...config.company_keywords,
                      newCompanyKeyword.trim(),
                    ],
                  });
                  setNewCompanyKeyword("");
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (newCompanyKeyword.trim()) {
                  setConfig({
                    ...config,
                    company_keywords: [
                      ...config.company_keywords,
                      newCompanyKeyword.trim(),
                    ],
                  });
                  setNewCompanyKeyword("");
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Keywords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Kalau pesan mengandung keyword ini, sender dianggap agent
          </p>
          <div className="flex flex-wrap gap-2">
            {config.agent_keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded bg-accent"
              >
                {kw}
                <button
                  onClick={() =>
                    setConfig({
                      ...config,
                      agent_keywords: config.agent_keywords.filter(
                        (_, idx) => idx !== i
                      ),
                    })
                  }
                  className="text-muted-foreground hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Tambah keyword..."
              value={newAgentKeyword}
              onChange={(e) => setNewAgentKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAgentKeyword.trim()) {
                  setConfig({
                    ...config,
                    agent_keywords: [
                      ...config.agent_keywords,
                      newAgentKeyword.trim(),
                    ],
                  });
                  setNewAgentKeyword("");
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (newAgentKeyword.trim()) {
                  setConfig({
                    ...config,
                    agent_keywords: [
                      ...config.agent_keywords,
                      newAgentKeyword.trim(),
                    ],
                  });
                  setNewAgentKeyword("");
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
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
