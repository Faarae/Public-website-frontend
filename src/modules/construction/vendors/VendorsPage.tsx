'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, CheckCircle, XCircle, AlertCircle, Calendar, Briefcase, Search, Save, Trash2, Award, ArrowUpRight, BarChart2, ShieldCheck, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface VendorMilestone {
  id: string;
  milestoneName: string;
  targetDate: string;
  targetProgress: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

interface VendorAudit {
  id: string;
  contractId: string;
  actualProgressPercent: number;
  notes: string;
  auditDate: string;
}

interface VendorProject {
  id: string;
  vendorName: string;
  jobType: string;
  volumeTarget?: string;
  contractValue: number;
  startDate?: string;
  targetCompletionDate?: string;
  weeklyTargets?: string; // JSON String
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  milestones?: VendorMilestone[];
  audits?: VendorAudit[];

  // Computed rating KPIs
  timelineAdherenceScore: number;
  weeklyConsistencyScore: number;
  crewAttendanceScore: number;
  finalPerformanceScore: number;
  performanceGrade: 'A' | 'B' | 'C';
  recommendation: string;
}

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [projectSearch, setProjectSearch] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<VendorProject | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<VendorProject | null>(null);

  // Form State
  const [vendorName, setVendorName] = useState('');
  const [jobType, setJobType] = useState('');
  const [volumeTarget, setVolumeTarget] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [projectStatus, setProjectStatus] = useState<'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'>('PLANNED');
  const [numWeeks, setNumWeeks] = useState(4);
  const [weeklyTargetValues, setWeeklyTargetValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery<VendorProject[]>({
    queryKey: ['vendorProjectsList'],
    queryFn: () => api.get('/v1/vendors/projects').then(res => res.data),
  });

  // Fetch project details when opened
  const { data: activeDetail = null, refetch: refetchDetail, isLoading: loadingDetail } = useQuery<VendorProject>({
    queryKey: ['vendorProjectDetail', selectedProject?.id],
    queryFn: () => api.get(`/v1/vendors/projects/${selectedProject?.id}`).then(res => res.data),
    enabled: !!selectedProject?.id,
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: any) => api.post('/v1/vendors/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProjectsList'] });
      setProjectModalOpen(false);
      resetProjectForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal membuat kontrak vendor.');
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/v1/vendors/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProjectsList'] });
      setProjectModalOpen(false);
      resetProjectForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Gagal mengubah kontrak vendor.');
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/vendors/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProjectsList'] });
    }
  });

  const approveMilestoneMutation = useMutation({
    mutationFn: ({ projectId, milestoneId }: { projectId: string; milestoneId: string }) =>
      api.post(`/v1/vendors/projects/${projectId}/milestones/${milestoneId}/approve`),
    onSuccess: () => {
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ['vendorProjectsList'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menyetujui milestone termin');
    }
  });

  const resetProjectForm = () => {
    setVendorName('');
    setJobType('');
    setVolumeTarget('');
    setContractValue('');
    setDisplayValue('');
    setStartDate('');
    setTargetCompletionDate('');
    setProjectStatus('PLANNED');
    setNumWeeks(4);
    setWeeklyTargetValues({});
    setEditingProject(null);
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetProjectForm();
    setProjectModalOpen(true);
  };

  const handleOpenEditModal = (project: VendorProject) => {
    setEditingProject(project);
    setVendorName(project.vendorName);
    setJobType(project.jobType);
    setVolumeTarget(project.volumeTarget || '');
    setContractValue(project.contractValue.toString());
    setDisplayValue(new Intl.NumberFormat('id-ID').format(project.contractValue));
    setStartDate(project.startDate || '');
    setTargetCompletionDate(project.targetCompletionDate || '');
    setProjectStatus(project.status);
    
    // Parse weekly targets
    if (project.weeklyTargets) {
      try {
        const parsed = JSON.parse(project.weeklyTargets);
        const keys = Object.keys(parsed);
        setNumWeeks(keys.length);
        const map: Record<string, string> = {};
        keys.forEach(k => {
          map[k] = parsed[k].toString();
        });
        setWeeklyTargetValues(map);
      } catch (e) {
        setNumWeeks(4);
        setWeeklyTargetValues({});
      }
    } else {
      setNumWeeks(4);
      setWeeklyTargetValues({});
    }

    setFormError(null);
    setProjectModalOpen(true);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !jobType.trim() || !contractValue) {
      setFormError('Nama Vendor, Tipe Pekerjaan, dan Nilai Kontrak wajib diisi.');
      return;
    }

    // Build weekly targets JSON
    const targets: Record<string, number> = {};
    for (let i = 1; i <= numWeeks; i++) {
      const val = weeklyTargetValues[String(i)] || '0';
      targets[String(i)] = parseFloat(val);
    }

    const payload = {
      vendorName,
      jobType,
      volumeTarget: volumeTarget || null,
      contractValue: parseFloat(contractValue),
      startDate: startDate || null,
      targetCompletionDate: targetCompletionDate || null,
      status: projectStatus,
      weeklyTargets: JSON.stringify(targets),
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: payload });
    } else {
      createProjectMutation.mutate(payload);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kontrak vendor ini?')) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleOpenDetailModal = (project: VendorProject) => {
    setSelectedProject(project);
    setDetailModalOpen(true);
  };

  const handleApproveMilestone = (milestoneId: string) => {
    if (selectedProject) {
      approveMilestoneMutation.mutate({ projectId: selectedProject.id, milestoneId });
    }
  };

  const getChartData = (project: VendorProject) => {
    if (!project || !project.weeklyTargets) return [];
    try {
      const targets = JSON.parse(project.weeklyTargets);
      return Object.entries(targets).map(([week, target]) => {
        const weekIdx = parseInt(week) - 1;
        const actual = project.audits && project.audits[weekIdx]
          ? project.audits[weekIdx].actualProgressPercent
          : 0;

        return {
          name: `Minggu ${week}`,
          Target: target,
          Actual: actual,
        };
      });
    } catch (e) {
      return [];
    }
  };

  const filteredProjects = projects.filter(p =>
    p.vendorName.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.jobType.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Kontrak & Evaluasi Vendor
          </h1>
          <p className="text-slate-555 mt-1 font-medium text-slate-500">
            Monitor target progress borongan, milestone termin, dan rating performa profil vendor.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/15 hover:opacity-95 transition-opacity"
        >
          <Plus className="h-5 w-5" />
          Tambah Kontrak Vendor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kontrak vendor..."
            value={projectSearch}
            onChange={e => setProjectSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm"
          />
        </div>
      </div>

      {/* Grid List of Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingProjects ? (
          <div className="col-span-full text-center py-10 text-slate-400 font-semibold">Memuat daftar kontrak vendor...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-400 font-semibold">Belum ada kontrak vendor terdaftar.</div>
        ) : (
          filteredProjects.map(proj => (
            <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group">
              
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    proj.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : proj.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-700'
                      : proj.status === 'DELAYED'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {proj.status === 'COMPLETED' ? 'COMPLETED' : proj.status === 'IN_PROGRESS' ? 'IN PROGRESS' : proj.status === 'DELAYED' ? 'DELAYED' : 'PLANNED'}
                  </span>
                  
                  {/* Visual Recommendation badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    proj.recommendation.includes('WORTH') 
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' 
                      : 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                  }`}>
                    Grade {proj.performanceGrade}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-cyan-600 transition-colors">
                  {proj.jobType}
                </h3>
                <p className="text-sm font-semibold text-slate-700">Vendor: {proj.vendorName}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-500 font-medium">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Nilai Kontrak</span>
                    <span className="font-bold text-slate-900">Rp {proj.contractValue.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Target Selesai</span>
                    <span className="font-bold text-slate-900">{formatDate(proj.targetCompletionDate)}</span>
                  </div>
                </div>
              </div>

              {/* KPI Performance summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-455 font-semibold">Skor Performa Akhir:</span>
                  <span className="font-bold text-slate-900">{proj.finalPerformanceScore} / 5</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${proj.finalPerformanceScore >= 3.5 ? 'bg-cyan-500' : 'bg-rose-500'}`}
                    style={{ width: `${(proj.finalPerformanceScore / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center pt-1 text-[10px] font-bold text-slate-400">
                  <span>WAKTU: {proj.timelineAdherenceScore}</span>
                  <span>TARGET: {proj.weeklyConsistencyScore}</span>
                  <span>ABSENSI: {proj.crewAttendanceScore}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 flex gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetailModal(proj)}
                  className="flex-1 text-center bg-slate-50 hover:bg-cyan-500 hover:text-white text-slate-700 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200"
                >
                  Evaluasi & Grafik
                </button>
                <button
                  onClick={() => handleOpenEditModal(proj)}
                  className="text-slate-400 hover:text-cyan-500 transition-colors p-2 border border-slate-200 rounded-xl"
                  title="Ubah Kontrak"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-2 border border-slate-200 rounded-xl"
                  title="Hapus Kontrak"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Contract Modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">
                {editingProject ? 'Ubah Kontrak Vendor' : 'Daftarkan Kontrak Vendor Baru'}
              </h3>
              <button onClick={() => setProjectModalOpen(false)} className="text-slate-400 hover:text-slate-655">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-105 p-3 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: CV Karya Jaya"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipe Pekerjaan (Job Type)</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Pasang Keramik Villa"
                    value={jobType}
                    onChange={e => setJobType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nilai Kontrak (Borongan)</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: 15.000.000"
                    value={displayValue}
                    onChange={e => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      const formatted = rawVal ? new Intl.NumberFormat('id-ID').format(Number(rawVal)) : '';
                      setDisplayValue(formatted);
                      setContractValue(rawVal);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Volume Target</label>
                  <input
                    type="text"
                    placeholder="contoh: 200 m2"
                    value={volumeTarget}
                    onChange={e => setVolumeTarget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Target Selesai</label>
                  <input
                    type="date"
                    value={targetCompletionDate}
                    onChange={e => setTargetCompletionDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status Kontrak</label>
                  <select
                    value={projectStatus}
                    onChange={e => setProjectStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="PLANNED">PLANNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DELAYED">DELAYED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Durasi (Minggu)</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={numWeeks}
                    onChange={e => setNumWeeks(Math.min(52, Math.max(1, Number(e.target.value))))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              {/* Weekly Targets input */}
              <div className="border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Progress Kumulatif Mingguan (%)
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-1">
                  {Array.from({ length: numWeeks }, (_, i) => {
                    const week = String(i + 1);
                    return (
                      <div key={week} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 min-w-[50px]">Minggu {week}:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          placeholder="Target %"
                          value={weeklyTargetValues[week] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setWeeklyTargetValues(prev => ({ ...prev, [week]: val }));
                          }}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs focus:ring-cyan-500"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Target kumulatif harus meningkat menuju 100% pada minggu terakhir.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-cyan-500/10 hover:opacity-95 transition-opacity"
                >
                  {editingProject ? 'Simpan Kontrak' : 'Daftarkan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Evaluasi & Dashboard Modal */}
      {detailModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Dashboard Evaluasi Performa Vendor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Kontrak: {selectedProject.jobType} | Vendor: {selectedProject.vendorName}</p>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedProject(null);
                }}
                className="text-slate-400 hover:text-slate-655"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Profil & Badges Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Dynamically Loaded Rating Profile */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                  <div className="absolute top-2 right-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700`}>
                      Grade {(activeDetail || selectedProject).performanceGrade}
                    </span>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-cyan-500/10 mb-3">
                    {(activeDetail || selectedProject).finalPerformanceScore}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Rating Evaluasi Proyek</h4>
                  <p className="text-xs text-slate-455 mt-1 font-semibold">Skor Gabungan (Skala 1 - 5)</p>
                  
                  {/* Worth it / visual badge recommendation */}
                  <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold ${
                    (activeDetail || selectedProject).recommendation.includes('WORTH')
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  }`}>
                    {(activeDetail || selectedProject).recommendation}
                  </div>
                </div>

                {/* Target vs Actual Progress Chart */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2 shadow-sm min-h-[220px]">
                  <h4 className="font-bold text-xs text-slate-555 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-cyan-600" />
                    Grafik Progress Mingguan (Target vs Aktual)
                  </h4>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getChartData(activeDetail || selectedProject)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                        <Line type="monotone" dataKey="Target" stroke="#64748b" strokeWidth={2} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Actual" stroke="#0ea5e9" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Milestones / Termin Payout Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-cyan-600" />
                  Rencana Payout & Milestone Proyek
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-3">Nama Milestone</th>
                        <th className="px-4 py-3 text-center">Target Tanggal</th>
                        <th className="px-4 py-3 text-center">Progress Target</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Aksi Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {loadingDetail ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400">Memuat detail milestone...</td>
                        </tr>
                      ) : !(activeDetail || selectedProject).milestones || (activeDetail || selectedProject).milestones?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400">Belum ada milestone dibuat.</td>
                        </tr>
                      ) : (
                        (activeDetail || selectedProject).milestones?.map(m => {
                          const isApproved = m.status === 'APPROVED';
                          const isPaid = m.status === 'PAID';

                          return (
                            <tr key={m.id} className="hover:bg-slate-50/20 text-xs">
                              <td className="px-4 py-3 font-semibold text-slate-900">{m.milestoneName}</td>
                              <td className="px-4 py-3 text-center text-slate-600">{formatDate(m.targetDate)}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-900">{m.targetProgress}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isApproved
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {m.status === 'PENDING' ? (
                                  <button
                                    onClick={() => handleApproveMilestone(m.id)}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all"
                                  >
                                    Setujui Cair Termin
                                  </button>
                                ) : isApproved ? (
                                  <span className="text-[10px] text-blue-500 font-semibold italic">Siap dibayarkan di payroll berikutnya</span>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-semibold italic">Termin Telah Dicairkan & Lunas</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weekly Evaluations logs list */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <BarChart2 className="h-5 w-5 text-cyan-600" />
                  Riwayat Audit & Kendala Lapangan Mingguan
                </h4>
                <div className="space-y-2 border border-slate-200 p-4 rounded-xl max-h-[160px] overflow-y-auto shadow-sm">
                  {!(activeDetail || selectedProject).audits || (activeDetail || selectedProject).audits?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Belum ada riwayat audit masuk.</p>
                  ) : (
                    (activeDetail || selectedProject).audits?.map((a, idx) => (
                      <div key={a.id || idx} className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-500">Tanggal Audit: {formatDate(a.auditDate)}</span>
                          <p className="text-slate-700 font-medium">{a.notes || 'Tidak ada catatan khusus.'}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-bold">Progress Aktual</span>
                          <span className="font-bold text-cyan-600 text-sm">{a.actualProgressPercent}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    setSelectedProject(null);
                  }}
                  className="px-6 py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl font-bold transition-all text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
