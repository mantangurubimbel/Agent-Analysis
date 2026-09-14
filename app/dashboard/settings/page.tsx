import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Hanya admin/leader/supervisor yang bisa akses
  if (!["admin", "leader", "supervisor"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Konfigurasi sistem & profil
        </p>
      </div>

      <SettingsTabs userRole={user.role} />
    </div>
  );
}
