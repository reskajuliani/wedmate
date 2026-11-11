import {
  UserProfile,
  WeddingPackage,
  Booking,
  WeddingProject,
  WeddingTask,
  Payment,
  PaymentTransaction,
  ActivityLog,
  AccountStatus,
  BookingStatus,
  TaskStatus,
  TransactionStatus,
  PaymentStatus,
  PaymentMethod,
} from './types';

export interface DemoDatabaseState {
  users: UserProfile[];
  packages: WeddingPackage[];
  bookings: Booking[];
  projects: WeddingProject[];
  tasks: WeddingTask[];
  payments: Payment[];
  transactions: PaymentTransaction[];
  activityLogs: ActivityLog[];
}

const STORAGE_KEY = 'wedmate_appfirst_portal_v5';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
}

// Initial Seed Data - ZERO MOCK DATA STRATEGY: Only base system admin seeded
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@wedmate.id',
    full_name: 'Admin WEDMATE',
    phone: '081234567890',
    role: 'ADMIN',
    status: 'APPROVED',
    approval_status: 'APPROVED',
    notes: 'Super administrator platform WEDMATE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const INITIAL_PACKAGES: WeddingPackage[] = [
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    name: 'Intimate Romance',
    slug: 'intimate-romance',
    price: 25000000,
    estimated_guests: 100,
    description: 'Paket pernikahan intimate dengan sentuhan hangat, privat, dan penuh estetika untuk keluarga dan sahabat terdekat.',
    features: [
      'Wedding Organizer On-the-Day (6 Crew Profesional)',
      'Master of Ceremony (MC) Profesional Pernikahan',
      'Dekorasi Akad/Pemberkatan & Pelaminan Minimalis Estetik',
      'Sound System 3000 Watt + Akustik Solo',
      'Dokumentasi 1 Fotografer & 1 Videografer (Highlight & All Softfiles)',
      'Buku Tamu Eksklusif + Kotak Angpau Mewah',
      'Konsultasi Rundown, Checklist & Timeline Pernikahan',
    ],
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    name: 'Classic Elegance',
    slug: 'classic-elegance',
    price: 55000000,
    estimated_guests: 300,
    description: 'Pilihan favorit pengantin modern: layanan komprehensif dari perencanaan hingga eksekusi hari H dengan estetika champagne gold.',
    features: [
      'Full Planning & Wedding Day Coordination (8 Crew Profesional)',
      'Master of Ceremony (MC) & Live Acoustic Band 4 Pemain',
      'Dekorasi Pelaminan 8-10 Meter & Lorong Masuk Floral Elegan',
      'Sound System 5000 Watt + Lighting Basic Ambience',
      'Dokumentasi 2 Fotografer & 2 Videografer (Teaser & Cinematic Movie)',
      'Make Up Artist Pengantin & 2 Ibu + Busana Akad & Resepsi',
      'Katering Prasmanan 300 Pax + 3 Pilihan Stall Populer',
      'Digital Guestbook & Undangan Website Interaktif',
    ],
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    name: 'Royal Grandeur',
    slug: 'royal-grandeur',
    price: 95000000,
    estimated_guests: 600,
    description: 'Kemegahan ballroom bintang lima dengan tim WO terpadu, orkestra, dan dekorasi mewah berkelas.',
    features: [
      'Dedicated Wedding Director + 12 Professional Crew Handal',
      'MC Ternama & Mini Chamber Orchestra / Full Band',
      'Dekorasi Grand Ballroom Mewah (Bunga Segar Impor Penuh)',
      'Lighting Full Stage Ambience + Dry Ice / Smoke Machine Effect',
      'Dokumentasi Lengkap Cinema Grade (Drone 4K, 3 Kamera, Same-Day Edit)',
      'Make Up Artist Ternama + 2 Busana Pengantin & 4 Seragam Ibu',
      'Katering 600 Pax + 6 Food Stalls Premium Pilihan',
      'VIP Concierge & Butler Service untuk Pengantin & Kedua Orang Tua',
    ],
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    name: 'Luxury Heritage',
    slug: 'luxury-heritage',
    price: 150000000,
    estimated_guests: 1000,
    description: 'Perpaduan sakral tradisi adat nusantara dengan kemewahan modern tanpa cela untuk 1.000 tamu undangan.',
    features: [
      'Full Custom Wedding Production & Director + 16 Crew',
      'Pemandu Adat Senior & Rias Pengantin Tradisional Pakem',
      'Dekorasi Pelaminan Adat Kolosal dengan Bunga Segar Mewah 16 Meter',
      'Sound System 10000 Watt & Professional Lighting Show',
      'Dokumentasi Sinematik Cinema Grade (Multi-Camera + Drone + Live Stream)',
      'Busana Pengantin Adat & Modern Lengkap dengan Keluarga Inti',
      'Katering 1000 Pax + 10 Gourmet Stalls Nusantara & Western',
      'Akomodasi Hotel Bintang 5 untuk Pengantin & Keluarga Besar',
    ],
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=800&q=80',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const INITIAL_BOOKINGS: Booking[] = [];
const INITIAL_PROJECTS: WeddingProject[] = [];
const INITIAL_TASKS: WeddingTask[] = [];
const INITIAL_PAYMENTS: Payment[] = [];
const INITIAL_TRANSACTIONS: PaymentTransaction[] = [];
const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

