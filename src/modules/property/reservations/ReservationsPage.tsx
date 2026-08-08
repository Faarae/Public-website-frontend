'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, FileText, CheckCircle, CreditCard, XCircle, LogIn, LogOut, Download, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/date';

interface Guest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  isVip: boolean;
}

interface VillaUnit {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  guest: Guest;
  bookingSource: string;
  bookingType: string;
  villaUnit?: VillaUnit;
  adults: number;
  children: number;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  basePrice: number;
  grandTotal: number;
  status: string;
  notes: string;
}

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [selectedRsvId, setSelectedRsvId] = useState<string | null>(null);
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  
  // Payment Form fields
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('TRANSFER');
  const [payProof, setPayProof] = useState('');

  // Fetch Reservations
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['reservations-list'],
    queryFn: async () => {
      const response = await api.get('/v1/reservations');
      return response.data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/v1/reservations/${id}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-list'] });
      alert('Tamu berhasil di-Check In!');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/v1/reservations/${id}/check-out`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-list'] });
      alert('Tamu berhasil di-Check Out! Tugas pembersihan dan invoice diterbitkan.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/v1/reservations/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-list'] });
      alert('Reservasi berhasil dibatalkan.');
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (payload: { id: string; amount: number; method: string; proofUrl?: string }) => {
      await api.post(`/v1/reservations/${payload.id}/confirm-payment`, {
        amount: payload.amount,
        method: payload.method,
        proofUrl: payload.proofUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-list'] });
      setConfirmPaymentOpen(false);
      setSelectedRsvId(null);
      setPayAmount('');
      setPayProof('');
      alert('Pembayaran berhasil dikonfirmasi dan status diubah ke Confirmed.');
    },
  });

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRsvId || !payAmount) return;

    confirmPaymentMutation.mutate({
      id: selectedRsvId,
      amount: parseFloat(payAmount),
      method: payMethod,
      proofUrl: payProof || undefined,
    });
  };

  const handleDownloadInvoice = async (resId: string) => {
    try {
      // Find invoice metadata linked to this reservation
      const invResponse = await api.get('/v1/invoices', {
        params: { referenceId: resId, referenceType: 'RESERVATION' }
      });
      const invId = invResponse.data.id;

      // Stream PDF
      const pdfResponse = await api.get(`/v1/invoices/${invId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invResponse.data.invoiceNumber.replace('/', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Invoice belum tersedia. Invoice terbit otomatis setelah Check-Out.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      INQUIRY: 'bg-yellow-50 text-yellow-600 border border-yellow-250',
      PENDING_PAYMENT: 'bg-orange-50 text-orange-600 border border-orange-250',
      CONFIRMED: 'bg-blue-50 text-blue-600 border border-blue-250',
      CHECKED_IN: 'bg-emerald-50 text-emerald-600 border border-emerald-250',
      CHECKED_OUT: 'bg-slate-50 text-slate-600 border border-slate-250',
      CANCELLED: 'bg-rose-50 text-rose-600 border border-rose-250',
      NO_SHOW: 'bg-violet-50 text-violet-600 border border-violet-250',
      REFUNDED: 'bg-neutral-50 text-neutral-600 border border-neutral-250',
    };
    return configs[status] || 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Dasbor Reservasi & Tamu
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Pantau arus pemesanan walk-in atau website, kelola status check-in, check-out, verifikasi pembayaran, dan unduh faktur formal.
          </p>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span>Memuat data reservasi...</span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-slate-400">
          <span>Tidak ada reservasi homestay terdata.</span>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-550">
                <th className="px-6 py-4">Kode Booking</th>
                <th className="px-6 py-4">Tamu</th>
                <th className="px-6 py-4">Sewa Unit</th>
                <th className="px-6 py-4">Check-In / Out</th>
                <th className="px-6 py-4">Grand Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-350">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                    {r.reservationNumber}
                    <span className="block text-[9px] text-slate-400 font-medium tracking-wider">via {r.bookingSource}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900 dark:text-white block">{r.guest.fullName}</span>
                    <span className="text-[10px] text-slate-400">{r.guest.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-slate-200 block">
                      {r.bookingType === 'PRIVATE' ? 'Seluruh Unit (Private)' : (r.villaUnit ? r.villaUnit.name : '-')}
                    </span>
                    <span className="text-[10px] text-slate-400">{r.adults} Dws / {r.children} Anak</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="block font-semibold">{formatDate(r.checkInDate)}</span>
                    <span className="block text-[10px] text-slate-400 font-medium">s/d {formatDate(r.checkOutDate)} ({r.totalNights} Malam)</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(r.grandTotal)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${getStatusBadge(r.status)}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    {r.status === 'PENDING_PAYMENT' && (
                      <button
                        onClick={() => {
                          setSelectedRsvId(r.id);
                          setConfirmPaymentOpen(true);
                        }}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                      >
                        Konfirmasi Bayar
                      </button>
                    )}
                    {r.status === 'CONFIRMED' && (
                      <button
                        onClick={() => checkInMutation.mutate(r.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                      >
                        Check-In
                      </button>
                    )}
                    {r.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => checkOutMutation.mutate(r.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                      >
                        Check-Out
                      </button>
                    )}
                    {r.status === 'CHECKED_OUT' && (
                      <button
                        onClick={() => handleDownloadInvoice(r.id)}
                        className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all"
                      >
                        <Download className="h-3 w-3" />
                        Invoice PDF
                      </button>
                    )}
                    {['PENDING_PAYMENT', 'CONFIRMED'].includes(r.status) && (
                      <button
                        onClick={() => {
                          if (confirm('Batalkan reservasi ini?')) {
                            cancelMutation.mutate(r.id);
                          }
                        }}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                      >
                        Batal
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Payment Modal Dialog */}
      {confirmPaymentOpen && selectedRsvId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleConfirmPaymentSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Verifikasi Pembayaran Tamu</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Jumlah Uang Diterima (IDR)</label>
              <input
                type="number"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="1500000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Metode</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CASH">Tunai (Cash)</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">URL Bukti Transfer (Opsional)</label>
              <input
                type="text"
                value={payProof}
                onChange={(e) => setPayProof(e.target.value)}
                placeholder="/uploads/proof.png"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-950 dark:text-white rounded-xl py-2.5 px-3 outline-none text-xs"
              />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setConfirmPaymentOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-lg text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg text-xs hover:bg-cyan-600 shadow-md"
              >
                Konfirmasi Lunas
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
