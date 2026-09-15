import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import type { AgentStats } from "@/lib/supabase/queries";

export function AgentCard({ stats }: { stats: AgentStats }) {
  const rateColor =
    stats.closing_rate >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.closing_rate >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-secondary)] transition-colors">
      <div className="p-4 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-[var(--accent)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[var(--text-primary)] truncate">
            {stats.agent_name}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {stats.total} chat • {stats.closed} closed
            {stats.pending > 0 && ` • ${stats.pending} pending`}
          </div>
        </div>

        {/* Closing Rate */}
        <div className="text-center px-3 border-l border-[var(--border)]">
          <div className={`text-xl font-bold ${rateColor}`}>
            {stats.closing_rate}%
          </div>
          <div className="text-xs text-[var(--text-muted)]">closing</div>
        </div>

        {/* Avg Score */}
        <div className="text-center px-3 border-l border-[var(--border)]">
          <div className="text-xl font-bold text-[var(--text-primary)]">
            {stats.avg_score}
          </div>
          <div className="text-xs text-[var(--text-muted)]">skor</div>
        </div>

        {/* Link */}
        <Link
          href={`/dashboard/chats?agent=${stats.agent_id}`}
          className="ml-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}