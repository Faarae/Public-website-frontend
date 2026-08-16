"use client";

import React from "react";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function AccommodationPage() {
  const villas = [
    {
      id: "zain",
      name: "Villa Zain",
      description: "Pemandangan taman tropis yang luas dengan teras pribadi yang intim. Mengusung konsep kehangatan kayu dan kaca dengan akses alami ke balkon privat.",
      bedrooms: 2,
      bathrooms: 2,
      areaSize: 240,
      basePrice: 4500000,
      imageUrl: "/kamar atas.jpeg",
    },
    {
      id: "nina",
      name: "Villa Nina",
      description: "Akses langsung ke kolam renang outdoor privat dengan ruang tamu konsep terbuka yang mewah. Dilengkapi tempat tidur terapung dan interior minimalis.",
      bedrooms: 2,
      bathrooms: 2,
      areaSize: 280,
      basePrice: 5200000,
      imageUrl: "/kamar bawah.jpeg",
    },
  ];

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="font-body text-on-surface antialiased bg-[#FAF9F9] min-h-screen flex flex-col justify-between">
      <PublicNavbar activeSection="villa" />

      <main className="pt-[140px] pb-20 px-6 md:px-16 max-w-container-max-width mx-auto w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-semibold block">
            DAFTAR AKOMODASI
          </span>
          <h1 className="font-headline text-3xl md:text-5xl text-primary font-normal">
            Pilih Ruang Tinggal Impian Anda
          </h1>
          <p className="font-body text-sm md:text-base text-on-surface-variant leading-relaxed">
            Kami menyediakan dua unit utama dengan pemandangan menawan serta interior berkelas untuk kenyamanan bermalam Anda di Medan.
          </p>
        </div>

        {/* Cards list */}
        <div className="space-y-12">
          {villas.map((villa) => (
            <div
              key={villa.id}
              className="bg-white border border-outline/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Image */}
              <div className="lg:col-span-6 h-[320px] lg:h-auto overflow-hidden relative group">
                <img
                  src={villa.imageUrl}
                  alt={villa.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Details */}
              <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label text-[10px] uppercase tracking-widest text-tertiary font-semibold">
                        LUXURY SUITE
                      </span>
                      <h2 className="font-headline text-3xl text-primary font-semibold mt-1">
                        {villa.name}
                      </h2>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-label uppercase tracking-wider font-semibold rounded-full">
                      Tersedia
                    </span>
                  </div>

                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    {villa.description}
                  </p>

                  {/* Features row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline/10 text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">bed</span>
                      <span className="font-label text-xs font-semibold">{villa.bedrooms} Kamar Tidur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">shower</span>
                      <span className="font-label text-xs font-semibold">{villa.bathrooms} K. Mandi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">square_foot</span>
                      <span className="font-label text-xs font-semibold">{villa.areaSize} m² Luas</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold block">
                      Harga Sewa Per Malam
                    </span>
                    <span className="font-headline text-2xl md:text-3xl text-primary font-semibold">
                      {formatIDR(villa.basePrice)}
                    </span>
                  </div>
                  <Link
                    href={`/book?villa=${villa.id}`}
                    className="bg-primary text-on-primary font-label text-xs tracking-widest uppercase px-8 py-4 rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-semibold text-center shadow-sm"
                  >
                    PESAN SEKARANG
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
