# Agent Analysis — Dashboard Web

Dashboard Next.js untuk tim leader, supervisor, admin, dan agent dalam melihat analisis percakapan sales WhatsApp.

Live: https://agentanalysisweb.vercel.app

Status dokumentasi: diperbarui berdasarkan source code per 23 September 2026.

## Fitur

- Login Google OAuth multi-akun.
- Overview dengan stats, trend chat, outcome, objection, handled rate, dan perbandingan team.
- Date range 7/30/90 hari atau semua waktu.
- Chats: list, filter, search, detail transcript, highlight objection, coaching, dan soft delete.
- Re-analyze single/bulk melalui queue backend.
- Leaderboard dan Team Saya.
- Settings: LLM, Analysis, Profile, Maintenance, dan Upload Limit.
- Manage Users: CRUD, tree hierarki, toggle `is_active`, dan counter upload.
- Broadcast Telegram: preview, kirim, filter role/team, dan history.
- Dark/light mode dengan custom ThemeProvider.

## Tech stack

- Next.js 16.3.5 App Router.
- React 19.2.8 dan TypeScript.
- shadcn/ui + Tailwind CSS v4.
- Inter + JetBrains Mono via `next/font/google`.
- Recharts.
- Supabase Auth, PostgreSQL, dan `@supabase/ssr`.
- Deploy Vercel.

## Setup lokal

```bash
git clone https://github.com/mantangurubimbel/Agent-Analysis.git
cd agent_analysis_web
npm install
cp .env.local.example .env.local
npm run dev
```

Buka http://localhost:3000.

Isi `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Untuk production, atur environment variables di Vercel dashboard. Jangan menaruh API key/token nyata di repository atau dokumentasi.

## Struktur folder

```text
agent_analysis_web/
  app/
    api/                  # route broadcast, chat, users, settings, profile
    auth/callback/        # OAuth callback
    dashboard/            # overview, chats, team, leaderboard, settings
    login/                # halaman login
    maintenance/          # halaman maintenance
    layout.tsx            # root layout + theme bootstrap
    globals.css           # design tokens
  components/
    dashboard/            # dashboard components
    theme/                # theme provider/toggle
    ui/                    # shadcn/ui
  lib/
    auth.ts               # current user
    hierarchy.ts           # query hierarki
    roles.ts               # role helper
    supabase/              # client, middleware, queries
  types/database.ts        # tipe database/frontend
  proxy.ts                 # wrapper middleware Next.js 16
```

## Auth dan middleware

`proxy.ts` adalah entry middleware resmi Next.js 16 dan meneruskan request ke `lib/supabase/middleware.ts`. Public paths, session refresh, user aktif, dan maintenance mode diproses di sana.

`getCurrentUser()` menggunakan email case-insensitive dan hanya menerima user DB dengan `is_active=true`. API route tidak boleh hanya mengandalkan visibility menu; authorization harus diperiksa ulang di server.

## Role

- Admin: seluruh fitur administrasi.
- Supervisor: team, chats sesuai hierarki, leaderboard, settings yang diizinkan, broadcast.
- Leader: team/chats sesuai hierarki dan leaderboard.
- Agent: dashboard dan data miliknya.

## Upload Limit

Upload limit berada di `/dashboard/settings` dan hanya dapat diubah admin. Counter per agent tampil di `/dashboard/settings/users`.

API:

- `GET /api/settings/upload-limit` — baca enabled, default limit, dan total upload hari ini.
- `POST /api/settings/upload-limit` — ubah enabled/default limit.

Backend Telegram dan frontend menggunakan `app_settings` serta `upload_logs` yang sama. Reset harian memakai WIB, dengan timestamp database tetap UTC. Frontend belum memiliki chart trending upload 7 hari, per-agent override, atau export CSV.

## Design system

- Font utama: Inter.
- Accent: Sky `#0ea5e9` light dan `#38bdf8` dark.
- Background/border menggunakan CSS variables.
- Dark mode menggunakan `data-theme="dark"`, bukan `.dark` class.
- Route active sidebar memakai match paling spesifik dengan boundary `/`.

## Test dan build

```bash
npm run lint
npm run build
```

Development:

```bash
npm run dev
npm start
```

## Deployment

Push ke GitHub branch yang terhubung dengan Vercel. Setelah deploy, verifikasi:

1. Google OAuth callback dan multi-akun.
2. User aktif/nonaktif dan redirect middleware.
3. Overview/charts dan filter tanggal.
4. Chat detail serta re-analyze.
5. Settings, upload limit, broadcast, dan maintenance.

Sinkronisasi OAuth juga memerlukan Supabase Site URL/Redirect URLs dan Google Cloud Authorized JavaScript origins yang benar.

## Dokumentasi

- [AGENTS.md](AGENTS.md) — instruksi kerja aktif untuk AI agent.
- [CHANGELOG.md](CHANGELOG.md) — riwayat perubahan frontend.
- [NOTES.md](NOTES.md) — status implementasi dan pekerjaan lanjutan.
- [Dokumentasi lama](docs/archive/2026-09-22/) — backup sebelum audit dokumentasi.
- Backend: `../agent_analysis`.

Repository: https://github.com/mantangurubimbel/Agent-Analysis
