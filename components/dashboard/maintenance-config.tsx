"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaintenanceConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_until: string;
}

export function MaintenanceConfig() {
  const router = useRouter();
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/maintenance");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal load config");
      setConfig(data);
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

    if (config.maintenance_mode) {
      const confirmed = confirm(
        "⚠️ Aktifkan maintenance mode?\n\n" +
          "Semua user (kecuali admin) TIDAK akan bisa mengakses dashboard.\n\n" +
          "Lanjutkan?"
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal save");

      setSuccess("✅ Config berhasil disimpan");
      router.refresh();
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-[var(--text-muted)]">
          Gagal load config
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {config.maintenance_mode && (
        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-3">
          <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Maintenance Mode AKTIF
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              User non-admin tidak bisa mengakses dashboard. Admin tetap bisa
              akses semua.
            </p>
          </div>
        </div>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Wrench className="w-4 h-4" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Aktifkan Maintenance Mode
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Hanya admin yang bisa mengakses dashboard
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.maintenance_mode}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maintenance_mode: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent)] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--accent)]"></div>
            </label>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="maintenance_message">
              Pesan untuk User
            </Label>
            <textarea
              id="maintenance_message"
              value={config.maintenance_message}
              onChange={(e) =>
                setConfig({
                  ...config,
                  maintenance_message: e.target.value,
                })
              }
              placeholder="Dashboard sedang dalam perbaikan. Silakan kembali lagi nanti."
              rows={3}
              className="w-full mt-1.5 px-3 py-2 text-sm rounded-md border bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-y border-[var(--border)]"
            />
          </div>

          {/* ETA */}
          <div>
            <Label htmlFor="maintenance_until">
              Perkiraan Selesai (Opsional)
            </Label>
            <Input
              id="maintenance_until"
              value={config.maintenance_until}
              onChange={(e) =>
                setConfig({
                  ...config,
                  maintenance_until: e.target.value,
                })
              }
              placeholder="mis. Hari ini jam 17:00 WIB"
              className="mt-1.5"
            />
          </div>

          {/* Preview */}
          {config.maintenance_mode && (
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
                Preview halaman maintenance:
              </p>
              <div className="text-center py-4 space-y-2">
                <div className="text-2xl">🚧</div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Under Construction
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {config.maintenance_message ||
                    "Dashboard sedang dalam perbaikan."}
                </p>
                {config.maintenance_until && (
                  <p className="text-xs text-[var(--text-muted)]">
                    ⏰ Selesai: {config.maintenance_until}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
