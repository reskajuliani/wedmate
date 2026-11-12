'use client';

import React from 'react';
import { Payment, PaymentTransaction } from '@/lib/types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '@/lib/utils';
import { Printer, X, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

interface InvoiceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  transactions: PaymentTransaction[];
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  weddingDate?: string;
  venueName?: string;
  packageName?: string;
}

export function InvoiceDocumentModal({
  isOpen,
  onClose,
  payment,
  transactions,
  clientName,
  clientEmail,
  clientPhone,
  weddingDate,
  venueName,
  packageName,
}: InvoiceDocumentModalProps) {
  if (!isOpen || !payment) return null;

  const approvedTransactions = transactions.filter((t) => t.status === 'APPROVED');
  const totalPaid = Math.max(
    payment.amount_paid || 0,
    approvedTransactions.reduce((acc, t) => acc + (t.amount || 0), 0)
  );
  const totalBilled = payment.total_amount || 0;
  const remaining = Math.max(totalBilled - totalPaid, 0);
  const isPaidOff = remaining === 0 && totalBilled > 0;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      {/* Print-specific style tag to isolate document */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 20mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#E8E2D8] shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="no-print p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8A46A]"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-[#1A1A1A]">
              Pratinjau Dokumen Tagihan Resmi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8A46A] hover:bg-[#b59157] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-[#1A1A1A] hover:bg-white border border-[#E8E2D8] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-8 sm:p-12 text-[#1A1A1A] space-y-8 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-[#1A1A1A]">
            <div>
              <span className="font-serif text-3xl font-bold tracking-wider text-[#C8A46A] block">
                WEDMATE
              </span>
              <p className="text-xs text-[#1A1A1A]/70 font-serif italic mt-0.5">
                Luxury Wedding Organizer &amp; Event Production
              </p>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                Jl. Senayan Utama No. 88, Jakarta Pusat • Telp: (021) 855-9000<br />
                Email: billing@wedmate.id • Web: wedmate-mauve.vercel.app
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-widest block">
                INVOICE TAGIHAN RESMI
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                {payment.invoice_number}
              </h2>
              <p className="text-xs text-gray-500">
                Tanggal Terbit: {formatDateIndo(payment.created_at)}
              </p>
              <div className="pt-2">
                {isPaidOff ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    LUNAS (PAID IN FULL)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    BELUM LUNAS (PARTIAL / UNPAID)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Event Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8]">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Ditujukan Kepada Klien
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">{clientName}</h3>
              <p className="text-xs text-gray-600 mt-1">{clientEmail}</p>
              {clientPhone && <p className="text-xs text-gray-600">Telp: {clientPhone}</p>}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Rincian Acara Pernikahan
              </span>
              <p className="text-xs text-gray-700">
                <strong>Paket:</strong> {packageName || 'Luxury Wedding Package'}
              </p>
              <p className="text-xs text-gray-700">
                <strong>Hari H:</strong> {weddingDate ? formatDateIndo(weddingDate) : '-'}
              </p>
              <p className="text-xs text-gray-700">
                <strong>Lokasi/Venue:</strong> {venueName || 'Lokasi Reservasi'}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Rincian Tagihan Layanan
            </h4>
            <table className="w-full text-left text-xs border border-[#E8E2D8] rounded-xl overflow-hidden">
              <thead className="bg-[#FAF8F5] text-gray-600 border-b border-[#E8E2D8]">
                <tr>
                  <th className="p-3 font-semibold">Deskripsi Layanan &amp; Paket</th>
                  <th className="p-3 text-right font-semibold">Jumlah Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                <tr>
                  <td className="p-3">
                    <strong className="text-[#1A1A1A] block">{packageName || 'Paket Pernikahan WEDMATE'}</strong>
                    <span className="text-gray-500">
                      Layanan Wedding Organizer, produksi acara, vendor coordination, dan pendampingan timeline pernikahan.
                    </span>
                  </td>
                  <td className="p-3 text-right font-serif font-bold text-sm text-[#1A1A1A]">
                    {formatRupiah(totalBilled)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment History Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Riwayat Transaksi Terverifikasi
            </h4>
            {approvedTransactions.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8]">
                Belum ada pembayaran yang terverifikasi untuk tagihan ini.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-[#E8E2D8] rounded-xl overflow-hidden">
                <thead className="bg-[#FAF8F5] text-gray-600 border-b border-[#E8E2D8]">
                  <tr>
                    <th className="p-2.5 font-semibold">Kode Transaksi</th>
                    <th className="p-2.5 font-semibold">Metode</th>
                    <th className="p-2.5 font-semibold">Waktu Setor</th>
                    <th className="p-2.5 text-right font-semibold">Nominal Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {approvedTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="p-2.5 font-mono text-[11px] text-[#1A1A1A]">
                        {tx.transaction_number}
                      </td>
                      <td className="p-2.5 text-gray-600">{tx.payment_method}</td>
                      <td className="p-2.5 text-gray-500">
                        {tx.created_at ? formatDateTimeIndo(tx.created_at) : '-'}
                      </td>
                      <td className="p-2.5 text-right font-serif font-bold text-emerald-700">
                        + {formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Totals Summary Card */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-2 p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Nilai Kontrak:</span>
                <span className="font-semibold text-[#1A1A1A]">{formatRupiah(totalBilled)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Terverifikasi Admin:</span>
                <span className="font-bold">- {formatRupiah(totalPaid)}</span>
              </div>
              <div className="pt-2 border-t border-[#E8E2D8] flex justify-between items-center">
                <span className="font-bold text-[#1A1A1A]">Sisa Tagihan:</span>
                <span className="font-serif text-base font-bold text-[#C8A46A]">
                  {formatRupiah(remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <strong className="text-[#1A1A1A] block">Rekening Resmi Pelunasan:</strong>
            <p>• Bank Central Asia (BCA): <strong>446 156 3613</strong> a.n. WEDMATE INDONESIA</p>
            <p>• DANA Dompet Digital: <strong>085551124373</strong> a.n. WEDMATE</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#E8E2D8] text-center text-xs">
            <div>
              <p className="text-gray-500 mb-16">Disetujui &amp; Diterima oleh Klien,</p>
              <p className="font-bold text-[#1A1A1A] border-t border-gray-300 pt-1 inline-block min-w-[160px]">
                {clientName}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-16">Wedding Director &amp; Finance WO,</p>
              <p className="font-bold text-[#1A1A1A] border-t border-gray-300 pt-1 inline-block min-w-[160px]">
                WEDMATE INDONESIA
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
