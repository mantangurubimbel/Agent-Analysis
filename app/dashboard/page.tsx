import {
  getStatsForCurrentUser,
  getChatsForCurrentUser,
  getTrendData,
  getObjectionStats,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, TrendingUp, Award, Clock } from "lucide-react";
import { TrendChart } from "@/components/dashboard/stats-charts";
import { OutcomeChart } from "@/components/dashboard/outcome-chart";
import { ObjectionChart } from "@/components/dashboard/objection-chart";

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

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [stats, recentChats, trendData, objections] = await Promise.all([
    getStatsForCurrentUser(),
    getChatsForCurrentUser(5),
    getTrendData(14),
    getObjectionStats(30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Halo, {user?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan performa 30 hari terakhir
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Chat Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recentChats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada chat. Upload via Telegram bot untuk memulai.
            </p>
          ) : (
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div
                  key={chat.chat_id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {chat.outcome &&
                          outcomeMeta[chat.outcome as keyof typeof outcomeMeta]
                            ?.emoji}
                      </span>
                      <span className="font-medium truncate">
                        {chat.customer_name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {chat.agent_name} • {chat.total_messages} pesan •{" "}
                      {new Date(chat.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold">
                      {chat.agent_score ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">skor</div>
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
    <Card className={highlight ? "border-primary/50 bg-accent" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
