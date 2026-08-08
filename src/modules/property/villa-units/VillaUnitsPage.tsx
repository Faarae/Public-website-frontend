'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, Wrench, ShieldAlert, Plus, CheckCircle, Save } from 'lucide-react';
import api from '@/services/api';

interface VillaUnit {
  id: string;
  name: string;
  description: string;
  capacityAdult: number;
  capacityChild: number;
  bedrooms: number;
  basePrice: number;
  status: string;
  cleaningStatus: string;
}

interface MaintenanceLog {
  id: string;
  villaUnit: VillaUnit;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  cost: number;
}

export default function VillaUnitsPage() {
  const queryClient = useQueryClient();
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [selectedVillaId, setSelectedVillaId] = useState('');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintCost, setMaintCost] = useState('');

  // Fetch Rooms
  const { data: units = [], isLoading } = useQuery<VillaUnit[]>({
    queryKey: ['admin-villas-list'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/villas');
      return response.data;
    },
  });

  // Fetch Maintenance Logs
  const { data: logs = [] } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance-logs'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/villas/maintenance');
      return response.data;
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (payload: { villaUnitId: string; description: string; cost: number }) => {
      await api.post('/v1/admin/villas/maintenance', {
        villaUnit: { id: payload.villaUnitId },
        description: payload.description,
        cost: payload.cost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-villas-list'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      setMaintenanceOpen(false);
      setMaintDescription('');
      setMaintCost('');
      alert('Tugas pemeliharaan berhasil dicatat. Status kamar diubah ke Maintenance.');
    },
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: async (logId: string) => {
      await api.patch(`/v1/admin/villas/maintenance/${logId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-villas-list'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-logs'] });
      alert('Tugas pemeliharaan selesai! Status kamar kembali Available.');
    },
  });

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillaId || !maintDescription) return;

    createMaintenanceMutation.mutate({
      villaUnitId: selectedVillaId,
      description: maintDescription,
      cost: maintCost ? parseFloat(maintCost) : 0,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusColor = (status: string) => {
    const config: Record<string, string> = {
      AVAILABLE: 'bg-emerald-50 text-emerald-600 border border-emerald-250',
      BOOKED: 'bg-cyan-50 text-cyan-600 border border-cyan-250',
      CHECKED_IN: 'bg-indigo-50 text-indigo-600 border border-indigo-250',
      MAINTENANCE: 'bg-rose-50 text-rose-600 border border-rose-250',
    };
    return config[status] || 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Daftar Unit Villa & Maintenance
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Pantau status operasional harian kamar (Available, Booked, Checked In, Maintenance) serta catat biaya perbaikan unit.
          </p>
        </div>

        {/* Add Maintenance trigger */}
        <button
          onClick={() => {
            if (units.length > 0) {
              setSelectedVillaId(units[0].id);
              setMaintenanceOpen(true);
            }
          }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
        >
          <Plus className="h-5 w-5" />
          Catat Maintenance Unit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Rooms list */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Status Kamar Real-time</h3>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Memuat data unit...</div>
          ) : (
            <div className="space-y-4">
              {units.map((u) => (
                <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center shadow-sm">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{u.name}</h4>
                    <span className="text-[10px] text-slate-450 block">Base Price: {formatCurrency(u.basePrice)}</span>
                    <span className="text-[10px] text-slate-450 block">Kondisi Kebersihan: <strong>{u.cleaningStatus}</strong></span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getStatusColor(u.status)}`}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Maintenance logs */}
        <div className="lg:col-span-6 space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Log Perbaikan / Pemeliharaan</h3>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-4">
              Belum ada log pemeliharaan tercatat.
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">{log.villaUnit.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{log.description}</p>
                    <span className="text-[9px] text-slate-400 block pt-1">
                      Mulai: {log.startDate} {log.endDate ? `s/d ${log.endDate}` : '(Sedang Berjalan)'}
                    </span>
                    <span className="text-[9px] text-cyan-600 font-semibold block">Estimasi Biaya: {formatCurrency(log.cost)}</span>
                  </div>
                  {log.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => completeMaintenanceMutation.mutate(log.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                    >
                      Selesai
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[9px] font-extrabold rounded-full">
                      COMPLETED
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Maintenance Dialog */}
      {maintenanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleMaintenanceSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Catat Perbaikan Kamar</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-550 uppercase">Pilih Unit Villa</label>
              <select
                value={selectedVillaId}
                onChange={(e) => setSelectedVillaId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-550 uppercase">Keterangan / Kerusakan</label>
              <textarea
                required
                rows={3}
                value={maintDescription}
                onChange={(e) => setMaintDescription(e.target.value)}
                placeholder="Perbaikan instalasi AC bocor di kamar tidur utama."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
              ></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-550 uppercase">Estimasi Biaya Perbaikan (IDR)</label>
              <input
                type="number"
                value={maintCost}
                onChange={(e) => setMaintCost(e.target.value)}
                placeholder="150000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
              />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setMaintenanceOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-350 font-bold rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-slate-900 text-white font-bold py-2 px-5 rounded-lg text-xs hover:bg-slate-850 shadow-md"
              >
                Simpan & Blokir Kamar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
