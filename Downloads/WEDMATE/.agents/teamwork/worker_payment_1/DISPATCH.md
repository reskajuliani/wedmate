## 2026-11-03T15:23:51Z
You are Agent 3: Payment BCA/DANA & Reports Engine Specialist for WEDMATE.
Your metadata working directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_payment_1
Project root directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE

MANDATORY: Read the original user request before starting:
C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\ORIGINAL_REQUEST.md
Also review the project plan:
C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\orchestrator_1\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context & Existing Foundation:
- Next.js 15 App Router is set up with Tailwind wedding palette (Champagne Gold #C8A46A, Ivory #F8F5EF, Soft Beige #E8DED0, Dark Charcoal #333333) and Lucide icons.
- `lib/demo-store.ts` provides a singleton `demoStore` with reactive subscription `demoStore.subscribe(fn)` and methods: `getPayments`, `getTransactions`, `createTransaction`, `verifyTransaction`, `getPaymentSummary`.
- `lib/auth-context.tsx` provides `useAuth()` with `user`, `role`, `status`.

Your Deliverables:
1. Customer Payment Portal (`app/portal/payments/page.tsx`):
   - Payment summary for customer's confirmed bookings: Total Tagihan, Sudah Dibayar, Sisa Tagihan, status badge (UNPAID, PARTIAL, PAID).
   - Official Payment Accounts Display (MUST BE EXACT):
     - Bank BCA: `446 156 3613` (a/n WEDMATE INDONESIA) with one-click Copy button and bank logo/badge.
     - DANA: `085551124373` (a/n WEDMATE) with one-click Copy button and e-wallet badge.
   - Payment transfer proof upload modal/form:
     - Select payment/booking
     - Payment method: BCA or DANA
     - Transfer amount input (e.g. DP or Pelunasan)
     - File upload for transfer proof (supports JPG, PNG, PDF with live preview)
     - Optional transfer notes / sender bank info
   - Transaction history table for the customer with status badges (PENDING, APPROVED, REJECTED) and rejection notes if any.
2. Admin Payment Verification (`app/admin/payments/page.tsx`):
   - Transaction verification dashboard with tabs/filters: Semua, Menunggu Verifikasi (Pending), Disetujui (Approved), Ditolak (Rejected).
   - Display transaction details: Transaction number, Customer name, Booking/Package, Method (BCA/DANA), Amount in IDR, Transfer proof image with modal zoom/preview.
   - Manual Admin verification action buttons:
     - "Setujui Pembayaran" (Approve)
     - "Tolak Pembayaran" (Reject with reason input)
   - CRITICAL REQUIREMENT: Strict manual Admin verification (NO auto-approval).
   - CRITICAL REQUIREMENT: Atomic balance updates: When approved, calling `demoStore.verifyTransaction(txId, 'APPROVED', adminId)` atomically recalculates `amount_paid`, updates `remaining_balance = total_amount - amount_paid`, and updates payment status (`PARTIAL` or `PAID`).
3. Admin Reports & Data Export Engine (`app/admin/reports/page.tsx`):
   - Financial Analytics Overview:
     - Total Pendapatan Masuk (Total Approved Amount)
     - Total Menunggu Verifikasi (Pending Amount)
     - Total Piutang / Sisa Tagihan (Remaining Balance)
     - Total Booking & Conversion Rate
   - Payment Method Distribution (BCA vs DANA share with visual bars/cards).
   - Comprehensive Transaction History Table with search, date range, and payment method filter.
   - Data Export Feature:
     - "Export to CSV" button: triggers download of `wedmate-transaksi-[date].csv` with complete columns.
     - Print / Formatted Summary report view button.
4. Verification:
   - Ensure exact account numbers: BCA `446 156 3613` and DANA `085551124373`.
   - Ensure clean code, TypeScript types, responsive UI matching the wedding aesthetic.
   - Write your handoff report to `C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_payment_1\handoff.md` and send a completion message back.
