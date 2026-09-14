"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, User, Mail, Send, Users, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roleEmoji: Record<string, string> = {
  admin: "👑",
  supervisor: "🔍",
  leader: "🎯",
  agent: "💼",
};

const roleLabel: Record<string, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  leader: "Leader",
  agent: "Agent",
};

interface Profile {
  id: number;
  full_name: string;
  username: string | null;
  email: string | null;
  telegram_id: number;
  role: string;
  team: string | null;
  leader_name: string | null;
  supervisor_name: string | null;
  created_at: string;
}

export function ProfileConfig() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [telegramId, setTelegramId] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal load profile");
      setProfile(data.profile);
      setFullName(data.profile.full_name || "");
      setUsername(data.profile.username || "");
      setEmail(data.profile.email || "");
      setTelegramId(String(data.profile.telegram_id || ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          username: username || null,
          email: email || null,
          telegram_id: telegramId ? parseInt(telegramId) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal save");

      setSuccess("✅ Profile berhasil disimpan");
      await loadProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Gagal load profile
        </CardContent>
      </Card>
    );
  }

  const hasChanges =
    fullName !== (profile.full_name || "") ||
    username !== (profile.username || "") ||
    email !== (profile.email || "") ||
    telegramId !== String(profile.telegram_id || "");

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          {success}
        </div>
      )}

      {/* Info Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {roleEmoji[profile.role] ?? "👤"}
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Role</p>
                <p className="font-medium">
                  {roleLabel[profile.role] ?? profile.role}
                </p>
              </div>
            </div>

            {profile.leader_name && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-xl">
                  🎯
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Leader</p>
                  <p className="font-medium">{profile.leader_name}</p>
                </div>
              </div>
            )}

            {profile.supervisor_name && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-xl">
                  🔍
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Supervisor</p>
                  <p className="font-medium">{profile.supervisor_name}</p>
                </div>
              </div>
            )}

            {profile.team && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Team</p>
                  <p className="font-medium">{profile.team}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">
              <User className="w-4 h-4 inline mr-1" />
              Nama Lengkap *
            </Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap kamu"
            />
          </div>

          <div>
            <Label htmlFor="username">
              <Send className="w-4 h-4 inline mr-1" />
              Username Telegram
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username (tanpa @)"
            />
          </div>

          <div>
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email untuk login dashboard (kalau berubah, logout & login ulang
              dengan email baru)
            </p>
          </div>

          <div>
            <Label htmlFor="telegram_id">
              <Send className="w-4 h-4 inline mr-1" />
              Telegram ID
            </Label>
            <Input
              id="telegram_id"
              type="number"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="mis. 93011671"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Chat ke @userinfobot di Telegram untuk dapat ID
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
