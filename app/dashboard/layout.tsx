import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/login?error=user_not_registered");

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end gap-1 border-b border-[var(--border)] bg-[var(--bg-main)] pl-16 pr-4 sm:px-5">
          <ThemeToggle />
          <UserMenu email={authUser.email ?? ""} />
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
