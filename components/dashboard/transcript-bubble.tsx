"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Transcript, TranscriptMessage } from "@/types/database";
import type { Highlight } from "@/lib/highlight";

interface TranscriptBubbleProps {
  transcript: Transcript;
  highlights?: Highlight[];
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const HIGHLIGHT_STYLES = {
  good: {
    border: "border-l-4 border-l-emerald-500",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  },
  objection: {
    border: "border-l-4 border-l-amber-500",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  },
  improve: {
    border: "border-l-4 border-l-rose-500",
    bg: "bg-rose-50/50 dark:bg-rose-950/20",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  },
  key: {
    border: "border-l-4 border-l-blue-500",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
};

export function TranscriptBubble({
  transcript,
  highlights = [],
}: TranscriptBubbleProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const highlightMap = useMemo(() => {
    const map = new Map<number, Highlight[]>();
    for (const h of highlights) {
      if (!map.has(h.messageIndex)) map.set(h.messageIndex, []);
      map.get(h.messageIndex)!.push(h);
    }
    return map;
  }, [highlights]);

  // Hitung jumlah match
  const matchCount = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return 0;
    return transcript.messages.filter((m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
  }, [transcript.messages, searchQuery]);

  return (
    <div className="space-y-3">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari dalam percakapan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Match info */}
      {searchQuery.length >= 2 && (
        <p className="text-xs text-muted-foreground">
          🔍 {matchCount} pesan mengandung &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      {/* Messages */}
      <div className="space-y-2 py-2">
        {transcript.messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            isAgent={msg.sender === "agent"}
            highlights={highlightMap.get(idx) ?? []}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isAgent,
  highlights,
  searchQuery,
}: {
  message: TranscriptMessage;
  isAgent: boolean;
  highlights: Highlight[];
  searchQuery: string;
}) {
  const primaryHighlight = useMemo(() => {
    if (highlights.length === 0) return null;
    const priority = ["improve", "objection", "key", "good"];
    for (const p of priority) {
      const h = highlights.find((x) => x.type === p);
      if (h) return h;
    }
    return highlights[0];
  }, [highlights]);

  const style = primaryHighlight
    ? HIGHLIGHT_STYLES[primaryHighlight.type as keyof typeof HIGHLIGHT_STYLES]
    : null;
  const hasHighlight = !!primaryHighlight;
  const content = message.is_media ? "[Media]" : message.content;

  // Check apakah message mengandung search query
  const isSearchMatch =
    searchQuery.length >= 2 &&
    content.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm transition-all",
          hasHighlight
            ? "text-foreground"
            : isAgent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          style?.border,
          style?.bg,
          isSearchMatch && "ring-2 ring-yellow-400 ring-offset-1"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 mb-1 text-xs",
            hasHighlight
              ? "text-muted-foreground"
              : isAgent
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          )}
        >
          <span className="font-medium">{message.sender_name}</span>
          <span>•</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {primaryHighlight && (
          <div className="mb-1">
            <span
              className={cn(
                "inline-block px-2 py-0.5 text-xs rounded font-medium",
                style?.badge
              )}
            >
              {primaryHighlight.label}
            </span>
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">
          {searchQuery ? highlightText(content, searchQuery) : content}
        </div>
      </div>
    </div>
  );
}
