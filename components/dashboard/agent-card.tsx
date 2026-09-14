import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentStats } from "@/lib/supabase/queries";

export function AgentCard({ stats }: { stats: AgentStats }) {
  const rateColor =
    stats.closing_rate >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.closing_rate >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{stats.agent_name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stats.total} chat • {stats.closed} closed
              {stats.pending > 0 && ` • ${stats.pending} pending`}
            </div>
          </div>

          {/* Closing Rate */}
          <div className="text-center px-3 border-l">
            <div className={`text-xl font-bold ${rateColor}`}>
              {stats.closing_rate}%
            </div>
            <div className="text-xs text-muted-foreground">closing</div>
          </div>

          {/* Avg Score */}
          <div className="text-center px-3 border-l">
            <div className="text-xl font-bold">{stats.avg_score}</div>
            <div className="text-xs text-muted-foreground">skor</div>
          </div>

          {/* Link */}
          <Link
            href={`/dashboard/chats?agent=${stats.agent_id}`}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
