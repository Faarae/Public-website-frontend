'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Percent, Calendar, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import api from '@/services/api';

interface PricingRule {
  id?: string;
  name: string;
  type: string;
  amountMultiplier: number;
  extraFee: number;
}

interface SeasonRate {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  rateMultiplier: number;
  extraFee: number;
}

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  // New Season Rate form
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStart, setNewSeasonStart] = useState('');
  const [newSeasonEnd, setNewSeasonEnd] = useState('');
  const [newSeasonMultiplier, setNewSeasonMultiplier] = useState(1.5);
  const [newSeasonExtra, setNewSeasonExtra] = useState(0);

  // Fetch Pricing Rules
  const { data: pricingRules = [] } = useQuery<PricingRule[]>({
    queryKey: ['pricing-rules'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/villas/pricing');
      return response.data;
    },
  });

  // Fetch Season Rates
  const { data: seasons = [] } = useQuery<SeasonRate[]>({
    queryKey: ['season-rates'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/villas/seasons');
      return response.data;
    },
  });

  const ruleMutation = useMutation({
    mutationFn: async (updatedRule: PricingRule) => {
      await api.post('/v1/admin/villas/pricing', updatedRule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const createSeasonMutation = useMutation({
    mutationFn: async (newSeason: SeasonRate) => {
      await api.post('/v1/admin/villas/seasons', newSeason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-rates'] });
      setNewSeasonName('');
      setNewSeasonStart('');
      setNewSeasonEnd('');
      setNewSeasonMultiplier(1.5);
      setNewSeasonExtra(0);
      alert('Aturan Peak Season berhasil ditambahkan!');
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/v1/admin/villas/seasons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-rates'] });
    },
  });

  const handleUpdateWeekendRule = (e: React.FormEvent, multiplier: number) => {
    e.preventDefault();
    const weekendRule = pricingRules.find(r => r.type === 'WEEKEND') || {
      name: 'Weekend Surcharge',
      type: 'WEEKEND',
      amountMultiplier: 1.20,
      extraFee: 0.00,
    };
    
    ruleMutation.mutate({
      ...weekendRule,
      amountMultiplier: multiplier,
    });
  };

  const handleCreateSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName || !newSeasonStart || !newSeasonEnd) return;

    createSeasonMutation.mutate({
      name: newSeasonName,
      startDate: newSeasonStart,
      endDate: newSeasonEnd,
      rateMultiplier: newSeasonMultiplier,
      extraFee: newSeasonExtra,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const weekendMultiplierValue = pricingRules.find(r => r.type === 'WEEKEND')?.amountMultiplier || 1.20;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Pengaturan Tarif & Seasonal Surcharge
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Modifikasi harga tambahan akhir pekan (Weekend multiplier) atau daftarkan rentang tanggal high season dengan kelipatan pengali tertentu.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-2xl flex items-center gap-2 text-xs">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          Aturan tarif berhasil diperbarui!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Weekend Multiplier Config */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Percent className="h-4.5 w-4.5 text-cyan-500" />
              Surcharge Akhir Pekan (Weekend)
            </h3>

            <form onSubmit={(e) => handleUpdateWeekendRule(e, weekendMultiplierValue)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-550 uppercase">Kelipatan Pengali Tarif Weekend</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="3.0"
                    value={weekendMultiplierValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const rule = pricingRules.find(r => r.type === 'WEEKEND') || {
                        name: 'Weekend Surcharge',
                        type: 'WEEKEND',
                        amountMultiplier: 1.20,
                        extraFee: 0.00,
                      };
                      ruleMutation.mutate({ ...rule, amountMultiplier: val });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
                  />
                  <span className="text-xs font-bold">x lipat</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-450 leading-relaxed">
                * Kelipatan ini secara otomatis memodifikasi harga dasar per malam pada hari Jumat malam dan Sabtu malam. Contoh: 1.20 berarti biaya naik 20% dari tarif normal.
              </div>
            </form>
          </div>
        </div>

        {/* Right: Peak Season period additions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-cyan-500" />
              Kelola Periode Peak Season / Hari Raya
            </h3>

            {/* List existing */}
            {seasons.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-4">
                Belum ada tarif musiman terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasons.map((s) => (
                  <div key={s.id} className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{s.name}</h4>
                      <span className="text-[10px] text-slate-400 block">{s.startDate} s/d {s.endDate}</span>
                      <span className="text-[10px] text-cyan-500 font-bold block">Multiplier: {s.rateMultiplier}x (+{formatCurrency(s.extraFee)})</span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Hapus aturan peak season ini?')) {
                          deleteSeasonMutation.mutate(s.id!);
                        }
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New */}
            <form onSubmit={handleCreateSeasonSubmit} className="pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Tambah Periode Baru</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-550 uppercase">Nama Musim (Event)</label>
                  <input
                    type="text"
                    required
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    placeholder="Liburan Lebaran"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-550 uppercase">Mulai Tanggal</label>
                  <input
                    type="date"
                    required
                    value={newSeasonStart}
                    onChange={(e) => setNewSeasonStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-550 uppercase">Akhir Tanggal</label>
                  <input
                    type="date"
                    required
                    value={newSeasonEnd}
                    onChange={(e) => setNewSeasonEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-550 uppercase">Multiplier Tarif</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    required
                    value={newSeasonMultiplier}
                    onChange={(e) => setNewSeasonMultiplier(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-550 uppercase">Biaya Ekstra Flat (IDR)</label>
                  <input
                    type="number"
                    required
                    value={newSeasonExtra}
                    onChange={(e) => setNewSeasonExtra(parseFloat(e.target.value))}
                    placeholder="200000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md"
              >
                <Plus className="h-4 w-4" />
                Simpan Aturan Musiman
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