class DemoStore {
  private state: DemoDatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private loadState(): DemoDatabaseState {
    if (!this.isBrowser()) {
      return {
        users: [...INITIAL_USERS],
        packages: [...INITIAL_PACKAGES],
        bookings: [...INITIAL_BOOKINGS],
        projects: [...INITIAL_PROJECTS],
        tasks: [...INITIAL_TASKS],
        payments: [...INITIAL_PAYMENTS],
        transactions: [...INITIAL_TRANSACTIONS],
        activityLogs: [...INITIAL_ACTIVITY_LOGS],
      };
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedUsers: UserProfile[] = parsed.users || [...INITIAL_USERS];
        const adminIndex = loadedUsers.findIndex((u) => u.role === 'ADMIN' || u.email === 'admin@wedmate.id');
        if (adminIndex === -1) {
          loadedUsers.unshift({ ...INITIAL_USERS[0] });
        } else {
          loadedUsers[adminIndex] = {
            ...INITIAL_USERS[0],
            ...loadedUsers[adminIndex],
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'ADMIN',
            status: 'APPROVED',
            approval_status: 'APPROVED',
          };
        }
        return {
          users: loadedUsers,
          packages: parsed.packages || [...INITIAL_PACKAGES],
          bookings: parsed.bookings || [...INITIAL_BOOKINGS],
          projects: parsed.projects || [...INITIAL_PROJECTS],
          tasks: parsed.tasks || [...INITIAL_TASKS],
          payments: parsed.payments || [...INITIAL_PAYMENTS],
          transactions: parsed.transactions || [...INITIAL_TRANSACTIONS],
          activityLogs: parsed.activityLogs || [...INITIAL_ACTIVITY_LOGS],
        };
      }
    } catch (e) {
      console.warn('Gagal membaca demo store dari localStorage, fallback ke seed default', e);
    }

