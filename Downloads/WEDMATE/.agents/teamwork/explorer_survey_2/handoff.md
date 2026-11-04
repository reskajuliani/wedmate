# Technical Investigation Report: Data Store, Zero Dummy Data, EmptyState, Edge Middleware & Security

**Agent**: `explorer_survey_2`  
**Date**: 2026-11-04T10:57:00Z  
**Scope**: Survey existing WEDMATE codebase focusing on Data Store, Zero Dummy Data, EmptyState, Edge Middleware & Security in relation to the new App-First Portal requirements (`ORIGINAL_REQUEST.md`, section 2026-11-04T10:34:22Z).

---

## 1. Observation

### 1.1 Data Store Architecture & Mock/Seed Data
- **File**: `lib/demo-store.ts`
  - **Storage Key**: `STORAGE_KEY = 'wedmate_zeromock_db_v3'` (line 29). Reads from `window.localStorage.getItem(STORAGE_KEY)` if in browser (line 171).
  - **Initial Seed Profiles (`INITIAL_USERS`, lines 32–45)**:
    ```typescript
    const INITIAL_USERS: UserProfile[] = [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@wedmate.id',
        full_name: 'Admin WEDMATE',
        phone: '081234567890',
        role: 'ADMIN',
        status: 'APPROVED',
        approval_status: 'APPROVED',
        notes: 'Super administrator platform WEDMATE',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];
    ```
    No customer users exist in initial seeds.
  - **Initial Packages (`INITIAL_PACKAGES`, lines 47–135)**:
    Contains 4 base catalog packages (`Intimate Romance`, `Classic Elegance`, `Royal Grandeur`, `Luxury Heritage`).
  - **Initial Operational Tables (lines 137–142)**:
    ```typescript
    const INITIAL_BOOKINGS: Booking[] = [];
    const INITIAL_PROJECTS: WeddingProject[] = [];
    const INITIAL_TASKS: WeddingTask[] = [];
    const INITIAL_PAYMENTS: Payment[] = [];
    const INITIAL_TRANSACTIONS: PaymentTransaction[] = [];
    const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
    ```
    All operational tables start with 0 rows (completely clean).
  - **Runtime Method Discrepancy Found**:
    - In `lib/demo-store.ts` line 593:
      ```typescript
      public getTasksByProjectId(projectId: string): WeddingTask[] {
        return this.state.tasks
          .filter((t) => t.project_id === projectId)
          .sort((a, b) => a.sort_order - b.sort_order);
      }
      ```
      There is **no** `getTasks(id)` method defined on `demoStore`.
    - In `app/customer/checklist/page.tsx` line 114:
      ```typescript
      setTasks(demoStore.getTasks(currentProject.id));
      ```
      Calling `demoStore.getTasks` will throw `TypeError: demoStore.getTasks is not a function` at runtime once a project is confirmed!

- **File**: `supabase/schema.sql`
  - Defines 7 ENUM types: `user_role`, `account_status`, `booking_status`, `task_status`, `payment_status`, `transaction_status`, `payment_method` (lines 14–54).
  - Defines 8 tables: `profiles`, `wedding_packages`, `bookings`, `wedding_projects`, `wedding_tasks`, `payments`, `payment_transactions`, `email_logs`, `activity_logs` (lines 61–180).
  - Defines strict RLS policies on all operational tables requiring `is_approved_customer()` or `is_admin()` (lines 350–509).
  - Seed Data (lines 514–576):
    - Inserts only 1 profile: Super Admin (`admin@wedmate.id`, UUID `a0000000-0000-0000-0000-000000000001`).
    - Inserts 4 wedding packages into `wedding_packages`.
    - Operational tables (`bookings`, `wedding_projects`, `wedding_tasks`, `payments`, `payment_transactions`, `email_logs`, `activity_logs`) contain 0 insert statements and start 100% clean.

### 1.2 Zero Dummy Data Compliance & Local Storage Persistence
- Neither `lib/demo-store.ts` nor `supabase/schema.sql` contains pre-seeded bookings, projects, tasks, payments, or transactions.
- **Dynamic Creation Observation**:
  - In `lib/auth-context.tsx` (lines 191–215), when `switchRole('pending')` or `switchRole('approved')` is executed (e.g. from the test helper on `/approval-pending`), it creates users with emails `pengantin.pending@example.com` or `pengantin.approved@example.com`.
  - When user records, bookings, or transactions are created in the browser during interactive manual tests, they are stored in `window.localStorage['wedmate_zeromock_db_v3']`.
  - If a tester ran tests previously, stale data could persist in the browser's localStorage. `demoStore.reset()` (line 229) clears all data back to `INITIAL_*`.

