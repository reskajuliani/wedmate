## 2026-11-04T10:59:33Z

You are a Worker subagent (worker_m2).
Working directory: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_m2\
Project root: C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\

Mandatory initial step:
Read C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\ORIGINAL_REQUEST.md, specifically the section dated 2026-11-04T10:34:22Z.
Also read C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\orchestrator_2\PROJECT.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Exclusive Write Ownership:
- `components/admin/EventScheduleCalendar.tsx` (create this component)
- `app/admin/approvals/page.tsx`

Tasks:
1. Create `components/admin/EventScheduleCalendar.tsx`:
   - Interactive monthly calendar grid for wedding reservations.
   - Controls to navigate previous month, next month, and return to today.
   - Month/Year title display (e.g. "November 2026").
   - 7-day header (Sen, Sel, Rab, Kam, Jum, Sab, Min).
   - Render day cells for the current month and pad empty start/end days.
   - Match bookings by `booking.wedding_date` (format YYYY-MM-DD).
   - Color indicators for booked dates:
     * Yellow/Amber: Status PENDING (Menunggu Konfirmasi) -> `bg-amber-100 text-amber-800 border-amber-300`, badge/dot `bg-amber-500`.
     * Green/Emerald: Status CONFIRMED (Sudah Terkonfirmasi) -> `bg-emerald-100 text-emerald-800 border-emerald-300`, badge/dot `bg-emerald-500`.
     * Red/Rose: Status CANCELLED (Dibatalkan) -> `bg-rose-100 text-rose-800 border-rose-300`, badge/dot `bg-rose-500`.
   - Date Click Details Modal / Drawer:
     * When clicking a date cell with bookings, open a modal displaying event details:
       - Nama Calon Pengantin (`booking.customer?.full_name || 'Klien WEDMATE'`)
       - Paket yang Dipilih (`booking.package?.name || '-'`)
       - Venue / Gedung (`booking.venue_name`, `booking.venue_address`)
       - Jumlah Tamu (`booking.guest_count` Tamu Undangan)
       - Nilai Reservasi (`formatRupiah(booking.total_price)`)
       - Status Reservasi (PENDING / CONFIRMED / CANCELLED)
       - Quick action buttons (Konfirmasi Booking / Batalkan Booking) delegating to parent handler callbacks.
   - Follow Modern Elegant Wedding palette: #C8A46A, #F8F5EF, #E8DED0, #333333.
2. In `app/admin/approvals/page.tsx`:
   - Expand `activeMainTab` state type to `'accounts' | 'bookings' | 'calendar'`.
   - Add the 3rd tab button in the header nav:
     `Tab 3: Kalender Jadwal Acara` with `<Calendar className="w-4 h-4 mr-2" />` icon.
   - Render `<EventScheduleCalendar bookings={bookings} onConfirmBooking={handleConfirmBooking} onCancelBooking={(id) => openRejectBookingModal(bookings.find(b => b.id === id)!)} />` when `activeMainTab === 'calendar'`.
3. Verify your implementation and ensure no syntax or compile errors.
4. Write a complete handoff report following the Handoff Protocol to:
   `C:\Users\LENOVO\.gemini\antigravity\scratch\WEDMATE\.agents\teamwork\worker_m2\handoff.md`
   and notify the orchestrator with send_message.
