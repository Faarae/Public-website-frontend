"use client";

import { useEffect } from "react";
import Link from "next/link";
import CanvasShader from "@/components/CanvasShader";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function PublicHomePage() {
  useEffect(() => {
    // Scroll reveal observer
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // Scroll parallax listener
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = document.querySelector(".parallax-bg") as HTMLElement | null;
      if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.4}px) scale(1.05)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAF9F9]">
      {/* Background WebGL Shader */}
      <CanvasShader />

      {/* Shared Navigation Header */}
      <PublicNavbar />

      {/* Hero Section (Using /villa.jpg) */}
      <section
        className="relative h-screen w-full flex items-center justify-center overflow-hidden"
        id="home"
      >
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover scale-105 parallax-bg"
            alt="d Zain al Mansion Exterior View"
            src="/villa.jpg"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 text-center px-6 md:px-0">
          <h1 className="font-headline text-3xl md:text-6xl lg:text-[72px] text-white mb-8 max-w-4xl leading-tight font-normal drop-shadow-md">
            Temukan Ketenangan di <br /> d Zain al Mansion
          </h1>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <a
              href="#villa"
              className="bg-white text-primary font-label text-xs tracking-widest px-10 py-4 hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 rounded-md font-semibold shadow-lg"
            >
              JELAJAHI VILLA
            </a>
            <a
              href="#kontak"
              className="border border-white text-white font-label text-xs tracking-widest px-10 py-4 hover:bg-white hover:text-primary active:scale-95 transition-all duration-300 rounded-md font-semibold"
            >
              HUBUNGI KAMI
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <span className="material-symbols-outlined text-white text-4xl">
            keyboard_arrow_down
          </span>
        </div>
      </section>

      {/* Statistics Strip (Bright High Contrast Boxes) */}
      <div className="bg-surface-container-low py-16 px-6 md:px-16 border-b border-outline/5">
        <div className="max-w-container-max-width mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="reveal bg-white p-6 rounded-2xl border border-outline/10 shadow-sm">
            <p className="font-headline text-4xl md:text-5xl text-tertiary font-bold">2</p>
            <p className="font-label text-xs uppercase tracking-widest text-primary font-bold mt-2">
              Unit Villa
            </p>
          </div>
          <div className="reveal bg-white p-6 rounded-2xl border border-outline/10 shadow-sm" style={{ transitionDelay: "100ms" }}>
            <p className="font-headline text-4xl md:text-5xl text-tertiary font-bold">2</p>
            <p className="font-label text-xs uppercase tracking-widest text-primary font-bold mt-2">
              Kamar per Unit
            </p>
          </div>
          <div className="reveal bg-white p-6 rounded-2xl border border-outline/10 shadow-sm" style={{ transitionDelay: "200ms" }}>
            <span className="material-symbols-outlined text-tertiary text-4xl mb-1">
              pool
            </span>
            <p className="font-label text-xs uppercase tracking-widest text-primary font-bold mt-1">
              Kolam Renang Outdoor
            </p>
          </div>
          <div className="reveal bg-white p-6 rounded-2xl border border-outline/10 shadow-sm" style={{ transitionDelay: "300ms" }}>
            <span className="material-symbols-outlined text-tertiary text-4xl mb-1">
              key
            </span>
            <p className="font-label text-xs uppercase tracking-widest text-primary font-bold mt-1">
              Private Stay
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <section
        className="py-20 md:py-28 px-6 md:px-16 max-w-container-max-width mx-auto"
        id="tentang"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-gutter items-center">
          <div className="md:col-span-7 reveal">
            <Link href="/gallery" className="block relative group overflow-hidden rounded-2xl shadow-md cursor-pointer">
              <img
                className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Interior Suasana Kamar d Zain al Mansion"
                src="/kamar bawah.jpeg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end text-white">
                <span className="font-label text-xs uppercase tracking-widest text-tertiary mb-1 font-bold">GALERI FOTO</span>
                <h4 className="font-headline text-2xl font-semibold drop-shadow-md text-white">Kehangatan Kayu &amp; Kaca</h4>
                <p className="font-body text-xs text-white/90 mt-2">Klik untuk membuka halaman galeri lengkap.</p>
              </div>
            </Link>
          </div>

          <div
            className="md:col-span-5 md:pl-12 reveal"
            style={{ transitionDelay: "200ms" }}
          >
            <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-bold mb-4 block">
              FILOSOFI KAMI
            </span>
            <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold mb-6 leading-tight">
              Arsitektur yang Bernapas dengan Alam
            </h2>
            <p className="font-body text-base md:text-lg text-on-surface-variant mb-8 leading-relaxed">
              d Zain al Mansion dirancang untuk menghadirkan harmoni sempurna antara
              kemewahan modern dan keasrian alam tropis Lembang. Setiap sudut ruangan
              adalah perayaan atas ketenangan, menggunakan material lokal
              berkualitas tinggi untuk menciptakan pengalaman menginap yang tak
              terlupakan.
            </p>
            <Link
              className="font-label text-xs uppercase tracking-widest text-primary border-b-2 border-tertiary pb-1 hover:border-primary hover:text-tertiary transition-all font-bold inline-block"
              href="/gallery"
            >
              LIHAT GALERI EKSKLUSIF
            </Link>
          </div>
        </div>
      </section>

      {/* Villa Showcase */}
      <section
        className="py-20 md:py-28 bg-surface-container-lowest"
        id="villa"
      >
        <div className="px-6 md:px-16 max-w-container-max-width mx-auto">
          <div className="flex justify-between items-end mb-16 reveal">
            <div>
              <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-bold mb-4 block">
                AKOMODASI
              </span>
              <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold">
                Pilih Tempat Peristirahatan Anda
              </h2>
            </div>
            <p className="hidden md:block max-w-sm text-on-surface-variant font-body text-sm">
              Dua pilihan unit dengan karakter unik yang tetap mengedepankan
              kenyamanan dan privasi maksimal bagi Anda dan keluarga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Villa Card A */}
            <div className="reveal group bg-surface-container-low p-6 rounded-2xl border border-outline/10 shadow-sm hover:shadow-md transition-all duration-300">
              <Link href="/accommodation" className="block overflow-hidden mb-6 aspect-video relative rounded-xl cursor-pointer">
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Villa Aruna Kamar Atas"
                  src="/kamar atas.jpeg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end text-white">
                  <span className="font-label text-[10px] uppercase tracking-widest text-tertiary font-bold">AKOMODASI</span>
                  <h4 className="font-headline text-xl text-white font-bold drop-shadow-md">Villa Aruna Suite</h4>
                  <p className="font-body text-xs text-white/90 mt-1">Klik untuk membuka detail akomodasi lengkap.</p>
                </div>
              </Link>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-headline text-2xl text-primary mb-2 font-bold">
                    Villa Aruna
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant mb-4">
                    Pemandangan taman tropis yang luas dengan teras pribadi yang intim.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                      <span className="material-symbols-outlined text-base text-tertiary">bed</span> 2 Kamar
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                      <span className="material-symbols-outlined text-base text-tertiary">square_foot</span> 240 m²
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body font-bold text-lg text-primary">
                    Rp 4.500.000
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5 font-bold">
                    per malam
                  </p>
                </div>
              </div>
              <Link
                href="/book?villa=aruna"
                className="block text-center w-full py-3.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-bold shadow-sm"
              >
                PESAN SEKARANG
              </Link>
            </div>

            {/* Villa Card B */}
            <div className="reveal group bg-surface-container-low p-6 rounded-2xl border border-outline/10 shadow-sm hover:shadow-md transition-all duration-300" style={{ transitionDelay: "200ms" }}>
              <Link href="/accommodation" className="block overflow-hidden mb-6 aspect-video relative rounded-xl cursor-pointer">
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt="Villa Bhumi Kamar Bawah"
                  src="/kamar bawah.jpeg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end text-white">
                  <span className="font-label text-[10px] uppercase tracking-widest text-tertiary font-bold">AKOMODASI</span>
                  <h4 className="font-headline text-xl text-white font-bold drop-shadow-md">Villa Bhumi Suite</h4>
                  <p className="font-body text-xs text-white/90 mt-1">Klik untuk membuka detail akomodasi lengkap.</p>
                </div>
              </Link>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-headline text-2xl text-primary mb-2 font-bold">
                    Villa Bhumi
                  </h3>
                  <p className="font-body text-sm text-on-surface-variant mb-4">
                    Akses langsung ke kolam renang dengan ruang tamu konsep terbuka yang mewah.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                      <span className="material-symbols-outlined text-base text-tertiary">bed</span> 2 Kamar
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                      <span className="material-symbols-outlined text-base text-tertiary">square_foot</span> 280 m²
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body font-bold text-lg text-primary">
                    Rp 5.200.000
                  </p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5 font-bold">
                    per malam
                  </p>
                </div>
              </div>
              <Link
                href="/book?villa=bhumi"
                className="block text-center w-full py-3.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-bold shadow-sm"
              >
                PESAN SEKARANG
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section (BRIGHT BRIGHT EKSKLUSIF BADGE) */}
      <section
        className="py-20 md:py-28 px-6 md:px-16 max-w-container-max-width mx-auto"
        id="fasilitas"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4 reveal">
          <div>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-bold mb-4 block">
              FASILITAS
            </span>
            <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold">
              Detail Kemewahan di Setiap Sisi
            </h2>
          </div>
          <Link
            href="/facilities"
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-bold shadow-sm"
          >
            <span>LIHAT SEMUA FASILITAS &amp; ADD-ON</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-gutter h-auto md:h-[750px]">
          {/* Main Sanctuary Card with HIGH CONTRAST BRIGHT EKSKLUSIF BADGE */}
          <div className="md:col-span-2 md:row-span-2 bg-surface-container-high relative overflow-hidden group reveal rounded-2xl">
            <img
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              alt="Outdoor Sanctuary & Villa Exterior"
              src="/villa.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-10 text-white">
              {/* BRIGHT SOLID GOLD BADGE */}
              <div>
                <span className="bg-amber-500 text-black font-label text-xs uppercase tracking-widest font-extrabold px-4 py-1.5 rounded-lg shadow-xl inline-block mb-3 border border-white/40">
                  ★ EKSKLUSIF
                </span>
              </div>
              <h4 className="font-headline text-2xl md:text-3xl mb-2 font-bold text-white drop-shadow-lg">
                Outdoor Sanctuary &amp; Pool
              </h4>
              <p className="text-white font-body text-sm leading-relaxed drop-shadow">
                Area santai terbuka dengan kolam renang outdoor privat berlatar keasrian lanskap tropis.
              </p>
            </div>
          </div>

          {/* Kitchen Card */}
          <div
            className="bg-surface-container relative overflow-hidden group reveal rounded-2xl h-64 md:h-auto"
            style={{ transitionDelay: "100ms" }}
          >
            <img
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              alt="Modern Designer Kitchen"
              src="/dapur.jpeg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="bg-amber-500 text-black font-label text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded shadow-lg inline-block mb-1 w-max">
                DAPUR MEWAH
              </span>
              <h5 className="font-headline text-lg text-white font-bold drop-shadow-md">Kitchen &amp; Dining Area</h5>
              <p className="font-body text-xs text-white/95 group-hover:opacity-100 opacity-90 transition-opacity duration-300 mt-1">Perlengkapan masak lengkap.</p>
            </div>
          </div>

          {/* Master Bedroom Teaser */}
          <div
            className="bg-surface-container relative overflow-hidden group reveal rounded-2xl h-64 md:h-auto"
            style={{ transitionDelay: "200ms" }}
          >
            <img
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              alt="Luxury Suite Bedroom"
              src="/kamar atas.jpeg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="bg-amber-500 text-black font-label text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded shadow-lg inline-block mb-1 w-max">
                KAMAR MEWAH
              </span>
              <h5 className="font-headline text-lg text-white font-bold drop-shadow-md">Master Suite Sanctuary</h5>
              <p className="font-body text-xs text-white/95 group-hover:opacity-100 opacity-90 transition-opacity duration-300 mt-1">Kenyamanan tidur kelas atas.</p>
            </div>
          </div>

          {/* High Speed Wifi Card */}
          <div
            className="md:col-span-2 bg-primary p-8 md:p-10 flex flex-col justify-center text-on-primary reveal rounded-2xl shadow-sm"
            style={{ transitionDelay: "300ms" }}
          >
            <span className="material-symbols-outlined text-4xl mb-4 text-tertiary">wifi</span>
            <h4 className="font-headline text-2xl md:text-3xl mb-3 font-bold text-white">
              Konektivitas Tinggi
            </h4>
            <p className="font-body text-sm opacity-95 leading-relaxed text-white">
              Tetap terhubung dengan dunia luar melalui internet fiber optik berkecepatan tinggi di seluruh area mansion, ideal untuk digital nomad atau sekadar hiburan.
            </p>
          </div>
        </div>
      </section>

      {/* DEDICATED GALERI PHOTO GRID SECTION */}
      <section className="py-20 md:py-28 bg-surface-container-low" id="galeri">
        <div className="px-6 md:px-16 max-w-container-max-width mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 reveal">
            <div>
              <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-bold mb-4 block">
                GALERI FOTO
              </span>
              <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold">
                Koleksi Visual d Zain al Mansion
              </h2>
            </div>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-bold shadow-sm"
            >
              <span>BUKA FULL GALERI</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <Link href="/gallery" className="block relative group h-[300px] bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <img
                src="/villa.jpg"
                alt="d Zain al Mansion Exterior"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end text-white">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-tertiary">EKSTERIOR</span>
                <h4 className="font-headline text-xl text-white font-bold drop-shadow-md">Arsitektur Tropis Modern</h4>
              </div>
            </Link>

            <Link href="/gallery" className="block relative group h-[300px] bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <img
                src="/kamar atas.jpeg"
                alt="Kamar Utama Suite"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end text-white">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-tertiary">KAMAR TIDUR</span>
                <h4 className="font-headline text-xl text-white font-bold drop-shadow-md">Upper Master Suite</h4>
              </div>
            </Link>

            <Link href="/gallery" className="block relative group h-[300px] bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <img
                src="/kamar bawah.jpeg"
                alt="Pool Suite Lounge"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-6 flex flex-col justify-end text-white">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-tertiary">INTERIOR</span>
                <h4 className="font-headline text-xl text-white font-bold drop-shadow-md">Poolside Lounge Suite</h4>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Private Stay Experience Section (With FIXED Parallax Background Image) */}
      <section className="relative py-24 md:py-32 bg-fixed bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url('/villa.jpg')` }}>
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] z-0"></div>

        <div className="relative z-10 px-6 md:px-16 max-w-4xl mx-auto text-center reveal">
          <div className="bg-white/95 backdrop-blur-md p-8 md:p-16 shadow-2xl border border-white/20 rounded-3xl relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-1.5 font-label text-xs tracking-widest rounded-full uppercase font-extrabold shadow-md border border-white/40">
              EXCLUSIVE
            </div>
            <h2 className="font-headline text-2xl md:text-4xl text-primary font-bold mb-6 mt-2">
              Pengalaman Private Stay
            </h2>
            <p className="font-body text-base text-on-surface-variant mb-10 leading-relaxed font-medium">
              Kami menawarkan fleksibilitas unik untuk kebutuhan menginap Anda. Anda dapat memesan satu unit villa untuk suasana yang lebih intim, atau memesan keseluruhan mansion (2 unit) untuk privasi mutlak bersama keluarga besar atau rekan bisnis. Nikmati layanan butler pribadi yang siap memenuhi setiap keinginan Anda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t border-outline/10 pt-8">
              <div>
                <h5 className="font-label text-xs uppercase tracking-widest text-tertiary font-bold mb-2">
                  Satu Unit
                </h5>
                <p className="font-body text-sm text-on-surface-variant font-medium">
                  Ideal untuk 4 orang dewasa dengan fasilitas private pool unit tersebut.
                </p>
              </div>
              <div>
                <h5 className="font-label text-xs uppercase tracking-widest text-tertiary font-bold mb-2">
                  Satu Mansion
                </h5>
                <p className="font-body text-sm text-on-surface-variant font-medium">
                  Kapasitas hingga 10 orang dengan akses penuh ke seluruh area mansion secara eksklusif.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/book"
                className="inline-block bg-primary text-on-primary font-label text-xs uppercase tracking-widest px-10 py-4 rounded-lg hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300 font-bold shadow-md"
              >
                PESAN PRIVATE STAY SEKARANG
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-surface-container-low overflow-hidden">
        <div className="px-6 md:px-16 max-w-container-max-width mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-bold mb-4 block">
              TESTIMONI
            </span>
            <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold italic">
              Kata Mereka yang Telah Menginap
            </h2>
          </div>

          <div className="flex gap-6 md:gap-gutter overflow-x-auto pb-10 no-scrollbar snap-x snap-mandatory">
            <div className="min-w-full md:min-w-[480px] bg-white p-8 md:p-12 snap-center reveal rounded-2xl border border-outline/10 shadow-sm">
              <div className="flex text-tertiary mb-6">
                {"★★★★★".split("").map((s, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="font-body text-base text-on-surface mb-8 leading-relaxed font-medium">
                &quot;Pengalaman menginap yang benar-benar magis. Desain interiornya sangat detail dan lingkungannya sangat tenang. Sangat cocok untuk healing.&quot;
              </p>
              <p className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                ANNA &amp; MARCO, ITALIA
              </p>
            </div>

            <div
              className="min-w-full md:min-w-[480px] bg-white p-8 md:p-12 snap-center reveal rounded-2xl border border-outline/10 shadow-sm"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="flex text-tertiary mb-6">
                {"★★★★★".split("").map((s, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="font-body text-base text-on-surface mb-8 leading-relaxed font-medium">
                &quot;Butler kami sangat membantu dan ramah. Villa Bhumi memberikan akses kolam renang yang fantastis. Pasti akan kembali lagi nanti!&quot;
              </p>
              <p className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                BUDI SANTOSO, JAKARTA
              </p>
            </div>

            <div
              className="min-w-full md:min-w-[480px] bg-white p-8 md:p-12 snap-center reveal rounded-2xl border border-outline/10 shadow-sm"
              style={{ transitionDelay: "400ms" }}
            >
              <div className="flex text-tertiary mb-6">
                {"★★★★★".split("").map((s, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="font-body text-base text-on-surface mb-8 leading-relaxed font-medium">
                &quot;Lokasinya sempurna, tidak terlalu jauh dari keramaian tapi tetap memiliki privasi total yang kami cari. Arsitekturnya luar biasa indah.&quot;
              </p>
              <p className="font-label text-xs uppercase tracking-widest text-primary font-bold">
                SARAH JOHNSON, AUSTRALIA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
      <PublicFooter />
    </div>
  );
}
