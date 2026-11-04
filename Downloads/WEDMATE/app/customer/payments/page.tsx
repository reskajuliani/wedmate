import { redirect } from 'next/navigation';

export default function CustomerPaymentsRedirect() {
  redirect('/customer/payment');
}
