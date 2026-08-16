"use client";

import React, { useState } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const items = [
    { id: "1", title: "Villa Zain Exterior", category: "EXTERIOR", imageUrl: "/villa.jpg", desc: "Arsitektur modern bernuansa hangat di jantung Kota Medan." },
    { id: "2", title: "Villa Zain Upper Suite", category: "BEDROOM", imageUrl: "/kamar atas.jpeg", desc: "Kamar utama dengan nuansa hangat dan sentuhan kayu yang menenangkan." },
    { id: "3", title: "Villa Nina Pool Suite", category: "BEDROOM", imageUrl: "/kamar bawah.jpeg", desc: "Akses langsung menuju kolam renang outdoor privat yang tenang." },
    { id: "4", title: "Modern Designer Kitchen", category: "INTERIOR", imageUrl: "/dapur.jpeg", desc: "Dapur bersih lengkap dengan peralatan memasak kelas atas." },
    { id: "5", title: "Private Pool Dusk View", category: "POOL", imageUrl: "/villa.jpg", desc: "Suasana senja di kolam renang outdoor dengan ketenangan Medan." },
  ];

  const categories = [
    { key: "ALL", name: "Semua Foto" },
    { key: "EXTERIOR", name: "Eksterior" },
    { key: "INTERIOR", name: "Interior" },
    { key: "BEDROOM", name: "Kamar Tidur" },
    { key: "POOL", name: "Kolam Renang" },
  ];

  const filteredItems =
    activeCategory === "ALL"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div className="font-body text-on-surface antialiased bg-[#FAF9F9] min-h-screen flex flex-col justify-between">
      <PublicNavbar activeSection="galeri" />

      <main className="pt-[140px] pb-20 px-6 md:px-16 max-w-container-max-width mx-auto w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-semibold block">
            GALERI FOTO
          </span>
          <h1 className="font-headline text-3xl md:text-5xl text-primary font-normal">
            Koleksi Visual d Zain al Mansion di Medan
          </h1>
          <p className="font-body text-sm md:text-base text-on-surface-variant leading-relaxed">
            Telusuri sudut-sudut keindahan desain interior, arsitektur premium, dan nuansa ketenangan yang hadir di jantung Kota Medan.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 border-b border-outline/10 pb-6">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2.5 text-xs font-label uppercase tracking-widest rounded-lg transition-all font-semibold ${
                activeCategory === cat.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="relative group h-[320px] bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-outline/10"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 text-white">
                <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-tertiary">
                  {item.category}
                </span>
                <h4 className="font-headline text-xl text-white font-medium drop-shadow-md mt-1">
                  {item.title}
                </h4>
                <p className="font-body text-xs opacity-90 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
