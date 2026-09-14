import { Users, TrendingUp, Award, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCard } from "./agent-card";
import type { AgentStats } from "@/lib/supabase/queries";
import type { TeamStructure, User } from "@/types/database";

interface TeamOverviewProps {
  structure: TeamStructure;
  agentStats: AgentStats[];
  currentRole: string;
}

export function TeamOverview({
  structure,
  agentStats,
  currentRole,
}: TeamOverviewProps) {
  // Hitung total
  const totalAgents = structure.agents.length;
  const totalLeaders = structure.leaders.length;
  const totalChats = agentStats.reduce((s, a) => s + a.total, 0);
  const totalClosed = agentStats.reduce((s, a) => s + a.closed, 0);
  const totalScoredChats = agentStats.filter((a) => a.total > 0);
  const avgClosingRate =
    totalChats > 0 ? Math.round((totalClosed / totalChats) * 100) : 0;
  const avgScore =
    totalScoredChats.length > 0
      ? Math.round(
          totalScoredChats.reduce((s, a) => s + a.avg_score, 0) /
            totalScoredChats.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={currentRole === "admin" ? "Total Agent" : "Agent di Tim"}
          value={totalAgents}
          icon={<Users className="w-5 h-5" />}
          description={
            currentRole === "supervisor" || currentRole === "admin"
              ? `${totalLeaders} leader`
              : undefined
          }
        />
        <StatCard
          title="Total Chat"
          value={totalChats}
          icon={<Clock className="w-5 h-5" />}
          description={`${totalClosed} closed`}
        />
        <StatCard
          title="Closing Rate"
          value={`${avgClosingRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          description="Rata-rata tim"
          highlight
        />
        <StatCard
          title="Avg Skor"
          value={avgScore}
          icon={<Award className="w-5 h-5" />}
          description="Rata-rata tim"
        />
      </div>

      {/* Leaders List (kalau supervisor/admin) */}
      {structure.leaders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            🎯 Leader ({structure.leaders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {structure.leaders.map((leader) => (
              <LeaderCard key={leader.id} leader={leader} />
            ))}
          </div>
        </div>
      )}

      {/* Agents List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          👥 Agent ({structure.agents.length})
        </h2>
        {agentStats.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada data chat untuk agent di tim ini.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {agentStats.map((stats) => (
              <AgentCard key={stats.agent_id} stats={stats} />
            ))}
          </div>
        )}
      </div>
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

function LeaderCard({ leader }: { leader: User }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
          🎯
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{leader.full_name}</div>
          <div className="text-xs text-muted-foreground">Leader</div>
        </div>
      </CardContent>
    </Card>
  );
}
