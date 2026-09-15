import { cn } from "@/lib/utils";

const META = {
  closed: {
    label: "Closed",
    emoji: "✅",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
  },
  no_response: {
    label: "No Response",
    emoji: "😶",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
  },
  rejected: {
    label: "Rejected",
    emoji: "❌",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
  },
  pending: {
    label: "Pending",
    emoji: "⏳",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
  },
  error: {
    label: "Error",
    emoji: "⚠️",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900",
  },
} as const;

export function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]">
        ⏳ Menunggu
      </span>
    );
  }

  const meta = META[outcome as keyof typeof META] ?? META.error;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
        meta.className
      )}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
