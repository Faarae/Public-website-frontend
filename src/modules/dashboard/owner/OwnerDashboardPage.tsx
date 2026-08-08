'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid 
} from 'recharts';
import { TrendingUp, Banknote, Coins, PiggyBank, Users, Wallet, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';
import Link from 'next/link';

const COLORS = ['#06b6d4', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];

interface DashboardData {
  totalInvestment: number;
  todayExpense: number;
  monthlyExpense: number;
  transactionCount: number;
  totalCapital: number;
  remainingBudget: number;
  expensesTotal: number;
  payrollTotal: number;
  overallSpending: number;
  budgetUtilizationPercent: number;
  activeWorkersCount: number;
  currentWeekPayroll: number;
  currentMonthPayroll: number;
  monthlyChart: Array<{ month: string; amount: number }>;
  categoryDistribution: Array<{ category: string; amount: number }>;
  budgetUtilizationChart: Array<{
    categoryName: string;
    allocatedBudget: number;
    actualSpending: number;
    remainingBudget: number;
    utilizationPercent: number;
  }>;
  capitalFlowChart: Array<{
    month: string;
    capitalReceived: number;
    totalSpending: number;
    remainingBalance: number;
  }>;
  weeklyPayrollTrend: Array<{ period: string; amount: number }>;
  monthlyPayrollTrend: Array<{ period: string; amount: number }>;
}

interface CapitalInflow {
  id: string;
  amount: number;
  source: string;
  injectionDate: string;
  description?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function OwnerDashboardPage() {
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'inflows' | 'outflows'>('overview');
  const [payrollPeriodTab, setPayrollPeriodTab] = useState<'weekly' | 'monthly'>('weekly');

  // Fetch Dashboard Stats
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
    refetchInterval: 15000,
  });

  // Fetch Capital Inflows (to show on Inflows Dashboard)
  const { data: capitals = [] } = useQuery<CapitalInflow[]>({
    queryKey: ['capitals-dashboard'],
    queryFn: async () => {
      const response = await api.get('/v1/capital');
      return response.data;
    },
    enabled: dashboardTab === 'inflows',
  });

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center border border-slate-800 bg-slate-900/40 rounded-3xl p-8 text-rose-455 gap-3">
        <span className="font-medium">Gagal memuat statistik keuangan. Silakan periksa koneksi service backend.</span>
      </div>
    );
  }

  // System Notifications
  const alerts: string[] = [];
  if (data) {
    if (data.budgetUtilizationPercent > 90) {
      alerts.push(`Peringatan: Anggaran proyek hampir habis! Total serapan anggaran telah mencapai ${data.budgetUtilizationPercent}%.`);
    }
    if (data.remainingBudget < 10000000) {
      alerts.push(`Peringatan Likuiditas: Sisa saldo kas berjalan sangat menipis (${formatCurrency(data.remainingBudget)}). Segera lakukan penyuntikan modal.`);
    }
    data.budgetUtilizationChart.forEach((b) => {
      if (b.utilizationPercent > 95 && b.allocatedBudget > 0) {
        alerts.push(`Anggaran kategori "${b.categoryName}" telah terserap ${b.utilizationPercent}% (${formatCurrency(b.actualSpending)} / ${formatCurrency(b.allocatedBudget)}).`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header section with clean tab switches */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Dashboard Zain Al Mansion
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analisis real-time investasi modal masuk, realisasi rencana anggaran biaya (RAB), upah, dan grafik trend pengeluaran pembangunan villa.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setDashboardTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              dashboardTab === 'overview'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Ringkasan Eksekutif
          </button>
          <button
            onClick={() => setDashboardTab('inflows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              dashboardTab === 'inflows'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PiggyBank className="h-4 w-4" />
            Modal Masuk (Inflow)
          </button>
          <button
            onClick={() => setDashboardTab('outflows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              dashboardTab === 'outflows'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-655 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Banknote className="h-4 w-4" />
            Pengeluaran & Payroll (Outflow)
          </button>
        </div>
      </div>

      {/* Notifications/Alerts Banners */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && data && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-sm">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>Kondisi keuangan sehat. Pengeluaran berada di bawah pagu anggaran dan saldo kas aman.</span>
        </div>
      )}

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {dashboardTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Total Injeksi Modal (Capital)</span>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isLoading ? '...' : formatCurrency(data?.totalCapital || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Seluruh dana investasi disetor</p>
            </div>
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Total Spending Proyek</span>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isLoading ? '...' : formatCurrency(data?.overallSpending || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Konstruksi + Gaji Tukang</p>
            </div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Sisa Kas Berjalan</span>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isLoading ? '...' : formatCurrency(data?.remainingBudget || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Likuiditas kas saat ini</p>
            </div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Serapan Anggaran (RAB)</span>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isLoading ? '...' : `${data?.budgetUtilizationPercent}%`}
              </span>
              <p className="text-xs text-slate-400 mt-2">Pencapaian belanja terhadap RAB</p>
            </div>
          </div>

          {/* Capital Flow Area Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col h-[400px] shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 mb-6 uppercase tracking-wider">Aliran Arus Kas (Capital vs Spending vs Balance)</h3>
              <div className="flex-1 w-full text-xs">
                {isLoading ? (
                  <div className="h-full w-full bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">
                    Memuat grafik...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.capitalFlowChart || []} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} tickFormatter={(t) => `Rp ${t / 1000000}Jt`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="remainingBalance" name="Saldo Berjalan" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBalance)" />
                      <Area type="monotone" dataKey="capitalReceived" name="Modal Masuk" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={0} />
                      <Area type="monotone" dataKey="totalSpending" name="Pengeluaran" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Budget vs Actual Mini Radar/Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col h-[400px] shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 mb-6 uppercase tracking-wider">Distribusi Belanja Konstruksi</h3>
              <div className="flex-1 w-full text-xs flex items-center justify-center">
                {isLoading ? (
                  <div className="h-full w-full bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">
                    Memuat...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.categoryDistribution || []}
                        cx="50%"
                        cy="40%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {(data?.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
                      />
                      <Legend verticalAlign="bottom" height={100} formatter={(val) => <span className="text-slate-400 text-xs">{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INFLOWS (INVESTMENT) */}
      {dashboardTab === 'inflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm group">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Total Investasi Masuk (Capital Inflow)</span>
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(data?.totalCapital || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Dana cair siap pakai untuk pembangunan</p>
            </div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm group">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Sisa Saldo Likuid</span>
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(data?.remainingBudget || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Selisih kas dari modal dikurangi pengeluaran</p>
            </div>
          </div>

          {/* Recent Capital Inflows List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Histori Aliran Investasi Terakhir</h3>
              <Link href="/capital" className="text-xs font-semibold text-cyan-500 hover:underline">Kelola Modal →</Link>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Sumber Dana / Investor</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4 text-right">Jumlah Modal (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {capitals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">Belum ada aliran investasi terdaftar.</td>
                    </tr>
                  ) : (
                    capitals.slice(0, 8).map((cap) => (
                      <tr key={cap.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="px-6 py-4 font-medium">{formatDate(cap.injectionDate)}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{cap.source}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{cap.description || '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          + {formatCurrency(cap.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OUTFLOWS (EXPENDITURES, BUDGETS & PAYROLL) */}
      {dashboardTab === 'outflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm group">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Pembelian Material (Expenses)</span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(data?.expensesTotal || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Logistik & bahan bangunan</p>
            </div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm group">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Gaji Tenaga Kerja (Payroll)</span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(data?.payrollTotal || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Gaji pengerja & borongan vendor</p>
            </div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm group">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Tenaga Kerja Aktif</span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {data?.activeWorkersCount || 0} Orang
              </span>
              <p className="text-xs text-slate-400 mt-2">Kru lapangan terdaftar aktif</p>
            </div>

            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl overflow-hidden shadow-sm group">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Gaji Cair Minggu Ini</span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(data?.currentWeekPayroll || 0)}
              </span>
              <p className="text-xs text-slate-400 mt-2">Payroll terbayar minggu ini</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Budget vs Actual Utilization Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col h-[400px] shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 mb-6 uppercase tracking-wider">Perbandingan Budget vs Realisasi Belanja (RAB)</h3>
              <div className="flex-1 w-full text-xs">
                {isLoading ? (
                  <div className="h-full w-full bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">
                    Memuat data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.budgetUtilizationChart || []} layout="vertical" margin={{ left: 30, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                      <XAxis type="number" stroke="#64748b" tickLine={false} tickFormatter={(t) => `Rp ${t / 1000000}Jt`} />
                      <YAxis type="category" dataKey="categoryName" stroke="#64748b" tickLine={false} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                      />
                      <Legend />
                      <Bar dataKey="allocatedBudget" name="Anggaran RAB" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="actualSpending" name="Belanja Aktual" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Payroll Weekly/Monthly Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col h-[400px] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Trend Payroll</h3>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setPayrollPeriodTab('weekly')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      payrollPeriodTab === 'weekly' ? 'bg-cyan-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    onClick={() => setPayrollPeriodTab('monthly')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      payrollPeriodTab === 'monthly' ? 'bg-cyan-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    Bulanan
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full text-xs">
                {isLoading ? (
                  <div className="h-full w-full bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">
                    Memuat...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={payrollPeriodTab === 'weekly' ? (data?.weeklyPayrollTrend || []) : (data?.monthlyPayrollTrend || [])}
                      margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                    >
                      <XAxis dataKey="period" stroke="#64748b" tickLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} tickFormatter={(t) => `Rp ${t / 1000000}Jt`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                      />
                      <Bar dataKey="amount" name="Jumlah Gaji" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Quick PDF Report link */}
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/15 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-base">Modul Ekspor Laporan Finansial & Dokumen Cetak</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Ekspor data modal, biaya belanja harian, payroll harian, dan evaluasi target RAB langsung ke berkas PDF and Excel formal.</p>
              </div>
            </div>
            <Link href="/reports" className="px-5 py-2.5 bg-cyan-500 text-white font-bold text-sm rounded-2xl hover:bg-cyan-600 transition shadow-md shadow-cyan-500/25 shrink-0">
              Buka Modul Laporan →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
