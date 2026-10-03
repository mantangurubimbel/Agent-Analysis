"use client";

import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

export function MultiSelectFilter({
  options,
  values,
  onChange,
  placeholder,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);
  const buttonLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? selectedLabels[0]
        : `${values.length} pilihan dipilih`;

  function toggleValue(value: string): void {
    onChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value]
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm text-[var(--text-primary)]"
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="text-[var(--text-muted)]">▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => onChange([])}
            className="w-full rounded px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            Semua
          </button>
          {options.map((option) => {
            const checked = values.includes(option.value);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={checked}
                onClick={() => toggleValue(option.value)}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <input type="checkbox" checked={checked} readOnly tabIndex={-1} aria-hidden="true" />
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
