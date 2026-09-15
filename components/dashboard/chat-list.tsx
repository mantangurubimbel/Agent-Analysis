"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OutcomeBadge } from "@/components/dashboard/outcome-badge";
import type { ChatRecord } from "@/types/database";
import { cn } from "@/lib/utils";

const OUTCOME_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "closed", label: "✅ Closed" },
  { value: "no_response", label: "😶 No Response" },
  { value: "rejected", label: "❌ Rejected" },
  { value: "pending", label: "⏳ Pending" },
] as const;

interface AgentOption {
  id: number;
  full_name: string;
}

interface ChatListProps {
  chats: ChatRecord[];
  searchFn?: (query: string) => Promise<ChatRecord[]>;
  agents?: AgentOption[]; // daftar agent yang visible
}

export function ChatList({ chats, searchFn, agents = [] }: ChatListProps) {
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<ChatRecord[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [agentFilter, setAgentFilter] = useState<string>("all");

  // Debounced search
  useEffect(() => {
    if (!searchFn || !search || search.trim().length < 2) {
      setSearchResults(null);
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

  // Data yang ditampilkan: hasil search atau data awal
  const baseData = searchResults ?? chats;

  const filtered = baseData.filter((c) => {
    const matchOutcome = outcome === "all" || c.outcome === outcome;
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

  return (
    <div className="space-y-4">
      {/* Filter */}
      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Cari customer, agent, atau isi percakapan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Dropdown Agent */}
        {agents.length > 1 && (
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] whitespace-nowrap"
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

      
      {/* Search info */}
      {searchResults !== null && (
        <p className="text-xs text-muted-foreground">
          🔍 Ditemukan <strong>{searchResults.length}</strong> chat untuk
          pencarian &ldquo;{search}&rdquo;
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
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
          {filtered.map((chat) => (
            <Link key={chat.chat_id} href={`/dashboard/chats/${chat.chat_id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <OutcomeBadge outcome={chat.outcome} />
                      <span className="font-medium truncate">
                        {chat.customer_name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {chat.agent_name} • {chat.total_messages} pesan •{" "}
                      {new Date(chat.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-center px-4 border-l">
                    <div className="text-lg font-bold">
                      {chat.agent_score ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">skor</div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Menampilkan {filtered.length} dari {baseData.length} chat
      </p>
    </div>
  );
}
