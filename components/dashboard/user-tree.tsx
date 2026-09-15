"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserFormDialog } from "./user-form-dialog";
import type { User } from "@/types/database";

const roleEmoji = {
  admin: "👑",
  supervisor: "🔍",
  leader: "🎯",
  agent: "💼",
};

const roleColor = {
  admin:
    "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300",
  supervisor:
    "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
  leader:
    "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
  agent: "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
};

export function UserTree({ users }: { users: User[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const admins = users.filter((u) => u.role === "admin");
  const supervisors = users.filter((u) => u.role === "supervisor");
  const leaders = users.filter((u) => u.role === "leader");
  const agents = users.filter((u) => u.role === "agent");

  const toggleExpand = (id: number) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpanded(newSet);
  };

  // Default: expand admin
  const isExpanded = (id: number) => expanded.has(id);

  return (
    <div className="space-y-2">
      {admins.map((admin) => (
        <div key={admin.id} className="space-y-2">
          <UserRow
            user={admin}
            users={users}
            isExpanded={isExpanded(admin.id)}
            onToggle={() => toggleExpand(admin.id)}
          />

          {isExpanded(admin.id) && (
            <div className="ml-8 space-y-2">
              {supervisors.map((sup) => (
                <div key={sup.id} className="space-y-2">
                  <UserRow
                    user={sup}
                    users={users}
                    isExpanded={isExpanded(sup.id)}
                    onToggle={() => toggleExpand(sup.id)}
                  />

                  {isExpanded(sup.id) && (
                    <div className="ml-8 space-y-2">
                      {leaders
                        .filter((l) => l.supervisor_id === sup.id)
                        .map((leader) => (
                          <LeaderNode
                            key={leader.id}
                            leader={leader}
                            agents={agents}
                            users={users}
                            expanded={expanded}
                            toggleExpand={toggleExpand}
                          />
                        ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Leaders tanpa supervisor */}
              {leaders
                .filter((l) => !l.supervisor_id)
                .map((leader) => (
                  <LeaderNode
                    key={leader.id}
                    leader={leader}
                    agents={agents}
                    users={users}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                  />
                ))}

              {/* Agents tanpa leader */}
              {agents
                .filter((a) => !a.leader_id)
                .map((agent) => (
                  <UserRow
                    key={agent.id}
                    user={agent}
                    users={users}
                    isExpanded={false}
                    onToggle={() => {}}
                  />
                ))}
            </div>
          )}
        </div>
      ))}

      {/* Kalau tidak ada admin, tampilkan tree dari supervisor */}
      {admins.length === 0 && (
        <div className="space-y-2">
          {supervisors.map((sup) => (
            <div key={sup.id} className="space-y-2">
              <UserRow
                user={sup}
                users={users}
                isExpanded={isExpanded(sup.id)}
                onToggle={() => toggleExpand(sup.id)}
              />
              {isExpanded(sup.id) && (
                <div className="ml-8 space-y-2">
                  {leaders
                    .filter((l) => l.supervisor_id === sup.id)
                    .map((leader) => (
                      <LeaderNode
                        key={leader.id}
                        leader={leader}
                        agents={agents}
                        users={users}
                        expanded={expanded}
                        toggleExpand={toggleExpand}
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderNode({
  leader,
  agents,
  users,
  expanded,
  toggleExpand,
}: {
  leader: User;
  agents: User[];
  users: User[];
  expanded: Set<number>;
  toggleExpand: (id: number) => void;
}) {
  const isExpanded = expanded.has(leader.id);
  const leaderAgents = agents.filter((a) => a.leader_id === leader.id);

  return (
    <div className="space-y-2">
      <UserRow
        user={leader}
        users={users}
        isExpanded={isExpanded}
        onToggle={() => toggleExpand(leader.id)}
      />
      {isExpanded && leaderAgents.length > 0 && (
        <div className="ml-8 space-y-2">
          {leaderAgents.map((agent) => (
            <UserRow
              key={agent.id}
              user={agent}
              users={users}
              isExpanded={false}
              onToggle={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  users,
  isExpanded,
  onToggle,
}: {
  user: User;
  users: User[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const emoji = roleEmoji[user.role as keyof typeof roleEmoji] ?? "👤";
  const colorClass = roleColor[user.role as keyof typeof roleColor] ?? "bg-muted";
  const isInactive = user.is_active === false;

  const subCount = getSubordinateCount(user, users);
  const hasSubs = subCount > 0;

  return (
    <div
      className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] ${
        isInactive ? "opacity-60" : ""
      }`}
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-muted ${
              hasSubs ? "" : "invisible"
            }`}
            disabled={!hasSubs}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${colorClass}`}
          >
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{user.full_name}</span>
              {isInactive && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {user.role} {hasSubs && `• ${subCount} subordinat`}
              {user.telegram_id > 0 && ` • TG: ${user.telegram_id}`}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isInactive ? (
              <UserX className="w-4 h-4 text-rose-500" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>

          <UserFormDialog mode="edit" user={user} allUsers={users} />
        </div>
      </div>
    </div>
  );
}

function getSubordinateCount(user: User, users: User[]): number {
  if (user.role === "supervisor") {
    const leaders = users.filter((u) => u.supervisor_id === user.id);
    const leaderIds = leaders.map((l) => l.id);
    const agents = users.filter(
      (u) => u.leader_id && leaderIds.includes(u.leader_id)
    );
    return leaders.length + agents.length;
  }
  if (user.role === "leader") {
    return users.filter((u) => u.leader_id === user.id).length;
  }
  if (user.role === "admin") {
    return users.length - 1;
  }
  return 0;
}
