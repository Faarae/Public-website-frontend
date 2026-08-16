"use client";

import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function BookPage() {
  const whatsappUrl = "https://wa.me/6282179366767?text=Halo%20Villa%20Zain%20Al%20Mansion%2C%20saya%20ingin%20mengetahui%20detail%20booking%20dan%20ketersediaan.";

  return (
    <div className="font-body text-on-surface antialiased bg-[#FAF9F9] min-h-screen flex flex-col justify-between">
      <PublicNavbar activeSection="reservasi" />

      <main className="pt-[140px] pb-20 px-6 md:px-16 max-w-5xl mx-auto w-full">
        <div className="bg-white border border-outline/10 rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 md:p-12 lg:p-16">
              <span className="font-label text-xs uppercase tracking-[0.22em] text-tertiary font-semibold block mb-5">
                Reservasi
              </span>

              <h1 className="font-headline text-4xl md:text-5xl text-primary leading-tight">
                Booking akan segera dibuka.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-on-surface-variant">
                Saat ini proses reservasi masih dalam tahap pengembangan. Untuk informasi ketersediaan,
                harga, dan pemesanan langsung, silakan hubungi tim kami melalui WhatsApp.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center bg-primary text-on-primary px-7 py-3.5 rounded-lg font-label text-xs tracking-[0.18em] uppercase hover:bg-tertiary transition-all font-semibold"
                >
                  Chat WhatsApp
                </a>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center border border-outline/30 text-primary px-7 py-3.5 rounded-lg font-label text-xs tracking-[0.18em] uppercase hover:border-primary transition-all font-semibold"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>

            <div className="bg-[#F6F1EA] p-8 md:p-12 border-l border-outline/10 flex flex-col justify-center">
              <div className="rounded-2xl bg-white border border-outline/10 p-6 shadow-sm">
                <p className="font-label text-[11px] uppercase tracking-[0.2em] text-tertiary font-semibold">
                  Kontak Langsung
                </p>
                <h2 className="mt-4 font-headline text-2xl text-primary">Villa Zain Al Mansion</h2>
                <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                  Medan, Sumatera Utara
                </p>

                <div className="mt-6 space-y-3 text-sm text-on-surface-variant">
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant block mb-1">
                      WhatsApp
                    </span>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-primary font-semibold">
                      +62 821-7936-6767
                    </a>
                  </div>

                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant block mb-1">
                      Email
                    </span>
                    <a href="mailto:hello@villazainalmansion.com" className="text-primary font-semibold">
                      hello@villazainalmansion.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
