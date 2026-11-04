-- =====================================================================
-- WEDMATE: Wedding Organizer CRM & Booking Management Platform
-- Complete Database Schema, RLS Policies, Audit Triggers & Seed Data
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. ENUM TYPES
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('BCA', 'DANA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- 2. TABLES DEFINITION
-- =====================================================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  status account_status NOT NULL DEFAULT 'PENDING',
  approval_status account_status GENERATED ALWAYS AS (status) STORED,
  wedding_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: wedding_packages
CREATE TABLE IF NOT EXISTS wedding_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
  estimated_guests INTEGER NOT NULL CHECK (estimated_guests > 0),
  description TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  package_id UUID NOT NULL REFERENCES wedding_packages(id) ON DELETE RESTRICT,
  wedding_date DATE NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  status booking_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  total_price NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: wedding_projects
CREATE TABLE IF NOT EXISTS wedding_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (progress_percent BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: wedding_tasks
CREATE TABLE IF NOT EXISTS wedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES wedding_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  status task_status NOT NULL DEFAULT 'TODO',
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  invoice_number TEXT UNIQUE NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
  amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  remaining_balance NUMERIC(15, 2) NOT NULL CHECK (remaining_balance >= 0),
  status payment_status NOT NULL DEFAULT 'UNPAID',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  transaction_number TEXT UNIQUE NOT NULL,
  payment_method payment_method NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  proof_url TEXT NOT NULL,
  notes TEXT,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payload JSONB,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 3. INDEXES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON wedding_packages(slug);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON wedding_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON wedding_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON wedding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_logs(user_id);

-- =====================================================================
-- 4. TRIGGERS & FUNCTIONS
-- =====================================================================

-- Updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_packages_updated_at
BEFORE UPDATE ON wedding_packages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON wedding_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON wedding_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atomic Payment Recalculation on Transaction Approval
CREATE OR REPLACE FUNCTION recalculate_payment_on_transaction_verify()
RETURNS TRIGGER AS $$
DECLARE
  v_total_verified NUMERIC(15, 2);
  v_payment_total NUMERIC(15, 2);
  v_new_status payment_status;
BEGIN
  IF (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED')) OR
     (OLD.status = 'APPROVED' AND NEW.status != 'APPROVED') THEN
    
    -- Calculate total approved payments for this payment record
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_verified
    FROM payment_transactions
    WHERE payment_id = NEW.payment_id AND status = 'APPROVED';

    -- Retrieve total bill
    SELECT total_amount INTO v_payment_total
    FROM payments WHERE id = NEW.payment_id;

    -- Determine new status
    IF v_total_verified >= v_payment_total THEN
      v_new_status := 'PAID';
    ELSIF v_total_verified > 0 THEN
      v_new_status := 'PARTIAL';
    ELSE
      v_new_status := 'UNPAID';
    END IF;

    -- Update parent payment record atomically
    UPDATE payments
    SET amount_paid = v_total_verified,
        remaining_balance = GREATEST(v_payment_total - v_total_verified, 0),
        status = v_new_status,
        updated_at = NOW()
    WHERE id = NEW.payment_id;

    -- Write activity log
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.verified_by,
      'TRANSACTION_VERIFIED',
      'payment_transactions',
      NEW.id::text,
      json_build_object(
        'payment_id', NEW.payment_id,
        'status', NEW.status,
        'amount', NEW.amount,
        'total_verified', v_total_verified,
        'payment_status', v_new_status
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recalc_payment
AFTER UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION recalculate_payment_on_transaction_verify();

-- Auto-recalculate project progress percent when tasks change
CREATE OR REPLACE FUNCTION recalculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_proj_id UUID;
  v_total_tasks INTEGER;
  v_completed_tasks INTEGER;
  v_percent NUMERIC(5, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_proj_id := OLD.project_id;
  ELSE
    v_proj_id := NEW.project_id;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'COMPLETED')
  INTO v_total_tasks, v_completed_tasks
  FROM wedding_tasks
  WHERE project_id = v_proj_id;

  IF v_total_tasks > 0 THEN
    v_percent := ROUND((v_completed_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100, 2);
  ELSE
    v_percent := 0.00;
  END IF;

  UPDATE wedding_projects
  SET progress_percent = v_percent,
      updated_at = NOW()
  WHERE id = v_proj_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_recalc_project_progress
AFTER INSERT OR UPDATE OR DELETE ON wedding_tasks
FOR EACH ROW EXECUTE FUNCTION recalculate_project_progress();

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'APPROVED'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is approved customer
CREATE OR REPLACE FUNCTION is_approved_customer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'CUSTOMER' AND (status = 'APPROVED' OR approval_status = 'APPROVED')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent non-admins from mutating role or status (anti-privilege escalation trigger)
CREATE OR REPLACE FUNCTION protect_profile_privileges()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() = NEW.id AND NOT is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Non-admin users cannot alter role';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Non-admin users cannot alter status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_protect_profile_privileges
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_profile_privileges();

-- Profiles: Public can ONLY create pending customer profile (NO privilege escalation)
CREATE POLICY "Public can create pending profile" ON profiles
  FOR INSERT WITH CHECK (role = 'CUSTOMER' AND status = 'PENDING');

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

-- Users can update only non-privilege profile fields (strictly guarded by trigger & check)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Wedding Packages: Anyone can view active, Admin can manage all
CREATE POLICY "Anyone can view active packages" ON wedding_packages
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admin can insert packages" ON wedding_packages
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update packages" ON wedding_packages
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete packages" ON wedding_packages
  FOR DELETE USING (is_admin());

-- Bookings: Customers can view own, Approved customers can insert, Admin can view/update all
CREATE POLICY "Customers can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Approved customers can insert booking" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND is_approved_customer()
  );

CREATE POLICY "Admin can update bookings" ON bookings
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete bookings" ON bookings
  FOR DELETE USING (is_admin());

-- Wedding Projects & Tasks
CREATE POLICY "View projects" ON wedding_projects
  FOR SELECT USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Admin manage projects" ON wedding_projects
  FOR ALL USING (is_admin());

CREATE POLICY "View tasks" ON wedding_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wedding_projects p
      WHERE p.id = wedding_tasks.project_id AND (p.customer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Approved customers can insert tasks" ON wedding_tasks
  FOR INSERT WITH CHECK (
    is_approved_customer() AND EXISTS (
      SELECT 1 FROM wedding_projects p
      WHERE p.id = wedding_tasks.project_id AND p.customer_id = auth.uid()
    )
  );

CREATE POLICY "Approved customers can update tasks" ON wedding_tasks
  FOR UPDATE USING (
    is_approved_customer() AND EXISTS (
      SELECT 1 FROM wedding_projects p
      WHERE p.id = wedding_tasks.project_id AND p.customer_id = auth.uid()
    )
  );

CREATE POLICY "Approved customers can delete tasks" ON wedding_tasks
  FOR DELETE USING (
    is_approved_customer() AND EXISTS (
      SELECT 1 FROM wedding_projects p
      WHERE p.id = wedding_tasks.project_id AND p.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage tasks" ON wedding_tasks
  FOR ALL USING (is_admin());

-- Payments & Transactions
CREATE POLICY "View payments" ON payments
  FOR SELECT USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Admin manage payments" ON payments
  FOR ALL USING (is_admin());

CREATE POLICY "View transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Approved customers can insert transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = customer_id AND is_approved_customer());

CREATE POLICY "Admin can update transactions" ON payment_transactions
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete transactions" ON payment_transactions
  FOR DELETE USING (is_admin());

-- Email & Activity logs
CREATE POLICY "Admin can view logs" ON email_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admin can view activity" ON activity_logs FOR SELECT USING (is_admin());

-- =====================================================================
-- 6. SEED DATA
-- =====================================================================

-- Seed Profiles (Initial Administrator Only)
INSERT INTO profiles (id, email, full_name, phone, role, status, wedding_date, notes)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'admin@wedmate.id',
    'Admin WEDMATE',
    '081234567890',
    'ADMIN',
    'APPROVED',
    NULL,
    'Super administrator account'
  )
ON CONFLICT (email) DO NOTHING;

-- Seed Wedding Packages (Public Catalog)
INSERT INTO wedding_packages (id, name, slug, price, estimated_guests, description, features, is_active)
VALUES
  (
    'p0000000-0000-0000-0000-000000000001',
    'Intimate Romance',
    'intimate-romance',
    25000000,
    100,
    'Paket pernikahan intimate dengan sentuhan hangat, privat, dan penuh estetika untuk keluarga dan sahabat terdekat.',
    '["Wedding Organizer On-the-Day (6 Crew)", "Master of Ceremony (MC) Profesional", "Dekorasi Akad/Pemberkatan & Pelaminan Minimalis", "Sound System 3000 Watt + Akustik Solo", "Dokumentasi 1 Fotografer & 1 Videografer (Highlight Video & All Softfiles)", "Buku Tamu Eksklusif + Kotak Angpau", "Konsultasi Rundown & Timeline Pernikahan"]'::jsonb,
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'Classic Elegance',
    'classic-elegance',
    55000000,
    300,
    'Pilihan favorit pengantin modern: layanan komprehensif dari perencanaan hingga eksekusi hari H dengan estetika champagne gold.',
    '["Full Planning & Wedding Day Coordination (8 Crew)", "Master of Ceremony (MC) & Live Acoustic Band", "Dekorasi Pelaminan 8-10 Meter & Lorong Masuk Floral", "Sound System 5000 Watt + Lighting Basic", "Dokumentasi 2 Fotografer & 2 Videografer + Teaser 1 Menit & Cinematic Movie", "Make Up & Busana Pengantin (Akad + Resepsi)", "Katering Prasmanan 300 Pax + 3 Pilihan Stall Populer", "Digital Guestbook & Undangan Website Interaktif"]'::jsonb,
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    'Royal Grandeur',
    'royal-grandeur',
    95000000,
    600,
    'Kemegahan ballroom bintang lima dengan tim WO terpadu, orkestra, dan dekorasi mewah berkelas.',
    '["Dedicated Wedding Director + 12 Professional Crew", "MC Ternama & Mini Chamber Orchestra / Full Band", "Dekorasi Grand Ballroom Mewah (Fresh Flowers Import)", "Lighting Full Stage Ambience + Dry Ice / Smoke Machine Effect", "Dokumentasi Lengkap (Drone 4K, 3 Kamera, Same-Day Edit)", "Make Up Artist Ternama + 2 Busana Pengantin & 4 Seragam Ibu", "Katering 600 Pax + 6 Food Stalls Premium", "VIP Concierge & Butler Service untuk Pengantin & Orang Tua"]'::jsonb,
    true
  ),
  (
    'p0000000-0000-0000-0000-000000000004',
    'Luxury Heritage',
    'luxury-heritage',
    150000000,
    1000,
    'Perpaduan sakral tradisi adat nusantara dengan kemewahan modern tanpa cela untuk 1.000 tamu undangan.',
    '["Full Custom Wedding Production & Director + 16 Crew", "Pemandu Adat Senior & Rias Pengantin Tradisional Pakem", "Dekorasi Pelaminan Adat Kolosal dengan Bunga Segar Mewah", "Sound System 10000 Watt & Professional Lighting Show", "Dokumentasi Sinematik Cinema Grade (Multi-Camera + Drone + Live Stream YouTube)", "Busana Pengantin Adat & Modern Lengkap dengan Keluarga Inti", "Katering 1000 Pax + 10 Gourmet Stalls", "Akomodasi Hotel Bintang 5 untuk Pengantin & Keluarga"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- NOTE: All operational tables (bookings, wedding_projects, wedding_tasks, payments, payment_transactions, email_logs, activity_logs)
-- start 100% CLEAN (Zero-Mock Data) in accordance with the Zero-Trust Architecture.

