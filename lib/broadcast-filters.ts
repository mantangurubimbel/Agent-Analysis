export const BROADCAST_ROLES = [
  "agent",
  "leader",
  "supervisor",
  "admin",
] as const;

export type BroadcastRole = (typeof BROADCAST_ROLES)[number];

export function isBroadcastRole(value: string): value is BroadcastRole {
  return BROADCAST_ROLES.includes(value as BroadcastRole);
}

export function normalizeFilterValues(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item && item !== "all")
    )
  );
}
