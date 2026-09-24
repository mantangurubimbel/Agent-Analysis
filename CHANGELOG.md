# Changelog — Agent Analysis Dashboard

Semua perubahan penting di dashboard frontend.

## [Unreleased]

### Changed

- Dokumentasi diselaraskan dengan source code per 24 September 2026.
- `proxy.ts` dicatat sebagai entry middleware Next.js 16.
- Status upload limit, broadcast, re-analyze, maintenance, chart analitik, dan auth multi-akun diperjelas.
- Helper timezone frontend dipusatkan agar query, API route, dan tampilan timestamp konsisten dengan UTC database dan WIB.
- Contoh credential nyata di dokumentasi dihapus; environment production harus diatur melalui Vercel.
- Broadcast mendukung multi-select role/team dengan pembatasan berdasarkan hierarki user.
- History broadcast dibatasi sesuai cakupan pengirim; supervisor mencakup bawahannya.
- Detail penerima gagal dan retry broadcast tersedia untuk admin, supervisor, dan leader sesuai cakupan.

### Known technical debt

- Chart trending upload 7 hari belum tersedia di frontend.
- Upload limit masih global; belum ada override per agent.
- Export upload log CSV dan export report PDF/Excel belum tersedia.
- Dependency `next-themes` masih tercantum, tetapi implementation aktif memakai custom `ThemeProvider`; jangan gunakan dependency tersebut untuk code baru.

### Planned

- Trending Upload chart 7 hari.
- Mobile responsive improvements.
- Real-time notification.
- Per-agent upload limit override.
- Export PDF/Excel report dan upload log CSV.

## [0.13.0] — 2026-09-19

### Added

- Halaman Broadcast Telegram untuk admin/supervisor.
- Halaman Maintenance mode.
- Toggle `is_active` user di Manage Users.
- Integrasi worker broadcast dan re-analyze dari backend.

### Fixed

- Login multi-akun dengan pilihan auto-login dan ganti akun.
- Middleware redirect loop untuk user yang belum terdaftar.

## [0.12.0] — 2026-09-18

### Added

- Date range filter 7/30/90 hari dan semua waktu.
- Objection Handled Rate chart.
- Team comparison chart.

### Fixed

- Refresh dashboard analytics.

## [0.11.0] — 2026-09-17

### Added

- Re-Analyze dari dashboard dengan badge, tombol, dan bulk action.
- Halaman `/maintenance`.

## [0.10.0] — 2026-09-16

### Added

- Halaman Broadcast Telegram.
- API broadcast: send, preview, list, dan teams.

## [0.9.0] — 2026-09-15

### Added

- Halaman Settings untuk LLM, Analysis, Profile, Maintenance, dan Upload Limit.
- Form LLM config dengan test connection.
- Form Analysis config.
- Endpoint dan counter upload limit per agent.

## [0.8.0] — 2026-09-14

### Added

- Halaman Team Saya untuk leader/supervisor.
- Manage Users dengan tree.
- Filter agent di list chats.
- Detail chat menampilkan leader dan supervisor.

## [0.7.0] — 2026-09-13

### Added

- Transcript bubble chat.
- Highlight objection otomatis dengan fuzzy match.
- Full-text search global dan in-chat.
- Soft delete dan retention 30 hari.

## [0.6.0] — 2026-09-12

### Added

- Google OAuth.
- Layout dashboard, sidebar, dan header.
- Login multi-akun.

## [0.5.0] — 2026-09-11

### Added

- Next.js 16 App Router.
- Supabase Auth + database.
- Tailwind CSS v4.

## [0.1.0–0.4.0] — 2026-09-10

### Added

- Redesign dashboard.
- Font Inter dan accent Sky.
- Dark mode berbasis `data-theme`.
- Sidebar grouping serta halaman Overview, Chats, dan Leaderboard.

## Dokumentasi

Backup file sebelum pembaruan ini tersedia di `docs/archive/2026-09-22/`.
