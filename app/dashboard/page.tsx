import {
  getStatsForCurrentUser,
  getChatsForCurrentUser,
  getTrendData,
  getObjectionStats,
  getObjectionHandledRate,
  getTeamStats,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, TrendingUp, Award, Clock } from "lucide-react";
import { TrendChart } from "@/components/dashboard/stats-charts";
import { OutcomeChart } from "@/components/dashboard/outcome-chart";
import { ObjectionChart } from "@/components/dashboard/objection-chart";
import { ObjectionRateChart } from "@/components/dashboard/objection-rate-chart";
import { TeamChart } from "@/components/dashboard/team-chart";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";

const outcomeMeta = {
  closed: {
    label: "Closed",
    color: "text-emerald-600 dark:text-emerald-400",
    emoji: "✅",
  },
  no_response: {
    label: "No Response",
    color: "text-muted-foreground",
    emoji: "😶",
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-600 dark:text-rose-400",
    emoji: "❌",
  },
  pending: {
    label: "Pending",
    color: "text-amber-600 dark:text-amber-400",
    emoji: "⏳",
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const daysParam = params.days || "30";
  const days = daysParam === "all" ? 0 : parseInt(daysParam) || 30;

  const user = await getCurrentUser();

  const [stats, recentChats, trendData, objections, objectionRates, teams] =
    await Promise.all([
      getStatsForCurrentUser(days),
      getChatsForCurrentUser(5),
      getTrendData(days > 0 ? Math.min(days, 90) : 90),
      getObjectionStats(days > 0 ? days : 365),
      days > 0 ? getObjectionHandledRate(days) : Promise.resolve([]),
      days > 0 ? getTeamStats(days) : Promise.resolve([]),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Halo, {user?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            Ringkasan performa{" "}
            {daysParam === "all" ? "semua waktu" : `${days} hari terakhir`}
          </p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Chat"
          value={stats.total}
          icon={<MessageSquare className="w-5 h-5" />}
          description={`${stats.pending} pending`}
        />
        <StatCard
          title="Closing Rate"
          value={`${stats.closingRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          description={`${stats.closed} dari ${stats.total}`}
          highlight
        />
        <StatCard
          title="Avg Skor"
          value={`${stats.avgScore}/100`}
          icon={<Award className="w-5 h-5" />}
          description="Rata-rata performa"
        />
        <StatCard
          title="Butuh Perhatian"
          value={stats.noResponse + stats.rejected}
          icon={<Clock className="w-5 h-5" />}
          description={`${stats.noResponse} tidak respon`}
        />
      </div>

      <TrendChart data={trendData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OutcomeChart
          closed={stats.closed}
          no_response={stats.noResponse}
          rejected={stats.rejected}
          pending={stats.pending}
        />
        <ObjectionChart data={objections} />
      </div>

      {days > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ObjectionRateChart data={objectionRates} />
          <TeamChart data={teams} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
            Chat Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentChats.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Belum ada chat. Upload via Telegram bot untuk memulai.
            </p>
          ) : (
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div
                  key={chat.chat_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {chat.outcome &&
                          outcomeMeta[chat.outcome as keyof typeof outcomeMeta]
                            ?.emoji}
                      </span>
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {chat.customer_name}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {chat.agent_name} • {chat.total_messages} pesan •{" "}
                      {new Date(chat.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {chat.agent_score ?? 0}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">skor</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  highlight = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-[var(--surface)] p-6 transition-colors ${
        highlight
          ? "border-[var(--accent)]/30 bg-[var(--accent-subtle)]/30"
          : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {title}
        </span>
        <span className="text-[var(--text-muted)]">{icon}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        {value}
      </div>
      {description && (
        <p className="text-xs text-[var(--text-muted)] mt-2">{description}</p>
      )}
    </div>
  );
}