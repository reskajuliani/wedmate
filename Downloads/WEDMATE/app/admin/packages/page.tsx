'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { demoStore } from '@/lib/demo-store';
import { supabaseService } from '@/lib/supabase-service';
import { WeddingPackage } from '@/lib/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Users,
  Search,
  Sparkles,
  ArrowLeft,
  X,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Intimate Ballroom', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80' },
  { label: 'Classic Elegance', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80' },
  { label: 'Royal Grandeur', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80' },
  { label: 'Outdoor Garden', url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=800&q=80' },
];

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<WeddingPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPrice, setFormPrice] = useState<number>(35000000);
  const [formGuests, setFormGuests] = useState<number>(250);
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState<string[]>([
    'Wedding Organizer On-the-Day (6 Crew Profesional)',
    'Master of Ceremony (MC) Acara Akad & Resepsi',
    'Dekorasi Pelaminan & Ruang Resepsi Elegan',
  ]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [formImageUrl, setFormImageUrl] = useState(SAMPLE_IMAGE_PRESETS[0].url);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<WeddingPackage | null>(null);

  // Subscribe to demo store and fetch from supabaseService
  useEffect(() => {
    const refreshData = async () => {
      const allPkgs = await supabaseService.getPackages(false);
      setPackages(allPkgs);
    };
    refreshData();
    const unsub = demoStore.subscribe(refreshData);
    return unsub;
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingPackageId(null);
    setFormName('');
    setFormSlug('');
    setFormPrice(30000000);
    setFormGuests(200);
    setFormDescription('Paket pernikahan eksklusif dirancang untuk pengalaman resepsi tak terlupakan.');
    setFormFeatures([
      'Wedding Organizer On-the-Day (6 Crew)',
      'Master of Ceremony (MC) Profesional',
      'Dekorasi Pelaminan Bunga Segar',
      'Dokumentasi Foto & Video Cinematic',
    ]);
    setNewFeatureInput('');
    setFormImageUrl(SAMPLE_IMAGE_PRESETS[0].url);
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (pkg: WeddingPackage) => {
    setEditingPackageId(pkg.id);
    setFormName(pkg.name);
    setFormSlug(pkg.slug);
    setFormPrice(pkg.price);
    setFormGuests(pkg.estimated_guests);
    setFormDescription(pkg.description);
    setFormFeatures([...pkg.features]);
    setNewFeatureInput('');
    setFormImageUrl(pkg.image_url || SAMPLE_IMAGE_PRESETS[0].url);
    setFormIsActive(pkg.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  // Auto generate slug from name
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingPackageId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormSlug(generatedSlug);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFormFeatures([...formFeatures, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== index));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Nama paket pernikahan wajib diisi.');
      return;
    }
    if (!formSlug.trim()) {
      setFormError('Slug URL paket wajib diisi.');
      return;
    }
    if (formPrice <= 0) {
      setFormError('Harga paket harus lebih besar dari 0.');
      return;
    }
    if (formGuests <= 0) {
      setFormError('Estimasi tamu harus minimal 1 orang.');
      return;
    }
    if (formFeatures.length === 0) {
      setFormError('Wajib menyertakan minimal 1 fitur/fasilitas paket.');
      return;
    }

    try {
      await supabaseService.savePackage({
        id: editingPackageId || undefined,
        name: formName.trim(),
        slug: formSlug.trim(),
        price: formPrice,
        estimated_guests: formGuests,
        description: formDescription.trim(),
        features: formFeatures,
        image_url: formImageUrl,
        is_active: formIsActive,
      });

      if (editingPackageId) {
        showNotification(`Paket "${formName}" berhasil diperbarui!`);
      } else {
        showNotification(`Paket baru "${formName}" berhasil ditambahkan ke katalog!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan paket.');
    }
  };

  const handleToggleActive = async (pkg: WeddingPackage) => {
    const updatedStatus = !pkg.is_active;
    await supabaseService.savePackage({
      ...pkg,
      is_active: updatedStatus,
    });
    showNotification(
      `Paket "${pkg.name}" kini ${updatedStatus ? 'AKTIF dan tampil di katalog' : 'DINONAKTIFKAN'}`
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    await supabaseService.deletePackage(deleteTarget.id);
    setDeleteTarget(null);
    showNotification(`Paket "${name}" telah dihapus dari sistem.`);
  };

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'ACTIVE') return matchesSearch && pkg.is_active;
    if (filterStatus === 'INACTIVE') return matchesSearch && !pkg.is_active;
    return matchesSearch;
  });

  const activeCount = packages.filter((p) => p.is_active).length;
  const inactiveCount = packages.length - activeCount;

  return (
    <div className="min-h-screen bg-ivory py-10 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/admin/approvals"
              className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-champagne font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pusat Persetujuan</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-softbeige shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-semibold text-champagne tracking-widest">
                  Katalog Layanan
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold text-champagne-800 bg-champagne-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {packages.length} Total Paket
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-charcoal">
                Manajemen Paket Pernikahan
              </h1>
              <p className="text-xs text-charcoal-500 mt-1">
                Kelola paket wedding, rincian harga, kapasitas tamu, dan publikasi fitur layanan pengantin.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-champagne hover:bg-champagne-600 text-white font-semibold text-xs shadow-wedding hover:shadow-wedding-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Paket Baru</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition animate-fadeIn ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-softbeige shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-ivory rounded-xl border border-softbeige w-full md:w-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'ALL'
                  ? 'bg-champagne text-white shadow-sm'
                  : 'text-charcoal-600 hover:text-champagne'
              }`}
            >
              Semua ({packages.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-charcoal-600 hover:text-emerald-700'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'INACTIVE'
                  ? 'bg-charcoal text-white shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal'
              }`}
            >
              Nonaktif ({inactiveCount})
            </button>
          </div>

          {/* Search Bar & View Mode */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-softbeige bg-ivory/50 focus:outline-none focus:border-champagne focus:bg-white transition"
              />
            </div>

            <div className="flex items-center border border-softbeige rounded-xl p-1 bg-ivory/50">
              <button
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid Card"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-champagne text-white shadow-xs'
                    : 'text-charcoal-400 hover:text-charcoal'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-champagne text-white shadow-xs'
                    : 'text-charcoal-400 hover:text-charcoal'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Packages Content */}
        {filteredPackages.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Belum ada data tersedia"
            description="Tidak ada paket yang cocok dengan filter atau kata kunci pencarian saat ini."
            actionLabel="Reset Filter Pencarian"
            onAction={() => {
              setSearchQuery('');
              setFilterStatus('ALL');
            }}
          />
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`card-wedding rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                  !pkg.is_active ? 'opacity-75 border-dashed border-gray-300' : ''
                }`}
              >
                <div>
                  {/* Image cover & status badge */}
                  <div className="relative h-48 w-full bg-softbeige overflow-hidden">
                    <img
                      src={pkg.image_url || SAMPLE_IMAGE_PRESETS[0].url}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono shadow-sm ${
                          pkg.is_active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-charcoal text-white'
                        }`}
                      >
                        {pkg.is_active ? 'Aktif di Publik' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-charcoal flex items-center gap-1 shadow-sm">
                      <Users className="w-3.5 h-3.5 text-champagne" />
                      <span>{pkg.estimated_guests} Tamu</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-charcoal hover:text-champagne transition-colors">
                        {pkg.name}
                      </h3>
                      <div className="text-lg font-serif font-bold text-champagne-800 mt-1">
                        {formatRupiah(pkg.price)}
                      </div>
                      <p className="text-xs text-charcoal-500 line-clamp-2 mt-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="space-y-1.5 pt-3 border-t border-softbeige">
                      <div className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider mb-2">
                        Fitur Termasuk ({pkg.features.length})
                      </div>
                      {pkg.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-charcoal-700">
                          <Check className="w-3.5 h-3.5 text-champagne shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feature}</span>
                        </div>
                      ))}
                      {pkg.features.length > 4 && (
                        <div className="text-[11px] text-charcoal-400 font-medium pl-5">
                          +{pkg.features.length - 4} fitur lainnya...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-ivory/60 border-t border-softbeige flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    title={pkg.is_active ? 'Nonaktifkan paket' : 'Aktifkan paket'}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                      pkg.is_active
                        ? 'border-softbeige text-charcoal-600 hover:bg-charcoal hover:text-white'
                        : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    {pkg.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{pkg.is_active ? 'Nonaktif' : 'Aktifkan'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(pkg)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-softbeige hover:border-champagne text-charcoal text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-champagne" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(pkg)}
                      title="Hapus paket"
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-3xl border border-softbeige shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-ivory border-b border-softbeige text-charcoal-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Paket & Visual</th>
                    <th className="py-4 px-4">Estimasi Tamu</th>
                    <th className="py-4 px-4">Harga Paket</th>
                    <th className="py-4 px-4">Fasilitas Utama</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-softbeige">
                  {filteredPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-ivory/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={pkg.image_url || SAMPLE_IMAGE_PRESETS[0].url}
                            alt={pkg.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-softbeige"
                          />
                          <div>
                            <div className="font-serif font-bold text-sm text-charcoal">
                              {pkg.name}
                            </div>
                            <span className="text-[10px] text-charcoal-400 font-mono">
                              /{pkg.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        <div className="flex items-center gap-1 text-charcoal">
                          <Users className="w-3.5 h-3.5 text-champagne" />
                          <span>{pkg.estimated_guests} Tamu</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-serif font-bold text-champagne-800 text-sm">
                        {formatRupiah(pkg.price)}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <span className="line-clamp-1 text-charcoal-500">
                          {pkg.features.join(' • ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                            pkg.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleActive(pkg)}
                            title={pkg.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            className="p-1.5 text-charcoal-400 hover:text-champagne rounded-lg hover:bg-champagne-50 transition"
                          >
                            {pkg.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(pkg)}
                            className="p-1.5 text-charcoal-600 hover:text-champagne rounded-lg hover:bg-champagne-50 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(pkg)}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT PACKAGE */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-softbeige shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-softbeige">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-charcoal">
                    {editingPackageId ? 'Edit Paket Pernikahan' : 'Tambah Paket Pernikahan Baru'}
                  </h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Isi detail paket wedding lengkap dengan estimasi tamu, harga, dan fitur pendukung.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-charcoal-400 hover:text-charcoal hover:bg-ivory rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSavePackage} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Nama Paket *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Contoh: Royal Grandeur"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="royal-grandeur"
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Harga Paket (IDR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000000}
                      step={500000}
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne font-mono"
                    />
                    <div className="text-[11px] text-champagne-800 font-semibold mt-1">
                      Preview: {formatRupiah(formPrice || 0)}
                    </div>
                  </div>

                  {/* Estimated Guests */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1.5">
                      Estimasi Kapasitas Tamu *
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={formGuests}
                      onChange={(e) => setFormGuests(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                    />
                    <div className="text-[11px] text-charcoal-400 mt-1">
                      Kapasitas rekomendasi pax tamu
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">
                    Deskripsi Ringkas Paket *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tuliskan rangkuman keunggulan paket dan suasana pernikahan yang ditawarkan..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                  />
                </div>

                {/* Image URL & Presets */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">
                    Foto Cover Paket (URL)
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne font-mono"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] text-charcoal-400 font-medium">Pilih Preset:</span>
                    {SAMPLE_IMAGE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImageUrl(p.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                          formImageUrl === p.url
                            ? 'bg-champagne text-white border-champagne'
                            : 'bg-ivory border-softbeige text-charcoal-600 hover:border-champagne'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features List Manager */}
                <div className="space-y-2 pt-2 border-t border-softbeige">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-charcoal">
                      Fasilitas & Fitur Termasuk ({formFeatures.length}) *
                    </label>
                    <span className="text-[10px] text-charcoal-400">Minimal 1 fitur</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      placeholder="Ketik fasilitas baru lalu klik Tambah atau tekan Enter..."
                      className="flex-1 px-4 py-2 text-xs rounded-xl border border-softbeige focus:outline-none focus:border-champagne"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-charcoal hover:bg-black text-white text-xs font-semibold rounded-xl transition"
                    >
                      Tambah
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pt-2">
                    {formFeatures.map((feat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-ivory border border-softbeige text-xs"
                      >
                        <span className="text-charcoal-800">{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-3 border-t border-softbeige">
                  <input
                    type="checkbox"
                    id="is_active_checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-champagne rounded border-softbeige focus:ring-champagne"
                  />
                  <label htmlFor="is_active_checkbox" className="text-xs font-semibold text-charcoal cursor-pointer">
                    Aktifkan paket untuk dapat dilihat dan dibooking calon pengantin
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-softbeige">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-softbeige text-charcoal text-xs font-semibold hover:bg-ivory transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-champagne hover:bg-champagne-600 text-white text-xs font-semibold shadow-wedding transition"
                  >
                    {editingPackageId ? 'Simpan Perubahan' : 'Buat Paket Baru'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full border border-softbeige shadow-2xl p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  Hapus Paket Pernikahan?
                </h3>
                <p className="text-xs text-charcoal-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus paket <strong>&quot;{deleteTarget.name}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-xl border border-softbeige text-charcoal text-xs font-semibold hover:bg-ivory transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  Hapus Paket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
