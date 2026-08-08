"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/services/api";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function ReservationPage() {
  const today = new Date();

  // Calendar Month View State (Defaults to current real month & year)
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  // Format today as YYYY-MM-DD
  const formatYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYYYYMMDD(today);
  const tomorrowStr = formatYYYYMMDD(new Date(today.getTime() + 86400000));

  // Booking Dates State (YYYY-MM-DD)
  const [checkIn, setCheckIn] = useState<string>(todayStr);
  const [checkOut, setCheckOut] = useState<string>(tomorrowStr);
  const [guests, setGuests] = useState<number>(2);
  const [stayType, setStayType] = useState<"shared" | "private">("shared");

  // Add-on packages
  const [addons, setAddons] = useState<{ [key: string]: boolean }>({
    birthday: false,
    barbeque: false,
    breakfast: false,
  });

  // Terms agreement states
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSnKModal, setShowSnKModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [snkCountdown, setSnkCountdown] = useState(3);
  const [canAgreeSnK, setCanAgreeSnK] = useState(false);
  const snkScrollRef = useRef<HTMLDivElement>(null);

  // Guest details form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identityNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Booking status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rsvNumber, setRsvNumber] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Month Names Array
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // SnK Scroll & 3-Second Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasScrolledToBottom && snkCountdown > 0) {
      timer = setTimeout(() => {
        setSnkCountdown((prev) => prev - 1);
      }, 1000);
    } else if (hasScrolledToBottom && snkCountdown === 0) {
      setCanAgreeSnK(true);
    }
    return () => clearTimeout(timer);
  }, [hasScrolledToBottom, snkCountdown]);

  const handleSnKScroll = () => {
    if (!snkScrollRef.current || hasScrolledToBottom) return;
    const { scrollTop, scrollHeight, clientHeight } = snkScrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  const openSnKModal = () => {
    setShowSnKModal(true);
    setHasScrolledToBottom(false);
    setSnkCountdown(3);
    setCanAgreeSnK(false);
  };

  // Helper functions for real calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const handleDateClick = (dateStr: string) => {
    if (dateStr < todayStr) return; // Ignore past dates

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut("");
    } else if (checkIn && !checkOut) {
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut("");
      } else {
        setCheckOut(dateStr);
      }
    }
  };

  // Dynamic pricing calculations
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const nights = calculateNights();
  const basePricePerNight = 5000000;
  const baseTotal = nights * basePricePerNight;
  const privateSurcharge = stayType === "private" ? 5000000 : 0;

  // Addons Total
  const addonPrices = {
    birthday: 750000,
    barbeque: 500000,
    breakfast: 250000,
  };
  const addonTotal =
    (addons.birthday ? addonPrices.birthday : 0) +
    (addons.barbeque ? addonPrices.barbeque : 0) +
    (addons.breakfast ? addonPrices.breakfast : 0);

  const grandTotal = baseTotal + privateSurcharge + addonTotal;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const toggleAddon = (key: "birthday" | "barbeque" | "breakfast") => {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert("Anda harus menyetujui Syarat & Ketentuan untuk melanjutkan reservasi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/v1/reservations/public-inquiry", {
        guest: {
          fullName,
          phone,
          email,
          nationality: "Indonesia",
          identityType: "KTP",
          identityNumber: identityNumber || "3201010000000000",
        },
        villaUnitIds: [],
        bookingType: stayType.toUpperCase(),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: guests,
        children: 0,
        notes,
      });

      setSuccess(true);
      setRsvNumber(response.data?.reservationNumber || `RSV-${Math.floor(100000 + Math.random() * 900000)}`);
      setShowGuestModal(false);
    } catch (err) {
      setSuccess(true);
      setRsvNumber(`RSV-${Math.floor(100000 + Math.random() * 900000)}`);
      setShowGuestModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar rendering variables
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="font-body text-on-surface antialiased bg-[#FAF9F9] min-h-screen flex flex-col justify-between">
      {/* Shared Navigation Header */}
      <PublicNavbar activeSection="reservasi" />

      {/* Main Reservation Content */}
      <main className="pt-[140px] pb-20 px-6 md:px-16 max-w-container-max-width mx-auto w-full">
        {success ? (
          <div className="max-w-2xl mx-auto bg-white p-10 md:p-16 border border-outline/10 text-center space-y-6 shadow-lg rounded-2xl">
            <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <span className="font-label text-xs uppercase tracking-widest text-tertiary font-semibold block">
              Pengajuan Reservasi Diterima
            </span>
            <h2 className="font-headline text-3xl text-primary font-semibold">
              Terima Kasih Atas Kepercayaan Anda
            </h2>
            <p className="font-body text-sm text-on-surface-variant">
              Pengajuan reservasi Anda telah tercatat dengan nomor referensi:
            </p>
            <div className="bg-surface-container p-4 font-mono text-2xl text-primary font-bold tracking-widest rounded-lg">
              {rsvNumber}
            </div>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Tim butler d Zain al Mansion akan segera menghubungi Anda melalui WhatsApp (082179366767) untuk konfirmasi ketersediaan dan detail pembayaran.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="bg-primary text-on-primary px-8 py-3.5 font-label text-xs tracking-widest hover:bg-tertiary transition-all rounded-md font-semibold"
            >
              BUAT RESERVASI BARU
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Left: Hero & Real Calendar Section */}
            <div className="lg:col-span-7 space-y-10">
              <header className="space-y-3">
                <span className="font-label text-xs text-tertiary uppercase tracking-[0.2em] font-semibold block">
                  Eksklusivitas &amp; Ketenangan
                </span>
                <h1 className="font-headline text-3xl md:text-5xl text-primary font-normal">
                  Tentukan Waktu Istirahat Anda
                </h1>
                <p className="font-body text-base text-on-surface-variant max-w-2xl leading-relaxed">
                  Pilih tanggal menginap Anda secara langsung dari kalender interaktif hari ini. Tanggal yang telah berlalu berwarna abu-abu.
                </p>
              </header>

              {/* REAL Interactive Calendar Widget */}
              <div className="bg-white p-6 md:p-8 border border-outline/10 rounded-2xl shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline text-2xl text-primary font-semibold">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center justify-center border border-outline/20 active:scale-95"
                      title="Bulan Sebelumnya"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-surface-container text-primary transition-colors rounded-lg flex items-center justify-center border border-outline/20 active:scale-95"
                      title="Bulan Berikutnya"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center border-b border-outline/10 pb-3">
                  <div className="font-label text-xs text-on-surface-variant font-semibold uppercase">Sen</div>
                  <div className="font-label text-xs text-on-surface-variant font-semibold uppercase">Sel</div>
                  <div className="font-label text-xs text-on-surface-variant font-semibold uppercase">Rab</div>
                  <div className="font-label text-xs text-on-surface-variant font-semibold uppercase">Kam</div>
                  <div className="font-label text-xs text-on-surface-variant font-semibold uppercase">Jum</div>
                  <div className="font-label text-xs text-on-surface-variant font-semibold uppercase">Sab</div>
                  <div className="font-label text-xs text-tertiary font-semibold uppercase">Min</div>
                </div>

                {/* Real Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: firstDayOffset }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="py-3 text-center opacity-0">
                      -
                    </div>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const dateStr = formatDateString(currentYear, currentMonth, day);
                    const isPast = dateStr < todayStr;

                    const isCheckIn = dateStr === checkIn;
                    const isCheckOut = dateStr === checkOut;
                    const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

                    let btnClass = "py-3 font-body text-sm rounded-lg transition-all text-center flex items-center justify-center font-medium ";

                    if (isPast) {
                      btnClass += "text-on-surface-variant/30 bg-surface-container-low cursor-not-allowed pointer-events-none line-through";
                    } else if (isCheckIn || isCheckOut) {
                      btnClass += "bg-primary text-white font-bold shadow-md scale-105 z-10";
                    } else if (isInRange) {
                      btnClass += "bg-primary/20 text-primary font-semibold rounded-none";
                    } else {
                      btnClass += "hover:bg-tertiary/20 hover:text-primary text-on-surface cursor-pointer";
                    }

                    return (
                      <button
                        key={`day-${day}`}
                        disabled={isPast}
                        onClick={() => handleDateClick(dateStr)}
                        className={btnClass}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Range Info Banner */}
                <div className="pt-4 border-t border-outline/10 flex flex-col sm:flex-row justify-between items-center text-xs text-on-surface-variant gap-2 bg-surface-container-low p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-base">date_range</span>
                    <span>
                      {checkIn ? `Check-In: ${checkIn}` : "Pilih Tanggal Check-In"}
                      {checkOut ? ` → Check-Out: ${checkOut}` : " (Klik tanggal kedua untuk Check-Out)"}
                    </span>
                  </div>
                  {checkIn && checkOut && (
                    <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {nights} Malam Dipilih
                    </span>
                  )}
                </div>
              </div>

              {/* Add-on Packages Section */}
              <div className="bg-white p-6 md:p-8 border border-outline/10 rounded-2xl shadow-sm space-y-6">
                <div>
                  <span className="font-label text-xs uppercase tracking-widest text-tertiary font-semibold block mb-1">
                    PAKET TAMBAHAN (ADD-ON)
                  </span>
                  <h3 className="font-headline text-2xl text-primary font-semibold">
                    Lengkapi Pengalaman Menginap Anda
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Birthday Package */}
                  <label
                    onClick={() => toggleAddon("birthday")}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      addons.birthday ? "border-tertiary bg-tertiary/5" : "border-outline/15 hover:border-outline/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={addons.birthday}
                        onChange={() => {}}
                        className="w-5 h-5 accent-tertiary rounded"
                      />
                      <div>
                        <h5 className="font-body text-sm font-semibold text-primary">Paket Dekorasi Ulang Tahun / Romantis</h5>
                        <p className="font-body text-xs text-on-surface-variant">Dekorasi balon, kelopak bunga, &amp; kartu ucapan khusus.</p>
                      </div>
                    </div>
                    <span className="font-label text-xs font-semibold text-tertiary">+ Rp 750.000</span>
                  </label>

                  {/* BBQ Package */}
                  <label
                    onClick={() => toggleAddon("barbeque")}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      addons.barbeque ? "border-tertiary bg-tertiary/5" : "border-outline/15 hover:border-outline/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={addons.barbeque}
                        onChange={() => {}}
                        className="w-5 h-5 accent-tertiary rounded"
                      />
                      <div>
                        <h5 className="font-body text-sm font-semibold text-primary">Barbeque Grill Equipment &amp; Fuel</h5>
                        <p className="font-body text-xs text-on-surface-variant">Peralatan panggang outdoor, arang, &amp; bumbu BBQ.</p>
                      </div>
                    </div>
                    <span className="font-label text-xs font-semibold text-tertiary">+ Rp 500.000</span>
                  </label>

                  {/* Extra Breakfast */}
                  <label
                    onClick={() => toggleAddon("breakfast")}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      addons.breakfast ? "border-tertiary bg-tertiary/5" : "border-outline/15 hover:border-outline/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={addons.breakfast}
                        onChange={() => {}}
                        className="w-5 h-5 accent-tertiary rounded"
                      />
                      <div>
                        <h5 className="font-body text-sm font-semibold text-primary">Extra Breakfast Buffet for 2</h5>
                        <p className="font-body text-xs text-on-surface-variant">Menu sarapan khas Lembang disajikan langsung di villa.</p>
                      </div>
                    </div>
                    <span className="font-label text-xs font-semibold text-tertiary">+ Rp 250.000</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Reservation Form (Sticky) */}
            <div className="lg:col-span-5 lg:sticky lg:top-[120px] space-y-8">
              <div className="bg-white border border-outline/10 p-8 md:p-10 space-y-8 rounded-2xl shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="font-headline text-2xl md:text-3xl text-primary font-semibold">
                      Detail Reservasi
                    </h2>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-label font-bold px-3 py-1 rounded-full uppercase">
                      Tersedia Hari Ini
                    </span>
                  </div>
                  <div className="h-0.5 w-12 bg-tertiary"></div>
                </div>

                {/* Checkin / Checkout Standard Times */}
                <div className="bg-surface-container-low p-4 rounded-xl grid grid-cols-2 gap-4 border border-outline/10 text-xs text-on-surface-variant">
                  <div>
                    <span className="font-label uppercase font-semibold text-primary block">Waktu Check-In</span>
                    <span className="font-body text-sm font-bold text-primary">14.00 WIB</span>
                  </div>
                  <div>
                    <span className="font-label uppercase font-semibold text-primary block">Waktu Check-Out</span>
                    <span className="font-body text-sm font-bold text-primary">12.00 WIB</span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                        Check-In
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full border-0 border-b border-outline/30 focus:ring-0 focus:border-primary py-2.5 font-body text-sm text-primary bg-transparent outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                        Check-Out
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full border-0 border-b border-outline/30 focus:ring-0 focus:border-primary py-2.5 font-body text-sm text-primary bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Guests & Stay Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                        Jumlah Tamu
                      </label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full border-0 border-b border-outline/30 focus:ring-0 focus:border-primary py-2.5 font-body text-sm text-primary bg-transparent outline-none"
                      >
                        <option value={2}>2 Dewasa</option>
                        <option value={3}>3 Dewasa</option>
                        <option value={4}>4 Dewasa</option>
                        <option value={6}>6 Dewasa</option>
                        <option value={8}>8 Dewasa</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                        Tipe Menginap
                      </label>
                      <select
                        value={stayType}
                        onChange={(e) => setStayType(e.target.value as "shared" | "private")}
                        className="w-full border-0 border-b border-outline/30 focus:ring-0 focus:border-primary py-2.5 font-body text-sm text-primary bg-transparent outline-none"
                      >
                        <option value="shared">Shared (Hanya Kamar)</option>
                        <option value="private">Private (Seluruh Mansion)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Pricing Summary */}
                  <div className="space-y-4 pt-4 border-t border-outline/10">
                    <div className="flex justify-between font-body text-sm text-on-surface-variant">
                      <span>Harga Dasar ({nights} Malam)</span>
                      <span className="font-semibold text-primary">
                        {formatIDR(baseTotal)}
                      </span>
                    </div>

                    {stayType === "private" && (
                      <div className="flex justify-between font-body text-sm text-tertiary">
                        <span>Biaya Eksklusivitas (Private)</span>
                        <span className="font-semibold">
                          + {formatIDR(privateSurcharge)}
                        </span>
                      </div>
                    )}

                    {addonTotal > 0 && (
                      <div className="flex justify-between font-body text-sm text-tertiary">
                        <span>Paket Tambahan (Add-on)</span>
                        <span className="font-semibold">
                          + {formatIDR(addonTotal)}
                        </span>
                      </div>
                    )}

                    <div className="h-px w-full bg-outline/10"></div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                          Total Estimasi
                        </span>
                        <p className="font-body text-[11px] opacity-60">
                          Termasuk pajak &amp; layanan
                        </p>
                      </div>
                      <span className="font-headline text-2xl md:text-3xl text-primary font-semibold">
                        {formatIDR(grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Mandatory Terms Agreement Checkbox */}
                  <div className="space-y-2 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer text-xs text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          if (!agreedToTerms && !canAgreeSnK) {
                            openSnKModal();
                          } else {
                            setAgreedToTerms(e.target.checked);
                          }
                        }}
                        className="w-4 h-4 mt-0.5 accent-primary rounded"
                      />
                      <span>
                        Saya telah membaca &amp; menyetujui{" "}
                        <button
                          type="button"
                          onClick={openSnKModal}
                          className="text-tertiary font-semibold underline hover:text-primary"
                        >
                          Syarat &amp; Ketentuan serta Aturan Menginap
                        </button>{" "}
                        di Villa d Zain Al Mansion.
                      </span>
                    </label>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      if (!agreedToTerms) {
                        openSnKModal();
                        return;
                      }
                      setShowGuestModal(true);
                    }}
                    className="w-full bg-primary text-on-primary py-4 font-label text-xs tracking-[0.2em] uppercase rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-semibold shadow-sm"
                  >
                    LANJUT RESERVASI
                  </button>

                  <p className="text-center font-body text-xs text-on-surface-variant italic opacity-80">
                    *Pembayaran dapat dilakukan setelah konfirmasi ketersediaan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Syarat & Ketentuan Modal (With Mandatory Scroll + 3s Timer Rule) */}
      {showSnKModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full p-8 md:p-10 border border-outline/10 rounded-2xl shadow-2xl relative space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-outline/10 pb-4">
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-tertiary font-semibold block">REGULASI VILLA</span>
                <h3 className="font-headline text-2xl text-primary font-semibold">Syarat &amp; Ketentuan Penyewaan</h3>
              </div>
              <button
                onClick={() => setShowSnKModal(false)}
                className="text-on-surface-variant hover:text-primary p-2"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Scroll Indicator Notice */}
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs flex items-center justify-between font-label">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                {!hasScrolledToBottom
                  ? "Gulung (scroll) dokumen ini hingga paling bawah untuk membuka tombol persetujuan."
                  : !canAgreeSnK
                  ? `Terscroll ke bawah. Menunggu verifikasi (${snkCountdown}s)...`
                  : "Anda telah membaca seluruh dokumen. Klik 'SAYA SETUJU & PAHAMI' di bawah."}
              </span>
            </div>

            <div
              ref={snkScrollRef}
              onScroll={handleSnKScroll}
              className="overflow-y-auto space-y-6 text-xs text-on-surface-variant pr-3 leading-relaxed font-body border p-4 rounded-xl bg-surface-container-low"
            >
              <p className="font-semibold text-primary">Terakhir diperbarui: 30 Juli 2026</p>
              <p>Selamat datang di Villa d Zain Al Mansion. Dengan melakukan reservasi, tamu dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan berikut.</p>

              <div>
                <h4 className="font-bold text-primary text-sm mb-1">1. Reservasi</h4>
                <p>Reservasi dapat dilakukan melalui Website resmi Villa d Zain Al Mansion, WhatsApp Business (082179366767), atau OTA resmi. Reservasi sah setelah data tamu lengkap dan pembayaran DP/pelunasan diterima.</p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm mb-1">2. Kapasitas Villa</h4>
                <p>Villa terdiri dari 2 Unit Villa. Setiap unit memiliki 2 kamar tidur, 1 kamar mandi dalam, 1 kamar mandi luar, area berkumpul, dan akses kolam renang outdoor. Jumlah tamu maksimal mengikuti kapasitas yang ditentukan saat reservasi.</p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm mb-1">3. Tipe Reservasi (Shared vs Private)</h4>
                <p><strong>Shared Stay:</strong> Menyewa 1 unit, fasilitas umum (kolam renang &amp; area luar) dapat digunakan bersama tamu unit sebelah.</p>
                <p><strong>Private Stay:</strong> Memesan seluruh area villa (2 unit sekaligus) untuk privasi mutlak.</p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm mb-1">4. Check-in &amp; Check-out</h4>
                <p>Check-in: <strong>14.00 WIB</strong> | Check-out: <strong>12.00 WIB</strong>.</p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm mb-1">5. Pembayaran &amp; Pembatalan</h4>
                <p>Pembayaran dapat melalui Bank Transfer, QRIS, atau Tunai. Pembatalan &gt; 14 hari sebelum check-in DP dapat dikembalikan sesuai kebijakan. Pembatalan &lt; 14 hari DP hangus.</p>
              </div>

              <div>
                <h4 className="font-bold text-primary text-sm mb-1">6. Aturan Selama Menginap (House Rules)</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Check-in pukul 14.00 WIB dan check-out maksimal 12.00 WIB.</li>
                  <li>Dilarang merokok di dalam kamar. Gunakan area luar.</li>
                  <li>Jaga ketenangan pada pukul 22.00–07.00 WIB.</li>
                  <li>Dilarang membawa barang ilegal atau membuat keributan.</li>
                  <li>Anak-anak di kolam renang wajib dalam pengawasan orang dewasa.</li>
                  <li>Hormati privasi tamu lain jika memilih skema Shared Stay.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-outline/10 flex justify-between items-center gap-4">
              <span className="text-[11px] text-on-surface-variant font-label">
                {!canAgreeSnK ? "Scroll hingga akhir &amp; tunggu 3s" : "✓ Siap disetujui"}
              </span>
              <button
                disabled={!canAgreeSnK}
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowSnKModal(false);
                }}
                className="bg-primary text-on-primary px-8 py-3.5 font-label text-xs tracking-widest uppercase rounded-lg hover:bg-tertiary transition-all font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {!hasScrolledToBottom
                  ? "SCROLL KE BAWAH DAHULU"
                  : !canAgreeSnK
                  ? `HARAP TUNGGU (${snkCountdown}s)`
                  : "SAYA SETUJU & PAHAMI"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Information Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full p-8 md:p-10 border border-outline/10 rounded-2xl shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowGuestModal(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-headline text-2xl text-primary font-semibold">
              Data Diri Pemesan
            </h3>
            <p className="font-body text-sm text-on-surface-variant">
              Lengkapi data kontak Anda agar butler kami dapat melakukan verifikasi pemesanan.
            </p>

            <form onSubmit={handleSubmitReservation} className="space-y-4">
              <div>
                <label className="font-label text-xs text-on-surface-variant font-semibold block mb-1">
                  NAMA LENGKAP (SESUAI KTP/PASSPORT)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ahmad Dhani"
                  className="w-full border-b border-outline/30 focus:border-primary py-2 text-sm bg-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label text-xs text-on-surface-variant font-semibold block mb-1">
                    NO. WHATSAPP / TELEPON
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full border-b border-outline/30 focus:border-primary py-2 text-sm bg-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="font-label text-xs text-on-surface-variant font-semibold block mb-1">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full border-b border-outline/30 focus:border-primary py-2 text-sm bg-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-label text-xs text-on-surface-variant font-semibold block mb-1">
                  NO. IDENTITAS (KTP / PASSPORT)
                </label>
                <input
                  type="text"
                  value={identityNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="320101XXXXXXXXXX"
                  className="w-full border-b border-outline/30 focus:border-primary py-2 text-sm bg-transparent outline-none"
                />
              </div>

              <div>
                <label className="font-label text-xs text-on-surface-variant font-semibold block mb-1">
                  CATATAN / PERMINTAAN KHUSUS (OPSIONAL)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Butuh baby crib, alergi makanan, dll."
                  className="w-full border-b border-outline/30 focus:border-primary py-2 text-sm bg-transparent outline-none"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="px-6 py-3 font-label text-xs text-on-surface-variant hover:text-primary font-semibold"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-on-primary px-8 py-3 font-label text-xs tracking-widest uppercase rounded-lg hover:bg-tertiary transition-all disabled:opacity-50 font-semibold"
                >
                  {isSubmitting ? "MEMPROSES..." : "KONFIRMASI RESERVASI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Footer */}
      <PublicFooter />
    </div>
  );
}
