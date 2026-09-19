# Changelog — Agent Analysis Dashboard

Semua perubahan penting di dashboard frontend.

---

## [Unreleased]

### Planned
- Export PDF/Excel report
- Mobile responsive
- Real-time notification

---

## [0.13.0] — 2026-09-19

### Added
- Halaman Broadcast Telegram (admin/supervisor)
- Halaman Maintenance mode
- Toggle is_active user di Manage Users
- Worker: broadcast & re-analyze (via backend)

### Fixed
- Login multi-akun (2 tombol: auto + ganti akun)
- Middleware redirect loop (user not registered)

---

## [0.12.0] — 2026-09-18

### Added
- Date range filter (7/30/90 hari / semua waktu)
- Objection Handled Rate chart
- Perbandingan Team chart

### Fixed
- Dashboard analytics refresh

---

## [0.11.0] — 2026-09-17

### Added
- Re-Analyze dari dashboard (badge + tombol + bulk)
- Maintenance mode (halaman /maintenance)

---

## [0.10.0] — 2026-09-16

### Added
- Halaman Broadcast Telegram
- API /api/broadcast/send, preview, list, teams

---

## [0.9.0] — 2026-09-15

### Added
- Halaman Settings (LLM, Analysis, Profile)
- Form LLM config dengan test connection
- Form Analysis config

---

## [0.8.0] — 2026-09-14

### Added
- Halaman Team Saya (leader/supervisor)
- Halaman Manage Users (admin) dengan tree
- Filter By Agent di list chats
- Detail chat tampilkan leader & supervisor

---

## [0.7.0] — 2026-09-13

### Added
- Transcript bubble chat
- Highlight objection otomatis (fuzzy match)
- Full-text search (global + in-chat)
- Soft delete + retention 30 hari

---

## [0.6.0] — 2026-09-12

### Added
- Auth dengan Google OAuth
- Layout dashboard (sidebar + header)
- Login page (multi-akun)

---

## [0.5.0] — 2026-09-11

### Added
- Init Next.js 16 (App Router)
- Setup Supabase (auth + DB)
- Tailwind CSS v4

---

## [0.1.0–0.4.0] — 2026-09-10

### Added
- Redesign dashboard (Tailwind Docs style)
- Font Inter
- Accent Sky
- Dark mode (data-theme)
- Sidebar grouping
- Halaman Overview, Chats, Leaderboard
EOF
