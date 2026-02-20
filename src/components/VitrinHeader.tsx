"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/#anasayfa", label: "Anasayfa" },
  { href: "/#hizmetler", label: "Hizmetler" },
  { href: "/#hakkimizda", label: "Hakkımızda" },
  { href: "/#iletisim", label: "İletişim" },
];

export function VitrinHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 shadow-md backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-stone-900" onClick={closeMenu}>
          Ahenk Yapı
        </Link>

        {/* Masaüstü menü */}
        <nav className="hidden items-center gap-1 sm:gap-3 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-amber-50 hover:text-stone-900"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/panel"
            className="ml-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-amber-600"
          >
            Giriş Yap
          </Link>
        </nav>

        {/* Mobil: hamburger butonu */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-stone-600 hover:bg-amber-50 hover:text-stone-900"
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobil açılır menü */}
      <div
        className={`fixed inset-0 z-30 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />
      <div
        className={`fixed right-0 top-0 z-40 h-full w-full max-w-xs border-l border-stone-200 bg-white shadow-xl transition-transform duration-200 ease-out md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <nav className="flex flex-col gap-1 p-4 pt-20">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className="rounded-lg px-4 py-3 text-base font-medium text-stone-700 transition-colors hover:bg-amber-50 hover:text-stone-900"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/panel"
            onClick={closeMenu}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-3 text-center text-base font-medium text-white shadow-md transition-colors hover:bg-amber-600"
          >
            Giriş Yap
          </Link>
        </nav>
      </div>
    </header>
  );
}
