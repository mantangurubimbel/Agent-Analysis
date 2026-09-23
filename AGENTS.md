# AGENTS.md — Panduan untuk AI Agent

WAJIB DIBACA sebelum memodifikasi code di repository ini.

## Konteks Project

Frontend Next.js untuk dashboard analisis sales WhatsApp tim Ruangguru.

- Framework: Next.js 16.3.5, App Router.
- UI: React 19, shadcn/ui, Tailwind CSS v4.
- Auth dan database: Supabase Google OAuth + PostgreSQL.
- Deployment: Vercel, auto-deploy dari GitHub.
- Live: https://agentanalysisweb.vercel.app
- Audit dokumentasi: 23 September 2026.

## Aturan Wajib

### Bahasa dan TypeScript

- Komentar dan UI text: Bahasa Indonesia.
- Nama variable dan fungsi: English.
- Pesan error yang ditampilkan ke user: Bahasa Indonesia.
- Pakai TypeScript strict dan type props untuk semua component.
- Jangan menggunakan `any` jika tipe yang benar masih bisa ditentukan.
- Import internal memakai alias `@/`.

### Component pattern

- Default adalah Server Component.
- Pakai `"use client"` hanya jika component memakai `useState`, `useEffect`, `useRef`, event handler, browser API, atau library client-side.
- API route harus memvalidasi user/role sebelum membaca atau mengubah data.
- Error eksternal harus ditangani dan dikembalikan sebagai response yang aman; jangan bocorkan secret atau detail internal yang tidak perlu.

### Styling dan design system

- Gunakan CSS variables design system, misalnya `bg-[var(--surface)]`, `text-[var(--text-primary)]`, dan `border-[var(--border)]`.
- Tailwind native boleh dipakai jika tokennya sudah dimap, misalnya `bg-card` atau `border-border`.
- Font: Inter, dengan JetBrains Mono untuk kebutuhan monospace.
- Accent: Sky `#0ea5e9` pada light mode dan `#38bdf8` pada dark mode.
- Dark mode memakai attribute `data-theme="dark"`, bukan `.dark` class.
- Gunakan `cn()` dari `@/lib/utils` untuk conditional class.
- Jangan menambahkan hardcoded warna yang melewati token design system tanpa alasan UI yang jelas.

### Sidebar active state

Gunakan match paling spesifik dan boundary slash:

```ts
const activeHref = navItems
  .filter((item) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  })
  .sort((a, b) => b.href.length - a.href.length)[0]?.href;

const isActive = item.href === activeHref;
```

Jangan memakai `startsWith(item.href)` tanpa `+ "/"` karena menu yang hanya memiliki prefix sama bisa aktif bersamaan.

### Timezone dan reset harian

- Timestamp di Supabase disimpan sebagai UTC.
- Reset “hari ini” untuk limit upload/statistik harian memakai WIB (UTC+7).
- Jangan memakai `new Date().toISOString().slice(0, 10)` untuk filter harian.
- Gunakan `getTodayRangeUtc()` dari `lib/timezone.ts` untuk query dan route API.
- Jangan menggunakan `CURRENT_DATE` untuk query harian.

## Struktur File Penting

- `proxy.ts` — entry middleware Next.js 16; meneruskan request ke `lib/supabase/middleware.ts`.
- `lib/supabase/middleware.ts` — refresh session, public path, user registration, dan maintenance mode.
- `lib/supabase/server.ts` — Supabase client server-side.
- `lib/supabase/client.ts` — Supabase client browser-side.
- `lib/supabase/queries.ts` — query chat, statistik, leaderboard, team, objection, dan upload.
- `lib/timezone.ts` — konversi batas hari WIB ke UTC dan format timestamp database.
- `lib/auth.ts` — `getCurrentUser()` dan `requireUser()`.
- `lib/hierarchy.ts` — aturan query hierarki.
- `lib/roles.ts` — helper role dan label.
- `app/dashboard/` — halaman overview, chats, leaderboard, team, settings, broadcast.
- `app/api/` — endpoint broadcast, chats, profile, settings, dan users.
- `components/dashboard/sidebar.tsx` — navigasi role-aware.
- `components/dashboard/upload-limit-config.tsx` — konfigurasi upload limit admin.
- `components/dashboard/user-tree.tsx` — manage users dan counter upload.
- `components/theme-provider.tsx` — custom theme provider berbasis `data-theme`.

## Hal yang Tidak Boleh Dilakukan

1. Jangan memakai `next-themes`; project memakai `components/theme-provider.tsx` custom. Dependency lama yang masih terdaftar di `package.json` tidak berarti boleh dipakai di code baru.
2. Jangan memakai `<script>` langsung di React component. Gunakan `next/script`; theme initialization saat ini berada di `app/layout.tsx`.
3. Jangan memakai `.dark` class. Gunakan `html[data-theme="dark"]` dan token yang sesuai.
4. Jangan menaruh `Button` di dalam `button`; gunakan button biasa atau `asChild` untuk komponen shadcn.
5. Jangan memakai `startsWith()` untuk route tanpa boundary `/`.
6. Jangan menambahkan moment.js atau date-fns lama; gunakan Date native atau `Intl.DateTimeFormat`.
7. Jangan menyimpan API key, token Telegram, atau service credential di source, README, commit, maupun client bundle.
8. Jangan menganggap user authenticated sudah terdaftar. Selalu gunakan email case-insensitive (`ilike`) dan `is_active = true` melalui helper auth/query.

