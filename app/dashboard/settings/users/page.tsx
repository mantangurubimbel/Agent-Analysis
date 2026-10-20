import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { UserTree } from "@/components/dashboard/user-tree";
import { UserFormDialog } from "@/components/dashboard/user-form-dialog";
import { getTodayUploadCounts } from "@/lib/supabase/queries";
import type { User } from "@/types/database";

export default async function ManageUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("role")
    .order("full_name");

  const allUsers = (users ?? []) as User[];

  // Ambil counter upload hari ini + config limit secara paralel
  const [uploadCounts, limitRes] = await Promise.all([
    getTodayUploadCounts(),
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["upload.daily_limit_enabled", "upload.daily_limit_default"]),
  ]);

  const limitMap: Record<string, string> = {};
  for (const row of limitRes.data ?? []) {
    limitMap[row.key] = row.value;
  }
  const limitEnabled = limitMap["upload.daily_limit_enabled"] !== "false";
  const limitDefault = parseInt(limitMap["upload.daily_limit_default"] ?? "1", 10);
  const supervisorIds = allUsers.filter((u) => u.role === "supervisor").map((u) => u.id);
  const { data: overrides } = supervisorIds.length ? await supabase.from("app_settings").select("key, value").in("key", supervisorIds.map((id) => `upload.daily_limit.supervisor.${id}`)) : { data: [] };
  const overrideMap = new Map((overrides ?? []).map((row) => [row.key, Number(row.value)]));
  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date());
  const previousMonth = (() => { const [year, month] = currentMonth.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, 1)); date.setUTCMonth(date.getUTCMonth() - 1); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`; })();
  const { data: invoices } = await supabase.from("invoices").select("supervisor_id, status").eq("period_month", previousMonth).eq("status", "paid");
  const paidSupervisors = new Set((invoices ?? []).map((row) => row.supervisor_id));
  const effectiveLimits: Record<number, number> = {};
  for (const item of allUsers) {
    const supervisor = item.role === "supervisor" ? item.id : item.role === "leader" ? item.supervisor_id : allUsers.find((leader) => leader.id === item.leader_id)?.supervisor_id;
    const limit = supervisor ? (overrideMap.get(`upload.daily_limit.supervisor.${supervisor}`) ?? limitDefault) : limitDefault;
    effectiveLimits[item.id] = new Date().getDate() >= 5 && supervisor && !paidSupervisors.has(supervisor) ? 0 : limit;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Manage Users
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            Kelola struktur tim: {allUsers.length} user terdaftar
          </p>
        </div>
        <UserFormDialog mode="create" allUsers={allUsers} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
        <span>👑 Admin</span>
        <span>🔍 Supervisor</span>
        <span>🎯 Leader</span>
        <span>💼 Agent</span>
        {limitEnabled && (
            <span className="sm:ml-auto">
        📤 Limit default: <strong>{limitDefault}/hari</strong> (reset 00:00 WIB)
          </span>
        )}
      </div>

      <UserTree
        users={allUsers}
        uploadCounts={uploadCounts}
        uploadLimit={limitEnabled ? limitDefault : null}
        effectiveLimits={effectiveLimits}
      />
    </div>
  );
}