    return {
      users: [...INITIAL_USERS],
      packages: [...INITIAL_PACKAGES],
      bookings: [...INITIAL_BOOKINGS],
      projects: [...INITIAL_PROJECTS],
      tasks: [...INITIAL_TASKS],
      payments: [...INITIAL_PAYMENTS],
      transactions: [...INITIAL_TRANSACTIONS],
      activityLogs: [...INITIAL_ACTIVITY_LOGS],
    };
  }

  private saveState(): void {
    if (this.isBrowser()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Gagal menyimpan demo store ke localStorage', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error notifying demo store listener', err);
      }
    });
  }

  public reset(): void {
    this.state = {
      users: [...INITIAL_USERS],
      packages: [...INITIAL_PACKAGES],
      bookings: [...INITIAL_BOOKINGS],
      projects: [...INITIAL_PROJECTS],
      tasks: [...INITIAL_TASKS],
      payments: [...INITIAL_PAYMENTS],
      transactions: [...INITIAL_TRANSACTIONS],
      activityLogs: [...INITIAL_ACTIVITY_LOGS],
    };
    this.saveState();
  }

  // ================= USERS / PROFILES =================
  public getUsers(): UserProfile[] {
    return [...this.state.users];
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    if (clean === 'admin' || clean.startsWith('admin@') || clean.includes('admin')) {
      const admin = this.state.users.find((u) => u.role === 'ADMIN' || u.email === 'admin@wedmate.id');
      if (admin) return admin;
      return INITIAL_USERS[0];
    }
    return this.state.users.find((u) => (u.email || '').trim().toLowerCase() === clean);
  }

  public createUser(user: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string }): UserProfile {
    const newUser: UserProfile = {
      ...user,
      approval_status: user.approval_status || user.status || 'PENDING',
      status: user.status || user.approval_status || 'PENDING',
      id: user.id || generateUUID(),
      created_at: (user as any).created_at || new Date().toISOString(),
      updated_at: (user as any).updated_at || new Date().toISOString(),
    };
    // Ensure we don't duplicate existing user with the same id or email
    const existingIndex = this.state.users.findIndex((u) => u.id === newUser.id || (u.email && newUser.email && u.email.toLowerCase() === newUser.email.toLowerCase()));
    if (existingIndex >= 0) {
      this.state.users[existingIndex] = { ...this.state.users[existingIndex], ...newUser };
    } else {
      this.state.users.push(newUser);
    }
    this.addActivity({
      action: 'USER_REGISTERED',
      entity_type: 'profiles',
      entity_id: newUser.id,
      details: { email: newUser.email, name: newUser.full_name, role: newUser.role, status: newUser.status },
    });
    this.saveState();
    return newUser;
  }

  public updateUserStatus(id: string, status: AccountStatus, reason?: string): UserProfile {
    let userIndex = this.state.users.findIndex((u) => u.id === id || (u.email && u.email.toLowerCase() === id.toLowerCase()));
    if (userIndex === -1) {
      const isEmail = id.includes('@');
      const newUser: UserProfile = {
        id: isEmail ? generateUUID() : id,
        email: isEmail ? id.toLowerCase() : '',
        full_name: 'Calon Pengantin',
        phone: '',
        role: 'CUSTOMER',
        status,
        approval_status: status,
        notes: reason || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.users.push(newUser);
      userIndex = this.state.users.length - 1;
    }

    const updated = {
      ...this.state.users[userIndex],
      status,
      approval_status: status,
      updated_at: new Date().toISOString(),
      notes: reason ? `${this.state.users[userIndex].notes || ''} [Alasan: ${reason}]`.trim() : this.state.users[userIndex].notes,
    };
    this.state.users[userIndex] = updated;

    this.addActivity({
      action: `USER_${status}`,
      entity_type: 'profiles',
      entity_id: updated.id,
      details: { email: updated.email, new_status: status, reason },
    });

    this.saveState();
    return updated;
  }

  // ================= PACKAGES =================
  public getPackages(onlyActive: boolean = false): WeddingPackage[] {
    if (onlyActive) {
      return this.state.packages.filter((p) => p.is_active);
    }
    return [...this.state.packages];
  }

  public getPackageById(id: string): WeddingPackage | undefined {
    return this.state.packages.find((p) => p.id === id);
  }

  public getPackageBySlug(slug: string): WeddingPackage | undefined {
    return this.state.packages.find((p) => p.slug === slug);
  }

  public createPackage(pkg: Omit<WeddingPackage, 'id' | 'created_at' | 'updated_at'>): WeddingPackage {
    const newPkg: WeddingPackage = {
      ...pkg,
      id: `p${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.packages.push(newPkg);
    this.saveState();
    return newPkg;
  }

  public updatePackage(id: string, updates: Partial<WeddingPackage>): WeddingPackage {
    const index = this.state.packages.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Package not found');
    const updated = {
      ...this.state.packages[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.state.packages[index] = updated;
    this.saveState();
    return updated;
  }

  public deletePackage(id: string): void {
    this.state.packages = this.state.packages.filter((p) => p.id !== id);
    this.saveState();
  }

  // ================= BOOKINGS =================
  public getBookings(customerId?: string): Booking[] {
    let list = this.state.bookings;
    if (customerId) {
      list = list.filter((b) => b.customer_id === customerId);
    }
    return list.map((b) => ({
      ...b,
      customer: this.getUserById(b.customer_id),
      package: this.getPackageById(b.package_id),
    }));
  }

  public getBookingById(id: string): Booking | undefined {
    const b = this.state.bookings.find((item) => item.id === id);
    if (!b) return undefined;
    return {
      ...b,
      customer: this.getUserById(b.customer_id),
      package: this.getPackageById(b.package_id),
    };
  }

  public createBooking(data: {
    customer_id: string;
    package_id: string;
    wedding_date: string;
    venue_name: string;
    venue_address: string;
    guest_count: number;
    notes?: string;
  }): Booking {
    const pkg = this.getPackageById(data.package_id);
    if (!pkg) throw new Error('Package not found');

    const newBooking: Booking = {
      id: generateUUID(),
      customer_id: data.customer_id,
      package_id: data.package_id,
      wedding_date: data.wedding_date,
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      guest_count: data.guest_count,
      status: 'PENDING',
      notes: data.notes,
      total_price: pkg.price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.bookings.push(newBooking);

    this.addActivity({
      action: 'BOOKING_CREATED',
      entity_type: 'bookings',
      entity_id: newBooking.id,
      details: { customer_id: data.customer_id, package_name: pkg.name, total: pkg.price },
    });

    this.saveState();
    return {
      ...newBooking,
      customer: this.getUserById(newBooking.customer_id),
      package: pkg,
    };
  }

  public updateBookingStatus(id: string, status: BookingStatus, notes?: string): Booking {
    const index = this.state.bookings.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Booking not found');

    const booking = this.state.bookings[index];
    booking.status = status;
    if (notes !== undefined) {
      booking.notes = notes;
    }
    booking.updated_at = new Date().toISOString();

    // If confirmed and no project yet, auto-create wedding_project & default tasks!
    if (status === 'CONFIRMED') {
      const existingProject = this.state.projects.find((p) => p.booking_id === id);
      if (!existingProject) {
        const cust = this.getUserById(booking.customer_id);
        const newProject: WeddingProject = {
          id: `w${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          booking_id: booking.id,
          customer_id: booking.customer_id,
          title: `Pernikahan ${cust ? cust.full_name : 'Pasangan Bahagia'}`,
          wedding_date: booking.wedding_date,
          progress_percent: 0,
          notes: 'Proyek pernikahan otomatis diinisiasi setelah konfirmasi booking.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.state.projects.push(newProject);

        // Populate standard default wedding checklist tasks across all required categories
        const defaultTasks: Omit<WeddingTask, 'id' | 'created_at' | 'updated_at'>[] = [
          {
            project_id: newProject.id,
            title: `Konfirmasi Gedung & Fasilitas Venue: ${booking.venue_name}`,
            description: `Detail lokasi: ${booking.venue_address}`,
            category: 'Venue',
            status: 'TODO',
            due_date: booking.wedding_date,
            sort_order: 1,
          },
          {
            project_id: newProject.id,
            title: `Food Tasting Katering untuk ${booking.guest_count} Tamu`,
            description: 'Memilih menu prasmanan utama, stall dessert, dan menu anak.',
            category: 'Catering',
            status: 'TODO',
            sort_order: 2,
          },
          {
            project_id: newProject.id,
            title: 'Fitting Pertama Busana Pengantin & Keluarga Inti',
            description: 'Pengukuran kebaya/beskap akad dan gaun resepsi.',
            category: 'Attire',
            status: 'TODO',
            sort_order: 3,
          },
          {
            project_id: newProject.id,
            title: 'Konsep Desain Dekorasi Pelaminan & Palet Floral',
            description: 'Penataan lorong masuk, photobooth, dan bunga segar panggung.',
            category: 'Decoration',
            status: 'TODO',
            sort_order: 4,
          },
          {
            project_id: newProject.id,
            title: 'Briefing Tim Dokumentasi Foto & Video Sinematik',
            description: 'Penyusunan shot-list momen sakral akad dan resepsi.',
            category: 'Documentation',
            status: 'TODO',
            sort_order: 5,
          },
          {
            project_id: newProject.id,
            title: 'Finalisasi Desain Undangan Digital & Cetak Fisik',
            description: 'Verifikasi ejaan nama mempelai, denah lokasi, dan barcode RSVP.',
            category: 'Invitation',
            status: 'TODO',
            sort_order: 6,
          },
          {
            project_id: newProject.id,
            title: 'Kurasi MC & Pengisi Musik Entertainment Resepsi',
            description: 'Pemilihan MC bilingual, band akustik, dan daftar lagu wedding.',
            category: 'Entertainment',
            status: 'TODO',
            sort_order: 7,
          },
          {
            project_id: newProject.id,
            title: 'Technical Meeting & Gladi Resik Persiapan di Lokasi',
            description: 'Sinkronisasi rundown H-7 bersama tim WO dan perwakilan keluarga.',
            category: 'Other',
            status: 'TODO',
            sort_order: 8,
          },
        ];

        defaultTasks.forEach((dt) => {
          this.state.tasks.push({
            ...dt,
            id: `t${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }

      // Auto-issue official payment invoice for customer upon booking confirmation
      const existingPayment = this.state.payments.find((p) => p.booking_id === id);
      if (!existingPayment) {
        const pkg = this.getPackageById(booking.package_id);
        const invoiceNum = `INV/${new Date().getFullYear()}/WM-${Math.floor(1000 + Math.random() * 9000)}`;
        const invoiceAmount = booking.total_price || (pkg ? pkg.price : 0);
        const newPayment: Payment = {
          id: `m${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          booking_id: booking.id,
          customer_id: booking.customer_id,
          invoice_number: invoiceNum,
          total_amount: invoiceAmount,
          amount_paid: 0,
          remaining_balance: invoiceAmount,
          status: 'UNPAID',
          due_date: booking.wedding_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.state.payments.push(newPayment);
      }
    }

    // If cancelled, remove any unpaid/unprocessed payment records associated with this booking
    if (status === 'CANCELLED') {
      this.state.payments = this.state.payments.filter(
        (p) => !(p.booking_id === id && p.amount_paid === 0)
      );
    }

    this.saveState();
    return {
      ...booking,
      customer: this.getUserById(booking.customer_id),
      package: this.getPackageById(booking.package_id),
    };
  }

  public confirmBooking(id: string, adminId?: string): Booking {
    const updated = this.updateBookingStatus(id, 'CONFIRMED');
    if (adminId) {
      this.addActivity({
        user_id: adminId,
        action: 'BOOKING_CONFIRMED',
        entity_type: 'bookings',
        entity_id: id,
        details: { confirmed_by: adminId, wedding_date: updated.wedding_date },
      });
      this.saveState();
    }
    return updated;
  }

  public cancelBooking(id: string, reason?: string): Booking {
    const updated = this.updateBookingStatus(id, 'CANCELLED');
    this.addActivity({
      action: 'BOOKING_CANCELLED',
      entity_type: 'bookings',
      entity_id: id,
      details: { reason },
    });
    this.saveState();
    return updated;
  }

  // ================= PROJECTS & TASKS =================
  public getProjects(customerId?: string): WeddingProject[] {
    let list = this.state.projects;
    if (customerId) {
      list = list.filter((p) => p.customer_id === customerId);
    }
    return list.map((p) => ({
      ...p,
      tasks: this.getTasksByProjectId(p.id),
      booking: this.getBookingById(p.booking_id),
    }));
  }

  public getProjectById(id: string): WeddingProject | undefined {
    const proj = this.state.projects.find((p) => p.id === id);
    if (!proj) return undefined;
    return {
      ...proj,
      tasks: this.getTasksByProjectId(proj.id),
      booking: this.getBookingById(proj.booking_id),
    };
  }

  public getTasksByProjectId(projectId: string): WeddingTask[] {
    return this.state.tasks
      .filter((t) => t.project_id === projectId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getTasks(projectId: string): WeddingTask[] {
    return this.getTasksByProjectId(projectId);
  }

  public createTask(task: Omit<WeddingTask, 'id' | 'created_at' | 'updated_at'>): WeddingTask {
    const newTask: WeddingTask = {
      ...task,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.tasks.push(newTask);
    this.recalculateProjectProgress(task.project_id);
    this.saveState();
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: TaskStatus): WeddingTask {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.status = status;
    task.updated_at = new Date().toISOString();
    this.recalculateProjectProgress(task.project_id);
    this.saveState();
    return task;
  }

  public updateTask(taskId: string, updates: Partial<WeddingTask>): WeddingTask {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    Object.assign(task, updates, { updated_at: new Date().toISOString() });
    this.recalculateProjectProgress(task.project_id);
    this.saveState();
    return task;
  }

  public deleteTask(taskId: string): void {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const projId = task.project_id;
    this.state.tasks = this.state.tasks.filter((t) => t.id !== taskId);
    this.recalculateProjectProgress(projId);
    this.saveState();
  }

  private recalculateProjectProgress(projectId: string): void {
    const proj = this.state.projects.find((p) => p.id === projectId);
    if (!proj) return;
    const pTasks = this.state.tasks.filter((t) => t.project_id === projectId);
    if (pTasks.length === 0) {
      proj.progress_percent = 0;
    } else {
      const completed = pTasks.filter((t) => t.status === 'COMPLETED').length;
      proj.progress_percent = Math.round((completed / pTasks.length) * 100);
    }
    proj.updated_at = new Date().toISOString();
  }

  // ================= PAYMENTS & TRANSACTIONS =================
  public getPayments(customerId?: string): Payment[] {
    let list = this.state.payments;
    if (customerId) {
      list = list.filter((p) => p.customer_id === customerId);
    }
    return list.map((p) => ({
      ...p,
      booking: this.getBookingById(p.booking_id),
      transactions: this.getTransactionsByPaymentId(p.id),
    }));
  }

  public getPaymentById(id: string): Payment | undefined {
    const p = this.state.payments.find((item) => item.id === id);
    if (!p) return undefined;
    return {
      ...p,
      booking: this.getBookingById(p.booking_id),
      transactions: this.getTransactionsByPaymentId(p.id),
    };
  }

  public getTransactions(paymentId?: string): PaymentTransaction[] {
    let list = this.state.transactions;
    if (paymentId) {
      list = list.filter((t) => t.payment_id === paymentId);
    }
    return list.map((t) => ({
      ...t,
      customer: this.getUserById(t.customer_id),
    }));
  }

  public getTransactionsByPaymentId(paymentId: string): PaymentTransaction[] {
    return this.state.transactions.filter((t) => t.payment_id === paymentId);
  }

  public createTransaction(data: {
    payment_id: string;
    customer_id: string;
    payment_method: PaymentMethod;
    amount: number;
    proof_url: string;
    notes?: string;
  }): PaymentTransaction {
    const txNumber = `TX/${new Date().getFullYear()}/${data.payment_method}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTx: PaymentTransaction = {
      id: generateUUID(),
      payment_id: data.payment_id,
      customer_id: data.customer_id,
      transaction_number: txNumber,
      payment_method: data.payment_method,
      amount: data.amount,
      proof_url: data.proof_url,
      notes: data.notes,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.transactions.push(newTx);
    this.addActivity({
      action: 'PAYMENT_SUBMITTED',
      entity_type: 'payment_transactions',
      entity_id: newTx.id,
      details: { amount: data.amount, method: data.payment_method, customer_id: data.customer_id },
    });
    this.saveState();
    return newTx;
  }

  public verifyTransaction(
    transactionId: string,
    status: 'APPROVED' | 'REJECTED',
    adminId: string,
    rejectionReason?: string
  ): PaymentTransaction {
    const tx = this.state.transactions.find((t) => t.id === transactionId);
    if (!tx) throw new Error('Transaction not found');

    tx.status = status;
    tx.verified_by = adminId;
    tx.verified_at = new Date().toISOString();
    tx.rejection_reason = rejectionReason;
    tx.updated_at = new Date().toISOString();

    // Atomic recalculation of the parent Payment
    const payment = this.state.payments.find((p) => p.id === tx.payment_id);
    if (payment) {
      const approvedTxs = this.state.transactions.filter(
        (t) => t.payment_id === payment.id && t.status === 'APPROVED'
      );
      const totalApproved = approvedTxs.reduce((sum, item) => sum + item.amount, 0);

      payment.amount_paid = totalApproved;
      payment.remaining_balance = Math.max(payment.total_amount - totalApproved, 0);

      if (payment.amount_paid >= payment.total_amount) {
        payment.status = 'PAID';
      } else if (payment.amount_paid > 0) {
        payment.status = 'PARTIAL';
      } else {
        payment.status = 'UNPAID';
      }
      payment.updated_at = new Date().toISOString();
    }

    this.addActivity({
      user_id: adminId,
      action: `TRANSACTION_${status}`,
      entity_type: 'payment_transactions',
      entity_id: tx.id,
      details: {
        amount: tx.amount,
        status,
        rejection_reason: rejectionReason,
        payment_id: tx.payment_id,
      },
    });

    this.saveState();
    return tx;
  }

  public getPaymentSummary() {
    const payments = this.state.payments;
    const transactions = this.state.transactions;

    const totalInvoiced = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const totalApproved = transactions
      .filter((t) => t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPending = transactions
      .filter((t) => t.status === 'PENDING')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRemaining = Math.max(totalInvoiced - totalApproved, 0);

    const bcaApproved = transactions
      .filter((t) => t.status === 'APPROVED' && t.payment_method === 'BCA')
      .reduce((sum, t) => sum + t.amount, 0);
    const danaApproved = transactions
      .filter((t) => t.status === 'APPROVED' && t.payment_method === 'DANA')
      .reduce((sum, t) => sum + t.amount, 0);

    const bcaTotal = transactions
      .filter((t) => t.payment_method === 'BCA')
      .reduce((sum, t) => sum + t.amount, 0);
    const danaTotal = transactions
      .filter((t) => t.payment_method === 'DANA')
      .reduce((sum, t) => sum + t.amount, 0);

    const bcaCount = transactions.filter((t) => t.payment_method === 'BCA').length;
    const danaCount = transactions.filter((t) => t.payment_method === 'DANA').length;

    const totalBookings = this.state.bookings.length;
    const paidBookingsCount = payments.filter((p) => p.status === 'PAID').length;
    const conversionRate = totalBookings > 0
      ? Math.round((payments.filter((p) => p.amount_paid > 0).length / totalBookings) * 100)
      : 0;

    return {
      totalInvoiced,
      totalApproved,
      totalPending,
      totalRemaining,
      bcaApproved,
      danaApproved,
      bcaTotal,
      danaTotal,
      bcaCount,
      danaCount,
      totalTransactions: transactions.length,
      approvedCount: transactions.filter((t) => t.status === 'APPROVED').length,
      pendingCount: transactions.filter((t) => t.status === 'PENDING').length,
      rejectedCount: transactions.filter((t) => t.status === 'REJECTED').length,
      totalBookings,
      paidBookingsCount,
      conversionRate,
    };
  }

  // ================= ACTIVITY LOGS =================
  public addActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): void {
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.state.activityLogs.unshift(newLog);
    // Keep max 100 activity logs
    if (this.state.activityLogs.length > 100) {
      this.state.activityLogs.pop();
    }
  }

  public getActivityLogs(): ActivityLog[] {
    return this.state.activityLogs.map((log) => ({
      ...log,
      user: log.user_id ? this.getUserById(log.user_id) : undefined,
    }));
  }
}

// Export singleton
export const demoStore = new DemoStore();
