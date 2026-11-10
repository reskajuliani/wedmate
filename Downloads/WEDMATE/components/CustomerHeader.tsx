'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  HeartHandshake,
  CalendarDays,
  ListTodo,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';

const CUSTOMER_NAV_ITEMS = [
  {
    label: 'Booking Paket',
    href: '/customer/booking',
    match: ['/customer/booking', '/customer/bookings', '/customer/dashboard/booking'],
    icon: CalendarDays,
  },
  {
    label: 'Checklist Pernikahan',
    href: '/customer/checklist',
    match: ['/customer/checklist', '/customer/project'],
    icon: ListTodo,
  },
  {
    label: 'Pembayaran',
    href: '/customer/payment',
    match: ['/customer/payment', '/customer/payments'],
    icon: CreditCard,
  },
];

export function CustomerHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (matchers: string[]) => {
    return matchers.some((m) => pathname === m || pathname.startsWith(m + '/'));
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/customer/booking" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#C8A46A] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A] block">
                WED<span className="text-[#C8A46A] font-sans font-light">MATE</span>
              </span>
              <span className="block text-[10px] tracking-widest text-[#C8A46A] uppercase -mt-1 font-semibold">
                Portal Pengantin
              </span>
            </div>
          </Link>

          {/* Desktop Core Navigation - STRICTLY 3 MENUS */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {CUSTOMER_NAV_ITEMS.map((item) => {
              const active = isActive(item.match);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#C8A46A] text-white shadow-sm'
                      : 'text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#C8A46A]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Top-Right: Profile & Logout */}
          <div className="hidden md:flex items-center space-x-4 pl-4 border-l border-[#E8E2D8]">
            <div className="text-right">
              <div className="text-xs font-bold text-[#1A1A1A] flex items-center justify-end gap-1.5">
                <div className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-center text-[#C8A46A]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>{user?.full_name || 'Calon Pengantin'}</span>
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] text-emerald-700 font-medium">
                  {user?.role === 'ADMIN' ? 'Administrator Preview' : 'Akun Terverifikasi'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Keluar dari akun"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-xl transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E2D8] bg-white px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {/* User Info Bar */}
          <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white border border-[#E8E2D8] flex items-center justify-center text-[#C8A46A]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">{user?.full_name || 'Calon Pengantin'}</p>
                <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{user?.role === 'ADMIN' ? 'Administrator' : 'Terverifikasi'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Core Menus */}
          <div className="space-y-1">
            {CUSTOMER_NAV_ITEMS.map((item) => {
              const active = isActive(item.match);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#C8A46A] text-white shadow-sm'
                      : 'text-[#1A1A1A] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#C8A46A]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
