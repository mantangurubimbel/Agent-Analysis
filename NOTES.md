# NOTES.md — Status Pengembangan

Catatan pickup untuk sesi AI berikutnya. Status ini diaudit pada 24 September 2026.

## Status fitur terakhir

Backend dan dashboard sudah memiliki fitur upload limit harian yang membaca sumber konfigurasi Supabase yang sama.

### Backend

- Tabel `upload_logs` memakai `user_id`, `chat_id`, `file_hash`, `file_name`, dan `uploaded_at`.
- Backend memiliki `_today_range_utc()` untuk menghitung hari WIB dalam UTC.
- Bot mengecek limit sebelum download file dan mengecek ulang saat konfirmasi.
- Admin bypass limit.
- Counter hanya naik untuk upload valid.
- Command admin tersedia: `/setlimit`, `/setlimit <angka>`, `/setlimit on`, `/setlimit off`.
- Duplicate detection menggunakan hash file.
- Worker broadcast dan re-analyze berjalan setiap 30 detik.

### Dashboard

- Tab Upload Limit tersedia di `/dashboard/settings` untuk admin.
- Counter `Upload X/Y` tersedia di `/dashboard/settings/users`.
- API tersedia di `app/api/settings/upload-limit/route.ts`.
- Query counter tersedia di `lib/supabase/queries.ts` melalui `getTodayUploadCounts()`.
- Reset harian memakai `getTodayRangeUtc()` dan WIB.
- Query dan tampilan timestamp database menggunakan helper terpusat di `lib/timezone.ts`.
- `proxy.ts` adalah wrapper middleware Next.js 16 yang aktif.
- Overview sudah memiliki date range, trend chat, objection rate, dan team comparison.

### Broadcast

- Form broadcast memakai multi-select role dan team.
- Admin dapat memilih semua role/team.
- Supervisor hanya dapat memilih leader dan agent dalam struktur bawahannya.
- Leader hanya dapat memilih agent di bawahnya.
- Preview dan send memvalidasi cakupan hierarki di server.
- History supervisor menampilkan broadcast dirinya sendiri dan bawahannya.
- History leader hanya menampilkan broadcast miliknya sendiri.
- Detail penerima gagal tersedia melalui `/api/broadcast/{id}/failed`.
- Retry membuat broadcast baru dan tidak mengubah audit broadcast lama.
- Retry dapat gagal kembali jika penyebab awal adalah format HTML Telegram yang invalid.

## Keputusan yang berlaku

| Aspek | Keputusan | Status |
|---|---|---|
| Limit | Satu global setting untuk semua agent | Selesai |
| Reset | Otomatis 00:00 WIB | Selesai |
| Schema | `upload_logs` dengan `uploaded_at` | Selesai |
| Behavior | Reject dengan pesan jelas saat limit tercapai | Selesai |
| Override | Belum ada override per agent | Belum |
| Waktu pengecekan | Sebelum download dan ulang saat konfirmasi | Selesai |
| Admin | Bypass limit | Selesai |
| Setting OFF | Unlimited | Selesai |
| UI | Tab Upload Limit | Selesai |
| Counter | Tampil per agent di Manage Users | Selesai |
| Trending Upload | Chart 7 hari | Belum |
| Export upload log | CSV | Belum |

## Pekerjaan yang tersisa

### Prioritas sedang

1. Tambahkan chart Trending Upload 7 hari pada dashboard.
2. Tambahkan per-agent upload limit override jika requirement berubah.

### Prioritas rendah

1. Export upload log ke CSV.
2. Export report PDF/Excel.
3. Tambahkan real-time notification.
4. Perbaiki mobile responsive.

## Aturan konsistensi timezone

- Backend: `_today_range_utc()` di `src/agent_analysis/storage/repository.py`.
- Frontend: `getTodayRangeUtc()` di `lib/timezone.ts`, dipakai query dan route upload-limit.
- Database: timestamp UTC.
- Jangan memakai `CURRENT_DATE`, `func.current_date()`, atau `new Date().toISOString().slice(0, 10)` untuk filter hari WIB.

## Catatan audit source code

- Default fallback provider dinormalisasi menjadi Groq → OpenRouter → Gemini di API dan UI konfigurasi.
- Helper backend `get_upload_trend()` mengelompokkan upload berdasarkan tanggal WIB.
- Frontend belum memiliki chart trending upload 7 hari untuk `upload_logs`; chart trend yang tersedia saat ini adalah trend chat.
- Frontend masih memiliki dependency `next-themes` di `package.json`, tetapi implementation aktif menggunakan custom `ThemeProvider`. Jangan menambahkan penggunaan `next-themes`.

## Verifikasi sebelum melanjutkan

```bash
# backend
cd ../agent_analysis
python -m pytest

# frontend
cd ../agent_analysis_web
npm run lint
npm run build
```

Untuk perubahan upload limit, verifikasi kedua sisi membaca setting dan rentang waktu yang sama. Untuk perubahan auth/API, verifikasi role admin, supervisor, leader, agent, user inactive, dan user yang belum terdaftar.

Untuk perubahan broadcast, verifikasi role admin, supervisor, leader, cakupan team,
history pengirim, detail penerima gagal, dan retry broadcast.

## Backup dokumentasi

Versi dokumentasi sebelum audit disimpan di `docs/archive/2026-09-22/`. File root tetap menjadi dokumentasi aktif.
