import { redirect } from 'next/navigation';

export default function AdminBookingsRedirect() {
  redirect('/admin/approvals?tab=bookings');
}
