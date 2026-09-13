"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OutcomeBadge } from "@/components/dashboard/outcome-badge";
import type { ChatRecord } from "@/types/database";

const OUTCOME_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "closed", label: "✅ Closed" },
  { value: "no_response", label: "😶 No Response" },
  { value: "rejected", label: "❌ Rejected" },
  { value: "pending", label: "⏳ Pending" },
] as const;

export function ChatList({ chats }: { chats: ChatRecord[] }) {
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("all");

  const filtered = useMemo(() => {
    return chats.filter((c) => {
      const matchSearch =
        !search ||
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        c.agent_name.toLowerCase().includes(search.toLowerCase());
      const matchOutcome = outcome === "all" || c.outcome === outcome;
      return matchSearch && matchOutcome;
    });
  }, [chats, search, outcome]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari customer atau agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {OUTCOME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setOutcome(f.value)}
              className={`px-3 py-2 text-sm rounded-md border whitespace-nowrap transition-colors ${
                outcome === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              {chats.length === 0
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
        Menampilkan {filtered.length} dari {chats.length} chat
      </p>
    </div>
  );
}
