"use client";

import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/supabase/queries";

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
        <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Medal className="w-5 h-5 text-slate-500 dark:text-slate-300" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
        <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)] shrink-0">
      {rank}
    </div>
  );
}

export function LeaderboardTable({ data }: { data: LeaderboardEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] py-16 text-center text-[var(--text-muted)]">
        Belum ada data untuk leaderboard.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, idx) => {
        const rank = idx + 1;
        return (
          <div
            key={entry.agent_id}
            className={`rounded-lg border bg-[var(--surface)] p-4 flex items-center gap-4 transition-colors ${
              rank <= 3
                ? "border-[var(--accent)]/30"
                : "border-[var(--border)]"
            }`}
          >
            {getRankBadge(rank)}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)] truncate">
                  {entry.agent_name}
                </span>
                {entry.team && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                    {entry.team}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {entry.total} chat • {entry.closed} closed •{" "}
                {entry.no_response} no resp
              </p>
            </div>

            <div className="text-center px-4 border-l border-[var(--border)]">
              <div className="text-lg font-bold text-[var(--accent)]">
                {entry.closing_rate}%
              </div>
              <div className="text-xs text-[var(--text-muted)]">closing</div>
            </div>

            <div className="text-center px-4 border-l border-[var(--border)]">
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {entry.avg_score}
              </div>
              <div className="text-xs text-[var(--text-muted)]">skor</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}