# Original User Request

## 2026-11-03T15:00:22Z

Membangun dan menjalankan aplikasi Wedding Organizer CRM & Booking Management Platform (WEDMATE) berbasis Next.js 15, TypeScript, Tailwind CSS, Supabase, dan Resend Email secara lengkap dan dapat langsung diakses di localhost:3000 dalam kurun waktu 20 menit.

Working directory: c:\Users\LENOVO\Downloads\WEDMATE
Integrity mode: development
Requested team: 3 parallel specialized feature agents (Agent 1: Foundation, Design System & Auth/Approval; Agent 2: Packages, Booking & Checklist Tracker; Agent 3: Payment BCA/DANA & Reports Engine)

Reference material:
- PRD: c:\Users\LENOVO\Downloads\WEDMATE\PRD.md
- Feature specifications: c:\Users\LENOVO\Downloads\WEDMATE\features\*.md

## Requirements

### R1. Next.js 15 App Router & Elegant Wedding Design System
- Setup Next.js 15 dengan TypeScript, Tailwind CSS, Lucide icons, dan palet warna Modern Elegant Wedding (Champagne Gold #C8A46A, Ivory #F8F5EF, Soft Beige #E8DED0, Dark Charcoal #333333).
- Navigasi mencakup Landing Page publik, Customer Portal, dan Admin Dashboard.

### R2. Database Schema, RLS & Supabase Setup (supabase/schema.sql)
- Siapkan file supabase/schema.sql lengkap (tabel profiles, wedding_packages, bookings, wedding_projects, wedding_tasks, payments, payment_transactions, email_logs, activity_logs, ENUM types, RLS policies, audit logs, dan seed data paket wedding serta akun awal).
- Sediakan file .env.local.example dan helper konfigurasi client/server Supabase yang aman.

### R3. Autentikasi, Approval Gatekeeper & RBAC
- Customer mendaftar di /register dengan default role = CUSTOMER dan status PENDING.
- Customer berstatus PENDING atau REJECTED diblokir dari rute customer dan dialihkan ke /approval-pending.
- Admin memiliki menu persetujuan pendaftaran (/admin/dashboard/approvals) untuk melakukan Approve atau Reject.

### R4. Katalog Paket, Booking Engine & Wedding Checklist
- Admin dapat mengelola paket pernikahan (CRUD).
- Customer terverifikasi dapat memilih paket dan mengajukan booking dengan tanggal acara, gedung, dan estimasi tamu.
- Konfirmasi booking oleh Admin menginisiasi entitas wedding_projects dan daftar tugas checklist persiapan pernikahan yang dapat dipantau progresnya secara real-time.

### R5. Sistem Pembayaran Manual (BCA & DANA), Verifikasi Saldo & Laporan
- Informasi pembayaran wajib menggunakan rekening resmi: BCA 446 156 3613 dan DANA 085551124373.
- Customer dapat mengunggah bukti transfer (JPG/PNG/PDF).
- Bukti transfer diverifikasi secara manual oleh Admin (Approve/Reject).
- Saldo tagihan (amount_paid dan remaining_balance) dikalkulasi secara atomik saat verifikasi disetujui.
- Modul laporan ringkasan transaksi dengan fitur ekspor data.

### R6. Graceful Demo Fallback & Otomasi Localhost Dev Server
- Jika kredensial Supabase di .env.local belum diisi, aplikasi harus tetap berjalan normal dengan graceful fallback demo data tanpa crash.
- Dev server Next.js dijalankan otomatis di background pada http://localhost:3000 dan diverifikasi respons HTTP-nya.

## Acceptance Criteria

### Localhost Executability
- [ ] Dev server Next.js berjalan sukses di http://localhost:3000 tanpa build error.
- [ ] Endpoint root / merespons HTTP status 200 dengan tampilan UI elegan WEDMATE.
- [ ] Terdapat akun demo / switcher untuk menguji alur Admin dan Customer secara langsung.

### Integrity & Safety
- [ ] Rekening pembayaran di frontend tepat: BCA 446 156 3613 dan DANA 085551124373.
- [ ] Verifikasi transaksi tidak auto-approve (wajib melalui tombol aksi Admin).
- [ ] Customer dengan status PENDING tidak dapat mengakses dashboard customer sebelum di-approve Admin.
- [ ] File migrasi SQL supabase/schema.sql tersedia dan sintaksnya valid.


## 2026-11-04T10:34:22Z

Transformasi menyeluruh WEDMATE dari situs promosi wedding organizer menjadi Aplikasi Web Internal (App-First Portal) berorientasi fungsionalitas murni, memangkas seluruh elemen website publik, menyederhanakan navigasi menjadi 3 Menu Customer dan Menu Admin terpadu lengkap dengan Kalender Jadwal Booking tanpa dummy data.

Working directory: c:\Users\LENOVO\Downloads\WEDMATE
Integrity mode: development
Requested team: multi-agent team (parallel modular execution)

## Requirements

### R1. Welcome Screen Auth Gateway (Pengganti Total Landing Page)
- Hapus seluruh elemen website/company profile (hero promo, about us, galeri, testimoni, kontak, footer).
- Halaman pertama (/) murni sebagai "Centered Auth Gateway" berlatar #F8F5EF berisi logo WEDMATE, tagline, teks pengantar, dan tepat 2 tombol utama:
  1. [ Masuk ke Akun ] mengarah ke /login.
  2. [ Registrasi Akun Baru ] mengarah ke /register.
- Jika pengguna sudah memiliki sesi login aktif:
  - Role ADMIN dialihkan otomatis ke /admin/approvals.
  - Role CUSTOMER dialihkan otomatis ke /customer/booking.

### R2. Customer Portal — 3 Menu Inti Saja (/customer/*)
1. Booking Paket (/customer/booking): Katalog paket aktif + form reservasi terpadu (tanggal acara, venue, jumlah tamu, catatan, tombol submit).
2. Checklist Pernikahan (/customer/checklist): Status booking (Pending/Confirmed), countdown hari H, dan checklist persiapan pernikahan dari WO (read-only).
3. Pembayaran (/customer/payment): Sisa tagihan, rekening resmi (BCA: 446 156 3613 & DANA: 085551124373), form upload bukti bayar, dan riwayat status transaksi.
- Navigasi atas (Header): Nama klien, status approval, dan tombol Logout di pojok kanan atas.

### R3. Admin Portal — Menu Kerja Inti & Kalender Booking (/admin/*)
1. Approval & Booking + Kalender (/admin/approvals):
   - Tab 1: Persetujuan Akun (Approve/Reject customer status pending).
   - Tab 2: Pengajuan Booking (Daftar tabel booking dengan aksi Konfirmasi / Batalkan).
   - Tab 3: Kalender Jadwal Acara:
     * Grid kalender bulanan interaktif (bisa navigasi bulan/tahun).
     * Menandai tanggal yang telah dibooking dengan indikator warna status:
       - Kuning/Amber: Status PENDING (Menunggu Konfirmasi).
       - Hijau/Emerald: Status CONFIRMED (Sudah Terkonfirmasi).
       - Merah/Rose: Status CANCELLED (Dibatalkan).
     * Klik pada tanggal menampilkan detail rincian acara: Nama Calon Pengantin, Paket yang Dipilih, Venue/Gedung, Jumlah Tamu, dan Nilai Reservasi.
2. Verifikasi Pembayaran (/admin/payments): Daftar transaksi pending verifikasi dengan modal preview bukti transfer, tombol Approve (kalkulasi saldo atomik), dan Reject (dengan alasan).
3. Checklist Proyek (/admin/projects): Checklist tugas persiapan pernikahan per klien/acara dengan fitur tambah tugas baru.
4. Kelola Paket (/admin/packages): CRUD sederhana untuk nama paket, harga, deskripsi, fasilitas, dan status aktif.
- Header kanan atas memuat nama Admin dan tombol Logout.

### R4. Keamanan Ketat & Zero Dummy Data
- Tamu tanpa login dicegat oleh Edge Middleware (middleware.ts) dan Server Layout Guards dari seluruh rute /customer/* dan /admin/*.
- Registrasi publik otomatis role CUSTOMER dan status PENDING, wajib menunggu persetujuan Admin di /approval-pending.
- Tabel awal murni kosong dari database Supabase / clean store, menampilkan komponen EmptyState jika data bernilai 0.
- Rekening resmi tetap tepat: BCA 446 156 3613 dan DANA 085551124373.
- Seluruh berkas disinkronkan ke c:\Users\LENOVO\Downloads\WEDMATE dan dev server aktif di http://localhost:3000.

## Acceptance Criteria

### Layout & Navigasi
- [ ] Rute root / hanya menampilkan Welcome Screen terpusat dengan 2 tombol (Masuk & Registrasi) tanpa navbar/footer promosi.
- [ ] Customer hanya memiliki 3 rute menu: /customer/booking, /customer/checklist, /customer/payment.
- [ ] Admin memiliki menu kerja: /admin/approvals, /admin/payments, /admin/projects, /admin/packages.

### Kalender Booking Admin
- [ ] Tersedia tampilan Kalender Bulanan di Admin Portal yang memvisualisasikan seluruh tanggal reservasi.
- [ ] Tanggal yang dipesan memiliki penanda status visual yang jelas (PENDING, CONFIRMED, CANCELLED).
- [ ] Saat tanggal kalender diklik, muncul ringkasan detail acara (nama pengantin, venue, paket, status).

### Fungsionalitas & Zero Dummy
- [ ] Seluruh aksi booking, pembayaran, checklist, dan paket bekerja interaktif tanpa dummy data statis.
- [ ] Komponen Empty State tampil saat tabel bernilai 0.
- [ ] Dev server Next.js berjalan tanpa runtime/compile error di http://localhost:3000.
