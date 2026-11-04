import { redirect } from 'next/navigation';

export default function PortalPaymentsRedirect() {
  redirect('/customer/payment');
}
