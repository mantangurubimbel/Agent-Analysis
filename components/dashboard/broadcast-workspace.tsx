"use client";

import { useState } from "react";
import { CalendarClock, History, Send } from "lucide-react";
import { BroadcastForm } from "@/components/dashboard/broadcast-form";
import { BroadcastHistory } from "@/components/dashboard/broadcast-history";
import { BroadcastScheduleManager } from "@/components/dashboard/broadcast-schedule-manager";

type BroadcastTab = "send" | "scheduled" | "history";

interface BroadcastWorkspaceProps {
  teams: string[];
  roles: string[];
}

const tabs: Array<{ id: BroadcastTab; label: string; description: string; icon: typeof Send }> = [
  { id: "send", label: "Kirim Sekarang", description: "Kirim pesan langsung", icon: Send },
  { id: "scheduled", label: "Terjadwal", description: "Atur pengiriman otomatis", icon: CalendarClock },
  { id: "history", label: "History", description: "Lihat broadcast sebelumnya", icon: History },
];

export function BroadcastWorkspace({ teams, roles }: BroadcastWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<BroadcastTab>("send");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 sm:grid-cols-3">
        {tabs.map(({ id, label, description, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                active
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className={`block text-xs ${active ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "send" && <BroadcastForm />}
      {activeTab === "scheduled" && <BroadcastScheduleManager teams={teams} roles={roles} />}
      {activeTab === "history" && <BroadcastHistory />}
    </div>
  );
}
