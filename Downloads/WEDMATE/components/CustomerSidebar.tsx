'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  HeartHandshake,
  CalendarDays,
  ListTodo,
  CreditCard,
  LogOut,
  User,
  CheckCircle2,
} from 'lucide-react';

export const CUSTOMER_NAV_ITEMS = [
  {
    label: 'Booking Paket',
    href: '/customer/booking',
    match: ['/customer/booking', '/customer/bookings', '/customer/dashboard/booking'],
    icon: CalendarDays,
    description: 'Katalog paket & formulir reservasi',
  },
  {
    label: 'Checklist Pernikahan',
    href: '/customer/checklist',
    match: ['/customer/checklist', '/customer/project'],
    icon: ListTodo,
    description: 'Status booking & countdown hari H',
  },
  {
    label: 'Pembayaran',
    href: '/customer/payment',
    match: ['/customer/payment', '/customer/payments'],
    icon: CreditCard,
    description: 'Info rekening & upload bukti transfer',
  },
];

interface CustomerSidebarProps {
  onItemClick?: () => void;
}

export function CustomerSidebar({ onItemClick }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (matchers: string[]) => {
    return matchers.some((m) => pathname === m || pathname.startsWith(m + '/'));
  };

  return (
    <aside className="w-64 bg-white border-r border-[#E8E2D8] flex flex-col justify-between shrink-0 h-full">
      {/* Top: Brand Header */}
      <div>
        <div className="p-6 border-b border-[#E8E2D8]">
          <Link href="/customer/booking" className="flex items-center gap-3 group" onClick={onItemClick}>
            <div className="w-10 h-10 rounded-2xl bg-[#C8A46A] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A] block">
                WED<span className="text-[#C8A46A] font-sans font-light">MATE</span>
              </span>
              <span className="block text-[10px] tracking-widest text-[#C8A46A] uppercase -mt-0.5 font-semibold">
                Portal Pengantin
              </span>
            </div>
          </Link>
          <p className="text-[11px] text-[#1A1A1A]/60 italic font-serif mt-3 leading-snug">
            &ldquo;Plan Your Day, Cherish Your Moments.&rdquo;
          </p>
        </div>

        {/* Navigation - STRICTLY 3 MENUS */}
        <div className="p-4 space-y-1.5">
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/40 block mb-2">
            Menu Utama
          </span>
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const active = isActive(item.match);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all group ${
                  active
                    ? 'bg-[#C8A46A] text-white shadow-sm'
                    : 'text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl mt-0.5 transition-colors ${
                    active ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#C8A46A] group-hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="block leading-tight">{item.label}</span>
                  <span
                    className={`text-[10px] font-normal block mt-0.5 line-clamp-1 ${
                      active ? 'text-white/80' : 'text-[#1A1A1A]/50'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom: Profile & Logout */}
      <div className="p-4 border-t border-[#E8E2D8] bg-[#FAF8F5]/50 space-y-3">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E8E2D8]">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-center text-[#C8A46A] shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1A1A1A] truncate">{user?.full_name || 'Calon Pengantin'}</p>
            <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{user?.role === 'ADMIN' ? 'Admin Preview' : 'Terverifikasi'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Keluar dari akun"
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </aside>
  );
}
