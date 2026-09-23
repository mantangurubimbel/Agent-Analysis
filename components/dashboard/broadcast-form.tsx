"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Send,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PreviewData {
  count: number;
  by_role: Record<string, number>;
  sample: Array<{
    full_name: string;
    role: string;
    team: string | null;
  }>;
}

interface TeamsResponse {
  teams: string[];
}

const ROLE_OPTIONS = [
  { value: "all", label: "Semua Role" },
  { value: "agent", label: "💼 Agent" },
  { value: "leader", label: "🎯 Leader" },
  { value: "supervisor", label: "🔍 Supervisor" },
  { value: "admin", label: "👑 Admin" },
];

export function BroadcastForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterActive, setFilterActive] = useState(true);

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [teams, setTeams] = useState<string[]>([]);

  // Load teams
  useEffect(() => {
    fetch("/api/broadcast/teams")
      .then((r) => r.json())
      .then((d: TeamsResponse) => setTeams(d.teams ?? []))
      .catch(() => {});
  }, []);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setError(null);

    try {
      const res = await fetch("/api/broadcast/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter_role: filterRole,
          filter_team: filterTeam,
          filter_active: filterActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal load preview");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [filterActive, filterRole, filterTeam]);

  // Fetch preview saat filter berubah
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterRole, filterTeam, filterActive, loadPreview]);

  async function handleSend() {
    if (!message.trim() || message.trim().length < 5) {
      setError("Pesan minimal 5 karakter");
      return;
    }

    if (!preview || preview.count === 0) {
      setError("Tidak ada penerima");
      return;
    }

    const confirmed = confirm(
      `Kirim pesan ke ${preview.count} user?\n\n` +
        `Role: ${filterRole}\n` +
        `Team: ${filterTeam}\n\n` +
        `Pesan tidak bisa dibatalkan setelah terkirim.`
    );

    if (!confirmed) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          filter_role: filterRole,
          filter_team: filterTeam,
          filter_active: filterActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal kirim broadcast");

      setSuccess(
        `✅ Broadcast #${data.broadcast_id} dijadwalkan ke ${data.recipient_count} user. ` +
          `Bot akan memproses dalam beberapa detik.`
      );
      setMessage("");

      // Refresh history
      router.refresh();
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSending(false);
    }
  }

  const charCount = message.length;
  const charLimit = 4096;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="space-y-6">
      {/* Alert */}
      {error && (
        <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Pesan */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <div>
          <Label htmlFor="message">📝 Pesan</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Halo, ini pengumuman penting...&#10;&#10;Gunakan <b>bold</b> untuk penekanan."
            className={`w-full mt-1.5 px-3 py-2 text-sm rounded-md border bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-y min-h-[200px] font-mono ${
              isOverLimit
                ? "border-rose-500"
                : "border-[var(--border)]"
            }`}
            rows={10}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-[var(--text-muted)]">
              Support HTML: <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>,{" "}
              <code>&lt;u&gt;</code>, <code>&lt;s&gt;</code>,{" "}
              <code>&lt;code&gt;</code>, <code>&lt;pre&gt;</code>
            </p>
            <p
              className={`text-xs ${
                isOverLimit
                  ? "text-rose-600 dark:text-rose-400 font-medium"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {charCount} / {charLimit}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div>
          <Label>🎯 Filter Penerima</Label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
            >
              <option value="all">Semua Team</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="filter_active"
              checked={filterActive}
              onChange={(e) => setFilterActive(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor="filter_active"
              className="text-sm text-[var(--text-secondary)] cursor-pointer"
            >
              Hanya user aktif
            </label>
          </div>
        </div>
      </div>

      {/* Preview Penerima */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            📊 Penerima
          </Label>
          {loadingPreview && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
          )}
        </div>

        {preview ? (
          <>
            <div className="p-3 rounded-md bg-[var(--accent-subtle)]/30 border border-[var(--accent)]/20">
              <p className="text-lg font-bold text-[var(--accent)]">
                {preview.count} user
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                akan menerima pesan ini
              </p>
            </div>

            {Object.keys(preview.by_role).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  Breakdown by role:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.by_role).map(([role, count]) => (
                    <span
                      key={role}
                      className="text-xs px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    >
                      {role}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preview.sample.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  Sample penerima:
                </p>
                <ul className="text-xs text-[var(--text-muted)] space-y-0.5">
                  {preview.sample.map((s, i) => (
                    <li key={i}>• {s.full_name}</li>
                  ))}
                  {preview.count > preview.sample.length && (
                    <li>
                      • ... dan {preview.count - preview.sample.length} lainnya
                    </li>
                  )}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            {loadingPreview ? "Loading..." : "Tidak ada penerima"}
          </p>
        )}
      </div>

      {/* Action */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSend}
          disabled={sending || !message.trim() || isOverLimit || !preview}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Kirim Broadcast
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
