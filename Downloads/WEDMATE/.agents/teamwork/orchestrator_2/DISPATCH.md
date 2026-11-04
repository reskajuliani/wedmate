# DISPATCH — orchestrator_2

## 2026-11-04T10:37:05Z

You are the Project Orchestrator for WEDMATE.

Your identity and workspace:
- Working directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE
- Agent folder: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\orchestrator_2\
- Original request file: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\ORIGINAL_REQUEST.md (Refer to the latest section dated 2026-11-04T10:34:22Z)

Task Summary:
Transform WEDMATE from a wedding organizer promotional site into an App-First Portal (purely functional web application), stripping all public website elements, simplifying customer navigation to 3 core menus, and providing an integrated Admin portal complete with an interactive Booking Schedule Calendar, with zero dummy data.

Key Requirements:
1. R1. Welcome Screen Auth Gateway (Replacement for Landing Page):
   - Remove all public website/company profile elements (hero promo, about us, gallery, testimonials, contact, promotional footer).
   - Root page (/) is strictly a "Centered Auth Gateway" with background #F8F5EF containing the WEDMATE logo, tagline, intro text, and exactly 2 primary buttons:
     1. [ Masuk ke Akun ] -> /login
     2. [ Registrasi Akun Baru ] -> /register
   - Active session redirects:
     - Role ADMIN redirects automatically to /admin/approvals
     - Role CUSTOMER redirects automatically to /customer/booking
2. R2. Customer Portal — Exactly 3 Core Menus (/customer/*):
   - /customer/booking: Active package catalog + integrated reservation form (event date, venue, guest count, notes, submit button).
   - /customer/checklist: Booking status (Pending/Confirmed), countdown to wedding day, and wedding preparation checklist from WO (read-only).
   - /customer/payment: Remaining balance, official accounts (BCA: 446 156 3613 & DANA: 085551124373), proof-of-payment upload form, and transaction status history.
   - Top Header: Client name, approval status, and Logout button in top-right.
3. R3. Admin Portal — Core Work Menus & Booking Calendar (/admin/*):
   - /admin/approvals:
     * Tab 1: Account Approvals (Approve/Reject customer pending status).
     * Tab 2: Booking Requests (Table of booking submissions with Confirm / Cancel actions).
     * Tab 3: Event Schedule Calendar:
       - Interactive monthly calendar grid (month/year navigation).
       - Mark booked dates with color indicators: Yellow/Amber for PENDING, Green/Emerald for CONFIRMED, Red/Rose for CANCELLED.
       - Clicking on a date displays event details: Bride & Groom names, Selected Package, Venue, Guest Count, and Reservation Total.
   - /admin/payments: Pending verification transactions list with transfer proof preview modal, Approve button (atomic balance calculation), and Reject button (with reason).
   - /admin/projects: Wedding preparation task checklist per client/event with add-task functionality.
   - /admin/packages: Simple CRUD for package name, price, description, facilities, and active status.
   - Top Header: Admin name and Logout button in top-right.
4. R4. Strict Security & Zero Dummy Data:
   - Unauthenticated guests blocked by Edge Middleware (middleware.ts) and Server Layout Guards from all /customer/* and /admin/* routes.
   - Public registration defaults to role CUSTOMER and status PENDING, redirected to /approval-pending until Admin approval.
   - Initial tables clean from database Supabase / clean store, rendering EmptyState components when data length is 0.
   - Official bank accounts strictly: BCA 446 156 3613 and DANA 085551124373.
   - Dev server active and error-free on http://localhost:3000.
