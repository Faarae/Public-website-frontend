'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, ShieldAlert, Star } from 'lucide-react';
import api from '@/services/api';

interface Guest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  gender: string;
  identityType: string;
  identityNumber: string;
  address: string;
  isVip: boolean;
}

export default function GuestsPage() {
  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: ['guests-list-crm'],
    queryFn: async () => {
      const response = await api.get('/v1/guests');
      return response.data;
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Database Tamu (Guest CRM)
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Data kontak lengkap, kewarganegaraan, nomor identitas KTP/Passport, dan status VIP dari seluruh tamu homestay.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span>Memuat data tamu...</span>
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-slate-400">
          <span>Belum ada tamu terdaftar dalam sistem.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guests.map((g) => (
            <div key={g.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 flex items-center justify-center font-bold">
                    {g.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{g.fullName}</h4>
                    <span className="text-[10px] text-slate-400 block">{g.nationality}</span>
                  </div>
                </div>

                {g.isVip && (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-extrabold rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    VIP
                  </span>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Telepon</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{g.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{g.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Identitas</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {g.identityType}: {g.identityNumber || '-'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-t border-slate-50 dark:border-slate-800/40 pt-2 text-[11px] text-slate-550 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-350">Alamat:</span>
                  <span className="leading-relaxed line-clamp-2">{g.address || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
