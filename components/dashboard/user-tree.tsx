"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { UserFormDialog } from "./user-form-dialog";
import { ActiveToggle } from "./active-toggle";
import { DeleteUserButton } from "./delete-user-button";
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

interface UserTreeProps {
  users: User[];
  uploadCounts?: Record<number, number>;
  uploadLimit?: number | null;
}

export function UserTree({
  users,
  uploadCounts = {},
  uploadLimit = null,
}: UserTreeProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const activeUsers = users.filter((u) => u.is_active !== false);
  const inactiveUsers = users.filter((u) => u.is_active === false);
  const admins = activeUsers.filter((u) => u.role === "admin");
  const supervisors = activeUsers.filter((u) => u.role === "supervisor");
  const leaders = activeUsers.filter((u) => u.role === "leader");
  const agents = activeUsers.filter((u) => u.role === "agent");

  const toggleExpand = (id: number) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpanded(newSet);
  };

  const isExpanded = (id: number) => expanded.has(id);

  const sharedProps = { users, uploadCounts, uploadLimit };

  return (
    <div className="space-y-6">
      {admins.map((admin) => (
        <div key={admin.id} className="space-y-2">
          <UserRow
            {...sharedProps}
            user={admin}
            isExpanded={isExpanded(admin.id)}
            onToggle={() => toggleExpand(admin.id)}
          />

          {isExpanded(admin.id) && (
            <div className="ml-8 space-y-2">
              {supervisors.map((sup) => (
                <div key={sup.id} className="space-y-2">
                  <UserRow
                    {...sharedProps}
                    user={sup}
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
                            {...sharedProps}
                            expanded={expanded}
                            toggleExpand={toggleExpand}
                          />
                        ))}
                    </div>
                  )}
                </div>
              ))}

              {leaders
                .filter(
                  (leader) =>
                    !leader.supervisor_id ||
                    !supervisors.some((supervisor) => supervisor.id === leader.supervisor_id)
                )
                .map((leader) => (
                  <LeaderNode
                    key={leader.id}
                    leader={leader}
                    agents={agents}
                    {...sharedProps}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                  />
                ))}

              {agents
                .filter(
                  (agent) =>
                    !agent.leader_id ||
                    !leaders.some((leader) => leader.id === agent.leader_id)
                )
                .map((agent) => (
                  <UserRow
                    {...sharedProps}
                    key={agent.id}
                    user={agent}
                    isExpanded={false}
                    onToggle={() => {}}
                  />
                ))}
            </div>
          )}
        </div>
      ))}

      {admins.length === 0 && (
        <div className="space-y-2">
          {supervisors.map((sup) => (
            <div key={sup.id} className="space-y-2">
              <UserRow
                {...sharedProps}
                user={sup}
                isExpanded={isExpanded(sup.id)}
                onToggle={() => toggleExpand(sup.id)}
              />
              {isExpanded(sup.id) && (
                <div className="ml-8 space-y-2">
                  {leaders
                    .filter((leader) => leader.supervisor_id === sup.id)
                    .map((leader) => (
                      <LeaderNode
                        key={leader.id}
                        leader={leader}
                        agents={agents}
                        {...sharedProps}
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

      {inactiveUsers.length > 0 && (
        <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">User Nonaktif</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                User tidak dapat login atau upload, tetapi riwayat datanya tetap tersimpan.
              </p>
            </div>
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {inactiveUsers.length} user
            </span>
          </div>

          <div className="space-y-2">
            {inactiveUsers.map((inactiveUser) => (
              <UserRow
                key={inactiveUser.id}
                {...sharedProps}
                user={inactiveUser}
                isExpanded={false}
                onToggle={() => {}}
                showSubordinates={false}
                showDelete
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LeaderNode({
  leader,
  agents,
  users,
  uploadCounts,
  uploadLimit,
  expanded,
  toggleExpand,
}: {
  leader: User;
  agents: User[];
  users: User[];
  uploadCounts: Record<number, number>;
  uploadLimit: number | null;
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
        uploadCounts={uploadCounts}
        uploadLimit={uploadLimit}
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
              uploadCounts={uploadCounts}
              uploadLimit={uploadLimit}
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
  uploadCounts,
  uploadLimit,
  isExpanded,
  onToggle,
  showSubordinates = true,
  showDelete = false,
}: {
  user: User;
  users: User[];
  uploadCounts: Record<number, number>;
  uploadLimit: number | null;
  isExpanded: boolean;
  onToggle: () => void;
  showSubordinates?: boolean;
  showDelete?: boolean;
}) {
  const emoji = roleEmoji[user.role as keyof typeof roleEmoji] ?? "👤";
  const colorClass =
    roleColor[user.role as keyof typeof roleColor] ?? "bg-muted";
  const isInactive = user.is_active === false;

  const subCount = getSubordinateCount(user, users);
  const hasSubs = showSubordinates && subCount > 0;

  // Counter upload (hanya untuk agent & kalau limit aktif)
  const showUploadCounter =
    user.role === "agent" && uploadLimit !== null && uploadLimit > 0;
  const uploadCount = uploadCounts[user.id] ?? 0;
  const uploadPct = showUploadCounter ? uploadCount / uploadLimit : 0;
  const uploadBadgeClass =
    uploadPct >= 1
      ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
      : uploadPct >= 0.8
      ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
      : "bg-[var(--bg-secondary)] text-[var(--text-muted)]";

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
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-secondary)] ${
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
              <span className="font-medium truncate text-[var(--text-primary)]">
                {user.full_name}
              </span>
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

          {/* Upload Counter (khusus agent) */}
          {showUploadCounter && (
            <div
              className={`text-xs font-medium px-2 py-1 rounded ${uploadBadgeClass}`}
              title={`Upload hari ini: ${uploadCount}/${uploadLimit} (reset 00:00 WIB)`}
            >
              📤 {uploadCount}/{uploadLimit}
            </div>
          )}

          <ActiveToggle
            key={`${user.id}-${isInactive ? "inactive" : "active"}`}
            userId={user.id}
            userName={user.full_name}
            isActive={user.is_active !== false}
          />

          <UserFormDialog mode="edit" user={user} allUsers={users} />
          {showDelete && (
            <DeleteUserButton userId={user.id} userName={user.full_name} />
          )}
        </div>
      </div>
    </div>
  );
}

function getSubordinateCount(user: User, users: User[]): number {
  const activeUsers = users.filter((candidate) => candidate.is_active !== false);
  if (user.role === "supervisor") {
    const leaders = activeUsers.filter((u) => u.supervisor_id === user.id);
    const leaderIds = leaders.map((l) => l.id);
    const agents = activeUsers.filter(
      (u) => u.leader_id && leaderIds.includes(u.leader_id)
    );
    return leaders.length + agents.length;
  }
  if (user.role === "leader") {
    return activeUsers.filter((u) => u.leader_id === user.id).length;
  }
  if (user.role === "admin") {
    return activeUsers.length - 1;
  }
  return 0;
}
