"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, History, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MultiSelectFilter } from "@/components/dashboard/multi-select-filter";
import { formatWibDateTime } from "@/lib/timezone";

interface Schedule {
  id: number;
  name: string;
  message: string;
  filter_role: string | null;
  filter_team: string | null;
  filter_active: boolean;
  schedule_type: "once" | "daily" | "weekly";
  next_run_at: string;
  end_at: string | null;
  weekday: number | null;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  creator: { full_name: string; username: string | null } | null;
}

interface ScheduleManagerProps {
  teams: string[];
  roles: string[];
}

interface ScheduleRun {
  id: number;
  broadcast_id: number | null;
  scheduled_for: string;
  executed_at: string | null;
  status: string;
  error_message: string | null;
}

const WEEKDAYS = [
  [1, "Senin"],
  [2, "Selasa"],
  [3, "Rabu"],
  [4, "Kamis"],
  [5, "Jumat"],
  [6, "Sabtu"],
  [7, "Minggu"],
] as const;

const ROLE_LABELS: Record<string, string> = {
  agent: "💼 Agent",
  leader: "🎯 Leader",
  supervisor: "🔍 Supervisor",
  admin: "👑 Admin",
};

function toWibInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function getDefaultStart(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return toWibInput(date.toISOString());
}

function formatScheduleType(schedule: Schedule): string {
  if (schedule.schedule_type === "once") return "Sekali jalan";
  if (schedule.schedule_type === "daily") return "Setiap hari";
  return `Setiap ${WEEKDAYS.find(([value]) => value === schedule.weekday)?.[1] ?? "minggu"}`;
}

