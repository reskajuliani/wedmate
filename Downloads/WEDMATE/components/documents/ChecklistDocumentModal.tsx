'use client';

import React from 'react';
import { WeddingProject, WeddingTask, Booking } from '@/lib/types';
import { formatDateIndo } from '@/lib/utils';
import { Printer, X, CheckSquare, Square, Calendar, MapPin, Users, ShieldCheck } from 'lucide-react';

interface ChecklistDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WeddingProject | null;
  tasks: WeddingTask[];
  confirmedBooking: Booking | null;
  clientName: string;
}

export function ChecklistDocumentModal({
  isOpen,
  onClose,
  project,
  tasks,
  confirmedBooking,
  clientName,
}: ChecklistDocumentModalProps) {
  if (!isOpen || (!project && !confirmedBooking)) return null;

  const weddingDate = project?.wedding_date || confirmedBooking?.wedding_date || '';
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-checklist,
          #printable-checklist * {
            visibility: visible !important;
          }
          #printable-checklist {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 15mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#E8E2D8] shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Top Action Bar (Hidden in print) */}
        <div className="no-print p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8A46A]"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-[#1A1A1A]">
              Pratinjau Lembar Kerja Checklist WO
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

        {/* Printable Checklist Worksheet */}
        <div id="printable-checklist" className="p-8 sm:p-12 text-[#1A1A1A] space-y-6 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-[#1A1A1A]">
            <div>
              <span className="font-serif text-3xl font-bold tracking-wider text-[#C8A46A] block">
                WEDMATE
              </span>
              <p className="text-xs text-[#1A1A1A]/70 font-serif italic">
                Wedding Organizer &amp; Event Production Specialist
              </p>
            </div>

            <div className="sm:text-right space-y-0.5">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-widest block">
                LEMBAR KERJA PERSIAPAN PERNIKAHAN
              </span>
              <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">
                {project?.title || `Pernikahan ${clientName}`}
              </h2>
              <p className="text-[11px] text-gray-500">
                Dicetak: {formatDateIndo(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Mempelai</span>
              <strong className="text-[#1A1A1A] text-sm block">{clientName}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Tanggal Acara</span>
              <strong className="text-[#1A1A1A] text-sm block">{weddingDate ? formatDateIndo(weddingDate) : '-'}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Venue &amp; Lokasi</span>
              <strong className="text-[#1A1A1A] block">{confirmedBooking?.venue_name || 'Venue Terkonfirmasi'}</strong>
              <span className="text-[10px] text-gray-500 line-clamp-1">{confirmedBooking?.venue_address || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Kesiapan Checklist</span>
              <strong className="text-[#C8A46A] text-sm block">{progressPercent}% Selesai</strong>
              <span className="text-[10px] text-gray-500">({completedTasks} dari {tasks.length} Tugas)</span>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Daftar Checklist Tugas &amp; Milestone Acara
            </h4>

            <table className="w-full text-left text-xs border border-[#E8E2D8] rounded-xl overflow-hidden">
              <thead className="bg-[#FAF8F5] text-gray-600 border-b border-[#E8E2D8]">
                <tr>
                  <th className="p-2.5 w-8 text-center font-semibold">Cek</th>
                  <th className="p-2.5 font-semibold">Rincian Tugas &amp; Spesifikasi Layanan</th>
                  <th className="p-2.5 w-24 font-semibold">Kategori</th>
                  <th className="p-2.5 w-28 font-semibold">Tenggat</th>
                  <th className="p-2.5 w-24 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50">
                    <td className="p-2.5 text-center">
                      {task.status === 'COMPLETED' ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 inline-block" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 inline-block" />
                      )}
                    </td>
                    <td className="p-2.5">
                      <strong className={`block text-xs ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-[#1A1A1A]'}`}>
                        {task.title}
                      </strong>
                      {task.description && (
                        <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                          {task.description}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-[11px] text-gray-600 font-medium">
                      {task.category}
                    </td>
                    <td className="p-2.5 text-[11px] text-gray-500">
                      {task.due_date ? formatDateIndo(task.due_date) : 'Hari H'}
                    </td>
                    <td className="p-2.5 text-center">
                      {task.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          SELESAI
                        </span>
                      ) : task.status === 'IN_PROGRESS' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          PROSES
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          BELUM
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signoff / Technical Meeting Section */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#E8E2D8] text-center text-xs">
            <div>
              <p className="text-gray-500 mb-14">Perwakilan Pengantin &amp; Keluarga,</p>
              <p className="font-bold text-[#1A1A1A] border-t border-gray-300 pt-1 inline-block min-w-[160px]">
                {clientName}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-14">Lead Wedding Director WEDMATE,</p>
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
