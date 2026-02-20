"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopBar({ userName, onMenuClick }: { userName: string; onMenuClick?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/panel/login");
    router.refresh();
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 fixed top-0 left-0 md:left-60 right-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button type="button" onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Menü">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        )}
        <input
          type="search"
          placeholder="Ara..."
          className="panel-input w-56 max-w-full py-2 text-sm"
        />
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <span className="text-sm font-medium">{userName}</span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-panel-lg border border-slate-200 py-1 z-20">
              <Link
                href="/panel/ayarlar"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Ayarlar
              </Link>
              <Link
                href="/panel/ayarlar/sifre"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Şifre değiştir
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
              >
                Çıkış
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
