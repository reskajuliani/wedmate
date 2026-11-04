'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, UserCheck, Clock, UserX, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { demoStore } from '@/lib/demo-store';

export default function RoleSwitcher() {
  const { user, switchRole, refreshUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const getActiveRoleKey = () => {
    if (!user) return 'guest';
    if (user.role === 'ADMIN') return 'admin';
    if (user.status === 'PENDING') return 'pending';
    return 'approved';
  };

  const currentKey = getActiveRoleKey();

  const handleReset = () => {
    if (confirm('Reset semua data demo WEDMATE kembali ke setelan awal?')) {
      demoStore.reset();
      refreshUser();
      switchRole('guest');
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
      <div className="bg-charcoal text-ivory rounded-2xl shadow-2xl border border-champagne/40 backdrop-blur-md overflow-hidden transition-all duration-300">
        {/* Header / Toggle Bar */}
        <div className="px-4 py-2.5 bg-charcoal-800 flex items-center justify-between border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-champagne opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-champagne"></span>
            </span>
            <span className="font-semibold text-champagne tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              WEDMATE Role Switcher & Gatekeeper Demo
            </span>
            <span className="hidden sm:inline-block text-gray-400">|</span>
            <span className="hidden sm:inline-block text-gray-300">
              Aktif: <strong className="text-white">{user ? user.full_name : 'Tamu (Guest)'}</strong>
            </span>
            {user && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30'
                    : user.status === 'APPROVED'
                    ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30'
                    : 'bg-amber-900/60 text-amber-200 border border-amber-500/30'
                }`}
              >
                {user.role === 'ADMIN' ? 'ADMIN' : `${user.role} (${user.status})`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Reset Data Demo"
              className="text-gray-400 hover:text-champagne transition-colors p-1 flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden md:inline">Reset Data</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:text-champagne text-gray-300 transition-colors"
              aria-label="Toggle switcher"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Buttons Content */}
        {isExpanded && (
          <div className="p-3 bg-charcoal/95 grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* 1. Guest */}
            <button
              onClick={() => switchRole('guest')}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                currentKey === 'guest'
                  ? 'bg-white/10 border-champagne shadow-inner ring-1 ring-champagne'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-gray-400" />
                  Tamu / Guest
                </span>
                <span className="text-[10px] text-gray-400 bg-black/40 px-1.5 py-0.5 rounded">Publik</span>
              </div>
              <p className="text-[11px] text-gray-300 line-clamp-1">Belum login, akses publik & landing page</p>
            </button>

            {/* 2. Pending Customer */}
            <button
              onClick={() => switchRole('pending')}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                currentKey === 'pending'
                  ? 'bg-amber-950/40 border-amber-400 shadow-inner ring-1 ring-amber-400'
                  : 'bg-white/5 border-white/10 hover:border-amber-400/40 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Customer (Pending)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  PENDING
                </span>
              </div>
              <p className="text-[11px] text-amber-100/70 line-clamp-1">Customer baru -&gt; Redirect ke Approval Pending</p>
            </button>

            {/* 3. Approved Customer */}
            <button
              onClick={() => switchRole('approved')}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                currentKey === 'approved'
                  ? 'bg-emerald-950/40 border-emerald-400 shadow-inner ring-1 ring-emerald-400'
                  : 'bg-white/5 border-white/10 hover:border-emerald-400/40 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Customer (Approved)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  APPROVED
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/70 line-clamp-1">Akses penuh Portal Customer, Checklist & Bayar</p>
            </button>

            {/* 4. Admin */}
            <button
              onClick={() => switchRole('admin')}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                currentKey === 'admin'
                  ? 'bg-purple-950/40 border-champagne shadow-inner ring-1 ring-champagne'
                  : 'bg-white/5 border-white/10 hover:border-champagne/40 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-champagne-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
                  Admin WEDMATE
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-300 line-clamp-1">Akses Penuh Dashboard, Approvals, Paket & Laporan</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
