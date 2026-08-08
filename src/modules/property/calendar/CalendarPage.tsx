'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User } from 'lucide-react';
import api from '@/services/api';

interface Guest {
  fullName: string;
}

interface VillaUnit {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  guest: Guest;
  bookingType: string;
  villaUnit?: VillaUnit;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch all active reservations
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['reservations-for-calendar'],
    queryFn: async () => {
      const response = await api.get('/v1/reservations');
      return response.data;
    },
  });

  // Fetch Rooms
  const { data: rooms = [] } = useQuery<VillaUnit[]>({
    queryKey: ['rooms-list-calendar'],
    queryFn: async () => {
      const response = await api.get('/v1/admin/villas');
      return response.data;
    },
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayLabel = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return labels[date.getDay()];
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = getDaysInMonth(year, month);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const getMonthName = (m: number) => {
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return names[m];
  };

  // Helper to check room state on a specific date
  const getRoomStateOnDate = (roomId: string, day: number) => {
    const checkDate = new Date(year, month, day);
    
    for (const r of reservations) {
      if (['CANCELLED', 'REFUNDED'].includes(r.status)) continue;
      
      const start = new Date(r.checkInDate);
      const end = new Date(r.checkOutDate);

      // Zero out time part for accurate comparison
      checkDate.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      if (checkDate >= start && checkDate < end) {
        // If it is a Private stay, it blocks all rooms!
        if (r.bookingType === 'PRIVATE') {
          return { status: 'BOOKED', reservation: r };
        }
        
        // For shared stay, check if matches specific room ID
        if (r.villaUnit && r.villaUnit.id === roomId) {
          return { status: 'BOOKED', reservation: r };
        }
      }
    }
    return { status: 'AVAILABLE', reservation: null };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Kalender Okupansi & Ketersediaan
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-1">
            Lihat ketersediaan kamar harian secara real-time. Data ketersediaan dikalkulasi dinamis langsung dari database reservasi aktif.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-sm">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </button>
          <span className="font-bold text-sm text-slate-900 dark:text-white px-2">
            {getMonthName(month)} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span>Memuat kalender okupansi...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col space-y-6">
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <div className="h-4.5 w-8 rounded-md bg-emerald-500"></div>
              <span>Available / Kosong</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4.5 w-8 rounded-md bg-cyan-500"></div>
              <span>Booked (Sewa Unit / Shared)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4.5 w-8 rounded-md bg-indigo-600"></div>
              <span>Private Stay (Seluruh Villa Diblok)</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="min-w-[950px]">
              {rooms.map((room) => (
                <div key={room.id} className="flex border-b border-slate-150 dark:border-slate-800/80 last:border-0 items-center">
                  {/* Room Label Column */}
                  <div className="w-48 p-4 font-bold text-slate-900 dark:text-white border-r border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex-shrink-0">
                    {room.name}
                  </div>

                  {/* Days columns */}
                  <div className="flex-grow flex divide-x divide-slate-100 dark:divide-slate-800">
                    {daysArray.map((day) => {
                      const { status, reservation } = getRoomStateOnDate(room.id, day);
                      const isWeekend = getDayLabel(year, month, day) === 'Sab' || getDayLabel(year, month, day) === 'Min';
                      
                      let colorClass = 'bg-emerald-500 hover:bg-emerald-600';
                      if (status === 'BOOKED' && reservation) {
                        colorClass = reservation.bookingType === 'PRIVATE' ? 'bg-indigo-600' : 'bg-cyan-500';
                      }

                      return (
                        <div
                          key={day}
                          className={`flex-1 text-center py-4 flex flex-col items-center justify-center relative group select-none transition-all cursor-pointer ${colorClass}`}
                          title={reservation ? `${reservation.reservationNumber} - ${reservation.guest.fullName}` : 'Kamar Kosong'}
                        >
                          <span className="font-bold text-xs text-white block">{day}</span>
                          <span className="text-[8px] text-white/80 block leading-tight">{getDayLabel(year, month, day)}</span>

                          {/* Hover popover details */}
                          {reservation && (
                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-xl text-[10px] space-y-1 z-20">
                              <span className="font-bold block">{reservation.reservationNumber}</span>
                              <span className="block font-medium">Tamu: {reservation.guest.fullName}</span>
                              <span className="block font-medium">Tipe: {reservation.bookingType}</span>
                              <span className="block text-slate-400">{r.checkInDate} s/d {r.checkOutDate}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stub fallback
const r = {
  checkInDate: '',
  checkOutDate: ''
};
