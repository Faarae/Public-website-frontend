'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Plus, Edit2, Trash2, Calendar, FileText, ArrowUpDown, ChevronLeft, ChevronRight, X, AlertCircle, FolderPlus } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface Capital {
  id: string;
  injectionDate: string;
  amount: number;
  source: string;
  description: string;
  createdBy: string;
  createdByName: string;
}

interface PaginatedCapital {
  content: Capital[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const capitalSchema = zod.object({
  injectionDate: zod.string().min(1, 'Tanggal wajib diisi'),
  amount: zod.union([zod.string(), zod.number()])
    .transform((val) => Number(val))
    .pipe(zod.number().positive('Jumlah uang harus bernilai positif')),
  source: zod.string().min(1, 'Sumber dana wajib diisi').max(100),
  description: zod.string().optional(),
});

type CapitalFormInput = zod.input<typeof capitalSchema>;
type CapitalFormOutput = zod.output<typeof capitalSchema>;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function CapitalPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(0);
  const [sortField, setSortField] = useState<string>('injectionDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeCapital, setActiveCapital] = useState<Capital | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [displayAmount, setDisplayAmount] = useState<string>('');

  // Fetch paginated Capital Inflows
  const { data: capitalData, isLoading, error } = useQuery<PaginatedCapital>({
    queryKey: ['capital', page, sortField, sortDir],
    queryFn: async () => {
      const response = await api.get('/capital', {
        params: {
          page,
          size: 10,
          sort: `${sortField},${sortDir}`,
        },
      });
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CapitalFormInput>({
    resolver: zodResolver(capitalSchema),
  });

  // Mutate: Create Capital
  const createMutation = useMutation({
    mutationFn: async (data: CapitalFormOutput) => {
      return api.post('/capital', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data modal.');
    },
  });

  // Mutate: Update Capital
  const updateMutation = useMutation({
    mutationFn: async (data: CapitalFormOutput & { id: string }) => {
      return api.put(`/capital/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data modal.');
    },
  });

  // Mutate: Delete Capital
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/capital/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteConfirmOpen(false);
      setActiveCapital(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menghapus data modal.');
      setDeleteConfirmOpen(false);
      setActiveCapital(null);
    },
  });

  const handleOpenCreateModal = () => {
    reset({
      injectionDate: new Date().toISOString().split('T')[0],
      amount: undefined,
      source: '',
      description: '',
    });
    setDisplayAmount('');
    setActiveCapital(null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cap: Capital) => {
    reset({
      injectionDate: cap.injectionDate,
      amount: cap.amount,
      source: cap.source,
      description: cap.description || '',
    });
    setDisplayAmount(cap.amount ? new Intl.NumberFormat('id-ID').format(cap.amount) : '');
    setActiveCapital(cap);
    setFormError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveCapital(null);
    setDisplayAmount('');
    setFormError(null);
    reset();
  };

  const onSubmit = (data: CapitalFormInput) => {
    const parsedData = data as unknown as CapitalFormOutput;
    setFormError(null);
    if (activeCapital) {
      updateMutation.mutate({ ...parsedData, id: activeCapital.id });
    } else {
      createMutation.mutate(parsedData);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white">Aliran Modal Masuk (Capital Inflow)</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Catat dan kelola alokasi modal serta dana investasi masuk untuk pendanaan proyek.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-cyan-500/10"
        >
          <Plus className="h-5 w-5" />
          Tambah Aliran Modal
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <span>Mengambil data modal...</span>
          </div>
        ) : error ? (
          <div className="flex h-96 items-center justify-center text-rose-450">
            <span>Gagal memuat catatan modal. Pastikan database aktif.</span>
          </div>
        ) : capitalData && capitalData.content.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-3">
            <FolderPlus className="h-10 w-10 text-slate-400" />
            <span>Belum ada investasi modal terdaftar. Klik "Tambah Aliran Modal" untuk mencatat dana.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-955/40 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="py-4 px-6 cursor-pointer select-none hover:text-slate-800 dark:hover:text-white transition-colors" onClick={() => toggleSort('injectionDate')}>
                      <div className="flex items-center gap-1.5">
                        Tanggal
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>
                    <th className="py-4 px-6">Sumber Dana (Modal)</th>
                    <th className="py-4 px-6 cursor-pointer select-none hover:text-slate-800 dark:hover:text-white transition-colors" onClick={() => toggleSort('amount')}>
                      <div className="flex items-center gap-1.5">
                        Jumlah Modal
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>
                    <th className="py-4 px-6">Keterangan</th>
                    <th className="py-4 px-6">Pencatat</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                  {capitalData?.content.map((cap) => (
                    <tr key={cap.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{formatDate(cap.injectionDate)}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs text-cyan-600 dark:text-cyan-400 font-semibold border border-slate-200 dark:border-slate-700/50">
                          {cap.source}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{formatCurrency(cap.amount)}</td>
                      <td className="py-4 px-6 text-slate-550 dark:text-slate-400 max-w-xs truncate" title={cap.description}>{cap.description || '-'}</td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{cap.createdByName}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(cap)}
                          className="inline-flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveCapital(cap);
                            setDeleteConfirmOpen(true);
                          }}
                          className="inline-flex p-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-955/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {capitalData && capitalData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-slate-550 dark:text-slate-400 text-xs">
                <span>
                  Menampilkan halaman <strong className="text-slate-800 dark:text-white">{capitalData.number + 1}</strong> dari <strong className="text-slate-800 dark:text-white">{capitalData.totalPages}</strong> ({capitalData.totalElements} item)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(capitalData.totalPages - 1, page + 1))}
                    disabled={page === capitalData.totalPages - 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 dark:bg-slate-955/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-855 dark:hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {activeCapital ? 'Ubah Data Aliran Modal' : 'Catat Aliran Modal Baru'}
            </h3>

            {formError && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-450 p-4 rounded-xl text-sm mb-6">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tanggal Modal Masuk</label>
                <input
                  type="date"
                  {...register('injectionDate')}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className={`w-full bg-slate-50 dark:bg-slate-950/60 border ${
                    errors.injectionDate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors cursor-pointer`}
                />
                {errors.injectionDate && <p className="text-xs text-rose-500">{errors.injectionDate.message}</p>}
              </div>

              {/* Source Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Nama Sumber Dana (contoh: Owner, Investor A)</label>
                <input
                  type="text"
                  placeholder="e.g. Setoran Modal Awal"
                  {...register('source')}
                  className={`w-full bg-slate-50 dark:bg-slate-950/60 border ${
                    errors.source ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors`}
                />
                {errors.source && <p className="text-xs text-rose-500">{errors.source.message}</p>}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jumlah Uang (IDR)</label>
                <input
                  type="text"
                  value={displayAmount}
                  placeholder="e.g. 500.000.000"
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, '');
                    const numVal = rawVal ? Number(rawVal) : undefined;
                    const formatted = rawVal ? new Intl.NumberFormat('id-ID').format(Number(rawVal)) : '';
                    setDisplayAmount(formatted);
                    setValue('amount', numVal || '');
                    trigger('amount');
                  }}
                  className={`w-full bg-slate-50 dark:bg-slate-955/60 border ${
                    errors.amount ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors`}
                />
                {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Keterangan</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Catatan tambahan tentang modal masuk..."
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/10 flex items-center justify-center gap-2"
                >
                  {isMutating && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  )}
                  {activeCapital ? 'Simpan Perubahan' : 'Catat Dana Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && activeCapital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-955/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Hapus Catatan Modal?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Apakah Anda yakin ingin menghapus alokasi modal sebesar <span className="text-slate-955 dark:text-white font-semibold">{formatCurrency(activeCapital.amount)}</span>? Tindakan ini akan mengurangi total anggaran investasi proyek.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setActiveCapital(null);
                }}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(activeCapital.id)}
                disabled={deleteMutation.isPending}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition-all"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
