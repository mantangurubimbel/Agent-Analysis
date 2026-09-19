"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { value: "7", label: "7 Hari Terakhir" },
  { value: "30", label: "30 Hari Terakhir" },
  { value: "90", label: "90 Hari Terakhir" },
  { value: "all", label: "Semua Waktu" },
];

export function DateRangeFilter({
  paramName = "days",
  className,
}: {
  paramName?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentValue = searchParams.get(paramName) || "30";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const currentLabel =
    PRESETS.find((p) => p.value === currentValue)?.label || "30 Hari Terakhir";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-md border bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-[var(--text-muted)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg z-50">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSelect(preset.value)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                currentValue === preset.value
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
