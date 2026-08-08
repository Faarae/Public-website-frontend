"use client";

import React from "react";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function FacilitiesPage() {
  const mainFacilities = [
    {
      title: "Outdoor Infinity Pool",
      desc: "Kolam renang outdoor privat berlatar lanskap tropis Lembang yang sejuk dan asri.",
      icon: "pool",
      image: "/villa.jpg",
    },
    {
      title: "Designer Kitchen & Dining",
      desc: "Dapur bersih modern lengkap dengan kompor induksi, kulkas, peralatan masak, dan kuliner set.",
      icon: "restaurant",
      image: "/dapur.jpeg",
    },
    {
      title: "Master Suite & Private Terrace",
      desc: "Kamar tidur mewah dengan kasur ukuran king, bantal empuk, dan akses langsung ke teras terbuka.",
      icon: "bed",
      image: "/kamar atas.jpeg",
    },
    {
      title: "Poolside Lounge Suite",
      desc: "Ruang istirahat lantai bawah dengan pemandangan langsung ke kolam renang privat.",
      icon: "weekend",
      image: "/kamar bawah.jpeg",
    },
    {
      title: "Fiber Optic High-Speed Wi-Fi",
      desc: "Koneksi internet cepat terjangkau di seluruh area indoor & outdoor mansion.",
      icon: "wifi",
      image: "/villa.jpg",
    },
    {
      title: "Layanan Butler & Keamanan 24/7",
      desc: "Staf profesional yang siap melayani kebutuhan Anda sepanjang hari dengan privasi terjamin.",
      icon: "concierge",
      image: "/kamar bawah.jpeg",
    },
  ];

  const addonServices = [
    {
      title: "Paket Dekorasi Romantis / Ulang Tahun",
      desc: "Penataan dekorasi balon, kelopak bunga, lampu hias, & ucapan khusus untuk merayakan momen spesial.",
      icon: "cake",
    },
    {
      title: "Peralatan & Perlengkapan Barbeque Grill",
      desc: "Penyediaan panggangan outdoor, arang, bumbu racikan, dan persiapan area BBQ malam hari.",
      icon: "local_fire_department",
    },
    {
      title: "Sarapan Spesial Khas Lembang",
      desc: "Hidangan sarapan hangat disajikan langsung di villa setiap pagi sesuai selera Anda.",
      icon: "flatware",
    },
    {
      title: "Layanan Private Chef & Dining",
      desc: "Koki pribadi untuk memasak hidangan istimewa langsung di dapur mansion.",
      icon: "skillet",
    },
    {
      title: "Penjemputan & Antar Jemput (Shuttle)",
      desc: "Layanan transportasi privat menuju stasiun, bandara, atau destinasi wisata pilihan.",
      icon: "directions_car",
    },
    {
      title: "Paket Spa & Relaxation in Villa",
      desc: "Pijat tradisional dan refleksi relaksasi langsung di dalam kenyamanan unit villa Anda.",
      icon: "spa",
    },
  ];

  return (
    <div className="font-body text-on-surface antialiased bg-[#FAF9F9] min-h-screen flex flex-col justify-between">
      <PublicNavbar activeSection="fasilitas" />

      <main className="pt-[140px] pb-20 px-6 md:px-16 max-w-container-max-width mx-auto w-full space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-semibold block">
            FASILITAS &amp; LAYANAN EKSKLUSIF
          </span>
          <h1 className="font-headline text-3xl md:text-5xl text-primary font-normal">
            Kenyamanan Maksimal di d Zain al Mansion
          </h1>
          <p className="font-body text-sm md:text-base text-on-surface-variant leading-relaxed">
            Nikmati beragam fasilitas utama kelas atas yang telah disediakan serta pilihan paket layanan tambahan (add-on) selama Anda menginap.
          </p>
        </div>

        {/* Main Facilities Section */}
        <div className="space-y-8">
          <div className="border-b border-outline/10 pb-4">
            <h2 className="font-headline text-2xl text-primary font-semibold">
              Fasilitas Utama Terintegrasi
            </h2>
            <p className="font-body text-xs text-on-surface-variant">Sudah termasuk dalam setiap pilihan menginap Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mainFacilities.map((fac, idx) => (
              <div
                key={idx}
                className="bg-white border border-outline/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={fac.image}
                    alt={fac.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/25"></div>
                  <span className="absolute top-4 right-4 bg-primary text-white p-2 rounded-lg shadow-md">
                    <span className="material-symbols-outlined text-lg">{fac.icon}</span>
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="font-headline text-xl text-primary font-semibold">
                    {fac.title}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    {fac.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add-on Services Section (WITHOUT PRICES) */}
        <div className="space-y-8 pt-8 border-t border-outline/10">
          <div className="space-y-2">
            <span className="font-label text-xs uppercase tracking-widest text-tertiary font-semibold block">
              OPSI SPESIAL (ADD-ON)
            </span>
            <h2 className="font-headline text-2xl md:text-3xl text-primary font-semibold">
              Layanan Tambahan Selama Menginap
            </h2>
            <p className="font-body text-sm text-on-surface-variant">
              Dapat dipilih dan disesuaikan dengan kebutuhan acara maupun kenyamanan rombongan Anda selama di villa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addonServices.map((addon, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-outline/10 shadow-sm flex items-start gap-5 hover:border-tertiary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">{addon.icon}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-headline text-lg text-primary font-semibold">
                    {addon.title}
                  </h4>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                    {addon.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 text-center">
            <Link
              href="/book"
              className="inline-block bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-10 py-4 rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-semibold shadow-md"
            >
              RESERVASI &amp; PILIH ADD-ON SEKARANG
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
