# NOTES.md — Log Pengembangan

Catatan ringkas sesi pengembangan untuk pickup cepat di chat AI berikutnya.

---

## 2026-09-20 — Fitur Upload Limit (SELESAI)

### Ringkasan
Fitur pembatasan upload chat WA harian per agent. Tersedia di 3 lapisan:
backend (bot Telegram), dashboard (Next.js), dan command Telegram.

### Backend (repo `agent_analysis_backend`)

**Yang dikerjakan:**
- Migration: tabel `upload_logs` (drop `upload_date`, index baru, RLS off)
- `models.py`: helper `_utcnow_naive()`, kolom bersih
- `repository.py`: logger, `_today_range_utc()`, 6 fungsi upload
- `handlers.py`: cek limit di `handle_document` + `_finalize_confirmation`
- `telegram_bot.py`: CommandHandler `/setlimit`
- `handlers.py`: fungsi `setlimit_cmd()` (admin only)
- `AGENTS.md`: aturan timezone, DON'T #7-9, Known Issues #7-8

**File yang diubah:**
- `src/agent_analysis/storage/models.py`
- `src/agent_analysis/storage/repository.py`
- `bots/handlers.py`
- `bots/telegram_bot.py`
- `AGENTS.md`

**Commit terakhir:**
- `feat(setlimit): command Telegram /setlimit untuk admin`
- `docs(agents): tambah aturan upload limit, timezone WIB, & tabel upload_logs`
- `fix(panduan): ganti placeholder {CUSTOMER} jadi format literal`
- `feat(upload-limit): daily upload limit per agent (reset 00:00 WIB)`

**Command Telegram:**
- `/setlimit`              -> tampilkan konfigurasi
- `/setlimit <angka>`      -> set limit (0-1000)
- `/setlimit on`           -> aktifkan
- `/setlimit off`          -> matikan (unlimited)

### Dashboard (repo `Agent-Analysis`)

**Yang dikerjakan:**
- Tab "Upload Limit" di `/dashboard/settings` (admin only)
- Form toggle ON/OFF + input number + statistik
- Counter "Upload X/Y" per agent di Manage Users (warna: abu/kuning/merah)
- API endpoint GET/POST `/api/settings/upload-limit`
- Query `getTodayUploadCounts()` di `lib/supabase/queries.ts`

**File yang diubah:**
- `app/api/settings/upload-limit/route.ts` (BARU)
- `components/dashboard/upload-limit-config.tsx` (BARU)
- `components/dashboard/settings-tabs.tsx`
- `components/dashboard/user-tree.tsx`
- `lib/supabase/queries.ts`
- `app/dashboard/settings/users/page.tsx`
- `AGENTS.md`

**Sinkron dengan Telegram:**
- Kedua UI baca/tulis `app_settings` yang sama
- Ubah dari Telegram -> langsung tampil di dashboard (refresh)
- Ubah dari dashboard -> langsung berlaku di bot

### Fitur yang Sudah Live

**Database:**
- Tabel `upload_logs` — log upload (user_id, chat_id, file_hash, file_name, uploaded_at)
- Setting `upload.daily_limit_enabled` (boolean)
- Setting `upload.daily_limit_default` (number)

**Backend (bot Telegram):**
- Cek limit SEBELUM download file
- Cek ulang di `_finalize_confirmation` (anti double-count)
- Admin bypass limit
- Reset 00:00 WIB
- Counter naik hanya untuk upload valid
- Reject bersih dengan pesan jelas

**Dashboard:**
- Tab "Upload Limit" di Settings
- Counter per agent di Manage Users
- Sinkron dengan Telegram

### Keputusan Final (13 poin)

| # | Aspek | Keputusan | Status |
|---|---|---|---|
| 1 | Limit | Global setting (1 angka untuk semua agent) | DONE |
| 2 | Reset | Auto 00:00 WIB | DONE |
| 3 | Schema | Tabel `upload_logs` | DONE |
| 4 | Behavior | Reject + pesan jelas | DONE |
| 5 | Override | Tunggu besok (tidak ada override) | DONE |
| 6 | Cek timing | Sebelum download file | DONE |
| 7 | Admin | Bypass limit | DONE |
| 8 | Setting OFF | Unlimited | DONE |
| 9 | UI | Tab baru "Upload Limit" | DONE |
| 10 | Counter di Manage Users | Ya ("3/10") | DONE |
| 11 | Counter rules | Naik hanya kalau upload valid | DONE |
| 12 | Notif admin | Tidak perlu | DONE |
| 13 | Trending Upload | Ya, tambahkan | BELUM |

### Yang Belum Dikerjakan

| # | Fitur | Prioritas |
|---|---|---|
| 1 | Trending Upload chart 7 hari (keputusan #13) | Sedang |
| 2 | Per-agent limit override (saat ini cuma global) | Sedang |
| 3 | Export upload log ke CSV | Rendah |
| 4 | Bersihkan `datetime.utcnow` di model lain (backend) | Rendah |

### Known Issues yang Sudah Diperbaiki

1. `logger` NameError di `repository.py` — FIXED
2. Reset jam 07:00 WIB (server UTC) — FIXED via `_today_range_utc()`
3. Counter naik untuk upload duplikat — FIXED
4. Counter double-count saat konfirmasi — FIXED
5. `upload_date` redundan dengan `uploaded_at` — FIXED (drop kolom)
6. Duplikat `*.bak` di `.gitignore` — FIXED

### Catatan Arsitektur

- Reset WIB harus konsisten di 2 tempat:
  - Backend: `_today_range_utc()` di `repository.py`
  - Dashboard: `getTodayRangeUtc()` di `lib/supabase/queries.ts`
- Jangan pakai `func.current_date()` (PostgreSQL) atau `new Date().toISOString().slice(0,10)` (JS) — keduanya pakai UTC, bukan WIB
- Semua timestamp disimpan UTC di DB — konversi hanya saat filter/query

### Template untuk Sesi Berikutnya

Kalau lanjut kerja di chat AI baru, tempel:

    Saya lanjut kerja di project ini.

    Repo backend: ~/Documents/deepseek/agent_analysis
    Repo dashboard: ~/Documents/deepseek/agent_analysis_web

    Status terakhir: (lihat NOTES.md)

    Yang mau dikerjakan: [fitur/tugas]

    Error/kendala: [kalau ada]
