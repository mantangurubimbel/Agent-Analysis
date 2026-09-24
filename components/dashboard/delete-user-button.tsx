"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteUserButtonProps {
  userId: number;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;

    const confirmed = window.confirm(
      `Hapus user ${userName} secara permanen?\n\n` +
        "Tindakan ini tidak dapat dibatalkan. User yang memiliki riwayat data " +
        "atau bawahan harus dinonaktifkan, bukan dihapus."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus user");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menghapus user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={loading}
      title="Hapus user"
      className="inline-flex h-8 items-center justify-center rounded-md border border-rose-200 px-2 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="sr-only">Hapus {userName}</span>
    </button>
  );
}
