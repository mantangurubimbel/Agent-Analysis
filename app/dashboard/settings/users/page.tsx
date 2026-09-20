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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
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
          <span className="ml-auto">
            📤 Limit upload: <strong>{limitDefault}/hari</strong> (reset 00:00 WIB)
          </span>
        )}
      </div>

      <UserTree
        users={allUsers}
        uploadCounts={uploadCounts}
        uploadLimit={limitEnabled ? limitDefault : null}
      />
    </div>
  );
}
