# WEDMATE — Wedding Organizer CRM & Booking Management Platform

Platform Wedding Organizer CRM & Manajemen Booking Pernikahan Terpadu berbasis Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase, dan Resend Email.

---

## 🎨 Palet Warna Modern Elegant Wedding
- **Champagne Gold**: `#C8A46A`
- **Ivory**: `#F8F5EF`
- **Soft Beige**: `#E8DED0`
- **Dark Charcoal**: `#333333`

---

## 🏛️ Rekening Resmi Terdaftar (Wajib & Eksklusif)
- **Bank Central Asia (BCA)**: `446 156 3613` a/n **WEDMATE INDONESIA**
- **DANA E-Wallet**: `085551124373` a/n **WEDMATE**

---

## 🚀 Fitur Lengkap Aplikasi WEDMATE

### 1. Foundation, Design System & Database Schema (Agent 1)
- **Next.js 15 App Router & Elegant Design System**: Palet warna pernikahan mewah, font serif klasik, layout responsif (Landing Page, Customer Portal, Admin Dashboard).
- **Database Schema & Migrasi SQL (`supabase/schema.sql`)**: 7 ENUM types, 9 tabel relasional (profiles, packages, bookings, projects, tasks, payments, transactions, email_logs, activity_logs), trigger database otomatis, RLS policies, dan initial seed data.
- **Graceful Demo Store (`lib/demo-store.ts`)**: State management in-memory & `localStorage` yang berjalan 100% tanpa crash meskipun kredensial Supabase di `.env.local` belum diisi.
- **Auth & Approval Gatekeeper**: Customer mendaftar di `/register` dengan role `CUSTOMER` dan status `PENDING`. Gatekeeper secara otomatis mengalihkan akun pending ke `/approval-pending`. Admin menyetujui akun di `/admin/dashboard/approvals`.
- **Global Role Switcher (`components/RoleSwitcher.tsx`)**: Demo switcher interaktif untuk berganti peran seketika: Tamu, Customer Pending (Dina & Dimas), Customer Approved (Siti & Rizky), dan Admin WEDMATE.

### 2. Katalog Paket, Booking Engine & Wedding Checklist Tracker (Agent 2)
- **Katalog Paket Pernikahan (CRUD)**: Admin dapat menambah, mengedit, mengaktifkan/menonaktifkan, dan menghapus paket di `/admin/packages`. Customer dapat memilih paket di landing page dan portal.
- **Booking Engine**: Customer dapat mengajukan pemesanan paket pernikahan lengkap dengan tanggal acara, gedung/venue, estimasi tamu, dan catatan khusus di `/portal/bookings`.
- **Wedding Checklist Tracker**: Konfirmasi booking oleh Admin di `/admin/bookings` secara otomatis menginisiasi entitas `wedding_projects` dan daftar tugas persiapan pernikahan (`wedding_tasks`) multi-kategori (Venue, Catering, Attire, Decoration, Documentation, Entertainment, Invitation, Legal, Other) dengan progress bar real-time di `/portal/project` dan `/admin/projects`.

### 3. Payment Gateway Manual BCA/DANA & Engine Laporan (Agent 3)
- **Sistem Pembayaran Manual Resmi**: Tampilan rekening resmi BCA `446 156 3613` a/n WEDMATE INDONESIA dan DANA `085551124373` a/n WEDMATE dengan tombol salin cepat.
- **Unggah Bukti Transfer**: Customer mengunggah struk transfer (JPG/PNG/PDF atau simulasi struk demo) di `/portal/payments`.
- **Verifikasi Manual Admin**: Admin melakukan review manual (Approve / Reject dengan alasan) di `/admin/payments`. Rekalkulasi saldo `amount_paid` dan `remaining_balance` dilakukan secara atomik saat verifikasi disetujui.
- **Engine Laporan & Ekspor CSV**: Dasbor analitik keuangan di `/admin/reports` dengan ringkasan transaksi, distribusi metode pembayaran BCA vs DANA, filter tanggal & status, serta ekspor data ke file CSV dan print-ready layout.

---

## 💻 Cara Menjalankan

1. **Pastikan Node.js 18+ terpasang di sistem.**
2. **Install dependensi:**
   ```bash
   npm install
   ```
3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
4. **Buka di browser:**
   Akses [http://localhost:3000](http://localhost:3000)

### URL Rute Utama:
- Beranda Publik: `http://localhost:3000`
- Gatekeeper Approval: `http://localhost:3000/approval-pending`
- Admin Approval Akun: `http://localhost:3000/admin/dashboard/approvals`
- Admin Katalog Paket: `http://localhost:3000/admin/packages`
- Admin Konfirmasi Booking: `http://localhost:3000/admin/bookings`
- Admin Checklist Proyek: `http://localhost:3000/admin/projects`
- Admin Verifikasi Pembayaran: `http://localhost:3000/admin/payments`
- Admin Laporan Keuangan & CSV: `http://localhost:3000/admin/reports`
- Customer Portal: `http://localhost:3000/portal`
- Customer Booking: `http://localhost:3000/portal/bookings`
- Customer Checklist: `http://localhost:3000/portal/project`
- Customer Pembayaran & Upload Bukti: `http://localhost:3000/portal/payments`
