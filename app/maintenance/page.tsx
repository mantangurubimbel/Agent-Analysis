import { Wrench, Clock, ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export default async function MaintenancePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["app.maintenance_message", "app.maintenance_until"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  const message =
    settings["app.maintenance_message"] ||
    "Dashboard sedang dalam perbaikan. Silakan kembali lagi nanti.";
  const until = settings["app.maintenance_until"] || "";

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/50">
          <Wrench className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            🚧 Under Construction
          </h1>
          <p className="text-base text-[var(--text-secondary)]">{message}</p>
        </div>

        {until && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Perkiraan selesai: <strong>{until}</strong>
            </span>
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-6 space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Kami sedang melakukan peningkatan sistem untuk pengalaman yang
            lebih baik. Terima kasih atas kesabaran Anda.
          </p>

          {isAdmin ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard (Admin)
            </Link>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login sebagai Admin
              </Link>
              <p className="text-xs text-[var(--text-muted)]">
                Hanya admin yang bisa mengakses dashboard saat maintenance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}