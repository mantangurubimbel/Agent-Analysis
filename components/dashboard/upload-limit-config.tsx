"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, TrendingUp } from "lucide-react";

interface UploadLimitData {
  enabled: boolean;
  default_limit: number;
  stats: {
    total_upload_today: number;
  };
}

export function UploadLimitConfig() {
  const [data, setData] = useState<UploadLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [defaultLimit, setDefaultLimit] = useState(1);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/upload-limit")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setMessage({ type: "error", text: d.error });
        } else {
          setData(d);
          setEnabled(d.enabled);
          setDefaultLimit(d.default_limit);
        }
      })
      .catch((e) => setMessage({ type: "error", text: String(e) }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/upload-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, default_limit: defaultLimit }),
      });
      const d = await res.json();
      if (d.error) {
        setMessage({ type: "error", text: d.error });
      } else {
        setMessage({ type: "ok", text: "Pengaturan berhasil disimpan" });
      }
    } catch (e) {
      setMessage({ type: "error", text: String(e) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batas Upload Harian</CardTitle>
          <CardDescription>
            Batasi jumlah upload chat WA per agent per hari. Reset otomatis jam 00:00 WIB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div>
              <Label className="text-base">Aktifkan batas upload harian</Label>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Kalau OFF, semua agent bisa upload tanpa batas.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                enabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-limit">Limit per agent per hari</Label>
            <Input
              id="default-limit"
              type="number"
              min={0}
              value={defaultLimit}
              onChange={(e) => setDefaultLimit(parseInt(e.target.value || "0", 10))}
              disabled={!enabled}
              className="max-w-[200px]"
            />
            <p className="text-xs text-[var(--text-muted)]">
              Contoh: isi 3 → setiap agent maksimal upload 3 chat per hari.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)] space-y-1">
            <p>ℹ️ Perubahan berlaku untuk semua agent.</p>
            <p>⏰ Reset otomatis setiap hari jam 00:00 WIB.</p>
            <p>👑 Admin bypass limit (tidak terkena pembatasan).</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
            {message && (
              <span
                className={`text-sm ${
                  message.type === "ok"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message.text}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {data?.stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Statistik Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {data.stats.total_upload_today}
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">
                Total upload hari ini (semua agent)
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
