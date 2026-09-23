"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, X, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OutcomeBadge } from "@/components/dashboard/outcome-badge";
import { cn } from "@/lib/utils";
import type { ChatRecord } from "@/types/database";
import { isChatFailed } from "@/types/database";
import { formatWibDateTime } from "@/lib/timezone";

const OUTCOME_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "closed", label: "✅ Closed" },
  { value: "no_response", label: "😶 No Response" },
  { value: "rejected", label: "❌ Rejected" },
  { value: "pending", label: "⏳ Pending" },
  { value: "error", label: "⚠️ Error" },
] as const;

interface AgentOption {
  id: number;
  full_name: string;
}

interface ChatListProps {
  chats: ChatRecord[];
  searchFn?: (query: string) => Promise<ChatRecord[]>;
  agents?: AgentOption[];
  userRole?: string;
}

export function ChatList({
  chats,
  searchFn,
  agents = [],
  userRole = "agent",
}: ChatListProps) {
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<ChatRecord[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [reanalyzing, setReanalyzing] = useState<Set<string>>(new Set());
  const [reparsing, setReparsing] = useState<Set<string>>(new Set());

  const canReanalyze = ["admin", "supervisor"].includes(userRole);
  const canReparse = userRole === "admin";

  function handleSearchChange(value: string) {
    setSearch(value);
    if (!searchFn || !value || value.trim().length < 2) {
      setSearchResults(null);
    }
  }

  useEffect(() => {
    if (!searchFn || !search || search.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchFn(search);
        setSearchResults(results);
      } catch (e) {
        console.error("Search error:", e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, searchFn]);

  const baseData = searchResults ?? chats;

  const filtered = baseData.filter((c) => {
    const matchOutcome =
      outcome === "all" ||
      (outcome === "error" && isChatFailed(c)) ||
      c.outcome === outcome;
    const matchAgent =
      agentFilter === "all" || String(c.user_id) === agentFilter;

    if (searchResults !== null) {
      return matchOutcome && matchAgent;
    }
    const matchSearch =
      !search ||
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.agent_name.toLowerCase().includes(search.toLowerCase());
    return matchSearch && matchOutcome && matchAgent;
  });

  const failedChats = filtered.filter(isChatFailed);
  const failedChatIds = failedChats.map((c) => c.chat_id);

  async function handleReanalyze(chatId: string) {
    setReanalyzing((prev) => new Set(prev).add(chatId));

    try {
      const res = await fetch("/api/chats/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal re-analyze");

      setTimeout(() => {
        setReanalyzing((prev) => {
          const n = new Set(prev);
          n.delete(chatId);
          return n;
        });
        window.location.reload();
      }, 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal re-analyze");
      setReanalyzing((prev) => {
        const n = new Set(prev);
        n.delete(chatId);
        return n;
      });
    }
  }

  async function handleBulkReanalyze() {
    if (failedChatIds.length === 0) return;

    const confirmed = confirm(
      `Re-analyze ${failedChatIds.length} chat yang gagal?\n\nProses akan dijalankan di background.`
    );
    if (!confirmed) return;

    const ids = failedChatIds.slice(0, 10);
    setReanalyzing(new Set(ids));

    try {
      const res = await fetch("/api/chats/reanalyze-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_ids: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bulk re-analyze");

      alert(`✅ ${data.queued} chat dijadwalkan untuk re-analyze.`);
      setTimeout(() => window.location.reload(), 5000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal bulk re-analyze");
      setReanalyzing(new Set());
    }
  }

  async function handleReparse(chatId: string) {
    setReparsing((prev) => new Set(prev).add(chatId));

    try {
      const res = await fetch("/api/chats/reparse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal parse ulang");

      alert("✅ Chat dijadwalkan untuk parse ulang dan analisis ulang.");
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal parse ulang");
      setReparsing((prev) => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      {canReanalyze && failedChats.length > 0 && (
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-900 dark:text-amber-200">
              {failedChats.length} chat gagal analisis
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleBulkReanalyze}
            disabled={reanalyzing.size > 0}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {reanalyzing.size > 0 ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Re-Analyze Semua ({Math.min(failedChatIds.length, 10)})
              </>
            )}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Cari customer, agent, atau isi percakapan..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {agents.length > 1 && (
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] whitespace-nowrap"
          >
            <option value="all">Semua Agent</option>
            {agents.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.full_name}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {OUTCOME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setOutcome(f.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border whitespace-nowrap transition-colors",
                outcome === f.value
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {searchResults !== null && (
        <p className="text-xs text-[var(--text-muted)]">
          🔍 Ditemukan <strong>{searchResults.length}</strong> chat untuk
          pencarian &ldquo;{search}&rdquo;
        </p>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-[var(--text-muted)]">
              {searchResults !== null
                ? `Tidak ada chat yang cocok dengan "${search}".`
                : chats.length === 0
                ? "Belum ada chat. Upload via Telegram bot untuk memulai."
                : "Tidak ada chat yang cocok dengan filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((chat) => {
            const failed = isChatFailed(chat);
            const isReanalyzing = reanalyzing.has(chat.chat_id);
            const isReparsing = reparsing.has(chat.chat_id);

            return (
              <div
                key={chat.chat_id}
                className={cn(
                  "rounded-lg border transition-colors",
                  failed
                    ? "border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10"
                    : "border-[var(--border)] bg-[var(--surface)]"
                )}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/chats/${chat.chat_id}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {failed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900">
                          <AlertTriangle className="w-3 h-3" />
                          Gagal Analisis
                        </span>
                      ) : (
                        <OutcomeBadge outcome={chat.outcome} />
                      )}
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {chat.customer_name}
                      </span>
                    </div>
                    </Link>
                    <p className="text-xs text-[var(--text-muted)]">
                      {chat.agent_name} • {chat.total_messages} pesan •{" "}
                      {formatWibDateTime(chat.created_at)}
                      {canReparse && (
                        <>
                          {" • "}
                          <button
                            type="button"
                            onClick={() => handleReparse(chat.chat_id)}
                            disabled={isReparsing}
                            className="font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
                          >
                            {isReparsing ? "Memproses..." : "Parse Ulang"}
                          </button>
                        </>
                      )}
                    </p>
                  </div>

                  {!failed && (
                    <div className="text-center px-4 border-l border-[var(--border)]">
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {chat.agent_score ?? "-"}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">skor</div>
                    </div>
                  )}

                  {failed && canReanalyze && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReanalyze(chat.chat_id)}
                      disabled={isReanalyzing}
                      className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    >
                      {isReanalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          Menunggu...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          Re-Analyze
                        </>
                      )}
                    </Button>
                  )}

                  <Link
                    href={`/dashboard/chats/${chat.chat_id}`}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] text-center">
        Menampilkan {filtered.length} dari {baseData.length} chat
      </p>
    </div>
  );
}
