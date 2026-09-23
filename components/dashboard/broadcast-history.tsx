"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatWibDateTime } from "@/lib/timezone";

interface Broadcast {
  id: number;
  message: string;
  filter_role: string | null;
  filter_team: string | null;
  recipient_count: number;
  success_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

interface FailedRecipient {
  recipient_id: number;
  user_id: number;
  telegram_id: number;
  full_name: string | null;
  username: string | null;
  error_message: string | null;
  sent_at: string | null;
}

export function BroadcastHistory() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [failedRecipients, setFailedRecipients] = useState<FailedRecipient[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [resending, setResending] = useState(false);
  const [failedError, setFailedError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  async function loadHistory() {
    try {
      const res = await fetch("/api/broadcast/list?limit=10");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil history broadcast");
      setBroadcasts(data.broadcasts ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadHistory(), 0);
    const interval = setInterval(loadHistory, 5000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, []);

  async function openFailedRecipients(broadcast: Broadcast) {
    setSelectedBroadcast(broadcast);
    setFailedRecipients([]);
    setFailedError(null);
    setRetryMessage(null);
    setLoadingFailed(true);

    try {
      const res = await fetch(`/api/broadcast/${broadcast.id}/failed`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil penerima yang gagal");
      setFailedRecipients(data.recipients ?? []);
    } catch (error) {
      setFailedError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoadingFailed(false);
    }
  }

  async function resendFailedRecipients() {
    if (!selectedBroadcast || failedRecipients.length === 0) return;
    if (
      !window.confirm(
        `Kirim ulang pesan ke ${failedRecipients.length} penerima yang gagal?\n\n` +
          "Jika penyebabnya format pesan Telegram, pengiriman ulang dapat gagal kembali."
      )
    ) {
      return;
    }

    setResending(true);
    setRetryMessage(null);
    setFailedError(null);
    try {
      const res = await fetch(`/api/broadcast/${selectedBroadcast.id}/failed`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menjadwalkan broadcast ulang");
      setRetryMessage(
        `Broadcast ulang #${data.broadcast_id} dijadwalkan ke ${data.recipient_count} penerima.`
      );
      await loadHistory();
    } catch (error) {
      setFailedError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setResending(false);
    }
  }

  function getStatusIcon(status: string) {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-rose-500" />;
    if (status === "processing") return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="h-4 w-4" />
          History Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : broadcasts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Belum ada broadcast</p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    #{broadcast.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(broadcast.status)}
                    <span className="text-xs capitalize text-[var(--text-muted)]">
                      {broadcast.status}
                    </span>
                  </div>
                </div>

                <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                  {broadcast.message}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>📤 {broadcast.recipient_count} target</span>
                  {broadcast.status === "completed" && (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✅ {broadcast.success_count}
                      </span>
                    </>
                  )}
                  {broadcast.failed_count > 0 && (
                    <>
                      <span className="text-rose-600 dark:text-rose-400">
                        ❌ {broadcast.failed_count}
                      </span>
                      <Button
                        variant="outline"
                        size="xs"
                        className="ml-auto"
                        onClick={() => void openFailedRecipients(broadcast)}
                      >
                        Lihat Gagal
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-xs text-[var(--text-muted)]">
                  {formatWibDateTime(broadcast.created_at, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={selectedBroadcast !== null}
        onOpenChange={(open) => {
          if (!open && !resending) setSelectedBroadcast(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Penerima Gagal — Broadcast #{selectedBroadcast?.id}</DialogTitle>
            <DialogDescription>
              Daftar akun Telegram yang tidak menerima pesan broadcast.
              {selectedBroadcast && (
                <span className="mt-1 block text-xs">
                  Waktu broadcast: {formatWibDateTime(selectedBroadcast.created_at, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingFailed ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : failedError ? (
            <div className="flex items-start gap-2 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{failedError}</span>
            </div>
          ) : failedRecipients.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              Tidak ada penerima gagal.
            </p>
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {failedRecipients.map((recipient) => (
                <div
                  key={recipient.recipient_id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {recipient.full_name || "Nama tidak tersedia"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {recipient.username ? `@${recipient.username} · ` : ""}
                        Telegram ID: {recipient.telegram_id}
                      </p>
                    </div>
                    {recipient.sent_at && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatWibDateTime(recipient.sent_at, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 break-words rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    {recipient.error_message || "Alasan gagal tidak tersedia"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {retryMessage && (
            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              {retryMessage}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedBroadcast(null)}
              disabled={resending}
            >
              Tutup
            </Button>
            <Button
              onClick={() => void resendFailedRecipients()}
              disabled={
                loadingFailed ||
                resending ||
                failedRecipients.length === 0 ||
                Boolean(retryMessage)
              }
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menjadwalkan...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kirim Ulang yang Gagal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
