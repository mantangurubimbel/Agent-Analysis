"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Invoice = { id: number; invoice_number: string; period_month: string; status: string; total_chats: number; rate: number; total: number; due_at: string; users?: { full_name: string } | null };

const statusLabel: Record<string, string> = { issued: "Terbit", paid: "Lunas", overdue: "Jatuh tempo", suspended: "Ditangguhkan", cancelled: "Dibatalkan" };

export function InvoiceManager({ userRole }: { userRole: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Memuat invoice saat tab dibuka.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  return <Card>
    <CardHeader><CardTitle>Invoice Billing</CardTitle><CardDescription>Invoice dibuat per supervisor dan status pembayaran dikonfirmasi admin.</CardDescription></CardHeader>
    <CardContent>
      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : error ? <p className="text-sm text-red-600">{error}</p> : invoices.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Belum ada invoice.</p> : <div className="space-y-3">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-4"><div><div className="font-semibold">{invoice.invoice_number}</div><div className="text-sm text-[var(--text-muted)]">{invoice.users?.full_name ?? "Supervisor"} · {invoice.period_month.slice(0, 7)} · {invoice.total_chats} chat</div><div className="text-sm">Status: <span className="font-medium">{statusLabel[invoice.status] ?? invoice.status}</span></div></div><div className="flex items-center gap-3"><div className="font-semibold">Rp {Number(invoice.total).toLocaleString("id-ID")}</div>{userRole === "admin" && invoice.status !== "paid" && invoice.status !== "cancelled" && <Button size="sm" onClick={() => void markPaid(invoice.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Tandai Lunas</Button>}</div></div>)}</div>}
    </CardContent>
  </Card>;
}
