"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PublicNavbarProps {
  activeSection?: string;
}

export default function PublicNavbar({ activeSection: explicitActive }: PublicNavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(explicitActive || "home");

  useEffect(() => {
    if (explicitActive) {
      setActiveSection(explicitActive);
      return;
    }

    if (pathname === "/book") {
      setActiveSection("reservasi");
      return;
    }

    if (pathname === "/gallery") {
      setActiveSection("galeri");
      return;
    }

    if (pathname === "/accommodation") {
      setActiveSection("villa");
      return;
    }

    const handleScroll = () => {
      setScrolled(window.pageYOffset > 50);

      // Section spy for homepage
      const sections = ["home", "tentang", "villa", "fasilitas", "galeri", "kontak"];
      const scrollPosition = window.pageYOffset + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, explicitActive]);

  const isCurrent = (section: string) => activeSection === section;

  const linkClass = (section: string) =>
    `font-label text-xs uppercase tracking-widest transition-all duration-300 pb-1 ${
      isCurrent(section)
        ? "text-primary border-b-2 border-tertiary font-semibold"
        : "text-on-surface-variant hover:text-primary hover:border-b-2 hover:border-primary/30"
    }`;

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 bg-[#FAF9F9]/90 backdrop-blur-xl border-b border-outline/10 px-6 md:px-16 max-w-container-max-width mx-auto left-0 right-0 flex justify-between items-center transition-all duration-300 ${
          scrolled ? "py-4 shadow-sm" : "py-6"
        }`}
      >
        <Link
          href="/"
          className="font-headline text-2xl md:text-3xl text-primary font-semibold tracking-tighter"
        >
          d Zain al Mansion
        </Link>

        <div className="hidden md:flex space-x-8 items-center">
          <Link href="/#home" className={linkClass("home")}>
            Beranda
          </Link>
          <Link href="/#tentang" className={linkClass("tentang")}>
            Tentang
          </Link>
          <Link href="/#villa" className={linkClass("villa")}>
            Villa
          </Link>
          <Link href="/#fasilitas" className={linkClass("fasilitas")}>
            Fasilitas
          </Link>
          <Link href="/#galeri" className={linkClass("galeri")}>
            Galeri
          </Link>
          <Link href="/#kontak" className={linkClass("kontak")}>
            Kontak
          </Link>
        </div>

        <div className="hidden md:flex items-center">
          <Link
            href="/book"
            className="bg-primary text-on-primary font-label text-xs tracking-widest px-8 py-3 rounded-md hover:bg-tertiary hover:text-white transition-all duration-300 shadow-sm font-semibold active:scale-95"
          >
            RESERVASI
          </Link>
        </div>

        <button
          className="md:hidden text-primary p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 z-40 bg-[#FAF9F9] p-6 border-b border-outline/10 flex flex-col gap-4 md:hidden shadow-xl">
          <Link
            href="/#home"
            onClick={() => setMobileMenuOpen(false)}
            className="font-label text-sm text-primary py-2 border-b border-outline/10"
          >
            Beranda
          </Link>
          <Link
            href="/#tentang"
            onClick={() => setMobileMenuOpen(false)}
            className="font-label text-sm text-on-surface-variant py-2 border-b border-outline/10"
          >
            Tentang
          </Link>
          <Link
            href="/#villa"
            onClick={() => setMobileMenuOpen(false)}
            className="font-label text-sm text-on-surface-variant py-2 border-b border-outline/10"
          >
            Villa
          </Link>
          <Link
            href="/#fasilitas"
            onClick={() => setMobileMenuOpen(false)}
            className="font-label text-sm text-on-surface-variant py-2 border-b border-outline/10"
          >
            Fasilitas
          </Link>
          <Link
            href="/#galeri"
            onClick={() => setMobileMenuOpen(false)}
            className="font-label text-sm text-on-surface-variant py-2 border-b border-outline/10"
          >
            Galeri
          </Link>
          <Link
            href="/#kontak"
            onClick={() => setMobileMenuOpen(false)}
            className="font-label text-sm text-on-surface-variant py-2 border-b border-outline/10"
          >
            Kontak
          </Link>
          <Link
            href="/book"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-primary text-on-primary font-label text-xs tracking-widest text-center py-3.5 mt-2 rounded-md font-semibold"
          >
            RESERVASI SEKARANG
          </Link>
        </div>
      )}
    </>
  );
}
