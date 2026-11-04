'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, UserRole, AccountStatus } from './types';
import { demoStore } from './demo-store';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  register: (data: { full_name: string; email: string; phone: string; wedding_date?: string }) => Promise<UserProfile>;
  logout: () => void;
  switchRole: (roleType: 'guest' | 'pending' | 'approved' | 'admin') => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'wedmate_active_user_id';

/**
 * Synchronize authentication cookies with document.cookie
 * This ensures Next.js Middleware and Server Component Layout Guards
 * can inspect user role and account status at the Edge / Server.
 */
function syncAuthCookies(user: UserProfile | null) {
  if (typeof document === 'undefined') return;

  if (!user) {
    document.cookie = 'wedmate_user_id=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'wedmate_user_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'wedmate_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'wedmate_user_status=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'wedmate_status=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'wedmate_user_approval_status=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'wedmate_session_user=; path=/; max-age=0; SameSite=Lax';
    return;
  }

  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const userStatus = user.status || user.approval_status || 'PENDING';
  document.cookie = `wedmate_user_id=${user.id}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `wedmate_user_role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `wedmate_role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `wedmate_user_status=${userStatus}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `wedmate_status=${userStatus}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `wedmate_user_approval_status=${userStatus}; path=/; max-age=${maxAge}; SameSite=Lax`;

  const sessionPayload = JSON.stringify({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    status: userStatus,
    approval_status: userStatus,
  });
  document.cookie = `wedmate_session_user=${encodeURIComponent(sessionPayload)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(AUTH_STORAGE_KEY);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fallback sync from localStorage on client mount if needed
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedId && savedId !== activeUserId) {
        setActiveUserId(savedId);
      }
    } catch {
      // ignore
    }
  }, [activeUserId]);

  // Listen for changes in demoStore (e.g. when admin approves or rejects the current user)
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const currentUser = React.useMemo(() => {
    if (!activeUserId) return null;
    return demoStore.getUserById(activeUserId) || null;
  }, [activeUserId, storeVersion]);

  // Sync cookies whenever currentUser changes (STRICTLY ONLY when currentUser is non-null)
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
          user = demoStore.getUsers().find((u) => u.role === 'ADMIN') || demoStore.getUserById('a0000000-0000-0000-0000-000000000001');
        }

        if (!user) {
          throw new Error('Akun dengan email ini tidak ditemukan. Silakan periksa kembali email Anda.');
        }

        setActiveUserId(user.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, user.id);
        }
        syncAuthCookies(user);
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

        // STRICT GATE: Public registration strictly creates role 'CUSTOMER' with status 'PENDING'
        const newUser = demoStore.createUser({
          email: data.email.trim().toLowerCase(),
          full_name: data.full_name.trim(),
          phone: data.phone.trim(),
          wedding_date: data.wedding_date || undefined,
          role: 'CUSTOMER',
          status: 'PENDING',
          approval_status: 'PENDING',
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

  const logout = useCallback(() => {
    setActiveUserId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    syncAuthCookies(null);
    if (typeof window !== 'undefined') {
      window.location.assign('/');
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

      // Check if target user exists, or dynamically create if needed
      let targetUser = demoStore.getUsers().find((u) => {
        if (roleType === 'admin') return u.role === 'ADMIN';
        if (roleType === 'pending') return u.role === 'CUSTOMER' && u.status === 'PENDING';
        if (roleType === 'approved') return u.role === 'CUSTOMER' && u.status === 'APPROVED';
        return false;
      });

      if (!targetUser) {
        if (roleType === 'admin') {
          targetUser = demoStore.getUserById('a0000000-0000-0000-0000-000000000001');
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

        // Route appropriately according to role and status
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

  // Client-side Gatekeeper protection effect:
  // 1. /customer/* and /portal/* requires authenticated customer with status APPROVED
  // 2. /admin/* requires authenticated user with role ADMIN
  // 3. /approval-pending routes approved customers to booking
  useEffect(() => {
    if (isLoading) return;

    const isCustomerRoute = pathname?.startsWith('/customer') || pathname?.startsWith('/portal');
    const isAdminRoute = pathname?.startsWith('/admin');

    if (isCustomerRoute) {
      if (!currentUser) {
        const fullUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;
        router.push('/login?redirect=' + encodeURIComponent(fullUrl));
      } else if (currentUser.role === 'CUSTOMER' && (currentUser.status !== 'APPROVED' && currentUser.approval_status !== 'APPROVED')) {
        router.push('/approval-pending');
      }
    }

    if (isAdminRoute) {
      if (!currentUser) {
        const fullUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;
        router.push('/login?redirect=' + encodeURIComponent(fullUrl));
      } else if (currentUser.role !== 'ADMIN') {
        // Non-admin blocked from admin dashboard
        if (currentUser.status !== 'APPROVED' && currentUser.approval_status !== 'APPROVED') {
          router.push('/approval-pending');
        } else {
          router.push('/customer/booking');
        }
      }
    }

    if (pathname === '/approval-pending') {
      if (currentUser?.role === 'ADMIN') {
        router.push('/admin/approvals');
      } else if (currentUser?.role === 'CUSTOMER' && (currentUser.status === 'APPROVED' || currentUser.approval_status === 'APPROVED')) {
        router.push('/customer/booking');
      }
    }

    // Auto-redirect authenticated users from root page only (/login and /register always open for form input)
    if (pathname === '/' && currentUser) {
      if (currentUser.role === 'ADMIN') {
        router.push('/admin/approvals');
      } else if (currentUser.status === 'APPROVED' || currentUser.approval_status === 'APPROVED') {
        router.push('/customer/booking');
      } else {
        router.push('/approval-pending');
      }
    }
  }, [pathname, currentUser, isLoading, router]);

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
