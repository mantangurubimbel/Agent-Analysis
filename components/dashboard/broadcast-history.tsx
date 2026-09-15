"use client";

import { useState, useEffect } from "react";
import { Loader2, History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function BroadcastHistory() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    // Auto-refresh setiap 5 detik
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch("/api/broadcast/list?limit=10");
      const data = await res.json();
      setBroadcasts(data.broadcasts ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-rose-500" />;
    if (status === "processing") return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="w-4 h-4" />
          History Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : broadcasts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            Belum ada broadcast
          </p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    #{b.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(b.status)}
                    <span className="text-xs capitalize text-[var(--text-muted)]">
                      {b.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                  {b.message}
                </p>

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>📤 {b.recipient_count} target</span>
                  {b.status === "completed" && (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✅ {b.success_count}
                      </span>
                      {b.failed_count > 0 && (
                        <span className="text-rose-600 dark:text-rose-400">
                          ❌ {b.failed_count}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(b.created_at).toLocaleString("id-ID", {
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
    </Card>
  );
}