### 1.3 Edge Middleware & Server Layout Guards
- **File**: `middleware.ts`
  - **Public Routes (lines 14–18)**:
    `const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/approval-pending';`
  - **Unauthenticated Handling (lines 29–33 & 82–86)**:
    Any unauthenticated request to non-public routes (`/customer/*`, `/admin/*`, etc.) is intercepted and redirected:
    `NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));`
  - **Role & Status Enforcement (lines 36–56 in Demo Mode, lines 89–123 in Supabase Mode)**:
    - If user visits `/`, `/login`, or `/register`:
      - `ADMIN` is redirected to `/admin/approvals`.
      - `CUSTOMER` is redirected to `/customer/booking`.
    - If user visits `/admin/*` and role is not `ADMIN`:
      Redirected to `/customer/booking`.
    - If user visits `/customer/*`:
      - If role is not `CUSTOMER`, redirected to `/admin/approvals`.
      - If `status !== 'APPROVED'`, redirected to `/approval-pending`.

- **File**: `app/customer/layout.tsx` (Server Component Layer 2 Guard)
  - Lines 74–76:
    ```typescript
    if (!userId || !userRole) {
      redirect('/login?redirect=/customer/booking');
    }
    ```
  - Lines 89–93:
    ```typescript
    if (userRole === 'CUSTOMER') {
      if (userStatus !== 'APPROVED') {
        redirect('/approval-pending');
      }
      return (...);
    }
    ```
  - PENDING or REJECTED customers are strictly barred from customer layouts.

- **File**: `app/admin/layout.tsx` (Server Component Layer 2 Guard)
  - Lines 80–88: Zero-Trust Admin verification (in demo mode, verifies `userId === 'a0000000-0000-0000-0000-000000000001' || cookieUser?.email === 'admin@wedmate.id'`).
  - Lines 92–94: If unauthenticated, redirected to `/login?redirect=/admin/approvals`.
  - Lines 96–102: Non-admins are blocked from `/admin/*` and redirected to `/customer/booking` (if approved) or `/approval-pending`.

- **File**: `app/register/page.tsx`
  - Lines 47–59: Registration form enforces role `CUSTOMER` and status `PENDING`, immediately routing the applicant to `/approval-pending`.

- **File**: `app/approval-pending/page.tsx`
  - Accurately renders pending state banner ("STATUS: PENDING REVIEW", lines 62–64), concierge contact (`wa.me/6285551124373`), and logout button.

- **Discrepancy in `lib/auth-context.tsx` client router pushes**:
  - In `lib/auth-context.tsx` lines 228, 265, and 271, approved customers are pushed to `/customer/dashboard` (which redirects to `/customer/booking`).
  - In line 230, admins are pushed to `/admin` (which redirects to `/admin/approvals`).
  - While page redirects resolve these, direct router calls should point directly to `/customer/booking` and `/admin/approvals` per the 2026-11-04 specifications.

### 1.4 EmptyState Components Across Modules
- **File**: `components/ui/empty-state.tsx`
  - Reusable presentation component with Lucide icon, champagne styling, title, description, and primary/secondary action buttons.
  - Interface:
    ```typescript
    export interface EmptyStateProps {
      title: string;
      description: string;
      icon?: LucideIcon;
      actionLabel?: string;
      actionHref?: string;
      onAction?: () => void;
      secondaryActionLabel?: string;
      secondaryActionHref?: string;
      onSecondaryAction?: () => void;
      action?: React.ReactNode;
      children?: React.ReactNode;
    }
    ```
- **Usage Across Codebase**:
  1. **Packages**:
     - `app/customer/booking/page.tsx:213`: When `packages.length === 0`, renders `<EmptyState icon={Sparkles} title="Katalog Paket Belum Tersedia" ... />`.
     - `app/admin/packages/page.tsx:364`: When `filteredPackages.length === 0`, renders `<EmptyState icon={Package} title="Tidak Ada Paket Ditemukan" ... />`.
  2. **Bookings**:
     - `app/customer/booking/page.tsx:470`: When `bookings.length === 0`, renders `<EmptyState icon={CalendarDays} title="Belum Ada Pengajuan Booking" ... />` with action button to fill booking form.
     - `app/admin/approvals/page.tsx:496`: When `filteredBookings.length === 0`, renders `<EmptyState icon={CalendarDays} title="Belum Ada Pengajuan Booking" ... />`.
  3. **Checklist & Projects**:
     - `app/customer/checklist/page.tsx:208`: When no active project or booking exists, renders `<EmptyState icon={ListTodo} title="Belum Ada Proyek Pernikahan Aktif" ... />`.
     - `app/admin/projects/page.tsx:255`: When `filteredProjects.length === 0`, renders `<EmptyState icon={ListTodo} title="Belum Ada Proyek Pernikahan Aktif" ... />`.
  4. **Payments & Transactions**:
     - `app/customer/payment/page.tsx:236`: When `payments.length === 0`, renders `<EmptyState icon={CreditCard} title="Belum Ada Tagihan Pembayaran" ... />`.
     - `app/admin/payments/page.tsx:387`: When `filteredTransactions.length === 0`, renders `<EmptyState icon={CreditCard} title="Belum Ada Transaksi Pembayaran" ... />`. Note: Passes `compact` prop which is not defined in `EmptyStateProps`.
  5. **Admin Approvals Calendar Tab (Missing)**:
     - `app/admin/approvals/page.tsx` currently only contains Tab 1 (`accounts`) and Tab 2 (`bookings`). Tab 3 (Monthly Calendar Grid) required by R3 is not yet implemented. When implemented, it will need a corresponding EmptyState or empty date indicator for months with 0 bookings.

