'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { PaymentTransaction, PaymentMethod, TransactionStatus } from '@/lib/types';
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
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminPaymentVerificationPage() {
  const { user } = useAuth();
  const [storeVersion, setStoreVersion] = useState(0);

  // Subscribe to demo store
  useEffect(() => {
    const unsub = demoStore.subscribe(() => setStoreVersion((v) => v + 1));
    return unsub;
  }, []);

  const adminId = user?.id || 'a0000000-0000-0000-0000-000000000001';

  // Get all transactions enriched
  const allTransactions: PaymentTransaction[] = demoStore.getTransactions();
  const allPayments = demoStore.getPayments();

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
    // Status filter
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
      return false;
    }
    // Method filter
    if (methodFilter !== 'ALL' && tx.payment_method !== methodFilter) {
      return false;
    }
    // Search query
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
  const handleApprove = (tx: PaymentTransaction) => {
    try {
      // Critical: strictly manual verification calling demoStore.verifyTransaction
      const updatedTx = demoStore.verifyTransaction(tx.id, 'APPROVED', adminId);
      const payment = demoStore.getPaymentById(tx.payment_id);

      setActionFeedback({
        type: 'success',
        message: `Pembayaran ${tx.transaction_number} senilai ${formatRupiah(
          tx.amount
        )} BERHASIL DISETUJUI! Saldo tagihan ${payment?.invoice_number || ''} diperbarui secara atomik: Terbayar ${formatRupiah(
          payment?.amount_paid || 0
        )}, Sisa ${formatRupiah(payment?.remaining_balance || 0)} (Status: ${payment?.status}).`,
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
  const handleConfirmReject = () => {
    if (!rejectModalTx) return;

    if (!rejectionReason.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }

    try {
      demoStore.verifyTransaction(rejectModalTx.id, 'REJECTED', adminId, rejectionReason.trim());
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
    <div className="min-h-screen bg-ivory py-10 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-charcoal-500">
            <Link href="/admin/approvals" className="hover:text-champagne flex items-center gap-1 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pusat Persetujuan</span>
            </Link>
            <span>/</span>
            <span className="text-charcoal-800 font-semibold">Verifikasi Pembayaran Manual</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white p-8 rounded-3xl border border-softbeige shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-semibold text-champagne tracking-widest">
                  Modul Keuangan & Rekonsiliasi
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verifikasi Manual Admin
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-charcoal">
                Verifikasi Bukti Transfer Pembayaran
              </h1>
              <p className="text-xs text-charcoal-500 mt-1 max-w-2xl">
                Setiap pembayaran yang diunggah pengantin harus diverifikasi secara manual oleh Admin (tanpa auto-approval). Persetujuan akan mengkalkulasi saldo tagihan secara atomik.
              </p>
            </div>

            {/* Official Accounts Quick Reference */}
            <div className="bg-ivory rounded-2xl p-4 border border-softbeige text-xs space-y-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-charcoal-400 block tracking-wider">
                Rekening Resmi Tujuan:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                  BCA
                </span>
                <span className="font-mono font-bold text-charcoal">446 156 3613</span>
                <span className="text-charcoal-400 text-[11px]">(WEDMATE INDONESIA)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">
                  DANA
                </span>
                <span className="font-mono font-bold text-charcoal">085551124373</span>
                <span className="text-charcoal-400 text-[11px]">(WEDMATE)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between border shadow-sm animate-fadeIn ${
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
              className="p-1 hover:bg-black/10 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-amber-800">
              {pendingCount} Transaksi
            </div>
            <div className="text-[11px] text-amber-700 font-mono mt-1 font-semibold">
              {formatRupiah(pendingAmount)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Disetujui (Approved)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-emerald-800">
              {approvedCount} Transaksi
            </div>
            <div className="text-[11px] text-emerald-700 font-mono mt-1 font-semibold">
              {formatRupiah(approvedAmount)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Ditolak (Rejected)</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-rose-800">
              {rejectedCount} Transaksi
            </div>
            <div className="text-[11px] text-charcoal-400 mt-1">
              Ditolak karena tidak sesuai
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-softbeige shadow-sm">
            <div className="text-xs text-charcoal-400 mb-1 flex items-center justify-between">
              <span>Total Seluruh Transaksi</span>
              <CreditCard className="w-4 h-4 text-champagne" />
            </div>
            <div className="text-2xl font-bold font-serif text-charcoal">
              {allTransactions.length} Transaksi
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1">
              BCA ({allTransactions.filter((t) => t.payment_method === 'BCA').length}) • DANA (
              {allTransactions.filter((t) => t.payment_method === 'DANA').length})
            </div>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="bg-white rounded-3xl p-6 border border-softbeige shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-ivory border border-softbeige overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-charcoal shadow-sm border border-softbeige font-bold'
                    : 'text-charcoal-500 hover:text-charcoal'
                }`}
              >
                Semua ({allTransactions.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                    : 'text-amber-800 hover:text-amber-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu Verifikasi</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                    : 'text-emerald-800 hover:text-emerald-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disetujui ({approvedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'REJECTED'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                    : 'text-rose-800 hover:text-rose-900'
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
                className="text-xs rounded-xl border border-softbeige bg-ivory/50 px-3 py-2 text-charcoal focus:outline-none focus:border-champagne"
              >
                <option value="ALL">Semua Metode</option>
                <option value="BCA">Bank BCA</option>
                <option value="DANA">DANA E-Wallet</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nomor TX / pengantin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-xs rounded-xl border border-softbeige bg-ivory/50 text-charcoal focus:outline-none focus:border-champagne w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Transactions Verification Table */}
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum Ada Transaksi Pembayaran"
              description="Belum ada bukti transfer yang diunggah oleh calon pengantin atau tidak ada transaksi yang cocok dengan filter yang dipilih."
              compact
            />
          ) : (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-softbeige text-charcoal-400 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-4">Transaksi</th>
                    <th className="py-3 px-4">Calon Pengantin</th>
                    <th className="py-3 px-4">Paket / Tagihan</th>
                    <th className="py-3 px-4">Metode & Rekening</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Bukti Transfer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Verifikasi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-softbeige">
                  {filteredTransactions.map((tx) => {
                    const isPending = tx.status === 'PENDING';
                    const isApproved = tx.status === 'APPROVED';
                    const isRejected = tx.status === 'REJECTED';
                    const payment = allPayments.find((p) => p.id === tx.payment_id);

                    return (
                      <tr
                        key={tx.id}
                        className={`transition ${
                          isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-ivory/40'
                        }`}
                      >
                        {/* Transaction ID & Date */}
                        <td className="py-4 px-4">
                          <div className="font-mono font-bold text-charcoal text-xs">
                            {tx.transaction_number}
                          </div>
                          <div className="text-[10px] text-charcoal-400 mt-0.5">
                            {formatDateTimeIndo(tx.created_at)}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-charcoal">
                            {tx.customer?.full_name || 'Calon Pengantin'}
                          </div>
                          <div className="text-[10px] text-charcoal-500 font-mono">
                            {tx.customer?.phone || '-'}
                          </div>
                        </td>

                        {/* Package & Invoice */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-charcoal">
                            {payment?.booking?.package?.name || 'Paket Pernikahan'}
                          </div>
                          <div className="text-[10px] text-charcoal-400 font-mono">
                            {payment?.invoice_number || '-'}
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono font-bold text-[11px] ${
                              tx.payment_method === 'BCA'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {tx.payment_method === 'BCA' ? (
                              <>
                                <Building2 className="w-3 h-3 text-blue-700" />
                                <span>BCA (446 156 3613)</span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-3 h-3 text-sky-700" />
                                <span>DANA (085551124373)</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4">
                          <div className="font-mono font-bold text-sm text-charcoal">
                            {formatRupiah(tx.amount)}
                          </div>
                          {tx.notes && (
                            <div className="text-[10px] text-charcoal-500 italic max-w-xs truncate mt-0.5">
                              "{tx.notes}"
                            </div>
                          )}
                        </td>

                        {/* Proof Image Button */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setPreviewModalTx(tx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-champagne-100 hover:bg-champagne-200 text-champagne-900 font-semibold text-xs transition active:scale-95 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-champagne-700" />
                            <span>Preview Bukti</span>
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-[10px] uppercase ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            <span>
                              {isApproved
                                ? 'Disetujui'
                                : isRejected
                                ? 'Ditolak'
                                : 'Menunggu Review'}
                            </span>
                          </span>

                          {isRejected && tx.rejection_reason && (
                            <div className="text-[10px] text-rose-700 mt-1 max-w-xs">
                              Alasan: {tx.rejection_reason}
                            </div>
                          )}
                        </td>

                        {/* Manual Admin Action Buttons */}
                        <td className="py-4 px-4 text-center">
                          {isPending ? (
                            <div className="inline-flex items-center gap-2">
                              {/* Approve Button */}
                              <button
                                onClick={() => handleApprove(tx)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
                                title="Setujui Pembayaran"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>

                              {/* Reject Button */}
                              <button
                                onClick={() => handleOpenReject(tx)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
                                title="Tolak Pembayaran"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-charcoal-400 font-mono">
                              Telah Diverifikasi
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

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW & VERIFY TRANSACTION MODAL                                 */}
      {/* ========================================================================= */}
      {previewModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-softbeige">
              <div>
                <span className="text-[10px] font-mono font-bold text-champagne-700 bg-champagne-100 px-2 py-0.5 rounded uppercase">
                  Detail Transaksi Verifikasi
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal mt-1">
                  {previewModalTx.transaction_number}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalTx(null)}
                className="p-1.5 rounded-full hover:bg-softbeige transition"
              >
                <X className="w-5 h-5 text-charcoal-600" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <span className="text-charcoal-400 block">Calon Pengantin:</span>
                <span className="font-bold text-charcoal text-sm">
                  {previewModalTx.customer?.full_name || 'Calon Pengantin'}
                </span>
              </div>
              <div>
                <span className="text-charcoal-400 block">Nominal Transfer:</span>
                <span className="font-bold text-emerald-800 text-sm font-mono">
                  {formatRupiah(previewModalTx.amount)}
                </span>
              </div>
              <div>
                <span className="text-charcoal-400 block">Metode Rekening:</span>
                <span className="font-bold text-charcoal">
                  {previewModalTx.payment_method === 'BCA'
                    ? 'BCA: 446 156 3613 (WEDMATE INDONESIA)'
                    : 'DANA: 085551124373 (WEDMATE)'}
                </span>
              </div>
              <div>
                <span className="text-charcoal-400 block">Waktu Pengiriman:</span>
                <span className="font-mono text-charcoal-600">
                  {formatDateTimeIndo(previewModalTx.created_at)}
                </span>
              </div>
            </div>

            {/* Proof Image / Document Container */}
            <div className="rounded-2xl bg-ivory p-3 border border-softbeige text-center my-2">
              <span className="text-[11px] font-semibold text-charcoal-500 block mb-2">
                Foto / Screenshot Bukti Struk Transfer:
              </span>
              <img
                src={previewModalTx.proof_url}
                alt="Bukti Transfer"
                className="max-h-72 w-auto mx-auto rounded-xl shadow-md border border-softbeige object-contain"
              />
            </div>

            {previewModalTx.notes && (
              <div className="p-3 rounded-xl bg-ivory text-xs border border-softbeige mt-3">
                <span className="font-semibold text-charcoal">Catatan Pengirim:</span>{' '}
                <span className="text-charcoal-600">{previewModalTx.notes}</span>
              </div>
            )}

            {/* Action Buttons in Modal */}
            <div className="pt-6 border-t border-softbeige mt-4 flex items-center justify-between">
              <button
                onClick={() => setPreviewModalTx(null)}
                className="px-4 py-2 rounded-xl border border-softbeige text-charcoal text-xs font-semibold hover:bg-softbeige transition"
              >
                Tutup
              </button>

              {previewModalTx.status === 'PENDING' ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenReject(previewModalTx)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    Tolak Bukti Transfer
                  </button>
                  <button
                    onClick={() => handleApprove(previewModalTx)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-wedding transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui Pembayaran Ini</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-mono font-bold text-charcoal-500">
                  Status: {previewModalTx.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT REASON FOR REJECTION                                         */}
      {/* ========================================================================= */}
      {rejectModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 pb-3 border-b border-softbeige text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal">
                  Tolak Bukti Pembayaran
                </h3>
                <p className="text-xs text-charcoal-500 font-mono">
                  {rejectModalTx.transaction_number}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-charcoal-600">
                Silakan tuliskan alasan penolakan agar pengantin mengetahui perbaikan apa yang harus dilakukan:
              </p>

              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Nomor referensi struk terpotong atau dana belum masuk di rekening koran BCA..."
                className="w-full text-xs rounded-xl border border-softbeige p-3 text-charcoal focus:outline-none focus:border-rose-400 bg-ivory/50"
                required
              />

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason('Foto struk buram / nomor referensi tidak terbaca.')
                  }
                  className="px-2 py-1 rounded bg-softbeige hover:bg-rose-100 text-charcoal-700"
                >
                  Struk buram
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason('Nominal yang ditransfer tidak sesuai dengan konfirmasi.')
                  }
                  className="px-2 py-1 rounded bg-softbeige hover:bg-rose-100 text-charcoal-700"
                >
                  Nominal tidak cocok
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionReason('Mutasi rekening bank belum mencatat dana masuk ini.')
                  }
                  className="px-2 py-1 rounded bg-softbeige hover:bg-rose-100 text-charcoal-700"
                >
                  Mutasi belum masuk
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-softbeige">
              <button
                onClick={() => setRejectModalTx(null)}
                className="px-4 py-2 rounded-xl border border-softbeige text-charcoal text-xs font-semibold hover:bg-softbeige transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
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
