import React from 'react';
import Link from 'next/link';
import { HeartHandshake, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { OFFICIAL_PAYMENT_ACCOUNTS } from '@/lib/types';

export default function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/80 pt-16 pb-28 border-t border-softbeige/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-champagne text-ivory flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 text-white" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                WED<span className="text-champagne font-sans font-light">MATE</span>
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Platform Wedding Organizer CRM & Manajemen Booking Pernikahan Terpadu. Menemani setiap langkah persiapan hari bahagia Anda dengan anggun, transparan, dan terpercaya.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-white text-base font-semibold mb-4 tracking-wide">Layanan & Navigasi</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/#packages" className="hover:text-champagne transition-colors">
                  Katalog Paket Pernikahan
                </Link>
              </li>
              <li>
                <Link href="/#workflow" className="hover:text-champagne transition-colors">
                  Alur & Checklist Persiapan
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-champagne transition-colors">
                  Pendaftaran Calon Pengantin
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-champagne transition-colors">
                  Login Portal Pengantin
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-champagne transition-colors">
                  Admin Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Verified Official Accounts */}
          <div>
            <h4 className="font-serif text-white text-base font-semibold mb-4 tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-champagne" />
              Rekening Resmi Terverifikasi
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-champagne font-semibold text-sm">
                  {OFFICIAL_PAYMENT_ACCOUNTS.BCA.bankName}
                </div>
                <div className="text-white font-mono text-base font-bold my-0.5">
                  {OFFICIAL_PAYMENT_ACCOUNTS.BCA.accountNumber}
                </div>
                <div className="text-gray-400">a/n {OFFICIAL_PAYMENT_ACCOUNTS.BCA.accountHolder}</div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="text-champagne font-semibold text-sm">
                  {OFFICIAL_PAYMENT_ACCOUNTS.DANA.bankName}
                </div>
                <div className="text-white font-mono text-base font-bold my-0.5">
                  {OFFICIAL_PAYMENT_ACCOUNTS.DANA.accountNumber}
                </div>
                <div className="text-gray-400">a/n {OFFICIAL_PAYMENT_ACCOUNTS.DANA.accountHolder}</div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-white text-base font-semibold mb-4 tracking-wide">Hubungi Kami</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <span>Wedding Gallery Lt. 2, Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-champagne shrink-0" />
                <span>+62 855-5112-4373 (Concierge WA)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-champagne shrink-0" />
                <span>support@wedmate.id</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} WEDMATE Platform Indonesia. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="mt-2 md:mt-0">Desain Modern Elegant Wedding • Champagne Gold Palette</p>
        </div>
      </div>
    </footer>
  );
}
