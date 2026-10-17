"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Invoice = { id: number; invoice_number: string; period_month: string; status: string; total_chats: number; rate: number; total: number; due_at: string; users?: { full_name: string } | null };
type InvoiceDetail = Invoice & { issued_at: string; invoice_items?: { uploader_name_snapshot: string; uploader_role: string; chat_count: number; amount: number }[]; invoice_settings?: { payment_instructions?: string } };

const statusLabel: Record<string, string> = { issued: "Terbit", paid: "Lunas", overdue: "Jatuh tempo", suspended: "Ditangguhkan", cancelled: "Dibatalkan" };

export function InvoiceManager({ userRole }: { userRole: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<{ id: number; full_name: string }[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [supervisorId, setSupervisorId] = useState("");
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/invoices");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengambil invoice");
      setInvoices(data.invoices ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal mengambil invoice"); }
    finally { setLoading(false); }
  }

  async function markPaid(id: number) {
    const response = await fetch(`/api/invoices/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    if (response.ok) void load();
  }

  async function generate() {
    if (!supervisorId || !period) return;
    const response = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supervisor_id: Number(supervisorId), period }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Gagal membuat invoice"); else void load();
  }
  async function showDetail(id: number) { setDetailLoading(true); setError(null); try { const response = await fetch(`/api/invoices/${id}`); const data = await response.json(); if (response.ok) setSelected(data.invoice); else setError(data.error || "Gagal membuka detail invoice"); } finally { setDetailLoading(false); } }

  // Memuat invoice saat tab dibuka.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); if (userRole === "admin") fetch("/api/invoices/options").then((r) => r.json()).then((d) => { setSupervisors(d.supervisors ?? []); setPeriods(d.periods ?? []); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <Card>
    <CardHeader><CardTitle>Invoice Billing</CardTitle><CardDescription>Invoice dibuat per supervisor dan status pembayaran dikonfirmasi admin.</CardDescription></CardHeader>
    <CardContent>
      {userRole === "admin" && <div className="mb-5 flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border)] p-3"><label className="text-sm">Supervisor<select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} className="mt-1 block rounded-md border border-[var(--border)] bg-transparent px-2 py-2"><option value="">Pilih supervisor</option>{supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label><label className="text-sm">Periode<select value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 block rounded-md border border-[var(--border)] bg-transparent px-2 py-2"><option value="">Pilih periode</option>{periods.map((p) => <option key={p} value={p}>{p}</option>)}</select></label><Button onClick={() => void generate()} disabled={!supervisorId || !period}>Generate Invoice</Button></div>}
      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : error ? <p className="text-sm text-red-600">{error}</p> : invoices.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Belum ada invoice.</p> : <div className="space-y-3">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-4"><button type="button" className="cursor-pointer text-left" onClick={() => void showDetail(invoice.id)}><div className="font-semibold">{invoice.invoice_number}</div><div className="text-sm text-[var(--text-muted)]">{invoice.users?.full_name ?? "Supervisor"} · {invoice.period_month.slice(0, 7)} · {invoice.total_chats} chat</div><div className="text-sm">Status: <span className="font-medium">{statusLabel[invoice.status] ?? invoice.status}</span></div></button><div className="flex items-center gap-3"><div className="font-semibold">Rp {Number(invoice.total).toLocaleString("id-ID")}</div>{userRole === "admin" && invoice.status !== "paid" && invoice.status !== "cancelled" && <Button size="sm" onClick={() => void markPaid(invoice.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Tandai Lunas</Button>}</div></div>)}</div>}
      {detailLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {selected && !detailLoading && (() => { const items = selected.invoice_items ?? []; const totalAgents = items.length; const left = items.filter((_, i) => i % 2 === 0); const right = items.filter((_, i) => i % 2 === 1); const table = (rows: typeof items) => <div className="overflow-hidden rounded border border-[var(--border)]"><div className="grid grid-cols-[1fr_70px] gap-2 bg-[var(--surface)] p-2 text-sm font-semibold"><span>Uploader</span><span className="text-right">Chat</span></div>{rows.map((item, index) => <div key={`${item.uploader_name_snapshot}-${index}`} className="grid grid-cols-[1fr_70px] gap-2 border-t border-[var(--border)] p-2 text-sm"><span>{item.uploader_name_snapshot}</span><span className="text-right">{item.chat_count}</span></div>)}</div>; return <div className="invoice-print mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"><section className="invoice-page"><div className="flex justify-between border-b border-[var(--border)] pb-4"><div><h2 className="text-xl font-bold">INVOICE</h2><p className="text-sm text-[var(--text-muted)]">Laporan billing chat berhasil dianalisis</p></div><div className="text-right text-sm"><div className="font-semibold">{selected.invoice_number}</div><div>Periode: {selected.period_month.slice(0, 7)}</div><div>Status: {statusLabel[selected.status] ?? selected.status}</div></div></div><div className="mt-5 grid grid-cols-4 gap-2 text-center">{[["Total Agent", totalAgents], ["Total Chat", selected.total_chats], ["Harga per Chat", `Rp ${Number(selected.rate).toLocaleString("id-ID")}`], ["Total", `Rp ${Number(selected.total).toLocaleString("id-ID")}`]].map(([label, value]) => <div key={String(label)} className="rounded border border-[var(--border)] p-3"><div className="text-xs text-[var(--text-muted)]">{label}</div><div className="mt-1 font-bold">{value}</div></div>)}</div><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><div className="font-semibold">Ditagihkan kepada</div><div>{selected.users?.full_name ?? "Supervisor"}</div></div><div className="sm:text-right"><div>Terbit: {new Date(selected.issued_at).toLocaleDateString("id-ID")}</div><div>Jatuh tempo: {new Date(selected.due_at).toLocaleDateString("id-ID")}</div></div></div>{selected.invoice_settings?.payment_instructions && <p className="mt-8 whitespace-pre-wrap border-t border-[var(--border)] pt-4 text-sm">{selected.invoice_settings.payment_instructions}</p>}</section><section className="invoice-page invoice-detail-page"><h3 className="mb-4 text-lg font-semibold">Detail Uploader</h3><div className="grid grid-cols-2 gap-5">{table(left)}{table(right)}</div></section><div className="mt-5 flex justify-between"><button type="button" onClick={() => window.print()} className="inline-flex items-center rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"><Printer className="mr-2 h-4 w-4" />Cetak / Simpan PDF</button><button type="button" onClick={() => setSelected(null)} className="text-sm text-[var(--text-muted)]">Tutup</button></div></div>; })()}
    </CardContent>
  </Card>;
}
