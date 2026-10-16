"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AgentRow = { id: number; name: string; total: number };
type LeaderRow = { leader_id: number | null; leader_name: string; supervisor_id: number | null; supervisor_name: string; total: number; agents: AgentRow[] };
type Report = { from: string; to: string; total: number; leaders: LeaderRow[] };

function monthRange(): [string, string] {
  const now = new Date();
  const year = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric" }).format(now);
  const month = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", month: "2-digit" }).format(now);
  const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return [`${year}-${month}-01`, `${year}-${month}-${String(last).padStart(2, "0")}`];
}

export function UploadReport() {
  const [defaults] = useState(monthRange);
  const [from, setFrom] = useState(defaults[0]);
  const [to, setTo] = useState(defaults[1]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/settings/upload-report?from=${from}&to=${to}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengambil laporan");
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil laporan");
    } finally {
      setLoading(false);
    }
  }

  // Memuat laporan saat tab pertama kali dibuka.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Chat Berhasil Dianalisis</CardTitle>
        <CardDescription>Jumlah chat unik untuk kebutuhan billing berdasarkan leader dan supervisor.</CardDescription>
        <div className="flex flex-wrap items-end gap-3 pt-3">
          <label className="text-sm text-[var(--text-muted)]">Dari<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text-primary)]" /></label>
          <label className="text-sm text-[var(--text-muted)]">Sampai<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text-primary)]" /></label>
          <Button onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Tampilkan</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : error ? <p className="text-sm text-red-600">{error}</p> : report && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><div className="text-3xl font-bold">{report.total}</div><div className="text-sm text-[var(--text-muted)]">Total chat unik berhasil dianalisis</div></div>
            {report.leaders.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Tidak ada chat pada rentang ini.</p> : report.leaders.map((leader) => (
              <div key={`${leader.supervisor_id ?? "none"}-${leader.leader_id ?? "none"}`} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex justify-between gap-3"><div><div className="text-xs text-[var(--text-muted)]">Supervisor: {leader.supervisor_name}</div><div className="font-semibold">{leader.leader_name}</div></div><div className="text-xl font-bold">{leader.total}</div></div>
                <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-3">{leader.agents.map((agent) => <div key={agent.id} className="flex justify-between text-sm"><span>{agent.name}</span><span className="font-medium">{agent.total}</span></div>)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
