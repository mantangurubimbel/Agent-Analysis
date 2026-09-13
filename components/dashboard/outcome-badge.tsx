import { cn } from "@/lib/utils";

const META = {
  closed: {
    label: "Closed",
    emoji: "✅",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  },
  no_response: {
    label: "No Response",
    emoji: "😶",
    className:
      "bg-muted text-muted-foreground border-border",
  },
  rejected: {
    label: "Rejected",
    emoji: "❌",
    className:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
  },
  pending: {
    label: "Pending",
    emoji: "⏳",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  error: {
    label: "Error",
    emoji: "⚠️",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
  },
} as const;

export function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border bg-muted text-muted-foreground">
        ⏳ Menunggu
      </span>
    );
  }

  const meta = META[outcome as keyof typeof META] ?? META.error;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border font-medium",
        meta.className
      )}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
