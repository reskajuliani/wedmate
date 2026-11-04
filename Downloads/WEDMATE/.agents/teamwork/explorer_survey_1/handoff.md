# Handoff Report: Codebase Survey — Routing, Auth Gateway & Navigation

**Agent**: explorer_survey_1  
**Working Directory**: `C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\explorer_survey_1\`  
**Target Milestone**: R1 & R2/R3 Layout & Auth Architecture  
**Timestamp**: 2026-11-04T10:56:00Z  

---

## 1. Observation

### A. Root Layout & Root Welcome Screen (`/`)
- **`app/layout.tsx` (lines 10-24)**:
  ```tsx
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="id" className="scroll-smooth">
        <body className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#333333] font-sans antialiased selection:bg-[#C8A46A]/20 selection:text-[#333333]">
          <AuthProvider>
            <div className="flex-1 flex flex-col">{children}</div>
          </AuthProvider>
        </body>
      </html>
    );
  }
  ```
  *Direct Observation*: `RootLayout` does **not** include any `Navbar` or `Footer`. It only provides HTML wrapper, background `#F8F5EF`, typography styling, and `AuthProvider`.

- **`app/page.tsx` (lines 10-103)**:
  - Lines 14-54 handle server-side session redirection:
    - If `profile?.role === 'ADMIN'` or `parsed.role === 'ADMIN'` or `roleCookie === 'ADMIN'` $\rightarrow$ `redirect('/admin/approvals')`.
    - Else if authenticated $\rightarrow$ `redirect('/customer/booking')`.
  - Lines 57-101 render the visual gateway card:
    - Background: `<main className="min-h-screen bg-[#F8F5EF] flex items-center justify-center p-6 text-[#333333]">`
    - Card: `<div className="w-full max-w-md bg-white border border-[#E8DED0] rounded-3xl p-8 sm:p-10 shadow-sm text-center">`
    - Brand Header:
      - Logo: `WEDMATE` (`font-serif text-3xl font-bold tracking-wider text-[#C8A46A]`)
      - Tagline: `Plan Your Day, Cherish Your Moments.`
    - Intro Section:
      - Title: `Portal Layanan Pernikahan`
      - Subtitle: `Akses sistem manajemen perencanaan pernikahan, reservasi paket, dan pelacakan pembayaran Anda.`
    - Two Primary Action Buttons:
      - Button 1: `<Link href="/login" ...><LogIn className="w-4 h-4" /> Masuk ke Akun</Link>` (solid `#C8A46A`, white text)
      - Button 2: `<Link href="/register" ...><UserPlus className="w-4 h-4" /> Registrasi Akun Baru</Link>` (bordered `#E8DED0`, background `#F8F5EF`, text `#333333`)
    - Footer note: `Khusus Klien & Tim Internal Wedding Organizer`

### B. Promotional & Company Profile Elements in Codebase
- **`components/Navbar.tsx` (lines 34-47, 131-160)**: Contains public navigation links: `Beranda`, `Paket Pernikahan` (`/packages`), `Alur Perencanaan` (`/#workflow`), and `Rekening Resmi` (`/#accounts`).
- **`components/Footer.tsx` (lines 28-105)**: Contains promotional links (`/#packages`, `/#workflow`), physical gallery address (`Wedding Gallery Lt. 2, Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan`), and contact details (`support@wedmate.id`, `+62 855-5112-4373`).
- **`app/packages/page.tsx` (lines 64-121)**: Contains standalone public promotional catalog with hero banner `"Katalog Publik Resmi WEDMATE"`, capacity filters (`Intimate`, `Modern Ballroom`, `Grand & Luxury`), and security badges.
- *Direct Observation*: None of `components/Navbar.tsx`, `components/Footer.tsx`, or `app/packages/page.tsx` are mounted in `app/page.tsx` or `app/layout.tsx`. Root `/` is completely isolated from them.

### C. Authentication Flows & Redirection Handlers
- **`app/login/page.tsx` (lines 38-50)**:
  ```ts
  const user = await login(email);
  if (user.role === 'ADMIN') {
    router.push('/admin/approvals');
  } else if (user.status === 'APPROVED') {
    if (packageParam) {
      router.push(`/customer/booking?packageId=${packageParam}`);
    } else if (redirectParam) {
      router.push(redirectParam);
    } else {
      router.push('/customer/booking');
    }
  } else {
    router.push('/approval-pending');
  }
  ```
- **`app/register/page.tsx` (lines 47-59)**:
  - Calls `useAuth().register(...)`.
  - Default values assigned by `demoStore.createUser`: `role: 'CUSTOMER'`, `status: 'PENDING'`.
  - Redirects immediately to: `router.push('/approval-pending')`.
- **`app/approval-pending/page.tsx` (lines 74-80, 154-162)**:
  - If approved, provides CTA link to `/customer/booking`.
  - Line 154 contains a stale string reference: `code>/admin/dashboard/approvals</code>` instead of `/admin/approvals`.
