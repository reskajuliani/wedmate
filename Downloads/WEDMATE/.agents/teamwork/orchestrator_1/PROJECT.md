# Project: WEDMATE (Wedding Organizer CRM & Booking Management Platform)

## Architecture
- Framework: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React
- Color Palette:
  - Champagne Gold: `#C8A46A`
  - Ivory: `#F8F5EF`
  - Soft Beige: `#E8DED0`
  - Dark Charcoal: `#333333`
- Backend / Data Layer:
  - Supabase client & server helper (`@supabase/supabase-js`, `@supabase/ssr`)
  - Complete schema & migration script: `supabase/schema.sql` (650 lines, 7 ENUMs, 9 tables, 2 triggers, RLS policies, seeds)
  - Graceful Demo Store (`lib/demo-store.ts`, 1,040 lines) allowing full offline functionality without Supabase credentials.
  - Role switcher component (`components/RoleSwitcher.tsx`) for testing Guest, Customer Pending, Customer Approved, and Admin flows instantly.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Next.js 15 Setup & Design System | Setup Next.js 15, Tailwind theme with wedding palette, Lucide icons, responsive navigation layout (Landing, Customer, Admin) | M1 | R1 |
| 2 | Supabase Schema & Config | supabase/schema.sql with profiles, packages, bookings, projects, tasks, payments, transactions, email_logs, activity_logs, ENUMs, RLS, seeds, .env.local.example | M1 | R2 |
| 3 | Auth & Approval Gatekeeper | Customer register (/register) default PENDING, gatekeeper redirecting PENDING/REJECTED to /approval-pending, Admin approvals page (/admin/dashboard/approvals) | M1 | R3 |
| 4 | Package Catalog CRUD | Admin package management (create, read, update, delete) and public/portal package browsing | M2 | R4 |
| 5 | Booking Engine | Customer booking flow with package selection, wedding date, venue, guest count, notes | M2 | R4 |
| 6 | Wedding Checklist Tracker | On booking confirmation by Admin, auto-initiate wedding_projects & wedding_tasks with 8-category checklist and real-time progress bar | M2 | R4 |
| 7 | Manual Payment Engine (BCA/DANA) | Display official payment accounts (BCA 446 156 3613, DANA 085551124373), proof upload (file/mock base64), payment creation | M3 | R5 |
| 8 | Manual Admin Payment Verification | Admin approves/rejects payment proofs; atomic balance recalculation (amount_paid, remaining_balance, status updates) | M3 | R5 |
| 9 | Reports & Data Export | Transaction summary analytics, payment logs, export to CSV (RFC 4180) / formatted report | M3 | R5 |
| 10 | Demo Fallback & Localhost Executability | Mock data fallback when Supabase keys absent, role switcher, dev server readiness on localhost:3000 | M4 | R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation, Design System, Supabase Schema & Auth | Next.js 15 setup, Tailwind wedding palette, supabase/schema.sql, Auth & Approval gatekeeper (/register, /approval-pending, /admin/dashboard/approvals), Role Switcher | none | DONE |
| M2 | Packages, Booking & Wedding Checklist Tracker | Package Catalog CRUD, Booking flow, Admin booking approval & auto-project generation, Checklist task manager | M1 | DONE |
| M3 | Payment BCA/DANA & Reports Engine | Payment accounts (BCA 446 156 3613, DANA 085551124373), proof upload, manual Admin verification, atomic balance updates, Reports & CSV export | M1 | DONE |
| M4 | Integration, Dev Server & Verification | Unified app integration, mock data provider completeness, Next.js dev server readiness, audit verification | M1, M2, M3 | DONE |

## Code Layout
```
WEDMATE/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                           # Landing page
│   ├── login/page.tsx
│   ├── register/page.tsx                  # Registration with PENDING status
│   ├── approval-pending/page.tsx          # Gatekeeper for pending/rejected
│   ├── portal/                            # Customer Portal
│   │   ├── page.tsx                       # Customer dashboard
│   │   ├── bookings/page.tsx              # Customer bookings & booking form
│   │   ├── project/page.tsx               # Wedding project checklist & tasks
│   │   └── payments/page.tsx              # Payment invoice & proof upload
│   └── admin/                             # Admin Dashboard
│       ├── page.tsx                       # Admin overview stats
│       ├── dashboard/approvals/page.tsx   # User registration approvals
│       ├── packages/page.tsx              # Packages CRUD
│       ├── bookings/page.tsx              # Bookings confirmation & management
│       ├── projects/page.tsx              # Projects overview & vendor checklists
│       ├── payments/page.tsx              # Manual payment proof verification
│       └── reports/page.tsx               # Financial reports & CSV export
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── RoleSwitcher.tsx                   # Demo switcher for Admin / Customer / Pending
├── lib/
│   ├── supabase/                          # Supabase client, server, middleware helpers
│   ├── demo-store.ts                      # Graceful fallback state & mock DB
│   ├── auth-context.tsx                   # Auth context with role & status
│   └── types.ts                           # Shared TypeScript domain types
├── supabase/
│   └── schema.sql                         # Complete database schema, RLS, seeds
├── .env.local.example
├── tailwind.config.ts
└── package.json
```

## Interface Contracts
### Auth & Profile
- Profile: `{ id: string, email: string, full_name: string, phone: string, role: 'ADMIN' | 'CUSTOMER', status: 'PENDING' | 'APPROVED' | 'REJECTED' }`
- Gatekeeper rule: `if (user.role === 'CUSTOMER' && user.status !== 'APPROVED') redirect to /approval-pending`

### Payment Accounts
- BCA Account: `446 156 3613` (a/n WEDMATE INDONESIA)
- DANA Account: `085551124373` (a/n WEDMATE)
- Verification rule: Manual Admin action strictly required. Atomic recalculation of `amount_paid` and `remaining_balance`.
