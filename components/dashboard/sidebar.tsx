"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { User } from "@/types/database";
import { getRoleEmoji, getRoleLabel } from "@/lib/roles";
import {
  LayoutDashboard,
  MessageSquare,
  Trophy,
  Settings,
  BarChart3,
  Users,
  UserCog,
  Megaphone,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/chats", label: "Chats", icon: MessageSquare },
      {
        href: "/dashboard/team",
        label: "Team Saya",
        icon: Users,
        roles: ["leader", "supervisor", "admin"],
      },
    ],
  },
  {
    title: "Komunikasi",
    items: [
      {
        href: "/dashboard/broadcast",
        label: "Broadcast",
        icon: Megaphone,
        roles: ["admin", "leader", "supervisor"],
      },
    ],
  },
  {
    title: "Analitik",
    items: [
      { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        href: "/dashboard/settings/users",
        label: "Manage Users",
        icon: UserCog,
        roles: ["admin"],
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        roles: ["admin", "leader", "supervisor"],
      },
    ],
  },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter groups: hapus group yang tidak punya item visible
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(user.role);
      }),
    }))
    .filter((group) => group.items.length > 0);

  // Cari active href (paling spesifik)
  const allItems = visibleGroups.flatMap((g) => g.items);
  const activeHref = allItems
    .filter((item) => {
      if (item.href === "/dashboard") return pathname === "/dashboard";
      return pathname === item.href || pathname.startsWith(item.href + "/");
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      <button
        type="button"
        aria-label="Buka menu navigasi"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-sm transition-colors hover:bg-[var(--bg-secondary)] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(85vw,280px)] -translate-x-full flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)] shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[240px] lg:translate-x-0 lg:shadow-none",
          mobileOpen && "translate-x-0"
        )}
      >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Agent Analysis
          </span>
        </Link>
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={() => setMobileOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-2.5 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            {/* Category heading */}
            <h3 className="px-2.5 mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {group.title}
            </h3>

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeHref;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-lg shrink-0">
            {getRoleEmoji(user.role)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
