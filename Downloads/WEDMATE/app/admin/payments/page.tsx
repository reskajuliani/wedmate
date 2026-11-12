'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { Payment, PaymentTransaction, PaymentMethod, TransactionStatus } from '@/lib/types';
import { formatRupiah, formatDateTimeIndo } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Building2,
  Smartphone,
  ExternalLink,
  Check,
  FileSpreadsheet,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminPaymentVerificationPage() {
  const { user } = useAuth();
  const adminId = user?.id || 'a0000000-0000-0000-0000-000000000001';

  const [allTransactions, setAllTransactions] = useState<PaymentTransaction[]>(() => {
    return demoStore.getTransactions();
  });
  const [allPayments, setAllPayments] = useState<Payment[]>(() => {
    return demoStore.getPayments();
  });

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [previewModalTx, setPreviewModalTx] = useState<PaymentTransaction | null>(null);
  const [rejectModalTx, setRejectModalTx] = useState<PaymentTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Subscribe to demo store and fetch from supabaseService with 3s auto-polling
  useEffect(() => {
    let isMounted = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let isFetching = false;

    const refreshData = async () => {
      try {
        const txs = await supabaseService.getTransactions();
        if (isMounted) setAllTransactions(txs);
        const pmts = await supabaseService.getPayments();
        if (isMounted) setAllPayments(pmts);
      } catch (e) {
        console.warn('Error loading payments in admin:', e);
      }
    };

    const executeSmartPoll = async () => {
      if (!isMounted) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isFetching) return;

      isFetching = true;
      try {
        await refreshData();
      } finally {
        isFetching = false;
        if (isMounted) {
          pollTimer = setTimeout(executeSmartPoll, 3000);
        }
      }
    };

    executeSmartPoll();

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && isMounted && !isFetching) {
        if (pollTimer) clearTimeout(pollTimer);
        executeSmartPoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const unsub = demoStore.subscribe(executeSmartPoll);

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsub();
    };
  }, []);

  // Pre-filter calculations
  const pendingCount = allTransactions.filter((t) => t.status === 'PENDING').length;
  const approvedCount = allTransactions.filter((t) => t.status === 'APPROVED').length;
  const rejectedCount = allTransactions.filter((t) => t.status === 'REJECTED').length;

  const pendingAmount = allTransactions
    .filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + t.amount, 0);

  const approvedAmount = allTransactions
    .filter((t) => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Apply filters
  const filteredTransactions = allTransactions.filter((tx) => {
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
      return false;
    }
    if (methodFilter !== 'ALL' && tx.payment_method !== methodFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTxNum = tx.transaction_number.toLowerCase().includes(q);
      const matchCust = tx.customer?.full_name?.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      if (!matchTxNum && !matchCust && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  // Handle Approve Transaction
  const handleApprove = async (tx: PaymentTransaction) => {
    try {
      // Optimistically update transactions & payments in local state
      setAllTransactions((prev) =>
        prev.map((t) =>
          t.id === tx.id
            ? { ...t, status: 'APPROVED', verified_by: adminId, verified_at: new Date().toISOString() }
            : t
        )
      );
      setAllPayments((prev) =>
        prev.map((p) => {
          if (p.id === tx.payment_id || (tx.customer_id && p.customer_id === tx.customer_id)) {
            const newPaid = Number(p.amount_paid || 0) + Number(tx.amount || 0);
            const newRemaining = Math.max(Number(p.total_amount || 0) - newPaid, 0);
            return {
              ...p,
              amount_paid: newPaid,
              remaining_balance: newRemaining,
              status: newPaid >= Number(p.total_amount || 0) && Number(p.total_amount || 0) > 0 ? 'PAID' : 'PARTIAL',
            };
          }
          return p;
        })
      );

      const updatedTx = await supabaseService.verifyTransaction(tx.id, 'APPROVED', adminId);
      const payment = allPayments.find((p) => p.id === tx.payment_id || (tx.customer_id && p.customer_id === tx.customer_id));

      setActionFeedback({
        type: 'success',
        message: `Pembayaran ${tx.transaction_number} senilai ${formatRupiah(
          tx.amount
        )} BERHASIL DISETUJUI! Saldo tagihan ${payment?.invoice_number || ''} diperbarui secara atomik.`,
      });

      if (previewModalTx?.id === tx.id) {
        setPreviewModalTx(null);
      }

      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Gagal memverifikasi transaksi.',
      });
    }
  };

  // Open Reject Modal
  const handleOpenReject = (tx: PaymentTransaction) => {
    setRejectModalTx(tx);
    setRejectionReason('Bukti transfer tidak valid atau nominal tidak sesuai catatan rekening bank.');
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectModalTx) return;

    if (!rejectionReason.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }

    try {
      setAllTransactions((prev) =>
        prev.map((t) =>
          t.id === rejectModalTx.id
            ? { ...t, status: 'REJECTED', rejection_reason: rejectionReason.trim(), verified_by: adminId, verified_at: new Date().toISOString() }
            : t
        )
      );
      await supabaseService.verifyTransaction(rejectModalTx.id, 'REJECTED', adminId, rejectionReason.trim());
      setActionFeedback({
        type: 'success',
        message: `Pembayaran ${rejectModalTx.transaction_number} telah DITOLAK. Alasan: "${rejectionReason.trim()}". Status tagihan tetap terjaga utuh.`,
      });

      setRejectModalTx(null);
      setRejectionReason('');
      if (previewModalTx?.id === rejectModalTx.id) {
        setPreviewModalTx(null);
      }

      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Gagal menolak transaksi.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/60">
            <Link href="/admin/approvals" className="hover:text-[#C8A46A] flex items-center gap-1 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pusat Persetujuan</span>
            </Link>
            <span>/</span>
            <span className="text-[#1A1A1A] font-semibold">Verifikasi Pembayaran Manual</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white p-8 rounded-3xl border border-[#E8E2D8] shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest">
                  Modul Keuangan &amp; Rekonsiliasi
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verifikasi Manual Admin
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">
                Verifikasi Bukti Transfer Pembayaran
              </h1>
              <p className="text-xs text-[#1A1A1A]/70 mt-1 max-w-2xl">
                Setiap pembayaran yang diunggah pengantin harus diverifikasi secara manual oleh Admin (tanpa auto-approval). Persetujuan akan mengkalkulasi saldo tagihan secara atomik.
              </p>
            </div>

            {/* Official Accounts Quick Reference */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D8] text-xs space-y-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/60 block tracking-wider">
                Rekening Resmi Tujuan:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                  BCA
                </span>
                <span className="font-mono font-bold text-[#1A1A1A]">446 156 3613</span>
                <span className="text-[#1A1A1A]/50 text-[11px]">(WEDMATE INDONESIA)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                  DANA
                </span>
                <span className="font-mono font-bold text-[#1A1A1A]">085551124373</span>
                <span className="text-[#1A1A1A]/50 text-[11px]">(WEDMATE)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between border shadow-xs animate-fadeIn ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="p-1 hover:bg-black/10 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Menunggu Review
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{pendingCount}</span>
              <span className="text-xs text-amber-600 font-medium">Transaksi</span>
            </div>
            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
              Nominal: {formatRupiah(pendingAmount)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disetujui
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{approvedCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Transaksi</span>
            </div>
            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
              Total: {formatRupiah(approvedAmount)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Ditolak
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{rejectedCount}</span>
              <span className="text-xs text-rose-600 font-medium">Transaksi</span>
            </div>
            <div className="text-[11px] text-[#1A1A1A]/50 mt-1">Struk tidak cocok</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#C8A46A] tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Total Transaksi
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{allTransactions.length}</span>
              <span className="text-xs text-[#C8A46A] font-medium">Invoice Aktif: {allPayments.length}</span>
            </div>
            <div className="text-[11px] text-[#1A1A1A]/50 mt-1">Di dalam database</div>
          </div>
        </div>

        {/* Filter and Table Container */}
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#1A1A1A] text-white font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#E8E2D8]'
                }`}
              >
                Semua ({allTransactions.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu Review ({pendingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disetujui ({approvedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Ditolak ({rejectedCount})</span>
              </button>
            </div>

            {/* Method filter & Search input */}
            <div className="flex items-center gap-3">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="text-xs rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#C8A46A]"
              >
                <option value="ALL">Semua Metode</option>
                <option value="BCA">Bank BCA</option>
                <option value="DANA">DANA E-Wallet</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nomor TX / pengantin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#1A1A1A] focus:outline-none focus:border-[#C8A46A] w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Transactions Verification Table */}
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum ada data tersedia"
              description="Belum ada bukti transfer yang diunggah oleh calon pengantin atau tidak ada transaksi yang cocok dengan filter yang dipilih."
              compact
            />
          ) : (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E2D8] text-[#1A1A1A]/60 uppercase font-semibold text-[11px] tracking-wider bg-[#FAF8F5]">
                    <th className="py-3 px-4">Transaksi</th>
                    <th className="py-3 px-4">Calon Pengantin</th>
                    <th className="py-3 px-4">Paket / Tagihan</th>
                    <th className="py-3 px-4">Metode &amp; Rekening</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Bukti Transfer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Verifikasi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {filteredTransactions.map((tx) => {
                    const isPending = tx.status === 'PENDING';
                    const isApproved = tx.status === 'APPROVED';
                    const isRejected = tx.status === 'REJECTED';
                    const payment = allPayments.find((p) => p.id === tx.payment_id);

                    return (
                      <tr
                        key={tx.id}
                        className={`transition ${
                          isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-[#FAF8F5]/60'
                        }`}
                      >
                        {/* Transaction ID & Date */}
                        <td className="py-4 px-4">
                          <div className="font-mono font-bold text-[#1A1A1A] text-xs">
                            {tx.transaction_number}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {formatDateTimeIndo(tx.created_at)}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-[#1A1A1A]">
                            {tx.customer?.full_name || 'Calon Pengantin'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {tx.customer?.phone || '-'}
                          </div>
                        </td>

                        {/* Package & Invoice */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-[#1A1A1A]">
                            {payment?.booking?.package?.name || 'Paket Pernikahan'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {payment?.invoice_number || '-'}
                          </div>
                        </td>

                        {/* Method */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAF8F5] border border-[#E8E2D8] text-[#1A1A1A]">
                            {tx.payment_method === 'BCA' ? (
                              <Building2 className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Smartphone className="w-3 h-3 text-cyan-600" />
                            )}
                            <span>{tx.payment_method}</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4">
                          <div className="font-serif font-bold text-sm text-[#C8A46A]">
                            {formatRupiah(tx.amount)}
                          </div>
                        </td>

                        {/* Proof Thumbnail */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setPreviewModalTx(tx)}
                            className="flex items-center gap-1.5 text-xs text-[#C8A46A] hover:underline font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Bukti</span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isRejected ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>
                              {isApproved
                                ? 'Disetujui'
                                : isRejected
                                ? 'Ditolak'
                                : 'Menunggu Review'}
                            </span>
                          </span>
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-4 px-4 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApprove(tx)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenReject(tx)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-[11px] text-emerald-700 font-medium">
                                ✓ Terverifikasi
                              </span>
                              {tx.customer?.phone && (
                                <a
                                  href={`https://wa.me/${tx.customer.phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Halo Kak ${tx.customer.full_name || 'Pengantin'}! 💐 Pembayaran transfer Anda sebesar ${formatRupiah(tx.amount)} (${tx.payment_method} - ${tx.transaction_number}) telah BERHASIL DIVERIFIKASI oleh tim keuangan WEDMATE. Saldo dan invoice tagihan Anda telah diperbarui di portal: https://wedmate-mauve.vercel.app/customer/payment`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition inline-flex items-center gap-0.5 text-[10px] font-semibold"
                                  title="Kirim Konfirmasi via WhatsApp"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>WA</span>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-700 font-medium">
                              ✕ Ditolak
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: PREVIEW & VERIFY TRANSACTION MODAL */}
      {previewModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C8A46A] tracking-wider block">
                  Verifikasi Bukti Transfer
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  {previewModalTx.transaction_number}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalTx(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8]">
              <div>
                <span className="text-gray-500 block text-[10px]">Nama Pengirim:</span>
                <strong className="text-[#1A1A1A]">
                  {previewModalTx.customer?.full_name || 'Calon Pengantin'}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Nominal Transfer:</span>
                <strong className="text-[#C8A46A] font-serif font-bold text-sm">
                  {formatRupiah(previewModalTx.amount)}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Metode Pembayaran:</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {previewModalTx.payment_method === 'BCA'
                    ? 'Bank BCA (446 156 3613)'
                    : 'DANA (085551124373)'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Waktu Unggah:</span>
                <span className="text-[#1A1A1A]">
                  {formatDateTimeIndo(previewModalTx.created_at)}
                </span>
              </div>
            </div>

            {/* Proof Image Box */}
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-black/5 border border-[#E8E2D8]">
              <Image
                src={previewModalTx.proof_url}
                alt="Bukti Transfer"
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            {previewModalTx.notes && (
              <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs border border-[#E8E2D8]">
                <span className="font-semibold text-gray-500 block text-[10px]">Catatan Pengirim:</span>
                <span className="text-[#1A1A1A]">{previewModalTx.notes}</span>
              </div>
            )}

            {/* Footer with verification action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D8]">
              <button
                onClick={() => setPreviewModalTx(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Tutup
              </button>

              {previewModalTx.status === 'PENDING' ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenReject(previewModalTx)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Tolak Bukti Transfer
                  </button>
                  <button
                    onClick={() => handleApprove(previewModalTx)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui Pembayaran Ini</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-mono font-bold text-gray-500">
                  Status: {previewModalTx.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT REASON FOR REJECTION */}
      {rejectModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8] text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  Tolak Bukti Pembayaran
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {rejectModalTx.transaction_number}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-600">
                Silakan tuliskan alasan penolakan agar pengantin mengetahui perbaikan apa yang harus dilakukan:
              </p>

              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Nomor referensi struk terpotong atau dana belum masuk di rekening koran BCA..."
                className="w-full text-xs rounded-xl border border-[#E8E2D8] p-3 text-[#1A1A1A] focus:outline-none focus:border-rose-400 bg-[#FAF8F5]"
                required
              />

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason('Foto struk buram / nomor referensi tidak terbaca.')
                  }
                  className="px-2 py-1 rounded bg-[#E8E2D8] hover:bg-rose-100 text-gray-700 cursor-pointer"
                >
                  Struk buram
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason('Nominal yang ditransfer tidak sesuai dengan konfirmasi.')
                  }
                  className="px-2 py-1 rounded bg-[#E8E2D8] hover:bg-rose-100 text-gray-700 cursor-pointer"
                >
                  Nominal tidak cocok
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason('Mutasi rekening bank belum mencatat dana masuk ini.')
                  }
                  className="px-2 py-1 rounded bg-[#E8E2D8] hover:bg-rose-100 text-gray-700 cursor-pointer"
                >
                  Mutasi belum masuk
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D8]">
              <button
                onClick={() => setRejectModalTx(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E2D8] text-[#1A1A1A] text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Konfirmasi Tolak Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
