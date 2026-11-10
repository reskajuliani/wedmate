'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  HeartHandshake,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react';
import { CustomerSidebar } from './CustomerSidebar';

export function CustomerHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive human-readable section title from current pathname
  const getPageTitle = () => {
    if (pathname.includes('/booking')) return 'Pemesanan & Reservasi Paket';
    if (pathname.includes('/checklist')) return 'Checklist Persiapan Pernikahan';
    if (pathname.includes('/payment')) return 'Informasi Tagihan & Pembayaran';
    return 'Portal Pengantin';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile Brand / Desktop Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-xl transition md:hidden cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Brand Logo */}
            <Link href="/customer/booking" className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-[#C8A46A] text-white flex items-center justify-center">
                <HeartHandshake className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold text-[#1A1A1A]">
                WED<span className="text-[#C8A46A] font-sans font-light">MATE</span>
              </span>
            </Link>

            {/* Desktop Page Title */}
            <div className="hidden md:block">
              <span className="text-[10px] uppercase font-bold text-[#C8A46A] tracking-wider block">
                Portal Pengantin
              </span>
              <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Top-Right: Profile & Logout */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right hidden sm:block">
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

            {/* Header: Tombol Logout */}
            <button
              onClick={logout}
              title="Keluar dari akun"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full shadow-2xl animate-fadeIn flex flex-col">
            <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C8A46A] text-white flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-white" />
                </div>
                <span className="font-serif text-lg font-bold text-[#1A1A1A]">
                  WED<span className="text-[#C8A46A] font-sans font-light">MATE</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CustomerSidebar onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
