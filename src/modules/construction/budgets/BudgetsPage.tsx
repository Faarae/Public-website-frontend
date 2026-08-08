'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { 
  Plus, Edit2, Trash2, X, AlertCircle, Calendar, Landmark, 
  Coins, TrendingUp, PiggyBank, ArrowRight, Info 
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

// Interfaces
interface Category {
  id: string;
  name: string;
}

interface Budget {
  id: number;
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  actualSpending: number;
  remainingBudget: number;
  utilizationPercentage: number;
  status: 'ON_TRACK' | 'NEAR_LIMIT' | 'OVER_BUDGET';
  startDate: string;
  endDate: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  exceededAmount?: number;
}

interface BudgetSummary {
  totalBudget: number;
  totalActual: number;
  remainingBudget: number;
  utilizationPercentage: number;
}

// Zod Schema
const budgetSchema = zod.object({
  categoryId: zod.string().min(1, 'Silakan pilih kategori'),
  budgetAmount: zod.union([zod.string(), zod.number()])
    .transform((val) => Number(val))
    .pipe(zod.number().positive('Jumlah anggaran harus lebih besar dari nol')),
  startDate: zod.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: zod.string().min(1, 'Tanggal selesai wajib diisi'),
  description: zod.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'Tanggal selesai harus sama dengan atau setelah tanggal mulai',
  path: ['endDate'],
});