- **`middleware.ts` (lines 14-55, 99-122)**:
  - `isPublicRoute`: `/`, `/login`, `/register`, `/approval-pending`.
  - Fallback cookie checks:
    - Line 25: `request.cookies.get('wedmate_role')?.value`
    - Line 26: `request.cookies.get('wedmate_status')?.value`
  - While `lib/auth-context.tsx` (lines 45-46) sets:
    - `wedmate_user_role` and `wedmate_user_status` (also `wedmate_session_user`).
  - Redirects logged-in users visiting `/`, `/login`, `/register`:
    - Role `ADMIN` $\rightarrow$ `/admin/approvals`.
    - Role `CUSTOMER` $\rightarrow$ `/customer/booking`.
- **`lib/auth-context.tsx` (lines 228, 265, 271)**:
  - Uses legacy target `router.push('/customer/dashboard')` instead of `/customer/booking`.
  - Line 230 uses `router.push('/admin')` instead of `/admin/approvals`.

### D. Route Naming & Customer / Admin Layouts
- **Customer Route Structure**:
  - The real customer pages are located in `app/customer/*`:
    - `app/customer/booking/page.tsx`: Catalog + Reservation Form + My Booking History.
    - `app/customer/checklist/page.tsx`: Booking Status Summary + Real-time Countdown + Read-only WO Task Checklist.
    - `app/customer/payment/page.tsx`: Billing Balance Summary + Official BCA/DANA Accounts with Copy Button + Upload Proof Modal + Verification History.
  - Legacy customer aliases in `app/customer/`:
    - `app/customer/bookings/page.tsx` $\rightarrow$ `redirect('/customer/booking')`
    - `app/customer/dashboard/page.tsx` $\rightarrow$ `redirect('/customer/booking')`
    - `app/customer/dashboard/booking/page.tsx` $\rightarrow$ `redirect('/customer/booking')`
    - `app/customer/payments/page.tsx` $\rightarrow$ `redirect('/customer/payment')`
    - `app/customer/project/page.tsx` $\rightarrow$ `redirect('/customer/checklist')`
    - `app/customer/page.tsx` $\rightarrow$ `redirect('/customer/booking')`
  - Legacy `/portal/*` routes in `app/portal/`:
    - `app/portal/page.tsx` $\rightarrow$ `redirect('/customer/booking')`
    - `app/portal/bookings/page.tsx` $\rightarrow$ `redirect('/customer/booking')`
    - `app/portal/payments/page.tsx` $\rightarrow$ `redirect('/customer/payment')`
    - `app/portal/project/page.tsx` $\rightarrow$ `redirect('/customer/checklist')`
- **Customer Navigation Layout (`components/CustomerHeader.tsx`)**:
  - `CUSTOMER_NAV_ITEMS` (lines 19-38) strictly specifies **3 core menus**:
    1. `Booking Paket` $\rightarrow$ `/customer/booking`
    2. `Checklist & Status` $\rightarrow$ `/customer/checklist`
    3. `Tagihan & Pembayaran` $\rightarrow$ `/customer/payment`
  - Header displays: WEDMATE Logo, 3 navigation items, client name, `"Akun Terverifikasi"` status badge, and Logout button.
- **Admin Navigation Layout (`components/AdminHeader.tsx`)**:
  - `ADMIN_NAV_ITEMS` (lines 20-45) strictly specifies **4 core menus**:
    1. `Persetujuan` $\rightarrow$ `/admin/approvals`
    2. `Verifikasi Pembayaran` $\rightarrow$ `/admin/payments`
    3. `Manajemen Project` $\rightarrow$ `/admin/projects`
    4. `Katalog Paket` $\rightarrow$ `/admin/packages`
  - Header displays: WEDMATE Administrator Logo, 4 navigation items with pending notification badges, admin name, `"SUPER ADMINISTRATOR"` badge, and Logout button.
- **Admin Tab 3 Gap in `app/admin/approvals/page.tsx`**:
  - Currently contains only Tab 1 (`accounts`: Persetujuan Akun) and Tab 2 (`bookings`: Pengajuan Booking).
  - Missing Tab 3 (`calendar`: Kalender Jadwal Acara) required by Requirement R3.

---

## 2. Logic Chain

1. **Root Page Compliance with R1**:
   - *Observation*: `app/page.tsx` renders a single card on `#F8F5EF` with WEDMATE logo, tagline (`Plan Your Day, Cherish Your Moments.`), intro text, and exactly 2 buttons: `[Masuk ke Akun]` (`/login`) and `[Registrasi Akun Baru]` (`/register`).
   - *Logic*: Because `app/layout.tsx` does not include `Navbar` or `Footer`, and `app/page.tsx` contains no company profile sections (hero, about us, gallery, testimonials, contact), the root `/` page visual structure already matches the Centered Auth Gateway requirement.

2. **Residual Promotional Elements**:
   - *Observation*: `components/Navbar.tsx` and `components/Footer.tsx` still contain legacy promotional navigation, while `app/packages/page.tsx` contains a public catalog page.
   - *Logic*: Because the platform is transforming into an internal-only application (App-First Portal), these standalone public pages and promotional components are obsolete. Customer package selection is handled inside `/customer/booking`, and Admin package CRUD is inside `/admin/packages`.

