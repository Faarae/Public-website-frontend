'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, History, UserCheck, Settings, Database, Server } from 'lucide-react';
import api from '@/services/api';

interface AuditLog {
  id: string;
  userId: string;
  activity: string;
  entity: string;
  entityId: string;
  createdAt: string;
}

const getActivityIcon = (activity: string) => {
  if (activity.toLowerCase().includes('login')) {
    return <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
  }
  if (activity.toLowerCase().includes('category')) {
    return <Settings className="h-5 w-5 text-cyan-655 dark:text-cyan-400" />;
  }
  if (activity.toLowerCase().includes('expense')) {
    return <Database className="h-5 w-5 text-indigo-655 dark:text-indigo-400" />;
  }
  return <Server className="h-5 w-5 text-slate-500 dark:text-slate-400" />;
};

export default function AuditLogsPage() {
  const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await api.get('/audit-logs');
      return response.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-wide text-slate-900 dark:text-white">Audit Log Keamanan</h2>
        <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Rekam jejak kronologis operasi sistem, login pengguna, dan mutasi database.</p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-colors">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <span>Mengambil riwayat audit...</span>
          </div>
        ) : error ? (
          <div className="flex h-96 items-center justify-center text-rose-450 p-8 text-center">
            <span>Gagal memuat log aktivitas. Pastikan Anda masuk sebagai akun OWNER.</span>
          </div>
        ) : logs && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-3">
            <History className="h-10 w-10 text-slate-400" />
            <span>Belum ada log aktivitas yang tercatat.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-955/40 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-4 px-6">Waktu Kejadian</th>
                  <th className="py-4 px-6">Aktivitas / Operasi</th>
                  <th className="py-4 px-6">Entitas Target</th>
                  <th className="py-4 px-6">ID Referensi Entitas</th>
                  <th className="py-4 px-6">ID Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {logs?.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  const d = String(dateObj.getDate()).padStart(2, '0');
                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const y = dateObj.getFullYear();
                  const timeStr = dateObj.toTimeString().split(' ')[0];
                  const dateStr = isNaN(dateObj.getTime()) ? '-' : `${d}/${m}/${y} ${timeStr}`;
                  return (
                    <tr key={log.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">{dateStr}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50">
                            {getActivityIcon(log.activity)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{log.activity}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {log.entity ? (
                          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700/50 font-mono">
                            {log.entity}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-650">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500 text-xs truncate max-w-[150px]" title={log.entityId}>
                        {log.entityId || '-'}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500 text-xs truncate max-w-[150px]" title={log.userId}>
                        {log.userId || 'Sistem / Anonim'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm transition-colors">
        <ShieldCheck className="h-6 w-6 text-cyan-600 dark:text-cyan-500 shrink-0" />
        <span className="text-xs text-slate-550 dark:text-slate-400">
          Sistem ini menggunakan metode pencatatan log aktivitas yang tidak dapat diubah (append-only). Catatan bersifat permanen dan tidak dapat dihapus atau dimodifikasi oleh pengguna mana pun.
        </span>
      </div>
    </div>
  );
}
