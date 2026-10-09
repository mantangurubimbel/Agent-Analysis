import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBroadcastScope } from "@/lib/broadcast-access";
import { BroadcastWorkspace } from "@/components/dashboard/broadcast-workspace";

export default async function BroadcastPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Hanya admin, supervisor, dan leader
  if (!["admin", "supervisor", "leader"].includes(user.role)) {
    redirect("/dashboard");
  }

  const scope = await getBroadcastScope(await createClient(), user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          📢 Broadcast Telegram
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">
          Kirim pesan ke user via Telegram
        </p>
      </div>

      <BroadcastWorkspace teams={scope.teams} roles={scope.allowedRoles} />
    </div>
  );
}
