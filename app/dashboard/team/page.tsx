import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTeamStructure } from "@/lib/hierarchy";
import { getAgentStatsForTeam } from "@/lib/supabase/queries";
import { TeamOverview } from "@/components/dashboard/team-overview";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Hanya leader/supervisor/admin yang bisa akses
  if (!["leader", "supervisor", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  const structure = await getTeamStructure(user);

  // Ambil stats untuk semua agent di tim
  const agentIds = structure.agents.map((a) => a.id);
  const agentStats = await getAgentStatsForTeam(agentIds);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Saya</h1>
        <p className="text-muted-foreground mt-1">
          {user.role === "admin"
            ? "Ringkasan semua tim"
            : user.role === "supervisor"
            ? "Leader & agent di bawah supervisi kamu"
            : "Agent di bawah kepemimpinan kamu"}
        </p>
      </div>

      <TeamOverview
        structure={structure}
        agentStats={agentStats}
        currentRole={user.role}
      />
    </div>
  );
}
