"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileConfig() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input id="full_name" placeholder="Nama kamu" disabled />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" disabled />
          </div>
          <div>
            <Label htmlFor="telegram_id">Telegram ID</Label>
            <Input id="telegram_id" disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            🚧 Fitur edit profil akan datang di batch berikutnya
          </p>
          <Button disabled>Simpan</Button>
        </CardContent>
      </Card>
    </div>
  );
}
