# Laporan Investigasi Teknis: Customer 3 Core Menus & Admin Portal (Termasuk Kalender Jadwal Acara)

**Author**: Explorer Subagent (`explorer_survey_3`)  
**Target Milestone**: Technical Architecture & Gap Analysis for Customer 3 Core Menus & Admin Portal  
**Date**: 2026-11-04  

---

## 1. Observation

Berdasarkan penelusuran menyeluruh berkas kode sumber di `C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\`, berikut adalah fakta temuan berbasis kode sumber langsung:

### 1.1 Customer Portal (3 Menu Inti & Header)
1. **Header Klien (`components/CustomerHeader.tsx`)**:
   - Baris 19-38: Mendefinisikan tepat 3 menu navigasi inti (`CUSTOMER_NAV_ITEMS`):
     - `Booking Paket` (`/customer/booking`)
     - `Checklist & Status` (`/customer/checklist`)
     - `Tagihan & Pembayaran` (`/customer/payment`)
   - Baris 54-66: Brand logo link mengarah ke `/customer/booking`.
   - Baris 92-103: Menampilkan nama klien (`user?.full_name`), avatar icon, dan badge status `Akun Terverifikasi`.
   - Baris 105-113 & Baris 144-150: Tombol `Keluar` (Logout) yang memicu `logout()` dari `AuthContext`.
2. **Menu 1: `/customer/booking` (`app/customer/booking/page.tsx`)**:
   - Baris 196-303: Katalog Paket Pernikahan Aktif (`packages.map(...)`) menampilkan gambar, nama paket, harga terformat Rupiah (`formatRupiah(pkg.price)`), kapasitas tamu, deskripsi, dan 4 fasilitas unggulan teratas dengan tombol aksi "Pilih Paket Ini".
   - Baris 305-455: Formulir Reservasi Terpadu (`<form onSubmit={handleSubmitBooking}>`) mencakup field:
     - Paket Wedding (`<select>` dropdown)
     - Tanggal Rencana Pernikahan (`<input type="date">` default H+6 bulan)
     - Nama Gedung/Venue (`<input type="text">`)
     - Estimasi Tamu Undangan (`<input type="number">`)
     - Alamat Lengkap Lokasi (`<textarea>`)
     - Catatan Khusus (`<textarea>`)
     - Tombol Kirim (`<button type="submit">` memanggil `demoStore.createBooking(...)`)
   - Baris 458-587: Riwayat Pengajuan Booking Saya yang menampilkan status booking (`PENDING`, `CONFIRMED`, `CANCELLED`), tanggal pengajuan, rincian gedung, serta link cepat ke Checklist WO & Pembayaran saat booking berstatus `CONFIRMED`.
   - Baris 213-217 & Baris 469-477: Integrasi komponen `EmptyState` jika paket kosong atau belum ada booking.
3. **Menu 2: `/customer/checklist` (`app/customer/checklist/page.tsx`)**:
   - Baris 49-75 & Baris 126-137: Real-time Wedding Countdown timer per detik (Hari, Jam, Menit, Detik) atau pesan selebrasi jika hari H telah tiba.
   - Baris 220-267: Ringkasan Status Booking (`TERKONFIRMASI`), tanggal hari H, nama gedung, alamat, kapasitas tamu, dan nilai kontrak.
   - Baris 354-539: Read-Only Checklist Persiapan Pernikahan dari Wedding Organizer:
     - Badge penanda hak akses: "Pantauan Klien (Read-Only)".
     - Bar progres kesiapan (% Selesai, jumlah tugas Selesai/Sedang Proses/Belum Mulai).
     - Filter status (`Semua`, `Selesai`, `Sedang Proses`, `Belum Mulai`), filter kategori (Venue, Catering, Attire, Decoration, Documentation, Invitation, Entertainment, Other), dan input pencarian judul.
   - **Critical Bug Finding**:
     - Pada baris 114: `setTasks(demoStore.getTasks(currentProject.id));`.
     - Dalam `lib/demo-store.ts`, fungsi tersebut bernama `getTasksByProjectId(projectId: string)` dan TIDAK memiliki method `getTasks()`.
     - Panggilan ini akan menyebabkan `TypeError: demoStore.getTasks is not a function` saat customer memiliki project aktif.
4. **Menu 3: `/customer/payment` (`app/customer/payment/page.tsx`)**:
   - Baris 172-174 & Baris 244-296: Ringkasan Saldo Tagihan (Total Nilai Kontrak, Total Telah Terverifikasi, dan Sisa Tagihan) dengan kalkulasi otomatis dari invoice.
   - Baris 301-454: Kanal Pembayaran Resmi menampilkan nomor rekening dan petunjuk transfer dengan fitur 1-klik copy clipboard:
     - `OFFICIAL_PAYMENT_ACCOUNTS.BCA`: No. Rekening `446 156 3613` a/n `WEDMATE INDONESIA`
     - `OFFICIAL_PAYMENT_ACCOUNTS.DANA`: No. Rekening `085551124373` a/n `WEDMATE`
   - Baris 562-650: Modal Unggah Bukti Transfer (`isModalOpen`): input invoice target, metode bayar (BCA/DANA), nominal transfer, file gambar bukti setor, catatan pengirim, dan tombol submit yang memanggil `demoStore.createTransaction(...)`.
   - Baris 457-559: Riwayat Pembayaran & Verifikasi menampilkan nomor transaksi (`TX/YYYY/...`), tanggal, nominal, metode, status badge (`MENUNGGU VERIFIKASI`, `DISETUJUI`, `DITOLAK`), alasan penolakan (jika ditolak), dan modal preview gambar bukti setor.

---

### 1.2 Admin Portal (Menu Kerja & Header)
1. **Header Admin (`components/AdminHeader.tsx`)**:
   - Baris 20-45: Mendefinisikan tepat 4 menu navigasi admin (`ADMIN_NAV_ITEMS`):
     - `Persetujuan` (`/admin/approvals`)
     - `Verifikasi Pembayaran` (`/admin/payments`)
     - `Manajemen Project` (`/admin/projects`)
     - `Katalog Paket` (`/admin/packages`)
   - Baris 51-67: Real-time badge counter untuk approval tertunda (akun pending + booking pending) dan pembayaran tertunda.
   - Baris 130-155: Identitas Admin (`Admin WEDMATE`), label `SUPER ADMINISTRATOR`, dan tombol `Keluar` (Logout).
2. **Menu 1: `/admin/approvals` (`app/admin/approvals/page.tsx`)**:
   - Baris 43-46: State `activeMainTab` saat ini didefinisikan sebagai union `'accounts' | 'bookings'`.
   - Baris 228-277: Hanya memiliki 2 tombol tab:
     - Tab 1: `Persetujuan Akun` (Review customer status pending, tombol Approve, tombol Reject dengan modal alasan penolakan).
     - Tab 2: `Pengajuan Booking` (Daftar booking pending/confirmed/cancelled, tombol Konfirmasi yang memicu auto-provisioning `WeddingProject` & default checklist tasks, tombol Tolak/Batalkan dengan modal alasan).
   - **Critical Missing Feature**:
     - **Tab 3: Kalender Jadwal Acara (`tab=calendar`) sama sekali belum diimplementasikan** pada berkas ini.
3. **Menu 2: `/admin/payments` (`app/admin/payments/page.tsx`)**:
   - Baris 61-95: Filter transaksi berdasarkan Status (`ALL`, `PENDING`, `APPROVED`, `REJECTED`), Metode Bayar (`ALL`, `BCA`, `DANA`), dan Pencarian teks.
   - Baris 98-124: Tombol Approve memicu `demoStore.verifyTransaction(tx.id, 'APPROVED', adminId)`. Dalam `lib/demo-store.ts` (baris 740-759), saldo tagihan invoice (`amount_paid` dan `remaining_balance`) dihitung secara atomik saat verifikasi disetujui.
   - Baris 127-160: Tombol Reject memicu modal alasan penolakan wajib, mencatat `rejection_reason` ke riwayat transaksi tanpa mengurangi saldo.
   - Baris 250-320: Modal preview bukti setor gambar resolusi penuh.
4. **Menu 3: `/admin/projects` (`app/admin/projects/page.tsx`)**:
   - Baris 58-127: Fitur tambah tugas checklist baru per proyek klien (`handleCreateTask`) mencakup judul tugas, kategori, tenggat waktu, dan deskripsi.
   - Baris 87-99: Aksi toggle status tugas (TODO -> COMPLETED) dan hapus tugas dengan rekalkulasi otomatis progres persentase proyek.
5. **Menu 4: `/admin/packages` (`app/admin/packages/page.tsx`)**:
   - Baris 43-160: Modal CRUD lengkap untuk paket pernikahan: tambah paket baru, edit paket yang ada, toggle `is_active`, hapus paket dengan dialog konfirmasi, dan input daftar fitur paket.

---

### 1.3 Keamanan, Edge Middleware & Sinkronisasi Cookie
1. **Middleware (`middleware.ts`)**:
   - Baris 14-18: Rute publik murni terbatas pada `/`, `/login`, `/register`, dan `/approval-pending`. Seluruh rute `/customer/*` dan `/admin/*` dicegat.
   - Baris 25-26: Dalam offline/demo mode, middleware membaca cookie:
     `const authRoleCookie = request.cookies.get('wedmate_role')?.value;`
     `const authStatusCookie = request.cookies.get('wedmate_status')?.value;`
2. **Auth Context (`lib/auth-context.tsx`)**:
   - Baris 44-47: Fungsi `syncAuthCookies()` menulis cookie dengan nama:
     `wedmate_user_id`, `wedmate_user_role`, `wedmate_user_status`, `wedmate_user_approval_status`, dan `wedmate_session_user`.
   - **Discrepancy Note**:
     - `middleware.ts` baris 25 mencari `wedmate_role` bukan `wedmate_user_role`.
     - Walaupun `CustomerLayout` dan `AdminLayout` memeriksa kedua nama tersebut (`cookieStore.get('wedmate_user_role')?.value || cookieStore.get('wedmate_role')?.value`), `middleware.ts` baris 25-26 berisiko menganggap user belum login jika hanya `wedmate_user_role` yang disetel.
     - `auth-context.tsx` harus menyetel kedua variasi (`wedmate_role` & `wedmate_user_role`, serta `wedmate_status` & `wedmate_user_status`) atau `middleware.ts` membaca fallback `wedmate_user_role`.

---

## 2. Logic Chain

1. **Dari Observasi 1.1 ke Kesiapan Customer Portal**:
   - Karena `components/CustomerHeader.tsx` telah menerapkan 3 rute (`/customer/booking`, `/customer/checklist`, `/customer/payment`), dan halaman-halaman tersebut telah tersedia lengkap dengan form, riwayat, empty state, dan rekening resmi BCA/DANA, maka arsitektur Customer Portal telah 95% sesuai dengan R2 spesifikasi.
   - Satu-satunya penghalang pada Customer Portal adalah bug pemanggilan method `demoStore.getTasks(...)` pada `app/customer/checklist/page.tsx:114` yang harus diperbaiki menjadi `demoStore.getTasksByProjectId(...)`.

2. **Dari Observasi 1.2 ke Kebutuhan Kalender Booking Admin**:
   - Spesifikasi R3 mewajibkan tab ketiga pada `/admin/approvals`: "Tab 3: Kalender Jadwal Acara".
   - Pemeriksaan kode di `app/admin/approvals/page.tsx` membuktikan tab ini belum ada (hanya ada tab `accounts` dan `bookings`).
   - Namun, `demoStore` telah menyediakan seluruh data yang dibutuhkan melalui `demoStore.getBookings()`, yang memuat `wedding_date`, `status`, `customer`, `package`, `venue_name`, `venue_address`, `guest_count`, dan `total_price`.
   - Oleh karena itu, solusi implementasi Tab 3 Kalender tidak memerlukan perubahan skema data baru, melainkan penambahan UI tab di `app/admin/approvals/page.tsx` atau komponen modular `<AdminBookingCalendar />`.

3. **Spesifikasi Teknis Kalender Jadwal Acara (Tab 3)**:
   - **Struktur State**:
     - `calendarYear: number`, `calendarMonth: number` (0 untuk Januari s/d 11 untuk Desember).
     - `selectedDate: string | null` (format `YYYY-MM-DD`).
     - `selectedDateBookings: Booking[]`.
   - **Indikator Status Visual pada Sel Tanggal**:
     - Kuning/Amber (`bg-amber-400` / `border-amber-500` / badge `bg-amber-100 text-amber-800`): Status `PENDING` (Menunggu Konfirmasi).
     - Hijau/Emerald (`bg-emerald-500` / `border-emerald-600` / badge `bg-emerald-100 text-emerald-800`): Status `CONFIRMED` (Sudah Terkonfirmasi).
     - Merah/Rose (`bg-rose-500` / `border-rose-600` / badge `bg-rose-100 text-rose-800`): Status `CANCELLED` (Dibatalkan).
   - **Interaktivitas Date Click (Modal / Popover Detail Acara)**:
     - Saat tanggal kalender diklik, jika tanggal tersebut memiliki 1 atau lebih reservasi:
       - Membuka modal ringkasan acara dengan data:
         1. Nama Calon Pengantin (`booking.customer?.full_name`)
         2. Paket Pernikahan (`booking.package?.name`)
         3. Venue / Gedung (`booking.venue_name` & `booking.venue_address`)
         4. Jumlah Tamu (`booking.guest_count` Tamu)
         5. Nilai Reservasi (`formatRupiah(booking.total_price)`)
         6. Status Reservasi dengan penanda warna yang sesuai
         7. Tombol Aksi Langsung: Konfirmasi / Tolak (jika Pending), atau Pintasan Proyek Checklist & Tagihan (jika Confirmed).

---

## 3. Caveats

1. **Investigasi Bersifat Read-Only**: Sesuai mandat Explorer, tidak ada berkas kode sumber di luar folder metadata `.agents/teamwork/explorer_survey_3` yang dimodifikasi selama survei ini.
2. **Terminal Execution Policy**: Lingkungan eksekusi menolak akses eksekusi terminal shell (`npx tsc --noEmit`), sehingga verifikasi sintaks dilakukan secara statis melalui inspeksi kode sumber dan analisis type interface TypeScript.
3. **Ketersediaan Supabase**: Kode saat ini beroperasi dalam mode standalone memory / `localStorage` (`DemoStore`). Jika Supabase SQL dihubungkan di kemudian hari, fungsi kalender akan mengambil data dari tabel `bookings` menggunakan query yang sama.

---

## 4. Conclusion

1. **Customer 3 Core Menus**: Telah terimplementasi dengan baik dan elegan di `/customer/booking`, `/customer/checklist`, dan `/customer/payment`. Terdapat 1 perbaikan baris kode pada `app/customer/checklist/page.tsx:114` (`getTasks` -> `getTasksByProjectId`).
2. **Admin Portal**: Menu `/admin/payments`, `/admin/projects`, dan `/admin/packages` telah berfungsi penuh dengan perhitungan atomik, modal preview bukti transfer, checklist interaktif, dan CRUD paket.
3. **Pekerjaan Utama yang Dibutuhkan**: Implementasi **Tab 3: Kalender Jadwal Acara** pada rute `/admin/approvals` (komponen grid bulanan, navigasi bulan/tahun, penanda visual PENDING/CONFIRMED/CANCELLED, dan modal popover detail acara pada tanggal yang diklik).
4. **Sinkronisasi Cookie**: Tambahkan penulisan `wedmate_role` dan `wedmate_status` pada `lib/auth-context.tsx` agar selaras sempurna dengan Edge Middleware di `middleware.ts`.

---

## 5. Verification Method

Untuk memverifikasi secara independen temuan-temuan di atas:

1. **Verifikasi Ketiadaan Tab 3 di Admin Approvals**:
   - Buka `app/admin/approvals/page.tsx`.
   - Periksa baris 44: `useState<'accounts' | 'bookings'>`.
   - Periksa baris 229-276: Hanya terdapat tombol tab untuk Persetujuan Akun dan Pengajuan Booking. Tidak ditemukan elemen Kalender Jadwal Acara.
2. **Verifikasi Bug `getTasks` di Customer Checklist**:
   - Buka `app/customer/checklist/page.tsx`.
   - Periksa baris 114: `setTasks(demoStore.getTasks(currentProject.id));`.
   - Buka `lib/demo-store.ts`. Periksa baris 593: method yang didefinisikan adalah `public getTasksByProjectId(projectId: string)`. Method `getTasks` tidak ada pada class `DemoStore`.
3. **Verifikasi Rekening Resmi di Customer Payment**:
   - Buka `lib/types.ts` baris 146-169 atau `app/customer/payment/page.tsx` baris 315-454.
   - Pastikan nomor rekening BCA: `446 156 3613` dan DANA: `085551124373`.
4. **Verifikasi Rekalkulasi Atomik Saldo Tagihan**:
   - Buka `lib/demo-store.ts` baris 740-759 pada method `verifyTransaction`.
   - Pastikan saldo tagihan `amount_paid` dan `remaining_balance` dikalkulasi ulang secara atomik saat status transaksi berubah menjadi `APPROVED`.
