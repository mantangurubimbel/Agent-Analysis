export function canViewAllChats(role: string): boolean {
  return role === "admin" || role === "supervisor";
}

export function canViewTeamChats(role: string): boolean {
  return role === "leader" || role === "admin" || role === "supervisor";
}

export function getRoleLabel(role: string): string {
  return (
    {
      agent: "Agent",
      leader: "Leader",
      supervisor: "Supervisor",
      admin: "Admin",
    }[role] ?? role
  );
}

export function getRoleEmoji(role: string): string {
  return (
    {
      agent: "💼",
      leader: "🎯",
      supervisor: "🔍",
      admin: "👑",
    }[role] ?? "👤"
  );
}
