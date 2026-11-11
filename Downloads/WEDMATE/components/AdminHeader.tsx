'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import {
  HeartHandshake,
  ShieldCheck,
  CreditCard,
  ListTodo,
  Package,
  LogOut,
  Menu,
  X,
  UserCheck,
  CalendarDays,
  Home,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  {
    label: 'Approval & Booking',
    href: '/admin/approvals',
    match: ['/admin/approvals', '/admin/dashboard/approvals', '/admin/bookings', '/admin/calendar'],
    icon: ShieldCheck,
  },
  {
    label: 'Verifikasi Pembayaran',
    href: '/admin/payments',
    match: ['/admin/payments', '/admin/reports'],
    icon: CreditCard,
  },
  {
    label: 'Checklist Proyek',
    href: '/admin/projects',
    match: ['/admin/projects'],
    icon: ListTodo,
  },
  {
    label: 'Kelola Paket',
    href: '/admin/packages',
    match: ['/admin/packages'],
    icon: Package,
  },
];

export function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    const updateBadges = () => {
      const users = demoStore.getUsers().filter((u) => u.role === 'CUSTOMER' && u.status === 'PENDING');
      const bookings = demoStore.getBookings().filter((b) => b.status === 'PENDING');
      setPendingApprovalsCount(users.length + bookings.length);

      const txs = demoStore.getTransactions().filter((t) => t.status === 'PENDING');
      setPendingPaymentsCount(txs.length);
    };

    updateBadges();
    const unsub = demoStore.subscribe(updateBadges);
    return unsub;
  }, []);

  const isActive = (matchers: string[]) => {
    return matchers.some((m) => pathname === m || pathname.startsWith(m + '/'));
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1F1F1F] text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/admin/approvals" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#C8A46A] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white block">
                WED<span className="text-[#C8A46A] font-sans font-light">MATE</span>
              </span>
              <span className="block text-[10px] tracking-widest text-[#C8A46A] uppercase -mt-1 font-semibold">
                Administrator
              </span>
            </div>
          </Link>

          {/* Desktop Core Navigation - STRICTLY 4 MENUS */}
          <nav className="hidden lg:flex items-center space-x-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isActive(item.match);
              const Icon = item.icon;
              const badgeCount =
                item.href === '/admin/approvals'
                  ? pendingApprovalsCount
                  : item.href === '/admin/payments'
                  ? pendingPaymentsCount
                  : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#C8A46A] text-white shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#C8A46A]'}`} />
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        active ? 'bg-white text-[#1A1A1A]' : 'bg-[#C8A46A] text-white'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Top-Right: Admin Profile & Logout */}
          <div className="hidden md:flex items-center space-x-4 pl-4 border-l border-white/15">
            <div className="text-right">
              <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#C8A46A]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>{user?.full_name || 'Admin WEDMATE'}</span>
              </div>
              <span className="text-[10px] text-[#C8A46A] font-mono block">
                SUPER ADMINISTRATOR
              </span>
            </div>

            <Link
              href="/"
              title="Lihat Halaman Depan / Welcome Screen"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white border border-white/10 transition"
            >
              <Home className="w-3.5 h-3.5 text-[#C8A46A]" />
              <span>Portal Utama</span>
            </Link>

            <button
              onClick={logout}
              title="Keluar dari sesi Admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-xl transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#1F1F1F] px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {/* User Info Bar */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#C8A46A]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user?.full_name || 'Admin WEDMATE'}</p>
                <p className="text-[10px] text-[#C8A46A] font-mono">SUPER ADMINISTRATOR</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#C8A46A] hover:bg-white/10 rounded-xl transition"
                title="Ke Portal Utama"
              >
                <Home className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Menus */}
          <div className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isActive(item.match);
              const Icon = item.icon;
              const badgeCount =
                item.href === '/admin/approvals'
                  ? pendingApprovalsCount
                  : item.href === '/admin/payments'
                  ? pendingPaymentsCount
                  : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#C8A46A] text-white shadow-sm'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#C8A46A]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        active ? 'bg-white text-[#1A1A1A]' : 'bg-[#C8A46A] text-white'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
