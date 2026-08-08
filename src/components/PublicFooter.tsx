"use client";

import Link from "next/link";

export default function PublicFooter() {
  const googleMapsUrl = "https://maps.google.com/?q=3.5979445938595878,98.61412146537555";
  const whatsappUrl = "https://wa.me/6282179366767";
  const emailUrl = "mailto:g4aproject@gmail.com";
  const instagramUrl = "https://instagram.com/ghiffar.64";

  return (
    <footer className="bg-surface-container-lowest border-t border-outline/10 w-full pt-16 pb-12" id="kontak">
      <div className="px-6 md:px-16 max-w-container-max-width mx-auto space-y-12">
        
        {/* Google Maps Section Card (Lembang, Bandung Location) */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="font-label text-xs uppercase tracking-[0.2em] text-tertiary font-semibold block mb-2">
                LOKASI MANSION
              </span>
              <h3 className="font-headline text-2xl md:text-3xl text-primary font-semibold">
                Temukan Keheningan di d Zain al Mansion
              </h3>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-on-primary border border-primary shadow-sm px-6 py-3 rounded-lg text-xs font-label uppercase tracking-widest font-semibold hover:bg-tertiary hover:border-tertiary active:scale-95 transition-all duration-300"
            >
              <span>Buka di Maps</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>

          {/* Map Frame Card Container */}
          <div className="relative w-full h-[340px] md:h-[420px] rounded-2xl md:rounded-3xl overflow-hidden border border-outline/15 shadow-sm group">
            {/* Top-left Floating Button inside Map */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md shadow-md px-4 py-2.5 rounded-lg text-xs font-label text-primary font-semibold flex items-center gap-2 hover:bg-tertiary hover:text-white active:scale-95 transition-all duration-300"
            >
              <span>Buka di Google Maps</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>

            {/* Embedded Google Maps iFrame */}
            <iframe
              title="Google Maps Location - d Zain al Mansion"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1139.5819918599434!2d98.61412146537555!3d3.5979445938595878!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30312e5f0f6ab605%3A0xa6695250f3328240!2sCinta%20Damai%2C%20Medan%20Helvetia%2C%20Medan%20City%2C%20North%20Sumatra!5e1!3m2!1sen!2sid!4v1785411443047!5m2!1sen!2sid"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full grayscale-[0.15] contrast-[1.05] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>

        {/* Footer Navigation & Brand Section (Aligned 4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 border-t border-outline/10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="font-headline text-2xl md:text-3xl text-primary font-semibold tracking-tight">
              d Zain al Mansion
            </h2>
            <p className="font-body text-sm text-on-surface-variant max-w-xs leading-relaxed">
              Pengalaman menginap mewah yang memadukan arsitektur modern dengan ketenangan alam tropis Indonesia.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                className="w-9 h-9 rounded-full border border-outline/20 flex items-center justify-center text-primary hover:bg-tertiary hover:text-white hover:border-tertiary active:scale-95 transition-all duration-300"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                title="Instagram @ghiffar.64"
              >
                <span className="material-symbols-outlined text-sm">share</span>
              </a>
              <a
                className="w-9 h-9 rounded-full border border-outline/20 flex items-center justify-center text-primary hover:bg-tertiary hover:text-white hover:border-tertiary active:scale-95 transition-all duration-300"
                href={emailUrl}
                title="Email: g4aproject@gmail.com"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
              </a>
              <a
                className="w-9 h-9 rounded-full border border-outline/20 flex items-center justify-center text-primary hover:bg-tertiary hover:text-white hover:border-tertiary active:scale-95 transition-all duration-300"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp 082179366767"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
              </a>
              <a
                className="w-9 h-9 rounded-full border border-outline/20 flex items-center justify-center text-primary hover:bg-tertiary hover:text-white hover:border-tertiary active:scale-95 transition-all duration-300"
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                title="Google Maps"
              >
                <span className="material-symbols-outlined text-sm">location_on</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigasi */}
          <div className="md:col-span-2 space-y-4">
            <h6 className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
              NAVIGASI
            </h6>
            <ul className="space-y-2.5">
              <li>
                <Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#home">
                  Beranda
                </Link>
              </li>
              <li>
                <Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#tentang">
                  Tentang
                </Link>
              </li>
              <li>
                <Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#villa">
                  Villa
                </Link>
              </li>
              <li>
                <Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#fasilitas">
                  Fasilitas
                </Link>
              </li>
              <li>
                <Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="/#galeri">
                  Galeri
                </Link>
              </li>
              <li>
                <Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="/book">
                  Reservasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Kontak & Sosial */}
          <div className="md:col-span-3 space-y-4">
            <h6 className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
              KONTAK & SOSIAL
            </h6>
            <ul className="space-y-2.5">
              <li>
                <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href={instagramUrl} target="_blank" rel="noreferrer">
                  Instagram: @ghiffar.64
                </a>
              </li>
              <li>
                <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href={whatsappUrl} target="_blank" rel="noreferrer">
                  WA: 082179366767 (Ghiffar)
                </a>
              </li>
              <li>
                <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href={emailUrl}>
                  Email: g4aproject@gmail.com
                </a>
              </li>
              <li>
                <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href={googleMapsUrl} target="_blank" rel="noreferrer">
                  Google Maps Location
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="md:col-span-3 space-y-4">
            <h6 className="font-label text-xs uppercase tracking-widest text-primary font-semibold">
              LEGAL
            </h6>
            <ul className="space-y-2.5">
              <li>
                <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                  Syarat &amp; Ketentuan
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean Bottom Copyright & Created By Strip */}
        <div className="pt-8 border-t border-outline/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <p className="font-body opacity-80">
            © 2026 d Zain al Mansion. All rights reserved.
          </p>
          <div className="font-label tracking-wider opacity-80">
            <span>Created by G4A Project</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
