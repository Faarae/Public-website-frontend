'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Upload, Trash2, Copy, CheckCircle, FileText } from 'lucide-react';
import api from '@/services/api';

interface MediaItem {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch Media Items
  const { data: mediaItems = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media-library'],
    queryFn: async () => {
      const response = await api.get('/v1/media');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/v1/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      await api.post('/v1/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    } catch (err: any) {
      alert('Gagal mengunggah berkas: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    // Build full URL if needed, or copy path
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Perpustakaan Media (Media Library)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Unggah dan kelola foto banner, fasilitas, galeri kamar, dan bukti pembayaran homestay Anda.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-cyan-500/10 cursor-pointer">
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Upload className="h-5 w-5" />
          )}
          {uploading ? 'Mengunggah...' : 'Unggah Berkas Baru'}
          <input
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span>Memuat media...</span>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-8 text-center">
          <ImageIcon className="h-12 w-12 text-slate-300 mb-3" />
          <span className="font-bold">Belum ada media diunggah</span>
          <span className="text-xs text-slate-450 mt-1">Unggah berkas gambar JPG/PNG atau PDF bukti transfer untuk mulai menggunakannya.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {mediaItems.map((item) => {
            const isImage = item.fileType.startsWith('image/');
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all">
                {/* Preview */}
                <div className="h-32 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden">
                  {isImage ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.fileUrl})` }}></div>
                  ) : (
                    <FileText className="h-10 w-10 text-slate-400" />
                  )}
                </div>

                {/* Footer details */}
                <div className="p-3 space-y-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate" title={item.filename}>
                    {item.filename}
                  </span>
                  <span className="block text-[9px] text-slate-400">
                    {(item.fileSize / 1024).toFixed(1)} KB
                  </span>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    <button
                      onClick={() => handleCopyLink(item.fileUrl, item.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-500 rounded-lg transition-all"
                      title="Salin Tautan"
                    >
                      {copiedId === item.id ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Hapus media ini secara permanen?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg transition-all"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