### 1.5 Official Payment Account Constants Verification
Verified across all codebase occurrences:
1. `lib/types.ts` (lines 146–169):
   - **BCA**: `accountNumber: '446 156 3613'`, `accountHolder: 'WEDMATE INDONESIA'`.
   - **DANA**: `accountNumber: '085551124373'`, `accountHolder: 'WEDMATE'`.
2. `app/customer/payment/page.tsx`:
   - Line 341: Displays `OFFICIAL_PAYMENT_ACCOUNTS.BCA.accountNumber` (`446 156 3613`).
   - Line 417: Displays `OFFICIAL_PAYMENT_ACCOUNTS.DANA.accountNumber` (`085551124373`).
   - Line 89–96: Sanitizes spaces when copying to clipboard (`4461563613` and `085551124373`).
3. `app/admin/payments/page.tsx`:
   - Lines 209, 216: Displays `BCA 446 156 3613 (WEDMATE INDONESIA)` and `DANA 085551124373 (WEDMATE)`.
   - Lines 464, 470: Renders badges `BCA (446 156 3613)` and `DANA (085551124373)`.
4. `app/admin/reports/page.tsx`:
   - Lines 105–107: Maps CSV rows to `'BCA 446 156 3613 a/n WEDMATE INDONESIA'` and `'DANA 085551124373 a/n WEDMATE'`.
5. `app/approval-pending/page.tsx`:
   - Line 127: Official WhatsApp concierge link uses `https://wa.me/6285551124373`.
- **Verdict**: 100% compliant. Zero unauthorized account numbers exist in the repository.

---

## 2. Logic Chain

1. **Premise 1 (Zero Dummy Data Requirement)**: The user specification states that initial tables must start completely clean from dummy data, with zero pre-seeded bookings, transactions, or fake wedding projects, displaying EmptyState components when row counts are 0.
   - *Supported by*: `ORIGINAL_REQUEST.md:104` ("Tabel awal murni kosong dari database Supabase / clean store, menampilkan komponen EmptyState jika data bernilai 0.").
   - *Observation*: `lib/demo-store.ts:137-142` initializes `INITIAL_BOOKINGS`, `INITIAL_PROJECTS`, `INITIAL_TASKS`, `INITIAL_PAYMENTS`, `INITIAL_TRANSACTIONS` as empty arrays (`[]`). `supabase/schema.sql:574-576` seeds only the base administrator and package catalog.
   - *Inference*: The codebase already adopts the Zero Dummy Data architecture at code level. However, to guarantee a clean state across browser sessions, the client storage key must be kept fresh or reset upon launch.

2. **Premise 2 (Security Architecture: Defense-in-Depth)**: Guests without authentication must not access `/customer/*` or `/admin/*`, and customers with PENDING status must be barred from all customer action routes and redirected to `/approval-pending`.
   - *Supported by*: `middleware.ts:28-56, 81-123`, `app/customer/layout.tsx:74-93`, `app/admin/layout.tsx:92-102`.
   - *Observation*: Both Edge Middleware and Server Layout Guards execute role and status checks independently. Unauthenticated requests are redirected to `/login?redirect=...`. Non-approved customers attempting to reach `/customer/booking`, `/customer/checklist`, or `/customer/payment` are immediately redirected to `/approval-pending`.
   - *Inference*: The access control mechanism is solidly structured with two defense layers.

3. **Premise 3 (EmptyState Coverage)**: When any list or entity table is empty, an elegant EmptyState component must render with contextual iconography and actions.
   - *Observation*: Every primary route (`/customer/booking`, `/customer/checklist`, `/customer/payment`, `/admin/approvals`, `/admin/payments`, `/admin/projects`, `/admin/packages`) imports and renders `components/ui/empty-state.tsx`.
   - *Inference*: Empty states are fully covered for existing views. When Tab 3 (Event Calendar) is added to `/admin/approvals`, it should follow the same pattern for months with zero reservations.

