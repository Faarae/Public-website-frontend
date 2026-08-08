'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Plus, Edit2, Trash2, FolderPlus, X, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

const categorySchema = zod.object({
  name: zod.string().min(1, 'Nama kategori wajib diisi').max(100, 'Nama tidak boleh lebih dari 100 karakter'),
  description: zod.string().optional(),
});

type CategoryFormInput = zod.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Categories
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categorySchema),
  });

  // Mutate: Create Category
  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormInput) => {
      return api.post('/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal menambahkan kategori.');
    },
  });

  // Mutate: Update Category
  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormInput & { id: string }) => {
      return api.put(`/categories/${data.id}`, { name: data.name, description: data.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal mengubah kategori.');
    },
  });

  // Mutate: Delete Category
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteConfirmOpen(false);
      setActiveCategory(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Kategori ini tidak dapat dihapus karena terhubung dengan pengeluaran yang ada.');
      setDeleteConfirmOpen(false);
      setActiveCategory(null);
    },
  });

  const handleOpenCreateModal = () => {
    reset({ name: '', description: '' });
    setActiveCategory(null);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    reset({ name: cat.name, description: cat.description });
    setActiveCategory(cat);
    setFormError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveCategory(null);
    setFormError(null);
    reset();
  };

  const handleOpenDeleteConfirm = (cat: Category) => {
    setActiveCategory(cat);
    setDeleteConfirmOpen(true);
  };

  const onSubmit = (data: CategoryFormInput) => {
    setFormError(null);
    if (activeCategory) {
      updateMutation.mutate({ ...data, id: activeCategory.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white">Kategori Pengeluaran</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Kelola kategori anggaran untuk memilah pengeluaran proyek.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-3 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10"
        >
          <Plus className="h-5 w-5" />
          Tambah Kategori
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <span>Mengambil data kategori...</span>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-rose-450">
            <span>Gagal memuat kategori. Pastikan database aktif.</span>
          </div>
        ) : categories && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <FolderPlus className="h-10 w-10 text-slate-400" />
            <span>Belum ada kategori terdaftar. Klik "Tambah Kategori" untuk membuat.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-4 px-6">Nama Kategori</th>
                  <th className="py-4 px-6">Keterangan</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {categories?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{cat.name}</td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-md truncate">{cat.description || '-'}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="inline-flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Ubah Kategori"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteConfirm(cat)}
                        className="inline-flex p-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-955/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT DIALOG MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {activeCategory ? 'Ubah Kategori' : 'Buat Kategori Baru'}
            </h3>

            {formError && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 p-4 rounded-xl text-sm mb-6">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nama Kategori</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="contoh: Bahan Bangunan"
                  className={`w-full bg-slate-50 dark:bg-slate-955/60 border ${
                    errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-all duration-200`}
                />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Keterangan</label>
                <textarea
                  rows={4}
                  {...register('description')}
                  placeholder="Tuliskan jenis pengeluaran apa saja yang masuk dalam kategori ini..."
                  className="w-full bg-slate-50 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 px-4 outline-none transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  {activeCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-955/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Hapus Kategori?</h3>
            <p className="text-slate-550 dark:text-slate-400 text-sm mb-6">
              Apakah Anda yakin ingin menghapus kategori <span className="text-slate-955 dark:text-white font-semibold">"{activeCategory.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setActiveCategory(null);
                }}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(activeCategory.id)}
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
