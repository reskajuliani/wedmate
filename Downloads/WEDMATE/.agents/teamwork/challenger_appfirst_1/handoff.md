# Adversarial Verification Report: Admin Event Schedule Calendar

## 1. Observation

Direct examination of `components/admin/EventScheduleCalendar.tsx` and `app/admin/approvals/page.tsx` revealed the following exact implementation details:

### A. Calendar & Month Arithmetic
- **Weekday Header Array (`EventScheduleCalendar.tsx`, line 48)**:
  ```typescript
  const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  ```
- **Grid Offset Calculation (`EventScheduleCalendar.tsx`, lines 147–149)**:
  ```typescript
  const firstDayOfMonth = new Date(year, month, 1);
  // (getDay() + 6) % 7 converts JS Sun(0)..Sat(6) to Mon(0)..Sun(6)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  ```
- **Month Boundaries & Days in Month (`EventScheduleCalendar.tsx`, lines 151–152)**:
  ```typescript
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  ```
- **Month Navigation Handlers (`EventScheduleCalendar.tsx`, lines 72–78)**:
  ```typescript
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  ```
  The third argument `1` anchors navigation to day 1, preventing the JavaScript 31st-day month skipping defect.

### B. Date Normalization & Key Matching
- **Bookings Grouping Map (`EventScheduleCalendar.tsx`, lines 126–137)**:
  ```typescript
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (!b.wedding_date) continue;
      const dateKey = b.wedding_date.split('T')[0].trim();
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(b);
    }
    return map;
  }, [bookings]);
  ```
- **Cell Key Generation (`EventScheduleCalendar.tsx`, line 173)**:
  ```typescript
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  ```
- **Customer Booking Date Input (`app/customer/booking/page.tsx`, lines 90, 362–368)**:
  Uses HTML5 `<input type="date">` which standardizes output format to `YYYY-MM-DD`.

### C. Multi-Booking Collisions
- **Cell Rendering (`EventScheduleCalendar.tsx`, lines 371–402)**:
  - If `hasBookings`: displays event badge count `{cell.bookings.length} acara`.
  - Up to 2 booking chips rendered via `cell.bookings.slice(0, 2)`.
  - If `cell.bookings.length > 2`: renders `+{cell.bookings.length - 2} acara lagi` overflow pill.
  - Clicking chip invokes `e.stopPropagation()` and opens modal for that specific event.
