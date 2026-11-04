# Plan — App-First Portal Transformation for WEDMATE

## Objective
Transform WEDMATE from a wedding organizer promotional site into an App-First Portal (purely functional web application), stripping all public website elements, simplifying customer navigation to 3 core menus, and providing an integrated Admin portal complete with an interactive Booking Schedule Calendar, with zero dummy data and active dev server on http://localhost:3000.

## Execution Strategy
1. **Phase 0: Survey & Exploration**
   - Dispatch 3 parallel Explorers to inspect existing routes, components, data stores (`lib/demo-store.ts`, supabase schemas), middleware, and package.json.
   - Synthesize architectural baseline into `PROJECT.md`.

2. **Phase 1: Implementation Milestones**
   - **Milestone 1: Welcome Screen Auth Gateway (R1)**
     - Replace landing page at `/` with centered Auth Gateway (#F8F5EF, logo, tagline, 2 buttons: [Masuk ke Akun] -> `/login`, [Registrasi Akun Baru] -> `/register`).
     - Session redirects: ADMIN -> `/admin/approvals`, CUSTOMER -> `/customer/booking`.
   - **Milestone 2: Customer Portal (3 Menus) (R2)**
     - Clean customer layout with top header (Client name, approval status, Logout).
     - `/customer/booking`: Active package catalog + integrated reservation form.
     - `/customer/checklist`: Booking status (Pending/Confirmed), countdown to wedding day, read-only preparation checklist.
     - `/customer/payment`: Remaining balance, official accounts (BCA: 446 156 3613 & DANA: 085551124373), proof-of-payment upload form, transaction history.
   - **Milestone 3: Admin Portal (4 Menus & Calendar) (R3)**
     - Clean admin layout with top header (Admin name, Logout).
     - `/admin/approvals`:
       * Tab 1: Account Approvals (Approve/Reject pending customers).
       * Tab 2: Booking Requests (Table of booking submissions with Confirm/Cancel).
       * Tab 3: Event Schedule Calendar (Interactive monthly grid, color indicators: Yellow=PENDING, Green=CONFIRMED, Red=CANCELLED, click event detail modal/panel).
     - `/admin/payments`: Pending verification transactions list with transfer proof preview modal, Approve button (atomic balance calculation), Reject button.
     - `/admin/projects`: Wedding preparation task checklist per client/event with add-task functionality.
     - `/admin/packages`: Simple CRUD for packages (name, price, description, facilities, active status).
   - **Milestone 4: Security & Zero Dummy Data (R4)**
     - Edge Middleware & Server Layout Guards protecting all `/customer/*` and `/admin/*` routes.
     - Public registration default CUSTOMER/PENDING -> `/approval-pending`.
     - Zero dummy data: Clean initial store/database with elegant EmptyState components when count is 0.
     - Official bank accounts strictly BCA 446 156 3613 & DANA 085551124373.

3. **Phase 2: Verification, E2E Testing & Dev Server**
   - Dev server active and error-free on http://localhost:3000.
   - Forensic Auditor verification (anti-cheating, clean data, official accounts, full interactivity).
   - Final review and handoff.
