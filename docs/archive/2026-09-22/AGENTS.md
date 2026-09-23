# AGENTS.md — Panduan untuk AI Agent

WAJIB DIBACA sebelum modifikasi code di repo ini.

---

## Konteks Project

Frontend Next.js untuk dashboard analisis sales WhatsApp.

- Framework: Next.js 16 (App Router)
- UI: shadcn/ui + Tailwind v4
- Auth: Supabase Google OAuth
- Deploy: Vercel (auto-deploy dari GitHub)
- Live: https://agentanalysisweb.vercel.app

---

## Aturan Wajib

### 1. Bahasa
- Komentar & UI text: Indonesia
- Nama variable/fungsi: English
- Pesan error: Indonesia

### 2. Component Pattern
Default: Server component.

Pakai "use client" HANYA kalau:
- Pakai useState, useEffect, useRef
- Event handler (onClick, onChange)
- Browser API (localStorage, dll)

### 3. Styling
Pakai CSS variables (bukan hardcode):

SALAH:
  div className="bg-white border-gray-200"

BENAR:
  div className="bg-[var(--surface)] border-[var(--border)]"

Atau pakai Tailwind native kalau sudah dimap:
  div className="bg-card border-border"

### 4. Font & Color
- Font: Inter (dari next/font/google)
- Accent: Sky #0ea5e9 (light) / #38bdf8 (dark)
- Dark mode: data-theme="dark" (BUKAN .dark class)

### 5. Sidebar Active State
WAJIB pakai match paling spesifik:

    const activeHref = navItems
      .filter((item) => {
        if (item.href === "/dashboard") return pathname === "/dashboard";
        return pathname === item.href || pathname.startsWith(item.href + "/");
      })
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;

    const isActive = item.href === activeHref;

Kenapa: startsWith tanpa / bikin 2 menu aktif bersamaan.

### 6. Timezone & Reset Harian
- Semua timestamp di Supabase pakai UTC
- Reset "hari" untuk fitur apapun (limit upload, statistik harian) pakai WIB (UTC+7)
- Jangan pakai new Date().toISOString().slice(0,10) untuk filter harian
- Gunakan getTodayRangeUtc() dari lib/supabase/queries.ts (return {startUtc, endUtc})

---

## File Penting

lib/supabase/server.ts — Supabase client (server-side)
lib/supabase/client.ts — Supabase client (browser)
lib/supabase/middleware.ts — Auth middleware (logic utama)
proxy.ts — Wrapper Next.js 16
lib/auth.ts — getCurrentUser()
lib/hierarchy.ts — Query hierarki
lib/supabase/queries.ts — Query chat, leaderboard, dll
components/dashboard/sidebar.tsx — Menu sidebar
components/dashboard/upload-limit-config.tsx — Form tab Upload Limit
app/api/settings/upload-limit/route.ts — API upload limit (GET/POST)

---

## JANGAN Dilakukan (DON'T)

### 1. Jangan pakai next-themes
Alasan: Bug dengan React 19.
Pakai custom ThemeProvider.

### 2. Jangan pakai script tag di React component
Alasan: React 19 strict.
Gunakan: Script dari next/script.

### 3. Jangan pakai .dark class
Alasan: Kita pakai data-theme="dark" attribute.

Config Tailwind:

    @custom-variant dark (&:is(html[data-theme="dark"] *));

### 4. Jangan pakai Button di dalam button
Alasan: Bikin hydration error.
Gunakan: button biasa dengan styling Tailwind, atau asChild.

### 5. Jangan pakai startsWith tanpa /
Lihat Aturan Wajib #5.

### 6. Jangan pakai moment.js atau date-fns lama
Alasan: Bikin bundle besar.
Gunakan: Date native atau Intl.DateTimeFormat.

---

## HARUS Dilakukan (DO)

