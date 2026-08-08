'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brush, CheckCircle, Clock } from 'lucide-react';
import api from '@/services/api';

interface VillaUnit {
  name: string;
  cleaningStatus: string;
}

interface CleaningTask {
  id: string;
  villaUnit: VillaUnit;
  status: string; // 'PENDING', 'IN_PROGRESS', 'COMPLETED'
  notes: string;
  startTime?: string;
  finishTime?: string;
}

export default function HousekeepingPage() {
  const queryClient = useQueryClient();

  // Fetch Cleaning Tasks
  const { data: tasks = [], isLoading } = useQuery<CleaningTask[]>({
    queryKey: ['cleaning-tasks-list'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/villas/cleaning');
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      await api.patch(`/v1/admin/villas/cleaning/${payload.id}`, null, {
        params: { status: payload.status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks-list'] });
      alert('Status pembersihan berhasil diperbarui!');
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-600 border border-yellow-250',
      IN_PROGRESS: 'bg-cyan-50 text-cyan-600 border border-cyan-250 animate-pulse',
      COMPLETED: 'bg-emerald-50 text-emerald-600 border border-emerald-250',
    };
    return config[status] || 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Tugas Kebersihan & Housekeeping
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Pantau dan perbarui penugasan kebersihan kamar. Tugas kebersihan diterbitkan secara otomatis setelah tamu Check-Out.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span>Memuat tugas kebersihan...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-8 text-slate-400">
          <Brush className="h-10 w-10 text-slate-350 mx-auto mb-2" />
          <span>Tidak ada tugas kebersihan berjalan.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{task.villaUnit.name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                  {task.notes || 'Pembersihan kamar reguler.'}
                </p>
                
                <div className="space-y-1 text-[10px] text-slate-400">
                  {task.startTime && <span className="block">Mulai: {task.startTime.replace('T', ' ').slice(0, 16)}</span>}
                  {task.finishTime && <span className="block">Selesai: {task.finishTime.replace('T', ' ').slice(0, 16)}</span>}
                </div>
              </div>

              {task.status !== 'COMPLETED' && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2">
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] shadow-sm flex items-center gap-1"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Mulai Bersihkan
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'COMPLETED' })}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] shadow-sm flex items-center gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Selesai Bersih
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
