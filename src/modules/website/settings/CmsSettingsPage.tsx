'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Image, Layout, HelpCircle, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import api from '@/services/api';

interface SettingsData {
  id?: string;
  websiteName: string;
  logoUrl: string;
  description: string;
  phoneNumber: string;
  email: string;
  whatsappNumber: string;
  googleMapsLink: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  footerText: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  backgroundImageUrl: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  displayOrder: number;
}

interface Facility {
  id: string;
  name: string;
  iconName: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function CmsSettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'settings' | 'banners' | 'facilities' | 'faq'>('settings');
  const [success, setSuccess] = useState(false);

  // Fetch Settings
  const { data: settings = {
    websiteName: '', logoUrl: '', description: '', phoneNumber: '', email: '', whatsappNumber: '',
    googleMapsLink: '', socialFacebook: '', socialInstagram: '', socialYoutube: '',
    seoTitle: '', seoDescription: '', seoKeywords: '', footerText: ''
  }, isLoading: loadingSettings } = useQuery<SettingsData>({
    queryKey: ['admin-website-settings'],
    queryFn: async () => {
      const response = await api.get('/v1/public/settings');
      return response.data;
    }
  });

  // Fetch Banners
  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/website/banners');
      return response.data;
    }
  });

  // Fetch Facilities
  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ['admin-facilities'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/website/facilities');
      return response.data;
    }
  });

  // Fetch FAQ
  const { data: faqs = [] } = useQuery<FAQ[]>({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/website/inquiries'); // reuse faq queries
      return []; // or return list
    }
  });

  const settingsMutation = useMutation({
    mutationFn: async (updated: SettingsData) => {
      await api.put('/v1/admin/website/settings', updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-website-settings'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  });

  const [settingsForm, setSettingsForm] = useState<SettingsData | null>(null);

  // Sync settings data once loaded
  React.useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsForm) {
      settingsMutation.mutate(settingsForm);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Pengaturan Website & CMS
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Modifikasi nama villa, foto banner utama, list fasilitas, serta rincian metadata SEO untuk website profil.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-250 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('settings')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            tab === 'settings'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <Settings className="h-4 w-4" />
          Konfigurasi Umum
        </button>
        <button
          onClick={() => setTab('banners')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            tab === 'banners'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <Image className="h-4 w-4" />
          Banner Utama (Hero)
        </button>
        <button
          onClick={() => setTab('facilities')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            tab === 'facilities'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'text-slate-650 hover:bg-slate-100'
          }`}
        >
          <Layout className="h-4 w-4" />
          Fasilitas Homestay
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-2xl flex items-center gap-2 text-xs">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          Pengaturan website berhasil disimpan!
        </div>
      )}

      {/* Settings Form */}
      {tab === 'settings' && settingsForm && (
        <form onSubmit={handleSettingsSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-350 text-sm uppercase tracking-wider">Identitas Villa</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-550 uppercase">Nama Website / Villa</label>
                <input
                  type="text"
                  required
                  value={settingsForm.websiteName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-550 uppercase">Logo URL (Dapatkan dari Media Library)</label>
                <input
                  type="text"
                  value={settingsForm.logoUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-550 uppercase">Deskripsi Profil Singkat</label>
                <textarea
                  rows={4}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                ></textarea>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-350 text-sm uppercase tracking-wider">Kontak & Sosial Media</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-550 uppercase">Nomor WhatsApp (Format: 6281..)</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-550 uppercase">Email Layanan</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-550 uppercase">Teks Hak Cipta Footer</label>
                <input
                  type="text"
                  value={settingsForm.footerText}
                  onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md text-xs"
            >
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      )}

      {/* Banners Manager */}
      {tab === 'banners' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-350 text-sm uppercase">Daftar Banner Aktif</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <div key={b.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between bg-slate-50 dark:bg-slate-950/20">
                <div className="h-40 bg-slate-100 dark:bg-slate-950 bg-cover bg-center" style={{ backgroundImage: `url(${b.backgroundImageUrl})` }}></div>
                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{b.title}</h4>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 line-clamp-2">{b.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities Manager */}
      {tab === 'facilities' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-350 text-sm uppercase">Fasilitas Terdaftar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facilities.map((fac) => (
              <div key={fac.id} className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">{fac.name}</h4>
                <p className="text-[10px] text-slate-450">{fac.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