### 1. Pakai cn() untuk conditional class

    import { cn } from "@/lib/utils";

    div className={cn(
      "base-class",
      isActive && "active-class",
      variant === "primary" && "primary-class"
    )}

### 2. Pakai CSS variables untuk warna

    div className="bg-[var(--surface)] text-[var(--text-primary)]"

### 3. Pakai @/ untuk import

    BENAR:
    import { Button } from "@/components/ui/button";

    SALAH:
    import { Button } from "../../../components/ui/button";

### 4. Pakai TypeScript strict
Semua props punya tipe. Jangan any.

---

## Supabase

### Auth Flow
1. User klik "Masuk dengan Google"
2. Redirect ke Google -> callback ke Supabase
3. Supabase -> callback ke /auth/callback?code=xxx
4. Exchange code -> set cookie session
5. Middleware cek session -> allow/redirect

### Middleware Priority
1. Public paths (/login, /auth, /maintenance) -> selalu allow
2. Belum login & protected -> redirect /login
3. Sudah login & protected -> cek user & maintenance

### Query Role

    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .ilike("email", authUser.email)  // case-insensitive!
      .eq("is_active", true)
      .maybeSingle();

Selalu ilike untuk email, selalu cek is_active.

---

## shadcn/ui

Install komponen baru:

    npx shadcn@latest add [component]

Komponen yang sudah ada:
- button, card, input, label
- select, dialog, dropdown-menu
- chart, textarea

---

## Upload Limit

Fitur pembatasan upload chat WA per agent per hari. Sinkron dengan
command Telegram /setlimit di backend.

### Lokasi
- Tab "Upload Limit" di /dashboard/settings (admin only)
- Counter "Upload X/Y" per agent di /dashboard/settings/users

### API
- GET  /api/settings/upload-limit
  - return { enabled, default_limit, stats: { total_upload_today } }
- POST /api/settings/upload-limit
  - body: { enabled?, default_limit? }
  - update app_settings: upload.daily_limit_enabled, upload.daily_limit_default

### Query
- getTodayUploadCounts() di lib/supabase/queries.ts
  - return map { user_id: count } untuk hari ini (reset 00:00 WIB)

### Tabel DB
- upload_logs — log upload (kolom: user_id, chat_id, file_hash, file_name, uploaded_at)
- Setting di app_settings:
  - upload.daily_limit_enabled (boolean)
  - upload.daily_limit_default (number)

### Aturan
- Admin bypass limit
- Limit ON/OFF via toggle
- OFF = unlimited
- Reset otomatis 00:00 WIB (lihat Aturan Wajib #6)

---

## Known Issues & Fix

1. Next.js 16 middleware -> proxy — FIXED — Rename middleware.ts -> proxy.ts
2. React 19 script tag warning — FIXED — Pakai next/script
3. Nested button — FIXED — Pakai button biasa atau asChild
4. Sidebar 2 menu aktif — FIXED — Match paling spesifik
5. User not registered loop — FIXED — Middleware priority
6. RLS error di app_settings — FIXED — Disable RLS
7. Hydration error DropdownMenuLabel — FIXED — Bungkus dengan DropdownMenuGroup

---

## Environment Variables

.env.local (development):

    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
    NEXT_PUBLIC_SITE_URL=http://localhost:3000

Production (Vercel dashboard):

    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
    NEXT_PUBLIC_SITE_URL=https://agentanalysisweb.vercel.app
    TELEGRAM_BOT_TOKEN=8876455319:xxx

---

## Deploy

1. Commit & push ke main
2. Vercel auto-deploy (2-3 menit)
3. Cek di https://vercel.com/dashboard

Setelah deploy, update:
- Supabase: Site URL & Redirect URLs
- Google Cloud: Authorized JavaScript origins

---

## Kontak

- Owner: Rustam Effendy (rustam.effendy@ruangguru.com)
- Repo: https://github.com/mantangurubimbel/Agent-Analysis

---

Terakhir update: 20 September 2026
