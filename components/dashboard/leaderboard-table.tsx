"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/lib/supabase/queries";

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
        <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Medal className="w-5 h-5 text-slate-500 dark:text-slate-300" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
        <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
      {rank}
    </div>
  );
}

export function LeaderboardTable({ data }: { data: LeaderboardEntry[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Belum ada data untuk leaderboard.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, idx) => {
        const rank = idx + 1;
        return (
          <Card key={entry.agent_id} className={rank <= 3 ? "border-primary/30" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              {getRankBadge(rank)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{entry.agent_name}</span>
                  {entry.team && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {entry.team}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.total} chat • {entry.closed} closed •{" "}
                  {entry.no_response} no resp
                </p>
              </div>

              <div className="text-center px-4 border-l">
                <div className="text-lg font-bold text-primary">
                  {entry.closing_rate}%
                </div>
                <div className="text-xs text-muted-foreground">closing</div>
              </div>

              <div className="text-center px-4 border-l">
                <div className="text-lg font-bold">{entry.avg_score}</div>
                <div className="text-xs text-muted-foreground">skor</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