4. **Premise 4 (Runtime Robustness & Defect Prevention)**:
   - *Observation*: In `app/customer/checklist/page.tsx:114`, `demoStore.getTasks(currentProject.id)` is called. In `lib/demo-store.ts:593`, only `getTasksByProjectId` is defined.
   - *Inference*: When a client confirms a booking and attempts to open `/customer/checklist`, this line will throw a fatal runtime exception. A helper alias `getTasks(projectId)` should be added to `demoStore` or the call site corrected to `getTasksByProjectId`.

5. **Premise 5 (Payment Constants Adherence)**:
   - *Observation*: All references in `lib/types.ts`, `app/customer/payment/page.tsx`, `app/admin/payments/page.tsx`, `app/admin/reports/page.tsx`, and `app/approval-pending/page.tsx` strictly use BCA `446 156 3613` and DANA `085551124373`.
   - *Inference*: Payment constant integrity is 100% verified.

---

## 3. Caveats

1. **Local Storage Testing Artifacts**: Although code-level seed arrays are empty, local browser storage (`wedmate_zeromock_db_v3`) retains any test records generated in earlier development runs unless cleared via `localStorage.clear()` or `demoStore.reset()`.
2. **Missing Feature in `/admin/approvals`**: Tab 3 ("Kalender Jadwal Acara" with month/year navigation, colored status dots, and modal/flyout event details) is specified in `ORIGINAL_REQUEST.md:89-95` but is not yet implemented in `app/admin/approvals/page.tsx`.
3. **TypeScript / Prop Warning in Admin Payments**: `app/admin/payments/page.tsx:391` passes `compact` to `EmptyState`, which is not declared on `EmptyStateProps`. While JSX tolerates extra props at runtime, adding `compact?: boolean` to `EmptyStateProps` or removing the prop ensures strict TS hygiene.

---

## 4. Conclusion

1. **Zero Dummy Data**: Clean architecture is in place. No mock bookings, projects, tasks, or payments are seeded in `lib/demo-store.ts` or `supabase/schema.sql`.
2. **EmptyState Coverage**: Fully implemented across Packages, Bookings, Payments, and Projects using `components/ui/empty-state.tsx`.
3. **Edge Middleware & Security**: Multi-layered defense (`middleware.ts` + Server Layout Guards) effectively protects `/customer/*` and `/admin/*`. PENDING customers are routed to `/approval-pending`.
4. **Actionable Fix Needed for Implementers**:
   - Fix method call: In `app/customer/checklist/page.tsx:114`, change `demoStore.getTasks(...)` to `demoStore.getTasksByProjectId(...)` (or expose `getTasks` alias in `demo-store.ts`).
   - Direct routing: Update `lib/auth-context.tsx` client redirects from `/customer/dashboard` to `/customer/booking` and `/admin` to `/admin/approvals`.
   - Implement Tab 3 Booking Calendar Grid in `app/admin/approvals/page.tsx`.
5. **Payment Constants**: BCA `446 156 3613` and DANA `085551124373` are strictly consistent across the entire platform.

---

## 5. Verification Method

To independently verify the observations and conclusions of this survey:

1. **Verify Empty Initial Data**:
   Inspect `lib/demo-store.ts` lines 137–142 and `supabase/schema.sql` lines 514–576. Confirm `INITIAL_BOOKINGS`, `INITIAL_PROJECTS`, `INITIAL_TASKS`, `INITIAL_PAYMENTS`, `INITIAL_TRANSACTIONS` are `[]`.
2. **Verify Method Mismatch in Checklist**:
   Inspect `app/customer/checklist/page.tsx` line 114:
   ```typescript
   setTasks(demoStore.getTasks(currentProject.id));
   ```
   Compare with `lib/demo-store.ts` lines 593–597: note that only `getTasksByProjectId` exists.
3. **Verify Middleware Guard Logic**:
   Inspect `middleware.ts` lines 29–56 and lines 82–123 to verify redirect behavior for unauthenticated and PENDING roles.
4. **Verify Bank Account Constants**:
   Inspect `lib/types.ts` lines 150 & 161; `app/customer/payment/page.tsx` lines 341 & 417; `app/admin/payments/page.tsx` lines 209, 216, 464, 470; `app/admin/reports/page.tsx` lines 105–107.
5. **Verify EmptyState Implementation**:
   Inspect `components/ui/empty-state.tsx` and its imports in:
   - `app/customer/booking/page.tsx` (lines 28, 213, 470)
   - `app/customer/checklist/page.tsx` (lines 25, 208)
   - `app/customer/payment/page.tsx` (lines 29, 236)
   - `app/admin/approvals/page.tsx` (lines 34, 496)
   - `app/admin/payments/page.tsx` (lines 29, 387)
   - `app/admin/projects/page.tsx` (lines 28, 255)
   - `app/admin/packages/page.tsx` (lines 28, 364)
