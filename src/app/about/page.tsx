'use client';

import React from 'react';
import PublicLayout from '@/components/PublicLayout';
import { Shield, Sparkles, Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Title */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Tentang Kami</span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Kisah Di Balik Villa d Zain Al Mansion</h1>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">Kami mendedikasikan tempat peristirahatan premium ini bagi Anda yang menginginkan ketenangan sejati di tengah alam pegunungan.</p>
          </div>

          {/* Banner */}
          <div className="h-[350px] bg-slate-200 border border-slate-200 rounded-3xl overflow-hidden shadow-md bg-cover bg-center" style={{ backgroundImage: "url('/images/about-main.jpg')" }}></div>

          {/* Content */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 text-slate-700 text-sm leading-relaxed">
            <h3 className="text-lg font-bold text-slate-900">Filosofi & Kenyamanan</h3>
            <p>
              Villa d Zain Al Mansion didirikan dengan visi untuk menyuguhkan pengalaman tinggal eksklusif bintang lima yang menyatu secara harmonis dengan alam. Setiap struktur bangunan dan interior dirancang dengan teliti untuk menghadirkan sirkulasi udara pegunungan yang segar serta pencahayaan alami yang optimal.
            </p>
            <p>
              Kami mengerti bahwa liburan adalah tentang melepaskan kepenatan dan membangun memori indah bersama orang terkasih. Oleh sebab itu, privasi tamu adalah prioritas nomor satu kami. Seluruh kompleks villa dipagari dan dijaga ketat selama 24 jam dengan sistem keamanan modern.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              <div className="flex gap-3">
                <Compass className="h-6 w-6 text-cyan-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">Lokasi Strategis</h4>
                  <p className="text-xs text-slate-500">Udara sejuk bebas polusi, dekat dengan pusat wisata alam.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="h-6 w-6 text-cyan-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">Keamanan 24 Jam</h4>
                  <p className="text-xs text-slate-500">Penjagaan ketat dan CCTV aktif di sekeliling kompleks.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Sparkles className="h-6 w-6 text-cyan-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">Pelayanan Prima</h4>
                  <p className="text-xs text-slate-500">Staf ramah yang siap melayani segala kebutuhan menginap Anda.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
