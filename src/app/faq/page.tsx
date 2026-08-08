'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/services/api';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/v1/public/faq')
      .then(res => setFaqs(res.data))
      .catch(() => {});
  }, []);

  return (
    <PublicLayout>
      <div className="bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">FAQ</span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Pertanyaan yang Sering Diajukan</h1>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">Kami merangkum jawaban atas berbagai pertanyaan umum demi membantu perencanaan liburan Anda.</p>
          </div>

          {/* Accordion List */}
          {faqs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Belum ada pertanyaan terdaftar.</div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div key={faq.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between p-6 text-left outline-none"
                    >
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <HelpCircle className="h-4.5 w-4.5 text-cyan-500 flex-shrink-0" />
                        {faq.question}
                      </span>
                      {isOpen ? <ChevronUp className="h-4.5 w-4.5 text-slate-400" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 border-t border-slate-50 text-xs text-slate-550 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
