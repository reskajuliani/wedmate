import { redirect } from 'next/navigation';

export default function AdminDashboardApprovalsRedirect() {
  redirect('/admin/approvals?tab=accounts');
}
