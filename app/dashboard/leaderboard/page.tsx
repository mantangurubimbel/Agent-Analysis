import { getLeaderboard } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const entries = await getLeaderboard(30);

  // Judul berdasarkan role
  const title =
    user.role === "admin"
      ? "Leaderboard Global"
      : user.role === "supervisor"
      ? "Leaderboard Tim"
      : "Leaderboard Agent";

  const description =
    user.role === "admin"
      ? "Ranking semua agent (30 hari terakhir)"
      : user.role === "supervisor"
      ? "Ranking agent di bawah supervisi kamu"
      : "Ranking agent di bawah kepemimpinan kamu";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <LeaderboardTable data={entries} />
    </div>
  );
}