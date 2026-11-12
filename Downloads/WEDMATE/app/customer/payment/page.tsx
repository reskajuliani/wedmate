'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { Payment, PaymentTransaction, PaymentMethod, OFFICIAL_PAYMENT_ACCOUNTS } from '@/lib/types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '@/lib/utils';
import {
  CreditCard,
  Copy,
  Check,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  X,
  Sparkles,
  Building2,
  Smartphone,
  ShieldCheck,
  Info,
  Calendar,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function CustomerPaymentPage() {
  const { user } = useAuth();
  const customerId = user?.id || '';

  const [payments, setPayments] = useState<Payment[]>(() => {
    return customerId ? demoStore.getPayments(customerId) : [];
  });
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    return customerId ? demoStore.getTransactions(customerId) : [];
  });

  // Clipboard copy state
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('BCA');
  const [amountInput, setAmountInput] = useState<string>('');
  const [senderNotes, setSenderNotes] = useState<string>('');
  const [proofPreview, setProofPreview] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const refreshData = async () => {
      if (!customerId) return;
      try {
        const userPayments = await supabaseService.getPayments(customerId);
        if (isMounted) setPayments(userPayments);

        const userTxs = await supabaseService.getTransactions(customerId);
        if (isMounted) setTransactions(userTxs);

        if (userPayments.length > 0 && !selectedPaymentId) {
          setSelectedPaymentId(userPayments[0].id);
          setAmountInput(
            userPayments[0].remaining_balance > 0
              ? userPayments[0].remaining_balance.toString()
              : userPayments[0].total_amount.toString()
          );
        }
      } catch (e) {
        console.warn('Refresh error in customer payments:', e);
      }
    };

    refreshData();
    const unsub = demoStore.subscribe(refreshData);
    const interval = setInterval(refreshData, 3000);
    return () => {
      isMounted = false;
      unsub();
      clearInterval(interval);
    };
  }, [customerId, selectedPaymentId]);

  const copyToClipboard = (text: string, label: string) => {
    const cleanText = text.replace(/\s+/g, '');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cleanText);
    }
    setCopiedAccount(label);
    showToast(`Nomor ${label} (${cleanText}) berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedAccount(null), 3000);
  };

  const handleOpenUpload = (targetPayment?: Payment) => {
    const p = targetPayment || payments[0];
    if (p) {
      setSelectedPaymentId(p.id);
      setAmountInput(p.remaining_balance > 0 ? p.remaining_balance.toString() : '10000000');
    }
    setFormError(null);
    setProofPreview('');
    setProofFileName('');
    setSenderNotes('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof window === 'undefined') return;
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.65);
            setProofPreview(compressed);
          } else {
            setProofPreview(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80');
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedPaymentId) {
      setFormError('Silakan pilih tagihan yang ingin dibayar.');
      return;
    }

    const amountNum = parseInt(amountInput, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Masukkan jumlah nominal transfer yang valid.');
      return;
    }

    if (!proofPreview) {
      setFormError('Unggah foto atau screenshot bukti transfer Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      await supabaseService.createTransaction({
        payment_id: selectedPaymentId,
        customer_id: customerId,
        payment_method: selectedMethod,
        amount: amountNum,
        proof_url: proofPreview,
        notes: senderNotes.trim() || undefined,
      });

      setIsModalOpen(false);
      showToast(
        'Bukti transfer berhasil diunggah! Status transaksi kini MENUNGGU VERIFIKASI tim keuangan.'
      );
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBilled = payments.reduce((acc, p) => acc + p.total_amount, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount_paid, 0);
  const totalRemaining = payments.reduce((acc, p) => acc + p.remaining_balance, 0);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest block mb-1">
              Portal Pengantin WEDMATE
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">
              Informasi Tagihan &amp; Pembayaran
            </h1>
            <p className="text-xs text-[#1A1A1A]/70 mt-1">
              Pantau sisa saldo tagihan paket pernikahan, nomor rekening resmi, dan konfirmasi bukti setor transaksi Anda.
            </p>
          </div>

          {payments.length > 0 && totalRemaining > 0 && (
            <button
              onClick={() => handleOpenUpload()}
              className="px-6 py-3.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white font-semibold text-xs shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Bukti Transfer</span>
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-fadeIn shadow-xs ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* SECTION 1: BILLING BALANCE CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
              Status Saldo Tagihan
            </h2>
            {payments.length > 0 && (
              <span className="text-xs text-gray-500 font-mono">
                {payments.length} Invoice Aktif
              </span>
            )}
          </div>

          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum ada data tersedia"
              description="Invoice tagihan pembayaran akan otomatis diterbitkan setelah reservasi booking paket pernikahan Anda disetujui oleh Admin."
              actionLabel="Lihat Status Booking"
              actionHref="/customer/booking"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Kontrak */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-2">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                  Total Nilai Kontrak
                </span>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                  {formatRupiah(totalBilled)}
                </div>
                <p className="text-xs text-gray-500">
                  Total biaya paket wedding yang disepakati
                </p>
              </div>

              {/* Sudah Dibayar */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-2">
                <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider block">
                  Total Telah Terverifikasi
                </span>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700">
                  {formatRupiah(totalPaid)}
                </div>
                <p className="text-xs text-gray-500">
                  Pembayaran yang sudah disetujui admin
                </p>
              </div>

              {/* Sisa Saldo */}
              <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#C8A46A] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#C8A46A] tracking-wider block">
                    Sisa Tagihan
                  </span>
                  {totalRemaining === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      LUNAS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      BELUM LUNAS
                    </span>
                  )}
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[#C8A46A]">
                  {formatRupiah(totalRemaining)}
                </div>
                <p className="text-xs text-gray-600">
                  {totalRemaining === 0
                    ? 'Semua kewajiban tagihan telah selesai.'
                    : 'Dapat dicicil sebelum hari H sesuai termin.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: OFFICIAL ACCOUNTS (BCA & DANA) */}
        <div className="space-y-4">
          <div className="border-b border-[#E8E2D8] pb-3">
            <span className="text-xs uppercase font-semibold text-[#C8A46A] tracking-widest block mb-0.5">
              Kanal Pembayaran Resmi
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
              Rekening &amp; E-Wallet Resmi WEDMATE
            </h2>
            <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
              Pastikan transfer hanya ditujukan ke akun resmi di bawah ini demi keamanan transaksi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account 1: BCA */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-xs space-y-5 hover:border-[#C8A46A] transition">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold font-mono text-sm border border-blue-200">
                    BCA
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1A1A1A]">
                      {OFFICIAL_PAYMENT_ACCOUNTS.BCA.bankName}
                    </h3>
                    <span className="text-[10px] text-gray-400">Transfer Bank &amp; M-Banking</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Terverifikasi
                </span>
              </div>

              {/* Number and Copy */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                    Nomor Rekening Resmi
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wider">
                    {OFFICIAL_PAYMENT_ACCOUNTS.BCA.accountNumber}
                  </span>
                  <span className="text-xs text-gray-600 block mt-0.5">
                    a/n <strong>{OFFICIAL_PAYMENT_ACCOUNTS.BCA.accountHolder}</strong>
                  </span>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(OFFICIAL_PAYMENT_ACCOUNTS.BCA.accountNumber, 'Rekening BCA')
                  }
                  className="p-3 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF8F5] text-[#1A1A1A] transition shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title="Salin nomor rekening"
                >
                  {copiedAccount === 'Rekening BCA' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#C8A46A]" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <span className="font-semibold text-gray-400 uppercase tracking-wider block text-[10px]">
                  Petunjuk Pembayaran:
                </span>
                <ul className="space-y-1">
                  {OFFICIAL_PAYMENT_ACCOUNTS.BCA.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#C8A46A] font-bold">•</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Account 2: DANA */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-xs space-y-5 hover:border-[#C8A46A] transition">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold font-mono text-sm border border-cyan-200">
                    DANA
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1A1A1A]">
                      {OFFICIAL_PAYMENT_ACCOUNTS.DANA.bankName}
                    </h3>
                    <span className="text-[10px] text-gray-400">Dompet Digital Resmi</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Terverifikasi
                </span>
              </div>

              {/* Number and Copy */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                    Nomor E-Wallet Resmi
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wider">
                    {OFFICIAL_PAYMENT_ACCOUNTS.DANA.accountNumber}
                  </span>
                  <span className="text-xs text-gray-600 block mt-0.5">
                    a/n <strong>{OFFICIAL_PAYMENT_ACCOUNTS.DANA.accountHolder}</strong>
                  </span>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(OFFICIAL_PAYMENT_ACCOUNTS.DANA.accountNumber, 'E-Wallet DANA')
                  }
                  className="p-3 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF8F5] text-[#1A1A1A] transition shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title="Salin nomor DANA"
                >
                  {copiedAccount === 'E-Wallet DANA' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#C8A46A]" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 text-[11px] text-gray-600">
                <span className="font-semibold text-gray-400 uppercase tracking-wider block text-[10px]">
                  Petunjuk Pembayaran:
                </span>
                <ul className="space-y-1">
                  {OFFICIAL_PAYMENT_ACCOUNTS.DANA.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#C8A46A] font-bold">•</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TRANSACTION HISTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                Riwayat Pembayaran &amp; Verifikasi
              </h2>
              <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
                Daftar bukti pembayaran yang telah Anda serahkan beserta status verifikasi dari tim administrasi.
              </p>
            </div>

            {payments.length > 0 && totalRemaining > 0 && (
              <button
                onClick={() => handleOpenUpload()}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-[#1A1A1A] hover:bg-[#C8A46A] hover:text-white hover:border-[#C8A46A] text-xs font-semibold transition cursor-pointer"
              >
                + Unggah Bukti Baru
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum ada data tersedia"
              description="Anda belum mengunggah bukti pembayaran. Lakukan transfer ke salah satu rekening resmi di atas dan unggah buktinya di sini."
              actionLabel={payments.length > 0 ? 'Unggah Bukti Transfer' : undefined}
              onAction={payments.length > 0 ? () => handleOpenUpload() : undefined}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-xs divide-y divide-[#E8E2D8]">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF8F5]/60 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Method badge */}
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-center font-bold text-xs text-[#1A1A1A] shrink-0">
                      {tx.payment_method}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                          {tx.transaction_number}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDateTimeIndo(tx.created_at)}
                        </span>
                      </div>

                      <div className="font-serif text-lg font-bold text-[#C8A46A]">
                        {formatRupiah(tx.amount)}
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-gray-600 italic">Catatan: {tx.notes}</p>
                      )}

                      {tx.rejection_reason && tx.status === 'REJECTED' && (
                        <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                          <strong>Alasan Penolakan:</strong> {tx.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    {/* Status Badge */}
                    {tx.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        DISETUJUI
                      </span>
                    ) : tx.status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        DITOLAK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        MENUNGGU VERIFIKASI
                      </span>
                    )}

                    {/* View Proof Button */}
                    <button
                      onClick={() => setPreviewImage(tx.proof_url)}
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] hover:bg-white text-[#1A1A1A] transition cursor-pointer"
                      title="Lihat Bukti Transfer"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: UPLOAD PAYMENT PROOF */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8E2D8] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#C8A46A] tracking-wider block">
                  Konfirmasi Pembayaran
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  Unggah Bukti Transfer
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="space-y-4">
              {/* Select Payment Invoice */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1A1A1A]">Pilih Tagihan</label>
                <select
                  value={selectedPaymentId}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                >
                  {payments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.invoice_number} — Sisa: {formatRupiah(p.remaining_balance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1A1A1A]">Metode Transfer</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('BCA')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      selectedMethod === 'BCA'
                        ? 'border-[#C8A46A] bg-[#FAF8F5] text-[#1A1A1A]'
                        : 'border-[#E8E2D8] text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>Bank BCA (446 156 3613)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('DANA')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      selectedMethod === 'DANA'
                        ? 'border-[#C8A46A] bg-[#FAF8F5] text-[#1A1A1A]'
                        : 'border-[#E8E2D8] text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>DANA (085551124373)</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Jumlah Nominal Transfer (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={100000}
                  step={50000}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Contoh: 15000000"
                  className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                  required
                />
              </div>

              {/* File Upload with Preview */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  File Bukti Transfer (Foto / Screenshot) <span className="text-red-500">*</span>
                </label>
                <div className="border border-dashed border-[#E8E2D8] rounded-2xl p-4 text-center bg-[#FAF8F5] hover:border-[#C8A46A] transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {proofPreview ? (
                    <div className="space-y-2">
                      <div className="relative h-32 w-full mx-auto rounded-xl overflow-hidden border border-[#E8E2D8]">
                        <Image
                          src={proofPreview}
                          alt="Preview bukti transfer"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        ✓ File dipilih: {proofFileName || 'Bukti Transfer'}
                      </p>
                      <span className="text-[10px] text-gray-400 block">
                        Klik untuk mengganti gambar
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      <Upload className="w-8 h-8 text-[#C8A46A] mx-auto" />
                      <p className="text-xs font-semibold text-[#1A1A1A]">
                        Klik untuk memilih foto struk / bukti mutasi
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Format JPG, PNG, WEBP (Maks 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sender Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Catatan Pengirim (Nama Pemilik Rekening / No Referensi)
                </label>
                <input
                  type="text"
                  value={senderNotes}
                  onChange={(e) => setSenderNotes(e.target.value)}
                  placeholder="Contoh: Transfer m-BCA a/n Budi Santoso"
                  className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#C8A46A]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#C8A46A] hover:bg-[#b59157] text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE PREVIEW */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E8E2D8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <h4 className="font-bold text-sm text-[#1A1A1A]">Bukti Pembayaran</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-black/5">
              <Image
                src={previewImage}
                alt="Bukti Transfer"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