3. **Session Redirection & Cookie Parity**:
   - *Observation*: `app/page.tsx` and `app/login/page.tsx` direct sessions to `/admin/approvals` (for `ADMIN`) and `/customer/booking` (for `CUSTOMER`). However, `middleware.ts` reads `wedmate_role` and `wedmate_status` whereas `lib/auth-context.tsx` writes `wedmate_user_role` and `wedmate_user_status`. Additionally, lines 228, 265, and 271 of `lib/auth-context.tsx` still push to `/customer/dashboard`.
   - *Logic*: If a user logs in via demo store in browser mode, `middleware.ts` might not see `wedmate_role` on subsequent requests if the cookie name key differs. Setting both cookie names in `syncAuthCookies` and ensuring `lib/auth-context.tsx` pushes to `/customer/booking` and `/admin/approvals` guarantees zero redirect mismatches across Edge Middleware and client routers.

4. **Customer Route Architecture**:
   - *Observation*: Customer routes reside under `/customer/*`, and all `/portal/*` routes are 1-line redirect proxies to `/customer/*`. `components/CustomerHeader.tsx` defines exactly 3 menu items.
   - *Logic*: Route structure is already consolidated under `/customer/*`. No routing re-architecture is required for customer views; the 3 core menus are `/customer/booking`, `/customer/checklist`, and `/customer/payment`. All alias redirects (`/portal/*`, `/customer/dashboard`, etc.) protect backward compatibility.

5. **Admin Portal Calendar Requirement**:
   - *Observation*: `app/admin/approvals/page.tsx` has Tabs 1 and 2, but lacks Tab 3 (Kalender Jadwal Acara).
   - *Logic*: R3 requires an interactive monthly calendar with color-coded booking date indicators (Amber for PENDING, Emerald for CONFIRMED, Rose for CANCELLED) and click-to-view event details. This is the primary functional component to be added to `/admin/approvals`.

---

## 3. Caveats

- **Supabase vs. Demo Store Mode**: The codebase includes full Supabase SSR support (`@supabase/ssr`), but also has a comprehensive in-memory / `localStorage` `demoStore` fallback when `.env.local` Supabase credentials are placeholders. Both modes must be kept aligned.
- **`app/packages/page.tsx` Retention**: It currently redirects unauthorized guests to `/login?redirect=/customer/dashboard/booking`. It can either be converted to a redirect to `/` or `/customer/booking`, or kept as an internal redirect.
- **No Source Code Changes**: Per the subagent Explorer role, no source files were altered during this survey.

---

## 4. Conclusion

1. **Root `/` (Welcome Screen)**:
   - Already operates as a clean "Centered Auth Gateway" on `#F8F5EF` with the WEDMATE logo, tagline, subtitle, and 2 buttons (`/login` and `/register`).
   - Does not render public Navbar or Footer.

2. **Promotional Elements**:
   - No promotional elements are visible on root `/`.
   - `components/Navbar.tsx`, `components/Footer.tsx`, and `app/packages/page.tsx` are unlinked from root.

3. **Auth & Redirection Flows**:
   - Authenticated ADMINs redirect to `/admin/approvals`.
   - Authenticated CUSTOMERs redirect to `/customer/booking`.
   - Unapproved/Pending CUSTOMERs redirect to `/approval-pending`.
   - Needs cookie parity fix: ensure `syncAuthCookies` in `lib/auth-context.tsx` writes both `wedmate_user_role` / `wedmate_role` and `wedmate_user_status` / `wedmate_status`, and replace remaining `/customer/dashboard` router pushes with `/customer/booking`.

4. **Customer Routing & Layout**:
   - Routes are strictly under `/customer/*`.
   - `CustomerHeader.tsx` already delivers the exact 3 core menus: `/customer/booking`, `/customer/checklist`, `/customer/payment`.
   - `/portal/*` routes function cleanly as redirect proxies.

5. **Admin Approvals & Calendar**:
   - `AdminHeader.tsx` delivers the exact 4 core menus.
   - Implementation focus for subsequent agent: add **Tab 3 (Kalender Jadwal Acara)** into `app/admin/approvals/page.tsx`.

---

## 5. Verification Method

To independently verify these findings, inspect the following files:

1. **Root Screen**:
   - View `app/layout.tsx` (confirm absence of Navbar/Footer imports).
   - View `app/page.tsx` (confirm background `#F8F5EF`, 2 buttons to `/login` and `/register`, and session redirects).
2. **Customer Navigation**:
   - View `components/CustomerHeader.tsx` (lines 19-38: verify exactly 3 items: `/customer/booking`, `/customer/checklist`, `/customer/payment`).
3. **Admin Navigation & Tabs**:
   - View `components/AdminHeader.tsx` (lines 20-45: verify 4 menus: `/admin/approvals`, `/admin/payments`, `/admin/projects`, `/admin/packages`).
   - View `app/admin/approvals/page.tsx` (lines 43-46, 228-277: verify existing Tabs 1 and 2, and absence of Tab 3).
4. **Auth Guards**:
   - View `middleware.ts` (lines 25-56, 99-123) and `lib/auth-context.tsx` (lines 30-58).
