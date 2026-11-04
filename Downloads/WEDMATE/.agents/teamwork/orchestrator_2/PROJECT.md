# Project: WEDMATE App-First Portal Transformation

## Architecture
- **Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Palette**: Modern Elegant Wedding (Ivory `#F8F5EF`, Champagne Gold `#C8A46A`, Soft Beige `#E8DED0`, Dark Charcoal `#333333`).
- **Data Layer**: Clean relational storage engine in `lib/demo-store.ts` with zero initial operational dummy data (`INITIAL_* = []`), reactive browser subscribers, and Supabase SQL schema (`supabase/schema.sql`).
- **Security & RBAC**: Edge Middleware (`middleware.ts`) + Server Component Layout Guards (`app/customer/layout.tsx`, `app/admin/layout.tsx`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Welcome Screen Auth Gateway | Centered card on `#F8F5EF` with WEDMATE logo, tagline, intro, and 2 buttons ([Masuk] -> `/login`, [Registrasi] -> `/register`). Session redirects: ADMIN -> `/admin/approvals`, CUSTOMER -> `/customer/booking`. | M1 | Survey (explorer 1) |
| 2 | Auth Context & Cookie Parity | Synchronize `wedmate_role` & `wedmate_user_role`, update client router pushes to direct routes `/customer/booking` and `/admin/approvals`. | M1 | Survey (explorer 1 & 2) |
| 3 | Customer Checklist Bug Fix | Fix method call `demoStore.getTasks` -> `demoStore.getTasksByProjectId` in `app/customer/checklist/page.tsx` and provide backward-compatible alias in `demo-store.ts`. | M1 | Survey (explorer 2 & 3) |
| 4 | Customer 3 Core Menus Verification | Validate `/customer/booking`, `/customer/checklist`, `/customer/payment`, `CustomerHeader`, live countdown, empty states, and official accounts. | M1 | Survey (explorer 1 & 3) |
| 5 | Admin Booking Schedule Calendar (Tab 3) | Interactive monthly calendar grid in `/admin/approvals`: month/year navigation, colored indicators (Amber=PENDING, Emerald=CONFIRMED, Rose=CANCELLED), click date detail modal. | M2 | Survey (explorer 1 & 3) |
| 6 | Admin 4 Work Menus Integration | Verify `/admin/approvals` (Tabs 1-3), `/admin/payments`, `/admin/projects`, `/admin/packages`, and `AdminHeader`. | M2 | Survey (explorer 1 & 3) |
| 7 | Zero Dummy Data & EmptyState Audit | Verify initial empty operational tables, EmptyState display across all customer & admin views, and strict BCA/DANA account numbers. | M3 | Survey (explorer 2) |
| 8 | Dev Server & Compilation Verification | Next.js dev server active and responsive on http://localhost:3000 without errors. | M3 | Survey (all) |
| 9 | Forensic Integrity Audit | Independent verification of authentic implementation, no dummy data, no hardcoded cheating, strict official accounts. | M4 | System Requirement |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Auth Gateway Parity & Checklist Fix | Fix `demoStore.getTasksByProjectId` call in `app/customer/checklist/page.tsx`, alias in `lib/demo-store.ts`, cookie sync & router push alignment in `lib/auth-context.tsx`. | None | DONE |
| M2 | Admin Booking Calendar (Tab 3) | Implement `components/admin/EventScheduleCalendar.tsx` and integrate Tab 3 (`calendar`) in `app/admin/approvals/page.tsx` with date-click modal, color status indicators, and month navigation. | M1 | DONE |
| M3 | Dev Server & Localhost Verification | Verify compilation, verify dev server on http://localhost:3000, verify full customer & admin interactive workflows. | M2 | DONE |
| M4 | Forensic Integrity Audit | Run `teamwork_preview_auditor` to verify zero dummy data, no hardcoded cheats, and exact official accounts. | M3 | DONE |

## Interface Contracts
### Calendar Component ↔ Admin Approvals Page
- **Component**: `components/admin/EventScheduleCalendar.tsx`
- **Props**:
  - `bookings: Booking[]`
  - `onSelectBooking?: (booking: Booking) => void`
  - `onConfirmBooking?: (bookingId: string) => void`
  - `onCancelBooking?: (bookingId: string) => void`
- **Visual Status Colors**:
  - `PENDING`: Amber (`bg-amber-100 text-amber-800 border-amber-300`, dot `bg-amber-500`)
  - `CONFIRMED`: Emerald (`bg-emerald-100 text-emerald-800 border-emerald-300`, dot `bg-emerald-500`)
  - `CANCELLED`: Rose (`bg-rose-100 text-rose-800 border-rose-300`, dot `bg-rose-500`)
- **Date Click Modal**:
  - Displays: Bride & Groom names, Selected Package, Venue & Address, Guest count, Total Price (formatted in Rupiah), and status badge.
  - Action buttons if PENDING: Quick Confirm / Quick Reject.

### Code Layout
- Root: `app/page.tsx` (Auth Gateway)
- Customer: `app/customer/booking/`, `app/customer/checklist/`, `app/customer/payment/`, `components/CustomerHeader.tsx`
- Admin: `app/admin/approvals/`, `app/admin/payments/`, `app/admin/projects/`, `app/admin/packages/`, `components/AdminHeader.tsx`, `components/admin/EventScheduleCalendar.tsx`
- Stores: `lib/demo-store.ts`, `lib/auth-context.tsx`, `lib/types.ts`
