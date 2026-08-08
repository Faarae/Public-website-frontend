'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import api from '@/services/api';

interface Settings {
  phoneNumber: string;
  email: string;
  googleMapsLink: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<Settings>({
    phoneNumber: '+62 812-3456-7890',
    email: 'info@dzainalmansion.com',
    googleMapsLink: 'https://maps.google.com/?q=3.5979445938595878,98.61412146537555'
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/v1/public/settings')
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/v1/public/contact', {
        name,
        email,
        phone,
        subject: 'Hubungi Kami - Halaman Kontak',
        message
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert('Gagal mengirim pesan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Kontak Kami</span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Mari Hubungi Staf Kami</h1>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">Ada pertanyaan atau request penawaran khusus? Jangan ragu untuk mengirim pesan kepada kami.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Info (Left) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200/80 p-8 rounded-3xl space-y-6">
                <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-4">Info Kontak & Lokasi</h3>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase">Telepon / WhatsApp</h4>
                    <p className="text-xs text-slate-500 mt-1">{settings.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase">Email Resmi</h4>
                    <p className="text-xs text-slate-500 mt-1">{settings.email}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase">Lokasi Homestay</h4>
                    <p className="text-xs text-slate-500 mt-1">Kawasan Sejuk Pegunungan, Bandung, Jawa Barat</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder or Embed */}
              <div className="bg-slate-200 border border-slate-300 rounded-3xl h-[220px] overflow-hidden relative shadow-sm">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d295.56884482931184!2d98.61468221171735!3d3.5982539871130252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30312f003b0ac2ef%3A0x4be0294f6928ac66!2sGrosir%20Vivi!5e1!3m2!1sen!2sid!4v1786204632498!5m2!1sen!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
              </div>
            </div>

            {/* Form (Right) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 p-8 rounded-3xl shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-6 border-b border-slate-100 pb-4">Kirim Pesan Langsung</h3>
              {success ? (
                <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-xl flex items-center gap-2 text-xs">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Terima kasih! Pesan Anda telah sukses terkirim. Staf kami akan membalas via email/nomor WA.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Ahmad Dhani"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 text-slate-900 rounded-xl py-2.5 px-3 outline-none transition-all text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="dhani@email.com"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 text-slate-900 rounded-xl py-2.5 px-3 outline-none transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor HP</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812XXXXXXXX"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 text-slate-900 rounded-xl py-2.5 px-3 outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Isi Pesan Pertanyaan</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tuliskan detail pertanyaan atau rencana kunjungan Anda di sini..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 text-slate-900 rounded-xl py-2.5 px-3 outline-none transition-all text-xs"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-cyan-500/10 flex items-center justify-center gap-2 text-xs"
                  >
                    <Send className="h-4.5 w-4.5" />
                    {submitting ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
