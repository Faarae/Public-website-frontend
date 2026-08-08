'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, CheckCircle, XCircle, AlertCircle, Calendar, ClipboardCheck, Users, Search, UserCheck, UserMinus, Save, ChevronLeft, ChevronRight, Award, BarChart2 } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface Worker {
  id: string;
  fullName: string;
  phoneNumber?: string;
  position?: string;
  dailyRate: number;
  workerType?: 'DAILY_LABOR' | 'VENDOR';
  vendorProjectId?: string;
  vendorProjectName?: string;
  status: string; // ACTIVE, INACTIVE
  notes?: string;
}

interface AttendanceDto {
  id?: string;
  workerId: string;
  workerName?: string;
  attendanceDate: string;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
  notes?: string;
}

interface WeeklyAttendanceItem {
  workerId: string;
  workerType: 'DAILY_LABOR' | 'VENDOR';
  days: Record<string, boolean>;
}

interface VendorEvaluationDto {
  id?: string;
  vendorId?: string;
  contractId: string;
  actualProgressPercent: number;
  notes: string;
  auditDate: string;
}
const DEFAULT_WORKERS: Worker[] = [];
const DEFAULT_VENDOR_PROJECTS: any[] = [];
const DEFAULT_WEEKLY_GRID = {
  gridItems: [] as WeeklyAttendanceItem[],
  vendorEvaluationResults: [] as VendorEvaluationDto[],
};

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'workers' | 'attendance'>('workers');
  
  // Workers Tab state
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  
  // Worker Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [displayDailyRate, setDisplayDailyRate] = useState('');
  const [workerType, setWorkerType] = useState<'DAILY_LABOR' | 'VENDOR'>('DAILY_LABOR');
  const [vendorProjectId, setVendorProjectId] = useState('');
  const [workerStatus, setWorkerStatus] = useState('ACTIVE');
  const [workerNotes, setWorkerNotes] = useState('');
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Attendance Tab state (Weekly Grid)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<Record<string, Record<string, boolean>>>({});
  const [vendorEvals, setVendorEvals] = useState<Record<string, { progress: number; notes: string }>>({});
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Vendor evaluation modal state
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedVendorForEval, setSelectedVendorForEval] = useState<{ id: string; name: string; contractId: string } | null>(null);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalNotes, setEvalNotes] = useState('');

  // Fetch Workers
  const { data: workers = DEFAULT_WORKERS, isLoading: loadingWorkers } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: () => api.get('/v1/workers').then(res => res.data),
  });

  // Fetch Active Workers
  const { data: activeWorkers = DEFAULT_WORKERS } = useQuery<Worker[]>({
    queryKey: ['workers', 'active'],
    queryFn: () => api.get('/v1/workers/active').then(res => res.data),
  });

  // Fetch Vendor Projects
  const { data: vendorProjects = DEFAULT_VENDOR_PROJECTS } = useQuery<any[]>({
    queryKey: ['vendorProjects'],
    queryFn: () => api.get('/v1/vendors/projects').then(res => res.data),
  });

  // Calculate Monday to Sunday Range of selectedDate
  const getMonSunRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    
    const dates = Array.from({ length: 7 }, (_, i) => {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      return next.toISOString().split('T')[0];
    });

    return {
      monday: monday.toISOString().split('T')[0],
      sunday: dates[6],
      dates
    };
  };

  const currentRange = getMonSunRange(selectedDate);

  // Fetch Weekly Attendance Grid
  const { data: weeklyGrid = DEFAULT_WEEKLY_GRID, refetch: refetchWeekly, isLoading: loadingWeeklyGrid } = useQuery<{
    gridItems: WeeklyAttendanceItem[];
    vendorEvaluationResults: VendorEvaluationDto[];
  }>({
    queryKey: ['attendance', 'weekly', currentRange.monday, currentRange.sunday],
    queryFn: () => api.get(`/v1/attendance/weekly?startDate=${currentRange.monday}&endDate=${currentRange.sunday}`).then(res => res.data),
    enabled: activeTab === 'attendance',
  });

  // Sync weekly grid into local state records
  useEffect(() => {
    if (activeTab === 'attendance' && weeklyGrid) {
      const records: Record<string, Record<string, boolean>> = {};
      const evals: Record<string, { progress: number; notes: string }> = {};

      weeklyGrid.gridItems.forEach(item => {
        records[item.workerId] = { ...item.days };
      });

      // Fill in defaults for missing active workers
      activeWorkers.forEach(w => {
        if (!records[w.id]) {
          records[w.id] = {};
          currentRange.dates.forEach(d => {
            records[w.id][d] = false;
          });
        }
      });

      weeklyGrid.vendorEvaluationResults.forEach(ev => {
        if (ev.contractId) {
          evals[ev.contractId] = {
            progress: ev.actualProgressPercent || 0,
            notes: ev.notes || '',
          };
        }
      });

      setWeeklyAttendance(records);
      setVendorEvals(evals);
    }
  }, [weeklyGrid, activeWorkers, activeTab, selectedDate]);

  // Mutations
  const createWorkerMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/workers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setWorkerModalOpen(false);
      resetWorkerForm();
    },
    onError: (err: any) => {
      setWorkerError(err.response?.data?.message || 'Gagal menambahkan pekerja.');
    }
  });

  const updateWorkerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/v1/workers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setWorkerModalOpen(false);
      resetWorkerForm();
    },
    onError: (err: any) => {
      setWorkerError(err.response?.data?.message || 'Gagal mengubah data pekerja.');
    }
  });

  const toggleWorkerStatusMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/workers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    }
  });

  const saveWeeklyAttendanceMutation = useMutation({
    mutationFn: (payload: any) => api.post('/v1/attendance/weekly', payload),
    onSuccess: () => {
      refetchWeekly();
      setAttendanceMsg({ type: 'success', text: 'Absensi & evaluasi mingguan berhasil dicatat!' });
      setTimeout(() => setAttendanceMsg(null), 3000);
    },
    onError: (err: any) => {
      setAttendanceMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan kehadiran mingguan' });
      setTimeout(() => setAttendanceMsg(null), 5000);
    }
  });

  const resetWorkerForm = () => {
    setFullName('');
    setPhoneNumber('');
    setPosition('');
    setDailyRate('');
    setDisplayDailyRate('');
    setWorkerType('DAILY_LABOR');
    setVendorProjectId('');
    setWorkerStatus('ACTIVE');
    setWorkerNotes('');
    setEditingWorker(null);
    setWorkerError(null);
  };

  const handleOpenAddModal = () => {
    resetWorkerForm();
    setWorkerModalOpen(true);
  };

  const handleOpenEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFullName(worker.fullName);
    setPhoneNumber(worker.phoneNumber || '');
    setPosition(worker.position || '');
    setWorkerType(worker.workerType || 'DAILY_LABOR');
    setVendorProjectId(worker.vendorProjectId || '');
    setDailyRate(worker.dailyRate ? worker.dailyRate.toString() : '');
    setDisplayDailyRate(worker.dailyRate ? new Intl.NumberFormat('id-ID').format(worker.dailyRate) : '');
    setWorkerStatus(worker.status);
    setWorkerNotes(worker.notes || '');
    setWorkerError(null);
    setWorkerModalOpen(true);
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setWorkerError('Nama Lengkap wajib diisi');
      return;
    }
    if (workerType === 'DAILY_LABOR' && !dailyRate) {
      setWorkerError('Gaji Harian wajib diisi untuk pengerja harian');
      return;
    }

    const payload = {
      fullName,
      phoneNumber: phoneNumber || null,
      position: position || null,
      dailyRate: workerType === 'DAILY_LABOR' ? parseFloat(dailyRate) : null,
      workerType,
      vendorProjectId: workerType === 'VENDOR' ? vendorProjectId || null : null,
      status: workerStatus,
      notes: workerNotes || null,
    };

    if (editingWorker) {
      updateWorkerMutation.mutate({ id: editingWorker.id, data: payload });
    } else {
      createWorkerMutation.mutate(payload);
    }
  };

  const handleToggleStatus = (id: string) => {
    if (confirm('Apakah Anda yakin ingin mengubah status aktif/nonaktif pekerja ini?')) {
      toggleWorkerStatusMutation.mutate(id);
    }
  };

  const handleCheckboxChange = (workerId: string, dateStr: string, checked: boolean) => {
    setWeeklyAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...(prev[workerId] || {}),
        [dateStr]: checked,
      }
    }));
  };

  const handleOpenEvalModal = (worker: Worker) => {
    if (!worker.vendorProjectId) return;
    const existing = vendorEvals[worker.vendorProjectId] || { progress: 0, notes: '' };
    setSelectedVendorForEval({
      id: worker.id,
      name: worker.fullName,
      contractId: worker.vendorProjectId,
    });
    setEvalProgress(existing.progress);
    setEvalNotes(existing.notes);
    setEvalModalOpen(true);
  };

  const handleSaveEvaluation = () => {
    if (!selectedVendorForEval) return;
    setVendorEvals(prev => ({
      ...prev,
      [selectedVendorForEval.contractId]: {
        progress: evalProgress,
        notes: evalNotes,
      }
    }));
    setEvalModalOpen(false);
    setSelectedVendorForEval(null);
  };

  const handleSubmitWeekly = () => {
    const attendances = Object.entries(weeklyAttendance).map(([workerId, days]) => {
      const w = activeWorkers.find(x => x.id === workerId);
      return {
        workerId,
        workerType: w?.workerType || 'DAILY_LABOR',
        days,
      };
    });

    const vendorEvaluations = Object.entries(vendorEvals).map(([contractId, data]) => {
      const w = activeWorkers.find(x => x.workerType === 'VENDOR' && x.vendorProjectId === contractId);
      return {
        vendorId: w?.id || null,
        contractId,
        actualProgressPercent: data.progress,
        notes: data.notes || null,
      };
    });

    const payload = {
      weekNumber: 1,
      weekStartDate: currentRange.monday,
      weekEndDate: currentRange.sunday,
      attendances,
      vendorEvaluations,
    };

    saveWeeklyAttendanceMutation.mutate(payload);
  };

  const changeWeek = (daysOffset: number) => {
    const baseDate = new Date(selectedDate);
    baseDate.setDate(baseDate.getDate() + daysOffset);
    setSelectedDate(baseDate.toISOString().split('T')[0]);
  };

  const filteredWorkers = workers.filter(w =>
    w.fullName.toLowerCase().includes(workerSearch.toLowerCase()) ||
    (w.position && w.position.toLowerCase().includes(workerSearch.toLowerCase()))
  );

  const getDayName = (dateStr: string) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[new Date(dateStr).getDay()];
  };

  const countPresentDays = (workerId: string) => {
    const daysMap = weeklyAttendance[workerId] || {};
    return Object.values(daysMap).filter(val => val === true).length;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Pekerja & Absensi
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola data pekerja harian, pihak ketiga (vendor), serta checklist absensi grid mingguan.
          </p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'workers'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Daftar Pekerja
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'attendance'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Ceklist Grid Mingguan
          </button>
        </div>
      </div>

      {/* Workers Tab */}
      {activeTab === 'workers' && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pekerja..."
                value={workerSearch}
                onChange={e => setWorkerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-sm"
              />
            </div>
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/15 hover:opacity-95 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Tambah Pekerja
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Tipe Pekerja</th>
                    <th className="px-6 py-4">Jabatan</th>
                    <th className="px-6 py-4">Proyek / Kontrak</th>
                    <th className="px-6 py-4 text-right">Gaji Harian</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/60 text-sm">
                  {loadingWorkers ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">Memuat daftar pekerja...</td>
                    </tr>
                  ) : filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">Belum ada pekerja terdaftar.</td>
                    </tr>
                  ) : (
                    filteredWorkers.map(w => (
                      <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{w.fullName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            w.workerType === 'VENDOR' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {w.workerType === 'VENDOR' ? 'VENDOR' : 'HARIAN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{w.position || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                          {w.workerType === 'VENDOR' ? (w.vendorProjectName || 'Belum ditautkan') : 'N/A (Harian)'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {w.workerType === 'VENDOR' ? '-' : `Rp ${(w.dailyRate || 0).toLocaleString('id-ID')}`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            w.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {w.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleOpenEditModal(w)}
                              className="text-slate-400 hover:text-cyan-500 transition-colors"
                              title="Ubah Info"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(w.id)}
                              className={`transition-colors ${
                                w.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-rose-500'
                                  : 'text-slate-400 hover:text-emerald-500'
                              }`}
                              title={w.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {w.status === 'ACTIVE' ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          </div>
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

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Week Selector Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => changeWeek(-7)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <div className="px-3 text-center flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-550 uppercase tracking-wider">Cari Tanggal:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 bg-white text-slate-900"
                    />
                  </div>
                  <span className="block text-sm font-semibold text-slate-900 mt-2">
                    Periode: {formatDate(currentRange.monday)} s.d. {formatDate(currentRange.sunday)}
                  </span>
                </div>
                <button onClick={() => changeWeek(7)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
            {attendanceMsg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border ${
                attendanceMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
              }`}>
                <AlertCircle className="h-4 w-4" />
                {attendanceMsg.text}
              </div>
            )}
          </div>

          {/* Weekly Grid Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-4 min-w-[150px]">Nama Pekerja</th>
                    <th className="px-3 py-4 text-center">Tipe</th>
                    {currentRange.dates.map(date => (
                      <th key={date} className="px-2 py-4 text-center">
                        <span className="block">{getDayName(date)}</span>
                        <span className="text-[10px] text-slate-400">{date.split('-')[2]}</span>
                      </th>
                    ))}
                    <th className="px-3 py-4 text-center font-bold">Hadir</th>
                    <th className="px-4 py-4 text-center">Evaluasi Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/60 text-sm">
                  {loadingWeeklyGrid ? (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-slate-455">Memuat grid absensi...</td>
                    </tr>
                  ) : activeWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-slate-455">Tidak ada pekerja aktif terdaftar.</td>
                    </tr>
                  ) : (
                    activeWorkers.map(w => {
                      const workerDays = weeklyAttendance[w.id] || {};
                      const isVendor = w.workerType === 'VENDOR';

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {w.fullName}
                            {w.position && <span className="block text-xs text-slate-400 font-normal">{w.position}</span>}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isVendor ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isVendor ? 'VENDOR' : 'HARIAN'}
                            </span>
                          </td>
                          {currentRange.dates.map(date => {
                            const checked = workerDays[date] || false;
                            return (
                              <td key={date} className="px-2 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={e => handleCheckboxChange(w.id, date, e.target.checked)}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/50"
                                />
                              </td>
                            );
                          })}
                          <td className="px-3 py-4 text-center font-bold text-slate-900">
                            {countPresentDays(w.id)} hr
                          </td>
                          <td className="px-4 py-4 text-center">
                            {isVendor ? (
                              w.vendorProjectId ? (
                                <button
                                  onClick={() => handleOpenEvalModal(w)}
                                  className="flex items-center gap-1.5 mx-auto bg-slate-100 hover:bg-cyan-500 hover:text-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-slate-200"
                                >
                                  <Award className="h-3.5 w-3.5" />
                                  Progress: {(vendorEvals[w.vendorProjectId]?.progress || 0)}%
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No Contract Linked</span>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {activeWorkers.length > 0 && (
              <div className="p-6 border-t border-slate-250 bg-slate-50/30 flex justify-end">
                <button
                  onClick={handleSubmitWeekly}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-500/10 hover:opacity-95 transition-opacity"
                >
                  <Save className="h-5 w-5" />
                  Simpan Absensi & Evaluasi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Worker Modal */}
      {workerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">
                {editingWorker ? 'Ubah Data Pekerja' : 'Daftarkan Pekerja Baru'}
              </h3>
              <button
                onClick={() => setWorkerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleWorkerSubmit} className="p-6 space-y-4">
              {workerError && (
                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 p-3 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                  {workerError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Budi Santoso"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipe Pekerja</label>
                  <select
                    value={workerType}
                    onChange={e => setWorkerType(e.target.value as 'DAILY_LABOR' | 'VENDOR')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="DAILY_LABOR">DAILY LABOR (Pengerja Harian)</option>
                    <option value="VENDOR">VENDOR (Pihak Ketiga Borongan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Posisi / Jabatan</label>
                  <input
                    type="text"
                    placeholder="contoh: Tukang Cat, Keramik"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              {workerType === 'DAILY_LABOR' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gaji Harian (IDR)</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: 150.000"
                    value={displayDailyRate}
                    onChange={e => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      const formatted = rawVal ? new Intl.NumberFormat('id-ID').format(Number(rawVal)) : '';
                      setDisplayDailyRate(formatted);
                      setDailyRate(rawVal);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kontrak Vendor / Proyek Borongan</label>
                  <select
                    value={vendorProjectId}
                    onChange={e => setVendorProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="">-- Pilih Kontrak Proyek --</option>
                    {vendorProjects.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        {proj.vendorName} - {proj.jobType} (Rp {proj.contractValue.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Vendor dibayar berdasarkan Milestone / Progress proyek borongannya.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor Telepon</label>
                <input
                  type="text"
                  placeholder="contoh: 0812-3456-7890"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              {editingWorker && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={workerStatus}
                    onChange={e => setWorkerStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="ACTIVE">AKTIF</option>
                    <option value="INACTIVE">NONAKTIF</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Catatan</label>
                <textarea
                  placeholder="Catatan pengerja..."
                  value={workerNotes}
                  onChange={e => setWorkerNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setWorkerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-655 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/10 hover:opacity-95 transition-opacity"
                >
                  {editingWorker ? 'Simpan' : 'Daftarkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Evaluation Modal */}
      {evalModalOpen && selectedVendorForEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Evaluasi Progress Vendor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Vendor: {selectedVendorForEval.name}</p>
              </div>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Actual Progress Kumulatif (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={evalProgress}
                    onChange={e => setEvalProgress(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalProgress}
                    onChange={e => setEvalProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-sm font-bold text-slate-600">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Catatan Evaluasi / Kendala Lapangan
                </label>
                <textarea
                  placeholder="Tulis kendala pengiriman material, hambatan cuaca, atau catatan target pengerjaan di sini..."
                  value={evalNotes}
                  onChange={e => setEvalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEvalModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEvaluation}
                  className="bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/10 hover:bg-cyan-600 transition-colors"
                >
                  Simpan Evaluasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