## Supabase dan auth flow

Alur login:

1. User memilih login Google.
2. Supabase mengarahkan ke `/auth/callback?code=...`.
3. Route callback menukar code dan mengatur cookie session.
4. `proxy.ts` memperbarui session dan mengatur akses public/protected.
5. `getCurrentUser()` mencari user DB dengan email case-insensitive serta `is_active=true`.

Prioritas middleware:

1. Path public (`/login`, `/auth`, `/maintenance`) selalu boleh diakses.
2. User belum login pada path protected diarahkan ke `/login`.
3. User login tetapi belum terdaftar/aktif diarahkan ke alur error yang sesuai.
4. Maintenance aktif mengarahkan user non-admin ke `/maintenance`.

## Role dan akses UI

- `admin`: semua dashboard, manage users, settings, upload limit, maintenance, dan broadcast.
- `supervisor`: team, chats sesuai hierarki, leaderboard, settings yang diizinkan, dan broadcast.
- `leader`: team/chats sesuai hierarki, leaderboard, dan profile/settings yang diizinkan.
- `agent`: dashboard dan data yang menjadi haknya.

API route tetap wajib melakukan authorization sendiri; pembatasan menu di UI bukan security boundary.

## Fitur yang tersedia

- Overview: stats, trend chat, outcome, objections, objection handled rate, dan perbandingan team.
- Date range: 7/30/90 hari atau semua waktu sesuai halaman.
- Chats: list, filter, full-text search, detail transcript, objection highlight, soft delete.
- Re-analyze: single dan bulk; request masuk ke `reanalyze_queue` backend.
- Leaderboard dan Team Saya.
- Manage Users: CRUD, tree hierarki, toggle `is_active`, dan counter upload.
- Settings: LLM, Analysis, Profile, Maintenance, dan Upload Limit.
- Broadcast: preview, pilih role/team, kirim, dan riwayat.
- Login Google multi-akun serta dark/light mode.

## Upload Limit

Fitur ini sinkron dengan backend Telegram melalui tabel/setting Supabase yang sama.

- Lokasi konfigurasi: `/dashboard/settings`, tab `Upload Limit`, admin only.
- Counter per agent: `/dashboard/settings/users`.
- API: `GET/POST /api/settings/upload-limit`.
- Query counter: `getTodayUploadCounts()` di `lib/supabase/queries.ts`.
- Tabel: `upload_logs` dengan `user_id`, `chat_id`, `file_hash`, `file_name`, `uploaded_at`.
- Setting: `upload.daily_limit_enabled`, `upload.daily_limit_default`.
- Reset: 00:00 WIB melalui rentang UTC dari `getTodayRangeUtc()`.
- Admin bypass limit di backend; dashboard hanya mengatur konfigurasi global.
- `OFF` berarti unlimited.

Belum tersedia di frontend:

- Chart trending upload 7 hari.
- Limit berbeda untuk setiap agent.
- Export upload log CSV.

## API penting

- `POST /api/auth/callback` — callback OAuth melalui route GET.
- `/api/chats/*` — delete, bulk delete, re-analyze, dan bulk re-analyze.
- `/api/broadcast/*` — preview, send, list, teams.
- `/api/settings/llm` dan `/api/settings/llm/test` — konfigurasi/test LLM.
- `/api/settings/analysis` — konfigurasi analisis.
- `/api/settings/maintenance` — maintenance mode.
- `/api/settings/upload-limit` — upload limit.
- `/api/settings/refresh` — refresh konfigurasi.
- `/api/profile` — profile user.
- `/api/users/*` — create, update, deactivate.

## Environment variables

Development `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production mengatur variable melalui Vercel dashboard. `TELEGRAM_BOT_TOKEN` hanya dipakai bila route/server integration membutuhkannya dan tidak boleh ditulis dengan nilai nyata di dokumentasi.

## Test dan build

```bash
npm run lint
npm run build
npm run dev
```

Sebelum mengubah query tanggal, auth, API route, atau component interaktif, test minimal harus mencakup role yang relevan, timezone WIB, error response, dan hydration/build.

## Deployment

1. Push ke branch yang terhubung ke Vercel.
2. Pastikan environment variables production tersedia di Vercel.
3. Verifikasi Supabase Site URL dan Redirect URLs serta Google OAuth origins.
4. Cek build dan halaman login, dashboard, settings, upload limit, broadcast, dan maintenance setelah deploy.

## Backup dokumentasi

Versi sebelum audit 22 September 2026 disimpan di `docs/archive/2026-09-22/`. File root ini adalah instruksi aktif; backup hanya referensi historis.
