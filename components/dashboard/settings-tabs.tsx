"use client";

import { useState } from "react";
import { Bot, BarChart3, User as UserIcon, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { LLMConfig } from "./llm-config";
import { AnalysisConfig } from "./analysis-config";
import { ProfileConfig } from "./profile-config";
import { MaintenanceConfig } from "./maintenance-config";

type Tab = "llm" | "analysis" | "profile" | "maintenance";

const TABS = [
  { id: "llm" as const, label: "LLM", icon: Bot, roles: ["admin"] },
  { id: "analysis" as const, label: "Analysis", icon: BarChart3, roles: ["admin"] },
  { id: "maintenance" as const, label: "Maintenance", icon: Wrench, roles: ["admin"] },
  { id: "profile" as const, label: "Profile", icon: UserIcon, roles: ["admin", "leader", "supervisor", "agent"] },
];

export function SettingsTabs({ userRole }: { userRole: string }) {
  const visibleTabs = TABS.filter((t) => t.roles.includes(userRole));
  const [activeTab, setActiveTab] = useState<Tab>(visibleTabs[0]?.id ?? "profile");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                isActive
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "llm" && <LLMConfig />}
        {activeTab === "analysis" && <AnalysisConfig />}
        {activeTab === "maintenance" && <MaintenanceConfig />}
        {activeTab === "profile" && <ProfileConfig />}
      </div>
    </div>
  );
}