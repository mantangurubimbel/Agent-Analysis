import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BroadcastForm } from "@/components/dashboard/broadcast-form";
import { BroadcastHistory } from "@/components/dashboard/broadcast-history";

export default async function BroadcastPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Hanya admin & supervisor
  if (!["admin", "supervisor"].includes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          📢 Broadcast Telegram
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">
          Kirim pesan ke user via Telegram
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form (kiri) */}
        <div className="lg:col-span-3">
          <BroadcastForm />
        </div>

        {/* History (kanan) */}
        <div className="lg:col-span-2">
          <BroadcastHistory />
        </div>
      </div>
    </div>
  );
}
