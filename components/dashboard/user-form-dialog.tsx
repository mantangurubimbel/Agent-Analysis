"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { User, UserRole } from "@/types/database";

interface UserFormDialogProps {
  mode: "create" | "edit";
  user?: User;
  allUsers: User[];
}

export function UserFormDialog({ mode, user, allUsers }: UserFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("agent");
  const [team, setTeam] = useState("");
  const [leaderId, setLeaderId] = useState<string>("");
  const [supervisorId, setSupervisorId] = useState<string>("");

  // Reset form saat dialog dibuka
  useEffect(() => {
    if (open) {
      if (mode === "edit" && user) {
        setFullName(user.full_name ?? "");
        setTelegramId(String(user.telegram_id ?? ""));
        setUsername(user.username ?? "");
        setEmail(user.email ?? "");
        setRole(user.role);
        setTeam(user.team ?? "");
        setLeaderId(user.leader_id ? String(user.leader_id) : "");
        setSupervisorId(
          user.supervisor_id ? String(user.supervisor_id) : ""
        );
      } else {
        setFullName("");
        setTelegramId("");
        setUsername("");
        setEmail("");
        setRole("agent");
        setTeam("");
        setLeaderId("");
        setSupervisorId("");
      }
      setError(null);
    }
  }, [open, mode, user]);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint =
        mode === "create" ? "/api/users/create" : "/api/users/update";

      const payload: Record<string, unknown> = {
        full_name: fullName,
        username: username || null,
        email: email || null,
        role,
        team: team || null,
        leader_id: leaderId ? parseInt(leaderId) : null,
        supervisor_id: supervisorId ? parseInt(supervisorId) : null,
      };

      if (mode === "create") {
        payload.telegram_id = parseInt(telegramId);
      } else {
        payload.id = user?.id;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan user");
      }

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }

  // Filter leader & supervisor
  const leaderOptions = allUsers.filter(
    (u) => u.role === "leader" && u.is_active !== false
  );
  const supervisorOptions = allUsers.filter(
    (u) => u.role === "supervisor" && u.is_active !== false
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        {mode === "create" ? (
          <>
            <Plus className="w-4 h-4" />
            Tambah User
          </>
        ) : (
          <>
            <Pencil className="w-4 h-4" />
            Edit
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah User Baru" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Isi data user baru. Telegram ID wajib & harus unik."
              : `Edit data ${user?.full_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Telegram ID (hanya create) */}
          {mode === "create" && (
            <div>
              <Label htmlFor="telegram_id">Telegram ID *</Label>
              <Input
                id="telegram_id"
                type="number"
                placeholder="mis. 93011671"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minta user chat ke @userinfobot untuk dapat ID
              </p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">Nama Lengkap *</Label>
            <Input
              id="full_name"
              placeholder="mis. Alda Dinda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username Telegram</Label>
            <Input
              id="username"
              placeholder="mis. alda_dinda (tanpa @)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="mis. alda@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email untuk login dashboard (kalau perlu)
            </p>
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">💼 Agent</SelectItem>
                <SelectItem value="leader">🎯 Leader</SelectItem>
                <SelectItem value="supervisor">🔍 Supervisor</SelectItem>
                <SelectItem value="admin">👑 Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leader (kalau role = agent) */}
          {role === "agent" && (
            <div>
              <Label htmlFor="leader_id">Leader</Label>
              <Select
                value={leaderId || "__none__"}
                onValueChange={(v) => setLeaderId(v === "__none__" || v === null ? "" : v)}
              >
                <SelectTrigger id="leader_id">
                  <SelectValue placeholder="Pilih leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tanpa Leader —</SelectItem>
                  {leaderOptions.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      🎯 {l.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Supervisor (kalau role = leader) */}
          {role === "leader" && (
            <div>
              <Label htmlFor="supervisor_id">Supervisor</Label>
              <Select
                value={supervisorId || "__none__"}
                onValueChange={(v) =>
                  setSupervisorId(v === "__none__" || v === null ? "" : v)
                }
              >
                <SelectTrigger id="supervisor_id">
                  <SelectValue placeholder="Pilih supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tanpa Supervisor —</SelectItem>
                  {supervisorOptions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      🔍 {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team */}
          <div>
            <Label htmlFor="team">Team (opsional)</Label>
            <Input
              id="team"
              placeholder="mis. Team A"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
