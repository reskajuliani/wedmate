## 2026-11-03T15:06:20Z
You are Agent 1: Foundation, Design System & Auth/Approval Specialist for WEDMATE.
Your metadata working directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_foundation_1
Project root directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE

MANDATORY: Read the original user request before starting:
C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\ORIGINAL_REQUEST.md
Also review the project plan:
C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\orchestrator_1\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Deliverables:
1. Setup Next.js 15 in C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE with TypeScript, App Router, Tailwind CSS, Lucide icons (lucide-react).
   - Configure Tailwind with the Modern Elegant Wedding color palette:
     - Champagne Gold: #C8A46A
     - Ivory: #F8F5EF
     - Soft Beige: #E8DED0
     - Dark Charcoal: #333333
2. Database Schema:
   - Create C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\supabase\schema.sql with:
     - ENUM types: user_role (ADMIN, CUSTOMER), account_status (PENDING, APPROVED, REJECTED), booking_status (PENDING, CONFIRMED, CANCELLED, COMPLETED), task_status (TODO, IN_PROGRESS, COMPLETED), payment_status (UNPAID, PARTIAL, PAID), transaction_status (PENDING, APPROVED, REJECTED), payment_method (BCA, DANA).
     - Tables: profiles, wedding_packages, bookings, wedding_projects, wedding_tasks, payments, payment_transactions, email_logs, activity_logs.
     - Constraints, foreign keys, indexes, RLS policies, audit log trigger, and rich seed data for packages and initial admin/customer accounts.
   - Provide .env.local.example and lib/supabase/client.ts & lib/supabase/server.ts helpers.
3. Graceful Demo Fallback:
   - Build lib/demo-store.ts that acts as a comprehensive mock database / local storage provider when Supabase credentials are not configured in .env.local. Ensure it stores and manipulates users, packages, bookings, projects, tasks, payments, and transactions seamlessly with persistence.
4. Auth & Approval Gatekeeper:
   - Auth context (lib/auth-context.tsx) and login/register pages (/login, /register).
   - Registering a new customer assigns role: 'CUSTOMER' and status: 'PENDING'.
   - Gatekeeper: Any customer with status 'PENDING' or 'REJECTED' accessing protected customer pages is blocked and redirected to /approval-pending.
   - Admin approval interface at /admin/dashboard/approvals allowing Admin to review, Approve, or Reject pending accounts.
5. Navigation & Landing Page:
   - Modern, responsive, high-aesthetic landing page at / with Hero, Package Highlights, Wedding planning timeline preview, Testimonials, CTA.
   - Global Role Switcher component visible on screen (or top banner) allowing immediate switching between:
     - Unauthenticated Guest
     - Pending Customer ("Dina & Dimas", status: PENDING) -> redirected to /approval-pending
     - Approved Customer ("Siti & Rizky", status: APPROVED) -> full access to customer portal
     - Admin ("Admin WEDMATE", role: ADMIN, status: APPROVED) -> full access to admin dashboard
6. Build Verification:
   - Run build command (e.g. npm run build) and ensure 0 compilation/TypeScript errors.
7. Write your handoff report to C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_foundation_1\handoff.md and send message back to orchestrator.
