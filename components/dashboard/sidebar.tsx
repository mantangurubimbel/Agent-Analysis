"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@/types/database";
import { getRoleEmoji, getRoleLabel } from "@/lib/roles";
import { LayoutDashboard, MessageSquare, Trophy, Settings, BarChart3, Users, UserCog } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chats", label: "Chats", icon: MessageSquare },
  { href: "/dashboard/team", label: "Team Saya", icon: Users, roles: ["leader", "supervisor", "admin"] },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/settings/users", label: "Manage Users", icon: UserCog, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  // Hitung href paling spesifik yang match → hanya 1 menu aktif
  const activeHref = navItems
    .filter((item) => {
      if (item.roles && !item.roles.includes(user.role)) return false;
      if (item.href === "/dashboard") return pathname === "/dashboard";
      return pathname === item.href || pathname.startsWith(item.href + "/");
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Agent Analysis</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => {
            if (item.roles && !item.roles.includes(user.role)) {
              return false;
            }
            return true;
          })
          .map((item) => {
            const Icon = item.icon;
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg">
            {getRoleEmoji(user.role)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}