export function BroadcastScheduleManager({ teams, roles }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [runsBySchedule, setRunsBySchedule] = useState<Record<number, ScheduleRun[]>>({});
  const [loadingRuns, setLoadingRuns] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleType, setScheduleType] = useState<Schedule["schedule_type"]>("once");
  const [startAt, setStartAt] = useState(getDefaultStart);
  const [endAt, setEndAt] = useState("");
  const [weekday, setWeekday] = useState("1");
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterTeams, setFilterTeams] = useState<string[]>([]);
  const [filterActive, setFilterActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/broadcast/schedules");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengambil jadwal");
      setSchedules(data.schedules ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal mengambil jadwal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadSchedules(), 0);
    return () => clearTimeout(timer);
  }, [loadSchedules]);

  async function saveSchedule(): Promise<void> {
    setError(null);
    setSuccess(null);
    if (!name.trim() || message.trim().length < 5 || !startAt) {
      setError("Nama, pesan minimal 5 karakter, dan jadwal mulai wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/broadcast/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          schedule_type: scheduleType,
          start_at: startAt,
          end_at: endAt || null,
          weekday: scheduleType === "weekly" ? Number(weekday) : null,
          filter_role: filterRoles,
          filter_team: filterTeams,
          filter_active: filterActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan jadwal");
      setSuccess("Jadwal broadcast berhasil disimpan");
      setName("");
      setMessage("");
      setEndAt("");
      setScheduleType("once");
      setStartAt(getDefaultStart());
      await loadSchedules();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  }

  async function updateSchedule(id: number, isActive: boolean): Promise<void> {
    try {
      const response = await fetch("/api/broadcast/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengubah status jadwal");
      await loadSchedules();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Gagal mengubah jadwal");
    }
  }

  async function deleteSchedule(id: number): Promise<void> {
    if (!window.confirm("Hapus jadwal broadcast ini? Riwayat broadcast yang sudah dibuat tidak ikut terhapus.")) return;
    try {
      const response = await fetch(`/api/broadcast/schedules?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghapus jadwal");
      await loadSchedules();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus jadwal");
    }
  }

  async function toggleRuns(id: number): Promise<void> {
    if (runsBySchedule[id]) {
      setRunsBySchedule((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }
    setLoadingRuns(id);
    try {
      const response = await fetch(`/api/broadcast/schedules/${id}/runs`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengambil riwayat jadwal");
      setRunsBySchedule((current) => ({ ...current, [id]: data.runs ?? [] }));
    } catch (runsError) {
      setError(runsError instanceof Error ? runsError.message : "Gagal mengambil riwayat jadwal");
    } finally {
      setLoadingRuns(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CalendarClock className="h-4 w-4" />
          Jadwal Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        {success && <p className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />{success}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <div><Label htmlFor="schedule-name">Nama jadwal</Label><input id="schedule-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Pengingat follow-up" className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm" /></div>
          <div><Label htmlFor="schedule-type">Berulang</Label><select id="schedule-type" value={scheduleType} onChange={(event) => setScheduleType(event.target.value as Schedule["schedule_type"])} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm"><option value="once">Sekali jalan</option><option value="daily">Setiap hari</option><option value="weekly">Setiap minggu</option></select></div>
          <div><Label htmlFor="schedule-start">Tanggal & jam mulai (WIB)</Label><input id="schedule-start" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm" /></div>
          <div><Label htmlFor="schedule-end">Berakhir (opsional, WIB)</Label><input id="schedule-end" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm" /></div>
          {scheduleType === "weekly" && <div><Label htmlFor="schedule-weekday">Hari</Label><select id="schedule-weekday" value={weekday} onChange={(event) => setWeekday(event.target.value)} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm">{WEEKDAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
        </div>

        <div><Label htmlFor="schedule-message">Pesan</Label><textarea id="schedule-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={4096} placeholder="Pesan yang dikirim otomatis..." className="mt-1.5 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-sm font-mono" /><p className="mt-1 text-right text-xs text-[var(--text-muted)]">{message.length} / 4096</p></div>

        <div>
          <Label>Filter penerima</Label>
          <div className="mt-1.5 grid gap-3 md:grid-cols-2">
            <MultiSelectFilter options={roles.map((role) => ({ value: role, label: ROLE_LABELS[role] ?? role }))} values={filterRoles} onChange={setFilterRoles} placeholder="Semua role" />
            <MultiSelectFilter options={teams.map((team) => ({ value: team, label: team }))} values={filterTeams} onChange={setFilterTeams} placeholder="Semua team" />
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={filterActive} onChange={(event) => setFilterActive(event.target.checked)} /> Hanya user aktif</label>
        </div>

        <div className="flex justify-end"><Button onClick={() => void saveSchedule()} disabled={saving} className="bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><CalendarClock className="mr-2 h-4 w-4" />Simpan Jadwal</>}</Button></div>

        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Jadwal tersimpan</h3>
          {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" /></div> : schedules.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Belum ada jadwal broadcast.</p> : schedules.map((schedule) => <div key={schedule.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-medium text-[var(--text-primary)]">{schedule.name}</p><p className="text-xs text-[var(--text-muted)]">{formatScheduleType(schedule)} · berikutnya {formatWibDateTime(schedule.next_run_at, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>{schedule.creator && <p className="text-xs text-[var(--text-muted)]">Dibuat oleh {schedule.creator.full_name}</p>}</div><span className={`rounded-full px-2 py-0.5 text-xs ${schedule.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{schedule.is_active ? "Aktif" : "Nonaktif"}</span></div><p className="mt-2 line-clamp-2 text-xs text-[var(--text-secondary)]">{schedule.message}</p><div className="mt-3 flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => void toggleRuns(schedule.id)} disabled={loadingRuns === schedule.id}>{loadingRuns === schedule.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <History className="mr-1 h-3.5 w-3.5" />}Riwayat</Button><Button variant="outline" size="sm" onClick={() => void updateSchedule(schedule.id, !schedule.is_active)}>{schedule.is_active ? <><Pause className="mr-1 h-3.5 w-3.5" />Nonaktifkan</> : <><Play className="mr-1 h-3.5 w-3.5" />Aktifkan</>}</Button><Button variant="destructive" size="sm" onClick={() => void deleteSchedule(schedule.id)}><Trash2 className="mr-1 h-3.5 w-3.5" />Hapus</Button></div>{runsBySchedule[schedule.id] && <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">{runsBySchedule[schedule.id].length === 0 ? <p className="text-xs text-[var(--text-muted)]">Belum ada eksekusi.</p> : runsBySchedule[schedule.id].map((run) => <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-[var(--text-muted)]">{formatWibDateTime(run.scheduled_for, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span><span className={run.status === "failed" ? "text-rose-600" : "text-[var(--text-secondary)]"}>{run.status}{run.broadcast_id ? ` · Broadcast #${run.broadcast_id}` : ""}</span></div>)}</div>}</div>)}
        </div>
      </CardContent>
    </Card>
  );
}