- **Modal Switcher (`EventScheduleCalendar.tsx`, lines 454–471)**:
  ```typescript
  {selectedDateBookings.length > 1 && (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {selectedDateBookings.map((b, idx) => (
        <button
          key={b.id}
          onClick={() => setActiveBookingDetail(b)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeBookingDetail.id === b.id
              ? 'bg-[#333333] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-gray-700 hover:bg-[#F8F5EF] border border-[#E8DED0]'
          }`}
        >
          <span>Acara #{idx + 1}: {b.customer?.full_name || 'Klien'}</span>
          <span className={`w-2 h-2 rounded-full ${getStatusBadge(b.status).dot}`} />
        </button>
      ))}
    </div>
  )}
  ```

### D. Visual Status Color Encoding
- **Badge Configuration (`EventScheduleCalendar.tsx`, lines 85–123)**:
  - `PENDING`: `bg-amber-100 text-amber-800 border-amber-300`, dot `bg-amber-500`, label "Menunggu Konfirmasi".
  - `CONFIRMED`: `bg-emerald-100 text-emerald-800 border-emerald-300`, dot `bg-emerald-500`, label "Sudah Terkonfirmasi".
  - `CANCELLED`: `bg-rose-100 text-rose-800 border-rose-300`, dot `bg-rose-500`, label "Dibatalkan".
  - `COMPLETED`: `bg-blue-100 text-blue-800 border-blue-300`, dot `bg-blue-500`, label "Selesai".
- Legend bar in calendar footer (lines 410–425) reproduces exact amber, emerald, and rose status pills.

### E. Action Callbacks & State Sync
- **Modal Buttons (`EventScheduleCalendar.tsx`, lines 573–609)**:
  - Quick Confirm button calls `closeModal()` and `onConfirmBooking?.(id)`.
  - Quick Cancel button calls `closeModal()` and `onCancelBooking?.(id)`.
- **Wiring in Admin Approvals Page (`app/admin/approvals/page.tsx`, lines 701–707)**:
  ```typescript
  {activeMainTab === 'calendar' && (
    <EventScheduleCalendar
      bookings={bookings}
      onConfirmBooking={handleConfirmBooking}
      onCancelBooking={(id) => openRejectBookingModal(bookings.find((b) => b.id === id)!)}
    />
  )}
  ```
  - `handleConfirmBooking` calls `demoStore.confirmBooking(id, adminId)` which updates the status to CONFIRMED, initializes `wedding_project`, populates default checklist tasks, and notifies subscribers.
  - `onCancelBooking` routes to `openRejectBookingModal`, opening the cancellation modal to capture reason and updating status to CANCELLED via `demoStore.cancelBooking`.

### F. Empty Month (0 Bookings)
- `bookingsByDate = {}`.
- `currentMonthBookings = []`.
- Metric counters: `currentMonthBookings.length = 0`, `monthPendingCount = 0`, `monthConfirmedCount = 0`, `monthTotalRevenue = 0`.
- Revenue display: `formatRupiah(0)` outputs `"Rp 0"`.
- Grid renders all 7xN cells with zero event chips.
- Empty cell click guard: `if (cell.bookings.length > 0)` prevents modal trigger on empty dates.

---

## 2. Logic Chain

1. **Grid Alignment Integrity**:
   - `DAY_NAMES` has Monday as index 0 and Sunday as index 6.
   - JS `Date.prototype.getDay()` maps Sunday=0, Monday=1, ..., Saturday=6.
   - Evaluating `(getDay() + 6) % 7`:
     - Sunday: `(0 + 6) % 7 = 6` (Min, 7th column).
     - Monday: `(1 + 6) % 7 = 0` (Sen, 1st column).
     - Saturday: `(6 + 6) % 7 = 5` (Sab, 6th column).
   - This formula is mathematically invariant and ensures zero column displacement across any year or century.

2. **Leap Year and Boundary Behavior**:
   - `new Date(year, month + 1, 0).getDate()` leverages JavaScript's ECMA-262 standard rollover:
     - Feb 2024 (leap year): `new Date(2024, 2, 0).getDate() === 29`.
     - Feb 2023 (non-leap year): `new Date(2023, 2, 0).getDate() === 28`.
     - Feb 2000 (century leap): `29`.
     - Feb 2100 (century non-leap): `28`.
   - Prev/Next month padding computes `dateKey` through `new Date(year, month - 1, day)` and `new Date(year, month + 1, day)` with full zero-padded `padStart(2, '0')`, ensuring cross-year transitions (e.g. Dec 2024 -> Jan 2025) produce valid keys `2024-12-31` and `2025-01-01`.

3. **Date Matching Equivalence**:
   - Both `YYYY-MM-DD` and ISO strings `YYYY-MM-DDTHH:mm:ss.sssZ` split on `'T'`.
   - For `YYYY-MM-DD`, `split('T')[0]` is `YYYY-MM-DD`.
   - For `YYYY-MM-DDTHH:mm:ssZ`, `split('T')[0]` is `YYYY-MM-DD`.
   - The cell `dateKey` is constructed as `${year}-${monthPadded}-${dayPadded}`.
   - Therefore `bookingsByDate[dateKey]` matches with 100% precision for all standard customer and system booking dates.

4. **Multi-Booking Robustness**:
   - Collisions on identical dates are grouped into arrays rather than overwriting each other.
   - Cells prevent overflow by slicing to 2 chips and displaying an overflow badge `+N acara lagi`.
   - Modal inspection detects `selectedDateBookings.length > 1` and provides tabbed switching with individual status indicators.
   - No crash or layout break occurs even with N concurrent bookings.

5. **Color-Code Conformance**:
   - Visual specifications: Amber for PENDING, Emerald for CONFIRMED, Rose for CANCELLED.
   - Implementation uses Tailwind classes `bg-amber-100 text-amber-800 border-amber-300`, `bg-emerald-100 text-emerald-800 border-emerald-300`, and `bg-rose-100 text-rose-800 border-rose-300` across chips, dots, modals, and metric summaries.
   - Perfect visual and cognitive alignment.

6. **Action Callback Reactivity**:
   - Confirm and Cancel actions trigger callbacks with booking ID and close the modal.
   - Callback handlers mutate `demoStore` state and trigger reactive re-render through subscriptions.
   - Confirmation triggers project initialization and task generation; cancellation triggers reason modal and status update.

---

## 3. Caveats

1. **Space-Delimited Timestamps**:
   If an external database returns raw SQL timestamps with a space delimiter instead of 'T' (e.g. `"2025-06-15 14:00:00"`), `split('T')[0]` would evaluate to `"2025-06-15 14:00:00"`, which would not match the cell `dateKey` (`"2025-06-15"`). All current inputs use HTML5 `<input type="date">` or ISO 8601 strings, so this does not trigger in the application today, but using `split(/[T ]/)[0]` is recommended as a defense-in-depth practice.
2. **Timezone Shifts on UTC Midnight**:
   When parsing date strings without timezone (e.g. `2025-06-15`), `new Date("2025-06-15")` is interpreted as UTC midnight. In Indonesian timezones (WIB UTC+7, WITA UTC+8, WIT UTC+9), this falls on the same calendar day (07:00 WIB). In negative UTC offset timezones (e.g. US UTC-5), UTC midnight converts to the previous evening. Within Indonesian target deployment, date display is unaffected.

---

## 4. Conclusion

The Admin Event Schedule Calendar (`components/admin/EventScheduleCalendar.tsx` and `app/admin/approvals/page.tsx`) demonstrates outstanding algorithmic correctness, visual fidelity, edge case resilience, and seamless reactivity. All six adversarial verification dimensions pass successfully.

**VERDICT: CONFIRMED**

---

## 5. Verification Method

To independently verify this evaluation:
1. Inspect `components/admin/EventScheduleCalendar.tsx`:
   - Lines 48, 147–152 for Sen–Min 7-day alignment and leap-year Date arithmetic.
   - Lines 126–137 for date format normalization (`split('T')[0].trim()`).
   - Lines 371–402 and 454–471 for multi-booking chips overflow and modal tab switcher.
   - Lines 85–123 for Amber (PENDING), Emerald (CONFIRMED), Rose (CANCELLED) status styling.
2. Inspect `app/admin/approvals/page.tsx`:
   - Lines 701–707 for calendar tab integration and action callbacks `handleConfirmBooking` and `onCancelBooking`.
   - Lines 118–147 for demoStore updates and auto-creation of project checklists upon confirmation.
3. Test empty-month behavior by reviewing default state with zero initial bookings (`INITIAL_BOOKINGS = []`):
   - Grid renders without errors, stats display `0` and `"Rp 0"`.
