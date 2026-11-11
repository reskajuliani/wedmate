'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, UserRole, AccountStatus } from './types';
import { demoStore } from './demo-store';
import { supabaseService } from './supabase-service';
import { createClient, isSupabaseConfigured } from './supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  register: (data: { full_name: string; email: string; phone: string; wedding_date?: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchRole: (roleType: 'guest' | 'pending' | 'approved' | 'admin') => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'wedmate_active_user_id';
const CANONICAL_ADMIN_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Safely parse a cookie by name from document.cookie
 */
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  if (!match) return null;
  try {
    const val = decodeURIComponent(match[1].trim());
    return val.replace(/^"|"$/g, '');
  } catch {
    return match[1].trim().replace(/^"|"$/g, '');
  }
}

/**
 * Synchronize authentication cookies with document.cookie & /api/auth/sync
 */
function syncAuthCookies(user: UserProfile | null) {
  if (typeof document === 'undefined') return;

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isHttps ? '; Secure' : '';

  if (!user) {
    const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const cookieNames = [
      'wedmate_user_id',
      'wedmate_user_role',
      'wedmate_role',
      'wedmate_user_status',
      'wedmate_status',
      'wedmate_user_approval_status',
      'wedmate_session_user',
    ];
    cookieNames.forEach((name) => {
      document.cookie = `${name}=; path=/; expires=${expiredDate}; max-age=0; SameSite=Lax${secureFlag}`;
      document.cookie = `${name}=; expires=${expiredDate}; max-age=0; SameSite=Lax${secureFlag}`;
    });

    try {
      fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: null }),
      }).catch(() => {});
    } catch {
      // ignore
    }
    return;
  }

  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const userStatus = user.status || user.approval_status || 'PENDING';
  let role = (user.role || 'CUSTOMER').toUpperCase();
  if (user.id === CANONICAL_ADMIN_ID || user.email === 'admin@wedmate.id') {
    role = 'ADMIN';
  }

  document.cookie = `wedmate_user_id=${user.id}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `wedmate_user_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `wedmate_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `wedmate_user_status=${userStatus}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `wedmate_status=${userStatus}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `wedmate_user_approval_status=${userStatus}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;

  const sessionPayload = JSON.stringify({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: role,
    status: userStatus,
    approval_status: userStatus,
  });
  document.cookie = `wedmate_session_user=${encodeURIComponent(sessionPayload)}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;

  try {
    fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { ...user, role, status: userStatus } }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  // Initialize active user ID from localStorage or cookies
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) return saved;
        const cookieId = getCookieValue('wedmate_user_id');
        if (cookieId) return cookieId;
        const sessionCookie = getCookieValue('wedmate_session_user');
        if (sessionCookie) {
          const parsed = JSON.parse(sessionCookie);
          if (parsed?.id) return parsed.id;
        }
        const role = getCookieValue('wedmate_user_role') || getCookieValue('wedmate_role');
        if (role && role.toUpperCase() === 'ADMIN') {
          return CANONICAL_ADMIN_ID;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [storeVersion, setStoreVersion] = useState(0);

  // Mark client mounted
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Sync state from storage or cookies on mount
  useEffect(() => {
    try {
      let savedId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!savedId) {
        savedId = getCookieValue('wedmate_user_id');
        if (!savedId) {
          const sessionCookie = getCookieValue('wedmate_session_user');
          if (sessionCookie) {
            const parsed = JSON.parse(sessionCookie);
            if (parsed?.id) savedId = parsed.id;
          }
        }
        if (!savedId) {
          const role = getCookieValue('wedmate_user_role') || getCookieValue('wedmate_role');
          if (role && role.toUpperCase() === 'ADMIN') {
            savedId = CANONICAL_ADMIN_ID;
          }
        }
      }
      if (savedId && savedId !== activeUserId) {
        setActiveUserId(savedId);
      }
    } catch {
      // ignore
    }
  }, [activeUserId]);

  // Listen for demoStore changes
  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Memoize currentUser object
  const currentUser = useMemo(() => {
    if (activeUserId) {
      const user = demoStore.getUserById(activeUserId);
      if (user) return user;
      if (activeUserId === CANONICAL_ADMIN_ID) {
        const admin = demoStore.getUsers().find((u) => u.role === 'ADMIN');
        if (admin) return admin;
      }
    }

    if (typeof document !== 'undefined') {
      try {
        const sessionCookie = getCookieValue('wedmate_session_user');
        if (sessionCookie) {
          const parsed = JSON.parse(sessionCookie);
          if (parsed && parsed.id) {
            const existing = demoStore.getUserById(parsed.id);
            if (existing) return existing;
            return parsed as UserProfile;
          }
        }
        const cookieRole = getCookieValue('wedmate_user_role') || getCookieValue('wedmate_role');
        const cookieId = getCookieValue('wedmate_user_id');
        if (
          (cookieRole && cookieRole.toUpperCase() === 'ADMIN') ||
          cookieId === CANONICAL_ADMIN_ID
        ) {
          return demoStore.getUserById(CANONICAL_ADMIN_ID) || demoStore.getUsers().find((u) => u.role === 'ADMIN') || null;
        }
      } catch {
        // ignore
      }
    }

    return null;
  }, [activeUserId, storeVersion]);

  // Keep cookies in sync when currentUser changes
  useEffect(() => {
    if (currentUser) {
      syncAuthCookies(currentUser);
    }
  }, [currentUser]);

  const refreshUser = useCallback(() => {
    setStoreVersion((v) => v + 1);
  }, []);

  const login = useCallback(
    async (email: string, password?: string): Promise<UserProfile> => {
      setIsLoading(true);
      try {
        const cleanEmail = (email || '').trim().toLowerCase();
        let user = demoStore.getUserByEmail(cleanEmail);

        // Fallback: If user enters any variation of admin, match the admin account
        if (!user && (cleanEmail === 'admin' || cleanEmail.startsWith('admin@') || cleanEmail.includes('admin'))) {
          user = demoStore.getUsers().find((u) => u.role === 'ADMIN') || demoStore.getUserById(CANONICAL_ADMIN_ID);
        }

        if (!user) {
          throw new Error('Akun dengan email ini tidak ditemukan. Silakan periksa kembali email Anda.');
        }

        setActiveUserId(user.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, user.id);
        }
        syncAuthCookies(user);

        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user }),
          });
        } catch {
          // ignore
        }

        return user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (data: {
      full_name: string;
      email: string;
      phone: string;
      wedding_date?: string;
    }): Promise<UserProfile> => {
      setIsLoading(true);
      try {
        const existing = demoStore.getUserByEmail(data.email);
        if (existing) {
          throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        }

        const newUser = await supabaseService.createProfile({
          email: data.email.trim().toLowerCase(),
          full_name: data.full_name.trim(),
          phone: data.phone.trim(),
          wedding_date: data.wedding_date || undefined,
          notes: 'Registrasi mandiri dari formulir web.',
        });

        setActiveUserId(newUser.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
        }
        syncAuthCookies(newUser);
        return newUser;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setActiveUserId(null);

    // 1. Panggil supabase.auth.signOut() jika Supabase sedang aktif
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Gagal memproses supabase.auth.signOut():', err);
    }

    // 2. Tunggu hingga request POST /api/auth/sync ({ user: null }) benar-benar selesai mengembalikan respon HTTP 200 OK
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: null }),
      });
    } catch (err) {
      console.warn('Gagal memproses sync cookie logout ke server:', err);
    }

    // 3. Pembersihan kuat di sisi browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }

      try {
        sessionStorage.clear();
      } catch (e) {
        // ignore
      }

      const isHttps = window.location.protocol === 'https:';
      const secureFlag = isHttps ? '; Secure' : '';
      const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';

      // Hapus seluruh cookie aplikasi wedmate
      const targetCookies = [
        'wedmate_user_id',
        'wedmate_user_role',
        'wedmate_role',
        'wedmate_user_status',
        'wedmate_status',
        'wedmate_user_approval_status',
        'wedmate_session_user',
      ];
      targetCookies.forEach((name) => {
        document.cookie = `${name}=; path=/; expires=${expiredDate}; max-age=0; SameSite=Lax${secureFlag}`;
        document.cookie = `${name}=; expires=${expiredDate}; max-age=0; SameSite=Lax${secureFlag}`;
      });

      // Sapu bersih seluruh cookie pada document.cookie
      const allCookies = document.cookie.split(';');
      for (let i = 0; i < allCookies.length; i++) {
        const c = allCookies[i];
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = `${name}=; path=/; expires=${expiredDate}; max-age=0; SameSite=Lax${secureFlag}`;
          document.cookie = `${name}=; expires=${expiredDate}; max-age=0; SameSite=Lax${secureFlag}`;
        }
      }

      // 4. Alihkan langsung ke halaman utama Welcome Screen (/)
      window.location.replace('/');
    } else {
      router.push('/');
    }
  }, [router]);

  const switchRole = useCallback(
    (roleType: 'guest' | 'pending' | 'approved' | 'admin') => {
      if (roleType === 'guest') {
        setActiveUserId(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        syncAuthCookies(null);
        router.push('/');
        return;
      }

      let targetUser = demoStore.getUsers().find((u) => {
        if (roleType === 'admin') return u.role === 'ADMIN';
        if (roleType === 'pending') return u.role === 'CUSTOMER' && u.status === 'PENDING';
        if (roleType === 'approved') return u.role === 'CUSTOMER' && u.status === 'APPROVED';
        return false;
      });

      if (!targetUser) {
        if (roleType === 'admin') {
          targetUser = demoStore.getUserById(CANONICAL_ADMIN_ID);
        } else if (roleType === 'pending') {
          targetUser = demoStore.createUser({
            email: 'pengantin.pending@example.com',
            full_name: 'Calon Pengantin (Pending)',
            phone: '081234567891',
            role: 'CUSTOMER',
            status: 'PENDING',
            approval_status: 'PENDING',
            notes: 'Menunggu review dan persetujuan Admin',
          });
        } else if (roleType === 'approved') {
          targetUser = demoStore.createUser({
            email: 'pengantin.approved@example.com',
            full_name: 'Calon Pengantin (Approved)',
            phone: '081234567892',
            role: 'CUSTOMER',
            status: 'APPROVED',
            approval_status: 'APPROVED',
            notes: 'Akun terverifikasi oleh Admin',
          });
        }
      }

      if (targetUser) {
        setActiveUserId(targetUser.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, targetUser.id);
        }
        syncAuthCookies(targetUser);

        if (roleType === 'pending') {
          router.push('/approval-pending');
        } else if (roleType === 'approved') {
          router.push('/customer/booking');
        } else if (roleType === 'admin') {
          router.push('/admin/approvals');
        }
      }
    },
    [router]
  );

  // Client-side Gatekeeper protection effect
  useEffect(() => {
    // NEVER perform client-side redirects before mount to avoid fighting SSR/layout guards
    if (!hasMounted || isLoading) return;

    const isCustomerRoute = pathname?.startsWith('/customer') || pathname?.startsWith('/portal');
    const isAdminRoute = pathname?.startsWith('/admin');

    const cookieRole = (getCookieValue('wedmate_user_role') || getCookieValue('wedmate_role'))?.toUpperCase();
    const cookieId = getCookieValue('wedmate_user_id');

    let sessionUserRole: string | null = null;
    let sessionUserId: string | null = null;
    let sessionUserEmail: string | null = null;
    try {
      const rawSession = getCookieValue('wedmate_session_user');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        sessionUserRole = parsed?.role ? String(parsed.role).toUpperCase() : null;
        sessionUserId = parsed?.id || null;
        sessionUserEmail = parsed?.email ? String(parsed.email).toLowerCase() : null;
      }
    } catch {
      // ignore
    }

    const hasAdminCookie =
      cookieRole === 'ADMIN' ||
      cookieId === CANONICAL_ADMIN_ID ||
      sessionUserRole === 'ADMIN' ||
      sessionUserId === CANONICAL_ADMIN_ID ||
      sessionUserEmail === 'admin@wedmate.id';

    const hasCustomerCookie =
      cookieRole === 'CUSTOMER' ||
      sessionUserRole === 'CUSTOMER' ||
      Boolean(getCookieValue('wedmate_session_user'));

    // Admin Routes Guard:
    if (isAdminRoute) {
      if (!currentUser && !hasAdminCookie) {
        const fullUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;
        router.push('/login?redirect=' + encodeURIComponent(fullUrl));
      }
      return;
    }

    // Customer Routes Guard
    if (isCustomerRoute) {
      if (!currentUser && !hasCustomerCookie && !hasAdminCookie) {
        const fullUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;
        router.push('/login?redirect=' + encodeURIComponent(fullUrl));
      } else if (currentUser && currentUser.role === 'CUSTOMER' && currentUser.status !== 'APPROVED' && currentUser.approval_status !== 'APPROVED') {
        router.push('/approval-pending');
      }
      return;
    }

    // Approval Pending Page Guard
    if (pathname === '/approval-pending') {
      if (currentUser?.role === 'ADMIN' || hasAdminCookie) {
        router.push('/admin/approvals');
      } else if (currentUser?.role === 'CUSTOMER' && (currentUser.status === 'APPROVED' || currentUser.approval_status === 'APPROVED')) {
        router.push('/customer/booking');
      }
      return;
    }

    // Welcome Screen Root Page Auto-Redirect
    if (pathname === '/') {
      if (currentUser?.role === 'ADMIN' || hasAdminCookie) {
        router.push('/admin/approvals');
      } else if (currentUser?.status === 'APPROVED' || currentUser?.approval_status === 'APPROVED') {
        router.push('/customer/booking');
      } else if (currentUser) {
        router.push('/approval-pending');
      }
    }
  }, [hasMounted, pathname, currentUser, activeUserId, isLoading, router]);

  const value: AuthContextType = {
    user: currentUser,
    role: currentUser?.role || null,
    status: currentUser?.status || null,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout,
    switchRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
