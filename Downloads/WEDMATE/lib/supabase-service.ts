import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { demoStore } from '@/lib/demo-store';
import {
  WeddingPackage,
  Booking,
  Payment,
  PaymentTransaction,
  UserProfile,
  WeddingProject,
  WeddingTask,
  TaskStatus,
  AccountStatus,
  BookingStatus,
  TransactionStatus,
  PaymentMethod,
} from '@/lib/types';

/**
 * Service to connect client and admin features directly to Supabase tables:
 * - `profiles`
 * - `wedding_packages`
 * - `bookings`
 * - `payments`
 * - `payment_transactions`
 * - `wedding_projects` & `wedding_tasks`
 * 
 * Provides graceful dual-mode synchronization with demoStore when Supabase is offline or unconfigured.
 */
export const supabaseService = {
  // -------------------------------------------------------------
  // PACKAGES (wedding_packages)
  // -------------------------------------------------------------
  async getPackages(onlyActive = false): Promise<WeddingPackage[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase.from('wedding_packages').select('*').order('price', { ascending: true });
        if (onlyActive) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            price: Number(d.price),
            estimated_guests: d.estimated_guests,
            description: d.description,
            features: Array.isArray(d.features) ? d.features : JSON.parse(d.features || '[]'),
            is_active: d.is_active,
            image_url: d.image_url,
            created_at: d.created_at,
            updated_at: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getPackages fallback to local store:', err);
      }
    }
    return demoStore.getPackages(onlyActive);
  },

  async savePackage(pkg: Omit<WeddingPackage, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<WeddingPackage> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        if (pkg.id) {
          const { data, error } = await supabase
            .from('wedding_packages')
            .update({
              name: pkg.name,
              slug: pkg.slug,
              price: pkg.price,
              estimated_guests: pkg.estimated_guests,
              description: pkg.description,
              features: pkg.features,
              is_active: pkg.is_active,
              image_url: pkg.image_url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pkg.id)
            .select()
            .single();

          if (!error && data) {
            demoStore.updatePackage(pkg.id, pkg);
            return {
              ...data,
              price: Number(data.price),
              features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
            };
          }
        } else {
          const { data, error } = await supabase
            .from('wedding_packages')
            .insert({
              name: pkg.name,
              slug: pkg.slug,
              price: pkg.price,
              estimated_guests: pkg.estimated_guests,
              description: pkg.description,
              features: pkg.features,
              is_active: pkg.is_active ?? true,
              image_url: pkg.image_url,
            })
            .select()
            .single();

          if (!error && data) {
            const saved: WeddingPackage = {
              ...data,
              price: Number(data.price),
              features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
            };
            demoStore.createPackage(saved);
            return saved;
          }
        }
      } catch (err) {
        console.warn('Supabase savePackage fallback:', err);
      }
    }

    if (pkg.id) {
      return demoStore.updatePackage(pkg.id, pkg);
    }
    return demoStore.createPackage(pkg as any);
  },

  async deletePackage(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error } = await supabase.from('wedding_packages').delete().eq('id', id);
        if (!error) {
          demoStore.deletePackage(id);
          return true;
        }
      } catch (err) {
        console.warn('Supabase deletePackage fallback:', err);
      }
    }
    demoStore.deletePackage(id);
    return true;
  },

  // -------------------------------------------------------------
  // BOOKINGS (bookings)
  // -------------------------------------------------------------
  async getBookings(customerId?: string): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase
          .from('bookings')
          .select('*, package:wedding_packages(*), customer:profiles(*)')
          .order('created_at', { ascending: false });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((b: any) => ({
            id: b.id,
            customer_id: b.customer_id,
            package_id: b.package_id,
            wedding_date: b.wedding_date,
            venue_name: b.venue_name,
            venue_address: b.venue_address,
            guest_count: b.guest_count,
            status: b.status,
            notes: b.notes,
            total_price: Number(b.total_price),
            created_at: b.created_at,
            updated_at: b.updated_at,
            package: b.package
              ? {
                  ...b.package,
                  price: Number(b.package.price),
                  features: Array.isArray(b.package.features) ? b.package.features : JSON.parse(b.package.features || '[]'),
                }
              : undefined,
            customer: b.customer || undefined,
          }));
        }
      } catch (err) {
        console.warn('Supabase getBookings fallback:', err);
      }
    }
    return demoStore.getBookings(customerId);
  },

  async createBooking(data: {
    customer_id: string;
    package_id: string;
    wedding_date: string;
    venue_name: string;
    venue_address: string;
    guest_count: number;
    notes?: string;
  }): Promise<Booking> {
    // Always sync with demoStore first to guarantee instant UI feedback
    const localBooking = demoStore.createBooking(data);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: dbBooking, error } = await supabase
          .from('bookings')
          .insert({
            id: localBooking.id,
            customer_id: data.customer_id,
            package_id: data.package_id,
            wedding_date: data.wedding_date,
            venue_name: data.venue_name,
            venue_address: data.venue_address,
            guest_count: data.guest_count,
            status: 'PENDING',
            notes: data.notes,
            total_price: localBooking.total_price,
          })
          .select('*, package:wedding_packages(*), customer:profiles(*)')
          .single();

        if (!error && dbBooking) {
          return {
            ...dbBooking,
            total_price: Number(dbBooking.total_price),
            package: dbBooking.package
              ? {
                  ...dbBooking.package,
                  price: Number(dbBooking.package.price),
                  features: Array.isArray(dbBooking.package.features) ? dbBooking.package.features : [],
                }
              : localBooking.package,
          };
        }
      } catch (err) {
        console.warn('Supabase createBooking sync error:', err);
      }
    }

    return localBooking;
  },

  async updateBookingStatus(id: string, status: BookingStatus, notes?: string): Promise<Booking> {
    const updated = demoStore.updateBookingStatus(id, status, notes);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('bookings')
          .update({
            status,
            notes: notes !== undefined ? notes : updated.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateBookingStatus sync error:', err);
      }
    }

    return updated;
  },

  // -------------------------------------------------------------
  // PAYMENTS & TRANSACTIONS (payments, payment_transactions)
  // -------------------------------------------------------------
  async getPayments(customerId?: string): Promise<Payment[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (customerId) {
          query = query.eq('customer_id', customerId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            customer_id: p.customer_id,
            invoice_number: p.invoice_number,
            total_amount: Number(p.total_amount),
            amount_paid: Number(p.amount_paid),
            remaining_balance: Number(p.remaining_balance),
            status: p.status,
            due_date: p.due_date,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getPayments fallback:', err);
      }
    }
    return demoStore.getPayments(customerId);
  },

  async getTransactions(customerId?: string): Promise<PaymentTransaction[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase
          .from('payment_transactions')
          .select('*, customer:profiles(*), payment:payments(*)')
          .order('created_at', { ascending: false });

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            payment_id: t.payment_id,
            customer_id: t.customer_id,
            transaction_number: t.transaction_number,
            payment_method: t.payment_method,
            amount: Number(t.amount),
            proof_url: t.proof_url,
            notes: t.notes,
            status: t.status,
            verified_by: t.verified_by,
            verified_at: t.verified_at,
            rejection_reason: t.rejection_reason,
            created_at: t.created_at,
            updated_at: t.updated_at,
            customer: t.customer || undefined,
            payment: t.payment ? { ...t.payment, total_amount: Number(t.payment.total_amount) } : undefined,
          }));
        }
      } catch (err) {
        console.warn('Supabase getTransactions fallback:', err);
      }
    }
    const local = demoStore.getTransactions();
    return customerId ? local.filter((t) => t.customer_id === customerId) : local;
  },

  async createTransaction(data: {
    payment_id: string;
    customer_id: string;
    payment_method: PaymentMethod;
    amount: number;
    proof_url: string;
    notes?: string;
  }): Promise<PaymentTransaction> {
    const localTx = demoStore.createTransaction(data);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('payment_transactions').insert({
          id: localTx.id,
          payment_id: data.payment_id,
          customer_id: data.customer_id,
          transaction_number: localTx.transaction_number,
          payment_method: data.payment_method,
          amount: data.amount,
          proof_url: data.proof_url,
          notes: data.notes,
          status: 'PENDING',
        });
      } catch (err) {
        console.warn('Supabase createTransaction sync error:', err);
      }
    }

    return localTx;
  },

  async verifyTransaction(
    txId: string,
    status: 'APPROVED' | 'REJECTED',
    adminId: string,
    rejectionReason?: string
  ): Promise<PaymentTransaction> {
    const verified = demoStore.verifyTransaction(txId, status, adminId, rejectionReason);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('payment_transactions')
          .update({
            status,
            verified_by: adminId,
            verified_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
            updated_at: new Date().toISOString(),
          })
          .eq('id', txId);

        // Update payment balance in Supabase if approved
        if (status === 'APPROVED' && verified.payment_id) {
          const payment = demoStore.getPayments().find((p) => p.id === verified.payment_id);
          if (payment) {
            await supabase
              .from('payments')
              .update({
                amount_paid: payment.amount_paid,
                remaining_balance: payment.remaining_balance,
                status: payment.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', verified.payment_id);
          }
        }
      } catch (err) {
        console.warn('Supabase verifyTransaction sync error:', err);
      }
    }

    return verified;
  },

  // -------------------------------------------------------------
  // PROFILES (profiles)
  // -------------------------------------------------------------
  async createProfile(data: {
    email: string;
    full_name: string;
    phone: string;
    wedding_date?: string;
    notes?: string;
  }): Promise<UserProfile> {
    // Generate valid UUIDv4 for PostgreSQL compatibility
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

    const profileData: UserProfile = {
      id,
      email: data.email.trim().toLowerCase(),
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      wedding_date: data.wedding_date || undefined,
      role: 'CUSTOMER',
      status: 'PENDING',
      approval_status: 'PENDING',
      notes: data.notes || 'Registrasi mandiri dari formulir web.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Immediate local cache update for 0ms reactivity
    demoStore.createUser(profileData);

    // Sync to Server API Registry for cross-device visibility (awaited)
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
          keepalive: true,
        });
      } catch (err) {
        console.warn('Sync /api/profiles error:', err);
      }
    }

    // Direct insertion into Supabase profiles database table
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        // NOTE: approval_status is a GENERATED ALWAYS column in PostgreSQL, so DO NOT include it in insert!
        const insertPayload: any = {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          phone: profileData.phone,
          role: profileData.role,
          status: profileData.status,
          notes: profileData.notes,
          wedding_date: profileData.wedding_date || null,
        };
        const { error } = await supabase.from('profiles').insert(insertPayload);
        if (error) {
          console.warn('Supabase createProfile insert error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase createProfile exception:', err);
      }
    }

    return profileData;
  },

  async getProfiles(role?: string): Promise<UserProfile[]> {
    // 1. Fetch from server API registry first (runs with Admin Client on server, bypassing RLS)
    let profilesFromApi: UserProfile[] = [];
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/profiles' + (role ? `?role=${role}` : ''));
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.profiles)) {
            profilesFromApi = json.profiles;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from /api/profiles:', err);
      }
    }

    // 2. Fetch directly from Supabase (if configured)
    let profilesFromSupabase: UserProfile[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (role) {
          query = query.eq('role', role);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          profilesFromSupabase = data.map((p: any) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            phone: p.phone,
            role: p.role,
            status: p.status || p.approval_status || 'PENDING',
            approval_status: p.approval_status || p.status || 'PENDING',
            wedding_date: p.wedding_date,
            notes: p.notes,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getProfiles fallback:', err);
      }
    }

    // 3. Merge Server API, Supabase, and local demoStore profiles
    const localUsers = demoStore.getUsers().filter((u) => !role || u.role === role);
    const map = new Map<string, UserProfile>();
    profilesFromApi.forEach((p) => {
      if (p.email) map.set(p.email.toLowerCase(), p);
    });
    profilesFromSupabase.forEach((p) => {
      if (p.email && !map.has(p.email.toLowerCase())) {
        map.set(p.email.toLowerCase(), p);
      }
    });
    localUsers.forEach((u) => {
      if (u.email && !map.has(u.email.toLowerCase())) {
        map.set(u.email.toLowerCase(), u);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  },

  async updateProfileStatus(userId: string, status: AccountStatus, notes?: string): Promise<UserProfile> {
    const updated = demoStore.updateUserStatus(userId, status, notes);

    // Sync to Server API Registry (uses Admin Client on server to update Supabase directly)
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email: updated.email, status, notes }),
          keepalive: true,
        });
      } catch (err) {
        console.warn('Sync /api/profiles PATCH error:', err);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const updateData: any = {
          status,
          notes: notes !== undefined ? notes : updated.notes,
          updated_at: new Date().toISOString(),
        };
        if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          await supabase.from('profiles').update(updateData).eq('id', userId);
        } else if (updated.email) {
          await supabase.from('profiles').update(updateData).eq('email', updated.email.toLowerCase());
        }
      } catch (err) {
        console.warn('Supabase updateProfileStatus sync error:', err);
      }
    }

    return updated;
  },

  // -------------------------------------------------------------
  // PROJECTS & TASKS (wedding_projects, wedding_tasks)
  // -------------------------------------------------------------
  async getProjects(customerId?: string): Promise<WeddingProject[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        let query = supabase.from('wedding_projects').select('*, tasks:wedding_tasks(*)').order('created_at', { ascending: false });
        if (customerId) {
          query = query.eq('customer_id', customerId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((p: any) => ({
            id: p.id,
            booking_id: p.booking_id,
            customer_id: p.customer_id,
            title: p.title,
            wedding_date: p.wedding_date,
            progress_percent: Number(p.progress_percent || 0),
            notes: p.notes,
            created_at: p.created_at,
            updated_at: p.updated_at,
            tasks: (p.tasks || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
          }));
        }
      } catch (err) {
        console.warn('Supabase getProjects fallback:', err);
      }
    }
    return demoStore.getProjects(customerId);
  },

  async getTasksByProjectId(projectId: string): Promise<WeddingTask[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('wedding_tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getTasksByProjectId fallback:', err);
      }
    }
    return demoStore.getTasksByProjectId(projectId);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<WeddingTask> {
    const updated = demoStore.updateTaskStatus(taskId, status);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from('wedding_tasks')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId);
      } catch (err) {
        console.warn('Supabase updateTaskStatus sync error:', err);
      }
    }
    return updated;
  },

  async createTask(task: Omit<WeddingTask, 'id' | 'created_at' | 'updated_at'>): Promise<WeddingTask> {
    const created = demoStore.createTask(task);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('wedding_tasks').insert({
          id: created.id,
          project_id: created.project_id,
          title: created.title,
          description: created.description,
          category: created.category,
          status: created.status,
          due_date: created.due_date,
          sort_order: created.sort_order,
        });
      } catch (err) {
        console.warn('Supabase createTask sync error:', err);
      }
    }
    return created;
  },

  async deleteTask(taskId: string): Promise<void> {
    demoStore.deleteTask(taskId);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('wedding_tasks').delete().eq('id', taskId);
      } catch (err) {
        console.warn('Supabase deleteTask sync error:', err);
      }
    }
  },
};
