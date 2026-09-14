import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { UserTree } from "@/components/dashboard/user-tree";
import { UserFormDialog } from "@/components/dashboard/user-form-dialog";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground mt-1">
            Kelola struktur tim: {allUsers.length} user terdaftar
          </p>
        </div>
        <UserFormDialog mode="create" allUsers={allUsers} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>👑 Admin</span>
        <span>🔍 Supervisor</span>
        <span>🎯 Leader</span>
        <span>💼 Agent</span>
      </div>

      <UserTree users={allUsers} />
    </div>
  );
}
