'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, DollarSign, FileText, XCircle, AlertCircle, Download, Check, X } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface PayrollDetail {
  id: string;
  workerName: string;
  dailyRate: number;
  attendanceDays: number;
  halfDays: number;
  totalWage: number;
  notes?: string;
}

interface Payroll {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'REJECTED';
  generatedBy: string;
  generatedByName: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  details?: PayrollDetail[];
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  
  // State variables
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  
  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Role State
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
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

  // Fetch Payroll List
  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery<Payroll[]>({
    queryKey: ['payrolls'],
    queryFn: () => api.get('/v1/payroll').then(res => res.data),
  });

  // Fetch Individual Payroll Details when viewing
  const { data: activeDetails = null, isLoading: loadingDetails } = useQuery<Payroll>({
    queryKey: ['payroll', selectedPayroll?.id],
    queryFn: () => api.get(`/v1/payroll/${selectedPayroll?.id}`).then(res => res.data),
    enabled: !!selectedPayroll?.id,
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: (data: { weekStart: string; weekEnd: string }) => api.post('/v1/payroll/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      setGenerateModalOpen(false);
      setStartDate('');
      setEndDate('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal membuat draf gaji. Pastikan absensi periode tersebut telah dicatat.');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/v1/payroll/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      if (selectedPayroll) {
        setSelectedPayroll(prev => prev ? { ...prev, status: 'APPROVED' } : null);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menyetujui daftar gaji');
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post(`/v1/payroll/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      if (selectedPayroll) {
        setSelectedPayroll(prev => prev ? { ...prev, status: 'PAID' } : null);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal mencatat pembayaran');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/v1/payroll/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      if (selectedPayroll) {
        setSelectedPayroll(prev => prev ? { ...prev, status: 'REJECTED' } : null);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menolak daftar gaji');
    }
  });

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setFormError('Silakan pilih tanggal mulai dan tanggal selesai.');
      return;
    }
    generateMutation.mutate({ weekStart: startDate, weekEnd: endDate });
  };

  const handleDownload = (id: string, type: 'pdf' | 'excel') => {
    const url = `/v1/payroll/reports/payroll/${type}?payrollId=${id}`;
    api.get(url, { responseType: 'blob' })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `laporan_gaji_${id}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => {
        alert('Gagal mengunduh file');
      });
  };

  const handleOpenDetails = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Manajemen Gaji Mingguan (Payroll)
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Hitung upah pekerja, buat rekapitulasi gaji mingguan, dan pantau status persetujuan pembayaran.
          </p>
        </div>
        <button
          onClick={() => setGenerateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/15 hover:opacity-95 transition-opacity"
        >
          <Plus className="h-5 w-5" />
          Buat Daftar Gaji Periode
        </button>
      </div>

      {/* Payroll Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Periode Mingguan</th>
                <th className="px-6 py-4">Total Gaji</th>
                <th className="px-6 py-4">Dibuat Oleh</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loadingPayrolls ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Memuat riwayat daftar gaji...</td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Belum ada daftar gaji terdaftar. Klik tombol di atas untuk membuat draf.</td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {formatDate(p.weekStart)} s.d. {formatDate(p.weekEnd)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-950 dark:text-white">
                      Rp {p.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-550 dark:text-slate-400">
                      {p.generatedByName || 'Sistem'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : p.status === 'APPROVED'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : p.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {p.status === 'PAID' ? 'DIBAYAR' : p.status === 'APPROVED' ? 'DISETUJUI' : p.status === 'REJECTED' ? 'DITOLAK' : 'DRAF'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenDetails(p)}
                          className="text-slate-500 hover:text-cyan-500 transition-colors flex items-center gap-1 font-semibold text-xs border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Detail
                        </button>
                        {p.status !== 'DRAFT' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleDownload(p.id, 'pdf')}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                              title="Unduh PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(p.id, 'excel')}
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Unduh Excel"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Buat Rekap Gaji Mingguan
              </h3>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-555 uppercase tracking-wider mb-2">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-555 uppercase tracking-wider mb-2">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/10 hover:opacity-95 transition-opacity"
                >
                  Buat Draf Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {detailsModalOpen && selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Rincian Daftar Gaji: {formatDate(selectedPayroll.weekStart)} s.d. {formatDate(selectedPayroll.weekEnd)}
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                  Daftar gaji kumulatif yang dibuat oleh {selectedPayroll.generatedByName || 'Sistem'}
                </p>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Detail Info Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tagihan Gaji</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">
                    Rp {selectedPayroll.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedPayroll.status === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : selectedPayroll.status === 'APPROVED'
                      ? 'bg-blue-500/10 text-blue-600'
                      : selectedPayroll.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {selectedPayroll.status === 'PAID' ? 'DIBAYAR' : selectedPayroll.status === 'APPROVED' ? 'DISETUJUI' : selectedPayroll.status === 'REJECTED' ? 'DITOLAK' : 'DRAF'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Disetujui</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {formatDate(selectedPayroll.approvedAt)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Dibayar</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {formatDate(selectedPayroll.paidAt)}
                  </span>
                </div>
              </div>

              {/* Itemized Workers Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 text-xs font-semibold text-slate-400 uppercase">
                      <th className="px-4 py-3">Nama Pekerja</th>
                      <th className="px-4 py-3 text-right">Gaji Harian</th>
                      <th className="px-4 py-3 text-center">Hadir Penuh</th>
                      <th className="px-4 py-3 text-center">Setengah Hari</th>
                      <th className="px-4 py-3 text-right">Total Diterima</th>
                      <th className="px-4 py-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loadingDetails ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">Memuat rincian...</td>
                      </tr>
                    ) : activeDetails?.details?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">Tidak ada data pekerja pada periode ini.</td>
                      </tr>
                    ) : (
                      activeDetails?.details?.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{d.workerName}</td>
                          <td className="px-4 py-3 text-right">Rp {d.dailyRate.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-center font-medium">{d.attendanceDays}</td>
                          <td className="px-4 py-3 text-center font-medium">{d.halfDays}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                            Rp {d.totalWage.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{d.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Owner Action Buttons */}
              {isOwner && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  {selectedPayroll.status === 'DRAFT' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => rejectMutation.mutate(selectedPayroll.id)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-rose-500/10 hover:opacity-95"
                      >
                        <X className="h-4 w-4" />
                        Tolak Draf
                      </button>
                      <button
                        onClick={() => approveMutation.mutate(selectedPayroll.id)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/10 hover:opacity-95"
                      >
                        <Check className="h-4 w-4" />
                        Setujui Daftar Gaji
                      </button>
                    </div>
                  )}
                  {selectedPayroll.status === 'APPROVED' && (
                    <button
                      onClick={() => markPaidMutation.mutate(selectedPayroll.id)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-500/10 hover:opacity-95"
                    >
                      <DollarSign className="h-4 w-4" />
                      Tandai Telah Dibayar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
