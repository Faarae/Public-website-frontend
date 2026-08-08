'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Plus, Edit2, Trash2, Search, Filter, Calendar, FileText, ArrowUpDown, ChevronLeft, ChevronRight, X, Upload, AlertCircle, FolderPlus } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  expenseDate: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  receiptFile: string;
  createdBy: string;
  createdByName: string;
}

interface PaginatedExpenses {
  content: Expense[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const expenseSchema = zod.object({
  expenseDate: zod.string().min(1, 'Tanggal wajib diisi'),
  categoryId: zod.string().min(1, 'Kategori wajib diisi'),
  amount: zod.union([zod.string(), zod.number()])
    .transform((val) => Number(val))
    .pipe(zod.number().positive('Jumlah biaya harus bernilai positif')),
  description: zod.string().optional(),
  receiptFile: zod.string().optional(),
});

type ExpenseFormInput = zod.input<typeof expenseSchema>;
type ExpenseFormOutput = zod.output<typeof expenseSchema>;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const getReceiptUrl = (receiptFile: string) => {
  if (typeof window !== 'undefined' && window.location.port === '3000') {
    return `http://${window.location.hostname}:8080${receiptFile}`;
  }
  return receiptFile;
};

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  
  // State variables for filters, search, pagination, and sorting
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<string>('expenseDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [displayAmount, setDisplayAmount] = useState<string>('');
  
  // Upload status state
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Check for OWNER role
  const [isOwner, setIsOwner] = useState(false);
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setIsOwner(parsed.role === 'OWNER');
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Excel Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importSuccess, setImportSuccess] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'expenses' | 'capital'>('expenses');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await api.post('/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const path = response.data.filePath;
      setUploadedPath(path);
      setValue('receiptFile', path);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload receipt.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
        await uploadFile(file);
      } else {
        alert('Only JPG, JPEG, PNG, and PDF files are allowed.');
      }
    }
  };

  // Fetch Category list for dropdowns
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  // Fetch paginated & filtered Expenses
  const { data: expenseData, isLoading, error } = useQuery<PaginatedExpenses>({
    queryKey: ['expenses', filterCategory, filterStartDate, filterEndDate, page, pageSize, sortField, sortDir],
    queryFn: async () => {
      const response = await api.get('/expenses/filter', {
        params: {
          categoryId: filterCategory || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
          page,
          size: pageSize,
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
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
  });

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Mutate: Create Expense
  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormOutput) => {
      return api.post('/expenses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error occurred while saving expense.');
    },
  });

  // Mutate: Update Expense
  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseFormOutput & { id: string }) => {
      return api.put(`/expenses/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error occurred while saving expense.');
    },
  });

  // Mutate: Delete Expense
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteConfirmOpen(false);
      setActiveExpense(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error deleting expense.');
      setDeleteConfirmOpen(false);
      setActiveExpense(null);
    },
  });

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImportPreview(file);
  };

  const processImportPreview = async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx') {
      setImportError('Only .xlsx Excel files are supported.');
      return;
    }

    setPreviewLoading(true);
    setImportError(null);
    setPreviewData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/v1/imports/excel/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(response.data);
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Failed to parse Excel file preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.tempFileId) return;

    setImportLoading(true);
    setImportError(null);

    try {
      const response = await api.post(`/v1/imports/excel/confirm?tempFileId=${previewData.tempFileId}`);
      setImportSuccess(response.data);
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-analysis'] });
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Failed to confirm historical import.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    setPreviewData(null);
    setImportSuccess(null);
    setImportError(null);
    setPreviewLoading(false);
    setImportLoading(false);
  };

  const handleOpenCreateModal = () => {
    reset({
      expenseDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      amount: undefined,
      description: '',
      receiptFile: '',
    });
    setUploadedPath(null);
    setActiveExpense(null);
    setFormError(null);
    setDisplayAmount('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    reset({
      expenseDate: exp.expenseDate,
      categoryId: exp.categoryId,
      amount: exp.amount,
      description: exp.description || '',
      receiptFile: exp.receiptFile || '',
    });
    setUploadedPath(exp.receiptFile || null);
    setActiveExpense(exp);
    setFormError(null);
    setDisplayAmount(exp.amount ? new Intl.NumberFormat('id-ID').format(exp.amount) : '');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveExpense(null);
    setUploadedPath(null);
    setFormError(null);
    setDisplayAmount('');
    reset();
  };

  const handleOpenDeleteConfirm = (exp: Expense) => {
    setActiveExpense(exp);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (data: ExpenseFormInput) => {
    const parsedData = data as unknown as ExpenseFormOutput;
    setFormError(null);
    if (activeExpense) {
      updateMutation.mutate({ ...parsedData, id: activeExpense.id });
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

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(0);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white">Pengeluaran Konstruksi (Biaya)</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Audit, catat, dan cari transaksi keuangan konstruksi villa.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {isOwner && (
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <Upload className="h-5 w-5" />
              Impor Excel
            </button>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <Plus className="h-5 w-5" />
            Tambah Pengeluaran
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end shadow-sm">
        {/* Category filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Kategori</label>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
            className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors"
          >
            <option value="">Semua Kategori</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Tanggal Mulai</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(0); }}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors cursor-pointer"
          />
        </div>

        {/* End Date filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Tanggal Selesai</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(0); }}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="w-full bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors cursor-pointer"
          />
        </div>

        {/* Action button */}
        <div>
          {(filterCategory || filterStartDate || filterEndDate) ? (
            <button
              onClick={handleClearFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Reset Filter
            </button>
          ) : (
            <div className="text-xs text-slate-500 py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Tidak ada filter aktif
            </div>
          )}
        </div>
      </div>

      {/* Main Expense Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <span>Mengambil data pengeluaran...</span>
          </div>
        ) : error ? (
          <div className="flex h-96 items-center justify-center text-rose-450">
            <span>Gagal memuat catatan pengeluaran. Silakan periksa database.</span>
          </div>
        ) : expenseData && expenseData.content.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-3">
            <FolderPlus className="h-10 w-10 text-slate-400" />
            <span>Tidak ada pengeluaran konstruksi yang cocok dengan filter Anda.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-955/40 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="py-4 px-6 cursor-pointer select-none hover:text-slate-800 dark:hover:text-white transition-colors" onClick={() => toggleSort('expenseDate')}>
                      <div className="flex items-center gap-1.5">
                        Tanggal
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6 cursor-pointer select-none hover:text-slate-800 dark:hover:text-white transition-colors" onClick={() => toggleSort('amount')}>
                      <div className="flex items-center gap-1.5">
                        Jumlah Biaya
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </th>
                    <th className="py-4 px-6">Keterangan</th>
                    <th className="py-4 px-6 text-center">Bukti Nota</th>
                    <th className="py-4 px-6">Pencatat</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                  {expenseData?.content.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{formatDate(exp.expenseDate)}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs text-cyan-600 dark:text-cyan-400 font-semibold border border-slate-200 dark:border-slate-700/50">
                          {exp.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{formatCurrency(exp.amount)}</td>
                      <td className="py-4 px-6 text-slate-550 dark:text-slate-400 max-w-xs truncate" title={exp.description}>{exp.description || '-'}</td>
                      <td className="py-4 px-6 text-center">
                        {exp.receiptFile ? (
                          <a
                            href={getReceiptUrl(exp.receiptFile)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-650 dark:text-cyan-400 hover:text-cyan-550 dark:hover:text-cyan-300 font-semibold hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{exp.createdByName}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="inline-flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(exp)}
                          className="inline-flex p-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 transition-colors"
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
            {expenseData && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-950/20 text-slate-550 dark:text-slate-450 text-xs">
                <div className="flex items-center gap-2">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none text-slate-800 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>items per page</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>
                    Showing page <strong className="text-slate-800 dark:text-white">{expenseData.number + 1}</strong> of <strong className="text-slate-800 dark:text-white">{expenseData.totalPages || 1}</strong> ({expenseData.totalElements} items)
                  </span>
                  {expenseData.totalPages > 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPage(Math.min(expenseData.totalPages - 1, page + 1))}
                        disabled={page === expenseData.totalPages - 1}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE / EDIT EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {activeExpense ? 'Edit Expense Record' : 'Record New Expense'}
            </h3>

            {formError && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 text-rose-455 p-4 rounded-xl text-sm mb-6">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input type="hidden" {...register('receiptFile')} />
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expense Date</label>
                <input
                  type="date"
                  {...register('expenseDate')}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className={`w-full bg-slate-50 dark:bg-slate-950/60 border ${
                    errors.expenseDate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors cursor-pointer`}
                />
                {errors.expenseDate && <p className="text-xs text-rose-500">{errors.expenseDate.message}</p>}
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Budget Category</label>
                <select
                  {...register('categoryId')}
                  className={`w-full bg-slate-50 dark:bg-slate-950/60 border ${
                    errors.categoryId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors`}
                >
                  <option value="">Select Category...</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-rose-500">{errors.categoryId.message}</p>}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount (IDR)</label>
                <input
                  type="text"
                  value={displayAmount}
                  placeholder="e.g. 1.500.000"
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, '');
                    const numVal = rawVal ? Number(rawVal) : undefined;
                    const formatted = rawVal ? new Intl.NumberFormat('id-ID').format(Number(rawVal)) : '';
                    setDisplayAmount(formatted);
                    setValue('amount', numVal || '');
                    trigger('amount');
                  }}
                  className={`w-full bg-slate-50 dark:bg-slate-950/60 border ${
                    errors.amount ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors`}
                />
                {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  rows={3}
                  {...register('description')}
                  placeholder="Detail the materials purchased or contractor services rendered..."
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-colors resize-none"
                />
              </div>

              {/* Receipt File Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Receipt Attachment</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-6 transition-all duration-200 ${
                    dragActive
                      ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955/60'
                  }`}
                >
                  <Upload className={`h-8 w-8 mb-3 transition-colors ${dragActive ? 'text-cyan-500' : 'text-slate-400'}`} />
                  
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Drag & drop your file here, or{' '}
                      <label className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:underline cursor-pointer">
                        browse
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleUploadFile}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500">
                      Supported: JPG, JPEG, PNG, PDF (Max 10MB)
                    </p>
                  </div>

                  {uploading && (
                    <div className="mt-4 text-xs font-medium text-cyan-650 dark:text-cyan-400 animate-pulse">
                      Uploading receipt document...
                    </div>
                  )}

                  {!uploading && uploadedPath && (
                    <div className="mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-450 truncate max-w-full">
                      ✓ Receipt uploaded: {uploadedPath.split('/').pop()}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating || uploading}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/10 flex items-center justify-center gap-2"
                >
                  {isMutating && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  )}
                  {activeExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EXPENSE CONFIRMATION MODAL */}
      {deleteConfirmOpen && activeExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Delete Expense Record?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to delete this expense of <span className="text-slate-950 dark:text-white font-semibold">{formatCurrency(activeExpense.amount)}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setActiveExpense(null);
                }}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(activeExpense.id)}
                disabled={deleteMutation.isPending}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition-all"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors">
            
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import Historical Data</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Upload historical construction sheets to normalize & import records</p>
                </div>
              </div>
              <button
                onClick={handleCloseImportModal}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* Errors/Warnings */}
              {importError && (
                <div className="flex gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 p-5 rounded-2xl text-sm font-medium">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>{importError}</div>
                </div>
              )}

              {/* SUCCESS STATE */}
              {importSuccess ? (
                <div className="text-center py-8 space-y-6">
                  <div className="mx-auto h-16 w-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Import Completed!</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Successfully processed and imported historical construction finance data.
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{importSuccess.importedExpensesCount}</span>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Expenses</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{importSuccess.importedCapitalCount}</span>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Capital Inflows</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{importSuccess.skippedDuplicatesCount}</span>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Skipped Duplicates</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-center">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{importSuccess.totalRowsProcessed}</span>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Total Rows</p>
                    </div>
                  </div>
                </div>
              ) : previewLoading ? (
                /* PREVIEW LOADING STATE */
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-850 dark:text-white">Processing Excel Workbook...</span>
                    <p className="text-xs text-slate-500 mt-1">Analyzing sheets, mapping category tags, and running duplicate validation checks.</p>
                  </div>
                </div>
              ) : previewData ? (
                /* PREVIEW DATA STATE */
                <div className="space-y-6">
                  
                  {/* Summary Dashboard Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <span className="text-sm font-semibold text-slate-500">Total Rows</span>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{previewData.totalRows}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <span className="text-sm font-semibold text-emerald-500">Expenses</span>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-450 mt-1">{previewData.expensesCount}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <span className="text-sm font-semibold text-cyan-500">Capital Inflows</span>
                      <p className="text-xl font-bold text-cyan-600 dark:text-cyan-450 mt-1">{previewData.capitalCount}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <span className="text-sm font-semibold text-amber-500">Duplicates</span>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-500 mt-1">{previewData.duplicateCount}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <span className="text-sm font-semibold text-slate-400">Skipped (Empty/Sum)</span>
                      <p className="text-xl font-bold text-slate-500 mt-1">{previewData.skippedCount}</p>
                    </div>
                  </div>

                  {/* Validation Warning Alert Box */}
                  {previewData.validationErrors.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 p-5 rounded-2xl text-xs space-y-1.5 overflow-y-auto max-h-36">
                      <p className="font-bold flex items-center gap-1 text-amber-900 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4" />
                        Preview Alerts & Warnings ({previewData.validationErrors.length})
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {previewData.validationErrors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
                    <button
                      onClick={() => setPreviewTab('expenses')}
                      className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${previewTab === 'expenses' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Expenses ({previewData.expenses.length})
                    </button>
                    <button
                      onClick={() => setPreviewTab('capital')}
                      className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${previewTab === 'capital' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      Capital Inflows ({previewData.capitalInjections.length})
                    </button>
                  </div>

                  {/* Previews Tables Container */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                    {previewTab === 'expenses' ? (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Row</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Method</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4">Duplicates check</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.expenses.map((exp: any, i: number) => (
                            <tr key={i} className={`border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-950/20 ${exp.isDuplicate ? 'opacity-60 bg-amber-500/[0.02]' : ''}`}>
                              <td className="py-3 px-4 font-mono text-slate-400">{exp.rowIndex + 1}</td>
                              <td className="py-3 px-4">{formatDate(exp.date)}</td>
                              <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{exp.categoryName}</td>
                              <td className="py-3 px-4 truncate max-w-xs" title={exp.description}>
                                {exp.description}
                                {exp.workerName && (
                                  <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                                    Laborer: {exp.workerName} | Rate: {formatCurrency(exp.dailyRate)} | Days: {exp.daysWorked}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono">{exp.paymentMethod}</td>
                              <td className="py-3 px-4 text-right font-bold">{formatCurrency(exp.amount)}</td>
                              <td className="py-3 px-4">
                                {exp.isDuplicate ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                                    Skipped (Duplicate)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Row</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Source</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4">Duplicates check</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.capitalInjections.map((cap: any, i: number) => (
                            <tr key={i} className={`border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-950/20 ${cap.isDuplicate ? 'opacity-60 bg-amber-500/[0.02]' : ''}`}>
                              <td className="py-3 px-4 font-mono text-slate-400">{cap.rowIndex + 1}</td>
                              <td className="py-3 px-4">{formatDate(cap.date)}</td>
                              <td className="py-3 px-4 truncate max-w-xs">{cap.description}</td>
                              <td className="py-3 px-4 text-slate-500 font-mono">{cap.source}</td>
                              <td className="py-3 px-4 text-right font-bold">{formatCurrency(cap.amount)}</td>
                              <td className="py-3 px-4">                                {cap.isDuplicate ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                                    Dilewati (Duplikat)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    Siap Impor
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                /* UPLOAD DRAG/DROP FILE CHOOSE STATE */
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center hover:border-indigo-500 transition-colors flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-955/25">
                    <div className="h-14 w-14 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-955 dark:text-white">Unggah File Laporan Excel Historis</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Tarik dan letakkan file spreadsheet `.xlsx` pengeluaran keuangan proyek Anda di sini, atau klik tombol di bawah untuk memilih file.
                      </p>
                    </div>
                    <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all">
                      Pilih File Excel
                      <input
                        type="file"
                        accept=".xlsx"
                        onChange={handleImportFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-955/20">
              {importSuccess ? (
                <button
                  onClick={handleCloseImportModal}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-3 rounded-xl transition-all"
                >
                  Selesai
                </button>
              ) : previewData ? (
                <>
                  <button
                    onClick={() => {
                      setPreviewData(null);
                      setImportError(null);
                    }}
                    className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-850 dark:text-slate-450 dark:hover:text-white transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importLoading || (previewData.expensesCount - previewData.duplicateCount <= 0 && previewData.capitalCount - previewData.duplicateCount <= 0)}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10"
                  >
                    {importLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    )}
                    Konfirmasi Impor
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCloseImportModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-855 dark:text-slate-455 dark:hover:text-white transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
