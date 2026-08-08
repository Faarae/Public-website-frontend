'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Table, Calendar, Filter, Eye, Download, Info, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface Category {
  id: string;
  name: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'financial-summary' | 'expenses' | 'payroll' | 'capital' | 'budget'>('financial-summary');
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  // Fetch Category list for filter
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-list-reports'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });

  // Fetch report data for preview
  const { data: previewData, isLoading: isPreviewLoading } = useQuery<any>({
    queryKey: ['report-preview', reportType, startDate, endDate, categoryId, paymentMethod],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (categoryId) params.categoryId = categoryId;
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const response = await api.get(`/v1/reports/${reportType}`, { params });
      return response.data;
    },
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format);
    try {
      const params: Record<string, any> = { generatedBy: 'Project Manager' };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (categoryId) params.categoryId = categoryId;
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const response = await api.get(`/v1/reports/${reportType}/${format}`, {
        params,
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] as string;
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `report-${reportType}-${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengekspor laporan. Silakan coba lagi.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Laporan Keuangan & Proyek (BI)
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Ekspor data modal, biaya belanja harian, payroll harian, dan evaluasi target RAB langsung ke berkas PDF and Excel formal.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-250 dark:border-slate-800 pb-2">
        {(['financial-summary', 'expenses', 'payroll', 'capital', 'budget'] as const).map((type) => {
          const labels = {
            'financial-summary': 'Ringkasan Finansial',
            'expenses': 'Pengeluaran Konstruksi',
            'payroll': 'Gaji & Termin Vendor',
            'capital': 'Injeksi Modal',
            'budget': 'Evaluasi RAB'
          };
          return (
            <button
              key={type}
              onClick={() => {
                setReportType(type);
                setCategoryId('');
                setPaymentMethod('');
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                reportType === type
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Parameter Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-500" />
              Filter Laporan
            </h3>

            <div className="space-y-4">
              {/* Date Filters */}
              {reportType !== 'budget' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Expense Category Filter */}
              {reportType === 'expenses' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kategori Pengeluaran</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Method Filter */}
              {reportType === 'expenses' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                  >
                    <option value="">Semua Metode</option>
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col gap-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={downloading !== null}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-cyan-500/10"
              >
                {downloading === 'pdf' ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                Unduh PDF Report
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={downloading !== null}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold py-3 rounded-xl transition-all duration-200"
              >
                {downloading === 'excel' ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                ) : (
                  <Table className="h-5 w-5" />
                )}
                Unduh Excel (.xlsx)
              </button>
            </div>
          </div>

          <div className="bg-slate-100/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1">
              <Info className="h-4.5 w-4.5 text-slate-400" />
              Catatan Ekspor:
            </h4>
            <p>1. Seluruh dokumen menyertakan tanda tangan persetujuan Owner.</p>
            <p>2. Format laporan didesain rapi dan siap cetak (Print-ready).</p>
            <p>3. Tindakan pengunduhan dicatat secara otomatis dalam Audit Logs.</p>
          </div>
        </div>

        {/* Right Preview Box */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
            Pratinjau Data Laporan (Preview)
          </h3>

          {isPreviewLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
              <span>Memuat data...</span>
            </div>
          ) : !previewData || (Array.isArray(previewData) && previewData.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
              <span>Tidak ada data transaksi ditemukan.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              {/* Financial Summary Preview */}
              {reportType === 'financial-summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Modal Masuk</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(previewData.totalCapital)}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Belanja Material</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(previewData.totalExpenses)}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Gaji Tukang (Payroll)</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(previewData.totalPayroll)}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Sisa Saldo Kas</span>
                      <span className="text-xl font-bold text-emerald-500">{formatCurrency(previewData.remainingCash)}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/10 rounded-2xl text-xs text-slate-550 dark:text-slate-400">
                    Rangkuman finansial di atas mencerminkan total investasi bersih dibandingkan dengan seluruh pengeluaran operasional.
                  </div>
                </div>
              )}

              {/* Expenses Preview */}
              {reportType === 'expenses' && Array.isArray(previewData) && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500">
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Deskripsi</th>
                        <th className="px-4 py-3">Metode</th>
                        <th className="px-4 py-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {previewData.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.expenseDate)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-250">{item.categoryName}</td>
                          <td className="px-4 py-3 truncate max-w-[150px]">{item.description}</td>
                          <td className="px-4 py-3">{item.paymentMethod}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payroll Preview */}
              {reportType === 'payroll' && Array.isArray(previewData) && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500">
                        <th className="px-4 py-3">Awal Pekan</th>
                        <th className="px-4 py-3">Akhir Pekan</th>
                        <th className="px-4 py-3 text-center">Kru Lapangan</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Total Upah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {previewData.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="px-4 py-3">{formatDate(item.periodStart)}</td>
                          <td className="px-4 py-3">{formatDate(item.periodEnd)}</td>
                          <td className="px-4 py-3 text-center font-medium">{item.workerCount} Orang</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.totalPayroll)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Capital Preview */}
              {reportType === 'capital' && Array.isArray(previewData) && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500">
                        <th className="px-4 py-3">Tanggal Injeksi</th>
                        <th className="px-4 py-3">Investor (Sumber)</th>
                        <th className="px-4 py-3">Keterangan</th>
                        <th className="px-4 py-3">Pencatat</th>
                        <th className="px-4 py-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {previewData.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.injectionDate)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">{item.source}</td>
                          <td className="px-4 py-3 truncate max-w-[150px]">{item.description || '-'}</td>
                          <td className="px-4 py-3">{item.createdBy}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-450">+ {formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Budget / RAB Preview */}
              {reportType === 'budget' && Array.isArray(previewData) && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500">
                        <th className="px-4 py-3">Kategori Anggaran</th>
                        <th className="px-4 py-3 text-right">Alokasi Budget</th>
                        <th className="px-4 py-3 text-right">Aktual Belanja</th>
                        <th className="px-4 py-3 text-right">Sisa Anggaran</th>
                        <th className="px-4 py-3 text-center">Persentase</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                      {previewData.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">{item.categoryName}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.allocatedBudget)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.actualSpending)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.remainingBudget)}</td>
                          <td className="px-4 py-3 text-center font-bold">{item.usagePercent}%</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Red'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                                : item.status === 'Yellow'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}>
                              {item.status === 'Red' ? 'OVER / CRISIS' : (item.status === 'Yellow' ? 'WARNING' : 'SAFE')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
