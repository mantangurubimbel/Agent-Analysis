import { getLeaderboard } from "@/lib/supabase/queries";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";

export default async function LeaderboardPage() {
  const entries = await getLeaderboard(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          Ranking agent berdasarkan closing rate (30 hari terakhir)
        </p>
      </div>
      <LeaderboardTable data={entries} />
    </div>
  );
}
