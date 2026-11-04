## 2026-11-03T15:23:50Z
You are Agent 2: Packages, Booking & Wedding Checklist Tracker Specialist for WEDMATE.
Your metadata working directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_booking_1
Project root directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE

MANDATORY: Read the original user request before starting:
C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\ORIGINAL_REQUEST.md
Also review the project plan:
C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\orchestrator_1\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context & Existing Foundation:
- Next.js 15 App Router is set up with Tailwind wedding palette (Champagne Gold #C8A46A, Ivory #F8F5EF, Soft Beige #E8DED0, Dark Charcoal #333333) and Lucide icons.
- `lib/demo-store.ts` provides a complete singleton `demoStore` with reactive subscription `demoStore.subscribe(fn)` and methods: `getPackages`, `createPackage`, `updatePackage`, `deletePackage`, `getBookings`, `createBooking`, `confirmBooking`, `getProjects`, `getTasksByProject`, `updateTaskStatus`, `createTask`.
- `lib/auth-context.tsx` provides `useAuth()` with `user`, `role`, `status`.

Your Deliverables:
1. Admin Package Catalog Management (`app/admin/packages/page.tsx`):
   - Package listing table & cards with image, price, estimated guests, features list, active status badge.
   - Add new package modal/form with validation.
   - Edit package modal/form and Delete / Toggle Active buttons.
2. Customer Booking Management (`app/portal/bookings/page.tsx`):
   - Display customer's existing bookings with status badges (PENDING, CONFIRMED, CANCELLED, COMPLETED).
   - "Buat Booking Baru" modal/form: Package selection dropdown, wedding date picker, venue name & address, guest count, special requests/notes.
   - Price calculation and booking summary preview before submission.
3. Admin Booking Management & Confirmation (`app/admin/bookings/page.tsx`):
   - Filterable bookings list (All, Pending, Confirmed, Cancelled).
   - Detailed booking view (customer info, package, venue, guest count, wedding date).
   - "Konfirmasi Booking" action: Calls `demoStore.confirmBooking(bookingId, adminId)`.
   - CRITICAL REQUIREMENT: On booking confirmation by Admin, automatically initialize `wedding_projects` and initial checklist `wedding_tasks` across categories (Venue, Catering, Attire, Decoration, Documentation, Invitation, Entertainment, Other) with real-time progress bar tracking!
4. Wedding Project & Checklist Tracker:
   - Customer project view (`app/portal/project/page.tsx`):
     - Displays wedding project title, countdown to wedding date, and dynamic progress bar (e.g. 35% completed).
     - Category filter (All, Venue, Catering, Attire, Decoration, Documentation, Invitation, Entertainment, Other).
     - Interactive checklist: checkboxes to mark tasks TODO / IN_PROGRESS / COMPLETED, immediately updating progress bar.
     - "Tambah Tugas" modal to add custom tasks.
   - Admin projects view (`app/admin/projects/page.tsx`):
     - Overview of all active client wedding projects and their checklist progress.
5. Verification:
   - Ensure clean code, TypeScript types, responsive UI using the wedding color palette.
   - Write your handoff report to `C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_booking_1\handoff.md` and send a completion message back.
