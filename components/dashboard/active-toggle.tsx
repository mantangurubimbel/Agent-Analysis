"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveToggleProps {
  userId: number;
  userName: string;
  isActive: boolean;
  disabled?: boolean;
}

export function ActiveToggle({
  userId,
  userName,
  isActive,
  disabled = false,
}: ActiveToggleProps) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading || disabled) return;

    // Kalau mau nonaktifkan → konfirmasi
    if (active) {
      const confirmed = confirm(
        `⚠️ Nonaktifkan ${userName}?\n\n` +
          `User tidak akan bisa:\n` +
          `• Login dashboard\n` +
          `• Upload chat via Telegram\n\n` +
          `Lanjutkan?`
      );
      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          // Kalau user aktif → mau nonaktifkan → reactivate: false
          // Kalau user nonaktif → mau aktifkan → reactivate: true
          reactivate: !active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update");

      setActive(!active);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal update");
      setActive(active);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || disabled}
      className={cn(
        "relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0",
        active
          ? "bg-emerald-500 dark:bg-emerald-600"
          : "bg-gray-300 dark:bg-gray-700"
      )}
      title={
        active ? "Aktif — klik untuk nonaktifkan" : "Nonaktif — klik untuk aktifkan"
      }
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-6" : "translate-x-1"
        )}
      />
      {loading && (
        <span className="absolute -right-6">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
        </span>
      )}
    </button>
  );
}