type BudgetFormInput = zod.input<typeof budgetSchema>;
type BudgetFormOutput = zod.output<typeof budgetSchema>;

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [displayAmount, setDisplayAmount] = useState<string>('');

  // Pagination & Filters
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BudgetFormInput>({
    resolver: zodResolver(budgetSchema),
  });

  // Fetch Categories for Dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  // Fetch Budgets List
  const { data: budgetsData, isLoading: listLoading } = useQuery<{ content: Budget[]; totalPages: number }>({
    queryKey: ['budgets', page, size],
    queryFn: async () => {
      const response = await api.get('/v1/budgets', {
        params: { page, size, sort: 'id,desc' }
      });
      return response.data;
    },
  });

  // Fetch Budget Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery<BudgetSummary>({
    queryKey: ['budgetsSummary'],
    queryFn: async () => {
      const response = await api.get('/v1/budgets/summary');
      return response.data;
    },
  });

  // Create Budget Mutation
  const createMutation = useMutation({
    mutationFn: async (data: BudgetFormOutput) => {
      return api.post('/v1/budgets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetsSummary'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan saat membuat rencana anggaran.');
    },
  });

  // Update Budget Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: BudgetFormOutput & { id: number }) => {
      return api.put(`/v1/budgets/${data.id}`, {
        categoryId: data.categoryId,
        budgetAmount: data.budgetAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetsSummary'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Terjadi kesalahan saat memperbarui rencana anggaran.');
    },
  });

  // Delete Budget Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/v1/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetsSummary'] });
      setDeleteConfirmOpen(false);
      setActiveBudget(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Terjadi kesalahan saat menghapus rencana anggaran.');
      setDeleteConfirmOpen(false);
      setActiveBudget(null);
    },
  });

  // Modal handlers
  const handleOpenCreateModal = () => {
    reset({
      categoryId: '',
      budgetAmount: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      description: '',
    });
    setDisplayAmount('');
    setActiveBudget(null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (budget: Budget) => {
    reset({
      categoryId: budget.categoryId,
      budgetAmount: budget.budgetAmount,
      startDate: budget.startDate,
      endDate: budget.endDate,
      description: budget.description || '',
    });
    setDisplayAmount(budget.budgetAmount ? new Intl.NumberFormat('id-ID').format(budget.budgetAmount) : '');
    setActiveBudget(budget);
    setFormError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveBudget(null);
    setFormError(null);
  };

  const onSubmit = (data: BudgetFormInput) => {
    const parsedData = data as unknown as BudgetFormOutput;
    if (activeBudget) {
      updateMutation.mutate({ ...parsedData, id: activeBudget.id });
    } else {
      createMutation.mutate(parsedData);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
      case 'NEAR_LIMIT':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20';
      case 'OVER_BUDGET':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 100) return 'bg-rose-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-cyan-500';
  };

  const getProgressBarTrackColor = (percentage: number) => {
    if (percentage > 100) return 'bg-rose-100 dark:bg-rose-955/30';
    if (percentage >= 80) return 'bg-amber-100 dark:bg-amber-955/30';
    return 'bg-cyan-100 dark:bg-cyan-955/30';
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Rencana Anggaran (Budget)</h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">Rencanakan dan analisis anggaran proyek konstruksi dibandingkan dengan pengeluaran rill.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-medium shadow-md shadow-cyan-500/10 transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Buat Anggaran Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400">
              <Landmark className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Anggaran</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {summaryLoading ? '...' : formatCurrency(summaryData?.totalBudget || 0)}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Coins className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Realisasi Pengeluaran</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {summaryLoading ? '...' : formatCurrency(summaryData?.totalActual || 0)}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sisa Anggaran</span>
          </div>
          <h3 className={`text-2xl font-bold ${summaryData && summaryData.remainingBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {summaryLoading ? '...' : formatCurrency(summaryData?.remainingBudget || 0)}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tingkat Penyerapan</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {summaryLoading ? '...' : formatPercent(summaryData?.utilizationPercentage || 0)}
          </h3>
        </div>
      </div>

      {/* Main Budgets Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Daftar Rencana Anggaran</h3>
        </div>
        <div className="overflow-x-auto">
          {listLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          ) : !budgetsData || budgetsData.content.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400">
              <Landmark className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <p className="font-medium">Belum ada rencana anggaran terdaftar.</p>
              <p className="text-sm text-slate-400 mt-1">Buat rencana anggaran baru untuk mulai memantau pengeluaran.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold text-sm border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Plafon Anggaran</th>
                  <th className="px-6 py-4">Realisasi Pengeluaran</th>
                  <th className="px-6 py-4">Sisa Anggaran</th>
                  <th className="px-6 py-4">Realisasi Penyerapan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {budgetsData.content.map((budget) => {
                  const percent = budget.utilizationPercentage;

                  return (
                    <tr key={budget.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {budget.categoryName}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatCurrency(budget.budgetAmount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatCurrency(budget.actualSpending)}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${budget.remainingBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(budget.remainingBudget)}
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-24 rounded-full ${getProgressBarTrackColor(percent)} overflow-hidden`}>
                            <div 
                              className={`h-full rounded-full ${getProgressBarColor(percent)}`} 
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {formatPercent(percent)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(budget.status)}`}>
                          {budget.status === 'ON_TRACK' ? 'ON TRACK' : budget.status === 'NEAR_LIMIT' ? 'NEAR LIMIT' : 'OVER BUDGET'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveBudget(budget);
                              setDetailOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            title="Rincian"
                          >
                            <Info className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(budget)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-cyan-600 hover:text-cyan-700 transition-colors"
                            title="Ubah"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveBudget(budget);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-rose-600 hover:text-rose-700 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {budgetsData && budgetsData.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-slate-500">
              Halaman {page + 1} dari {budgetsData.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(budgetsData.totalPages - 1, page + 1))}
              disabled={page === budgetsData.totalPages - 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {activeBudget ? 'Ubah Rencana Anggaran' : 'Buat Anggaran Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {formError && (
                <div className="flex gap-2.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-500/20">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Pengeluaran
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-rose-500 text-xs mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Budget Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Plafon Anggaran (IDR)
                </label>
                <input
                  type="text"
                  value={displayAmount}
                  placeholder="contoh: 150.000.000"
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, '');
                    const numVal = rawVal ? Number(rawVal) : undefined;
                    const formatted = rawVal ? new Intl.NumberFormat('id-ID').format(Number(rawVal)) : '';
                    setDisplayAmount(formatted);
                    setValue('budgetAmount', numVal || '');
                    trigger('budgetAmount');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {errors.budgetAmount && (
                  <p className="text-rose-500 text-xs mt-1">{errors.budgetAmount.message}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.startDate && (
                    <p className="text-rose-500 text-xs mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.endDate && (
                    <p className="text-rose-500 text-xs mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Tuliskan rincian alokasi anggaran..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-medium shadow-md shadow-cyan-500/10 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailOpen && activeBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Rincian Rencana Anggaran</h3>
              <button onClick={() => { setDetailOpen(false); setActiveBudget(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Kategori</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{activeBudget.categoryName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Status Anggaran</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(activeBudget.status)}`}>
                    {activeBudget.status === 'ON_TRACK' ? 'ON TRACK' : activeBudget.status === 'NEAR_LIMIT' ? 'NEAR LIMIT' : 'OVER BUDGET'}
                  </span>
                </div>

                <div className="col-span-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                  <span className="text-xs text-slate-400 block mb-0.5">Periode Anggaran</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(activeBudget.startDate)} <ArrowRight className="h-3.5 w-3.5" /> {formatDate(activeBudget.endDate)}
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                  <span className="text-xs text-slate-400 block mb-0.5">Plafon Anggaran</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{formatCurrency(activeBudget.budgetAmount)}</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                  <span className="text-xs text-slate-400 block mb-0.5">Realisasi Pengeluaran</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{formatCurrency(activeBudget.actualSpending)}</span>
                </div>

                <div className="col-span-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                  <span className="text-xs text-slate-400 block mb-0.5">Sisa Anggaran</span>
                  <span className={`font-bold text-lg ${activeBudget.remainingBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(activeBudget.remainingBudget)}
                  </span>
                </div>

                {activeBudget.status === 'OVER_BUDGET' && activeBudget.exceededAmount && (
                  <div className="col-span-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-500/20">
                    <div className="flex gap-2 font-medium">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>Batas Anggaran Terlewati!</span>
                    </div>
                    <p className="mt-1 text-xs">Pengeluaran rill melebihi plafon anggaran sebesar <b>{formatCurrency(activeBudget.exceededAmount)}</b>.</p>
                  </div>
                )}

                <div className="col-span-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                  <span className="text-xs text-slate-400 block mb-0.5">Keterangan</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                    {activeBudget.description || 'Tidak ada keterangan.'}
                  </p>
                </div>
              </div>

              <div className="flex pt-3 border-t border-slate-100 dark:border-slate-800 justify-end">
                <button
                  onClick={() => { setDetailOpen(false); setActiveBudget(null); }}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && activeBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-center text-slate-900 dark:text-white mb-2">Hapus Rencana Anggaran?</h3>
              <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus rencana anggaran untuk kategori <b>{activeBudget.categoryName}</b>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteConfirmOpen(false); setActiveBudget(null); }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(activeBudget.id)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 transition-colors"
              >
                Ya, Hapus Anggaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
