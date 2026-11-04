export type UserRole = 'ADMIN' | 'CUSTOMER';
export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'BCA' | 'DANA';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  approval_status: AccountStatus;
  wedding_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WeddingPackage {
  id: string;
  name: string;
  slug: string;
  price: number;
  estimated_guests: number;
  description: string;
  features: string[];
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  package_id: string;
  wedding_date: string;
  venue_name: string;
  venue_address: string;
  guest_count: number;
  status: BookingStatus;
  notes?: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  customer?: UserProfile;
  package?: WeddingPackage;
}

export interface WeddingProject {
  id: string;
  booking_id: string;
  customer_id: string;
  title: string;
  wedding_date: string;
  progress_percent: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  tasks?: WeddingTask[];
  booking?: Booking;
}

export interface WeddingTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  category: 'Venue' | 'Catering' | 'Attire' | 'Decoration' | 'Documentation' | 'Entertainment' | 'Invitation' | 'Legal' | 'Other';
  status: TaskStatus;
  due_date?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  status: PaymentStatus;
  due_date?: string;
  created_at: string;
  updated_at: string;
  booking?: Booking;
  transactions?: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  customer_id: string;
  transaction_number: string;
  payment_method: PaymentMethod;
  amount: number;
  proof_url: string;
  notes?: string;
  status: TransactionStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  payment?: Payment;
  customer?: UserProfile;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_name: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  payload?: Record<string, any>;
  error_message?: string;
  sent_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
  user?: UserProfile;
}

export interface OfficialPaymentAccount {
  method: PaymentMethod;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string[];
}

export const OFFICIAL_PAYMENT_ACCOUNTS: Record<PaymentMethod, OfficialPaymentAccount> = {
  BCA: {
    method: 'BCA',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '446 156 3613',
    accountHolder: 'WEDMATE INDONESIA',
    instructions: [
      'Gunakan ATM, m-BCA, atau KlikBCA',
      'Transfer ke rekening BCA 446 156 3613 a/n WEDMATE INDONESIA',
      'Simpan bukti transfer dan unggah melalui portal pembayaran'
    ]
  },
  DANA: {
    method: 'DANA',
    bankName: 'DANA E-Wallet',
    accountNumber: '085551124373',
    accountHolder: 'WEDMATE',
    instructions: [
      'Buka aplikasi DANA',
      'Kirim uang ke nomor 085551124373 a/n WEDMATE',
      'Screenshot bukti transaksi sukses dan unggah melalui portal pembayaran'
    ]
  }
};
