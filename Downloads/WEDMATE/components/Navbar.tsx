'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { HeartHandshake, Menu, X, User, LogOut, LayoutDashboard, Shield, Clock, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur-md border-b border-softbeige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-champagne text-ivory flex items-center justify-center shadow-wedding group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-charcoal flex items-center gap-1">
                WED<span className="text-champagne font-sans font-light">MATE</span>
              </span>
              <span className="block text-[10px] tracking-widest text-charcoal-400 uppercase -mt-1 font-medium">
                Wedding CRM & Planner
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Clean Public Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-charcoal-600">
            <Link href="/" className="hover:text-champagne transition-colors">
              Beranda
            </Link>
            <Link href="/packages" className="hover:text-champagne transition-colors">
              Paket Pernikahan
            </Link>
            <Link href="/#workflow" className="hover:text-champagne transition-colors">
              Alur Perencanaan
            </Link>
            <Link href="/#accounts" className="hover:text-champagne transition-colors">
              Rekening Resmi
            </Link>
          </nav>

          {/* User Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-champagne-50 hover:bg-champagne-100 text-charcoal text-xs font-medium border border-softbeige transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-champagne" />
                    <span>Panel Admin</span>
                    <ArrowRight className="w-3 h-3 text-champagne" />
                  </Link>
                ) : user.status === 'APPROVED' ? (
                  <Link
                    href="/customer/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-champagne hover:bg-champagne-600 text-white text-xs font-semibold shadow-wedding transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard Pengantin</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <Link
                    href="/approval-pending"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold transition"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Status Akun (Pending)</span>
                  </Link>
                )}

                <div className="text-right pl-2 border-l border-softbeige">
                  <div className="text-xs font-semibold text-charcoal flex items-center justify-end gap-1">
                    <User className="w-3 h-3 text-champagne" />
                    {user.full_name}
                  </div>
                  <span className="text-[10px] text-charcoal-400 block font-mono">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Keluar"
                  className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-charcoal-700 hover:text-champagne px-4 py-2 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-white bg-champagne hover:bg-champagne-600 px-5 py-2.5 rounded-full shadow-wedding hover:shadow-wedding-lg transition-all"
                >
                  Daftar Calon Pengantin
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-charcoal-600 hover:text-champagne focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ivory border-b border-softbeige px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-champagne"
          >
            Beranda
          </Link>
          <Link
            href="/packages"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-champagne"
          >
            Paket Pernikahan
          </Link>
          <Link
            href="/#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-champagne"
          >
            Alur Perencanaan
          </Link>
          <Link
            href="/#accounts"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-champagne"
          >
            Rekening Resmi
          </Link>

          {isAuthenticated && user && (
            <div className="pt-3 border-t border-softbeige">
              <div className="text-sm font-semibold text-charcoal mb-2">
                Halo, {user.full_name} ({user.role})
              </div>
              {user.role === 'ADMIN' ? (
                <div className="space-y-2">
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-3 rounded-xl bg-champagne-50 border border-softbeige text-charcoal text-sm font-semibold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-champagne" />
                      Buka Panel Admin
                    </span>
                    <ArrowRight className="w-4 h-4 text-champagne" />
                  </Link>
                </div>
              ) : user.status === 'APPROVED' ? (
                <div className="space-y-2">
                  <Link
                    href="/customer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-3 rounded-xl bg-champagne text-white text-sm font-semibold flex items-center justify-between shadow-wedding"
                  >
                    <span className="flex items-center gap-1.5">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard Pengantin
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  href="/approval-pending"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-amber-700 font-medium"
                >
                  Status Approval Akun
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="mt-4 flex items-center gap-1.5 text-sm text-red-600 font-medium"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="pt-4 border-t border-softbeige flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border border-softbeige text-charcoal font-medium hover:border-champagne"
              >
                Masuk Akun
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-champagne text-white font-medium hover:bg-champagne-600 shadow-wedding"
              >
                Daftar Calon Pengantin
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Contextual Sub-Nav Bar: ONLY visible when inside /admin */}
      {pathname.startsWith('/admin') && user?.role === 'ADMIN' && (
        <div className="bg-charcoal text-white text-xs border-t border-charcoal-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto py-2.5 scrollbar-none">
            <span className="text-[11px] font-bold text-champagne uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Panel Admin:
            </span>
            <Link
              href="/admin"
              className={`hover:text-champagne transition shrink-0 ${
                pathname === '/admin' ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/dashboard/approvals"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('approvals') ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Persetujuan Akun
            </Link>
            <Link
              href="/admin/packages"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('packages') ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Katalog Paket
            </Link>
            <Link
              href="/admin/bookings"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('bookings') ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Manajemen Booking
            </Link>
            <Link
              href="/admin/projects"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('projects') ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Proyek & Checklist
            </Link>
            <Link
              href="/admin/payments"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('payments') ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Verifikasi Pembayaran
            </Link>
            <Link
              href="/admin/reports"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('reports') ? 'text-champagne font-bold border-b border-champagne pb-0.5' : 'text-gray-300'
              }`}
            >
              Laporan & Rekonsiliasi
            </Link>
          </div>
        </div>
      )}

      {/* Contextual Sub-Nav Bar: ONLY visible when inside /customer or /portal */}
      {(pathname.startsWith('/customer') || pathname.startsWith('/portal')) && user?.role === 'CUSTOMER' && (
        <div className="bg-champagne-50/80 border-t border-champagne-200 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto py-2.5 scrollbar-none">
            <span className="text-[11px] font-bold text-champagne-800 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" /> Portal:
            </span>
            <Link
              href="/customer/dashboard"
              className={`hover:text-champagne transition shrink-0 ${
                pathname === '/customer/dashboard' || pathname === '/portal' ? 'text-champagne-800 font-bold border-b border-champagne-600 pb-0.5' : 'text-charcoal-600'
              }`}
            >
              Ringkasan Proyek
            </Link>
            <Link
              href="/customer/dashboard/booking"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('/booking') ? 'text-champagne-800 font-bold border-b border-champagne-600 pb-0.5' : 'text-charcoal-600'
              }`}
            >
              Pesan Paket
            </Link>
            <Link
              href="/customer/bookings"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('bookings') ? 'text-champagne-800 font-bold border-b border-champagne-600 pb-0.5' : 'text-charcoal-600'
              }`}
            >
              Booking & Jadwal
            </Link>
            <Link
              href="/customer/project"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('project') ? 'text-champagne-800 font-bold border-b border-champagne-600 pb-0.5' : 'text-charcoal-600'
              }`}
            >
              Checklist Persiapan
            </Link>
            <Link
              href="/customer/payments"
              className={`hover:text-champagne transition shrink-0 ${
                pathname.includes('payments') ? 'text-champagne-800 font-bold border-b border-champagne-600 pb-0.5' : 'text-charcoal-600'
              }`}
            >
              Tagihan & Bayar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
