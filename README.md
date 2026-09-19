# Agent Analysis — Dashboard Web

Dashboard web untuk tim leader & supervisor menganalisis percakapan sales.

Live: https://agentanalysisweb.vercel.app

---

## Fitur

- Login Google OAuth (multi-akun)
- Overview — stats, charts, recent chats
- Chats — list + filter + search
- Detail Chat — transcript bubble + highlight + coaching
- Re-Analyze — trigger analisis ulang dari dashboard
- Leaderboard — ranking agent
- Team Saya — untuk leader/supervisor
- Settings — LLM, Analysis, Maintenance, Profile
- Manage Users — CRUD + tree + toggle is_active
- Broadcast — kirim pesan massal via Telegram
- Dark/light mode

---

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind CSS v4
- Font: Inter (via next/font/google)
- Charts: Recharts
- Auth: Supabase Auth (Google OAuth)
- DB: Supabase PostgreSQL
- Deploy: Vercel

---

## Setup

Langkah install:

    git clone https://github.com/mantangurubimbel/Agent-Analysis.git
    cd agent_analysis_web
    npm install
    cp .env.local.example .env.local

Edit .env.local — isi Supabase keys.

Jalankan:

    npm run dev

Buka http://localhost:3000

---

## Environment Variables

Isi file .env.local:

    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
    NEXT_PUBLIC_SITE_URL=http://localhost:3000

Untuk production, tambahkan juga:

    TELEGRAM_BOT_TOKEN=8876455319:xxx

---

## Struktur Folder

agent_analysis_web/
  app/
    api/                        # API routes
      broadcast/                # Broadcast
      chats/                    # Chats & re-analyze
      profile/                  # User profile
      settings/                 # App settings
      users/                    # Manage users
    auth/callback/              # OAuth callback
    dashboard/                  # Dashboard pages
      broadcast/                # Broadcast page
      chats/                    # List & detail
      leaderboard/              # Leaderboard
      settings/                 # Settings
        users/                  # Manage users
      team/                     # Team view
    login/                      # Login page
    maintenance/                # Maintenance page
    layout.tsx                  # Root layout
    globals.css                 # Design tokens
  components/
    dashboard/                  # Dashboard components
      sidebar.tsx
      user-menu.tsx
      chat-list.tsx
      transcript-bubble.tsx
      outcome-badge.tsx
      date-range-filter.tsx
    ui/                         # shadcn/ui
  lib/
    auth.ts                     # Auth helper
    hierarchy.ts                # Hierarki query
    roles.ts                    # Role helper
    utils.ts                    # Utilities
    highlight.ts                # Fuzzy match
    supabase/                   # Supabase client
  types/
    database.ts                 # Type definitions
  middleware.ts                 # Proxy wrapper
  proxy.ts                      # Auth middleware

---

## Design System

- Font: Inter
- Accent: Sky (#0ea5e9 light, #38bdf8 dark)
- Background: White (light), Slate-950 (dark)
- Border: Slate-200 (light), Slate-800 (dark)
- Dark mode: data-theme attribute (BUKAN .dark class)

---

## Deploy

Deploy ke Vercel:

1. Push ke GitHub
2. Vercel -> New Project -> Import repo
3. Set environment variables
4. Deploy

Auto-deploy setiap push ke main.

---

## Dokumentasi Tambahan

- AGENTS.md — panduan untuk AI
- CHANGELOG.md — history perubahan
- Backend README — ../agent_analysis/README.md
