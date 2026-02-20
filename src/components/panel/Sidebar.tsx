"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";

const icons = {
  home: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  stok: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  taseron: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  gider: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V9" />
    </svg>
  ),
  rapor: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  web: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  ayar: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

type IconKey = "home" | "stok" | "taseron" | "gider" | "rapor" | "web" | "ayar";

const items: Array<{
  href: string;
  label: string;
  icon: IconKey;
  sub?: Array<{ href: string; label: string }>;
}> = [
  { href: "/panel", label: "Anasayfa", icon: "home" },
  { href: "/panel/stok", label: "Stok", icon: "stok" },
  { href: "/panel/taseronluk", label: "Taşeronluk", icon: "taseron" },
  { href: "/panel/giderler", label: "Giderler", icon: "gider" },
  { href: "/panel/raporlar", label: "Raporlar", icon: "rapor" },
  { href: "/panel/web-icerik", label: "Web İçerik", icon: "web" },
  { href: "/panel/ayarlar", label: "Ayarlar", icon: "ayar", sub: [
    { href: "/panel/ayarlar", label: "Genel" },
    { href: "/panel/ayarlar/sifre", label: "Şifre Değiştir" },
    { href: "/panel/ayarlar/audit", label: "Audit Log" },
  ]},
];

type SidebarProps = { onNavigate?: () => void };

export default function Sidebar(props: SidebarProps) {
  const { onNavigate } = props;
  const pathname = usePathname();

  const initiallyOpen = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.sub?.some((s) => pathname === s.href) || (item.sub && pathname.startsWith(item.href) && pathname !== item.href)) set.add(item.href);
    });
    return set;
  }, []);

  const [openGroups, setOpenGroups] = useState<Set<string>>(initiallyOpen);

  const toggle = (href: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  return (
    <div
      className="w-60 min-h-screen flex flex-col fixed left-0 top-0 z-30 bg-slate-900 text-slate-200 shadow-xl"
      role="complementary"
      aria-label="Panel menüsü"
    >
      <div className="p-5 border-b border-slate-700/80">
        <Link href="/panel" onClick={onNavigate} className="flex items-center gap-2 font-semibold text-white text-lg tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          Ahenk Yapı
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const hasSub = item.sub && item.sub.length > 0;
            const isGroupActive = hasSub && (pathname === item.href || item.sub!.some((s) => pathname === s.href));
            const isOpen = hasSub && (openGroups.has(item.href) || isGroupActive);

            if (hasSub) {
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => toggle(item.href)}
                    className={`flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors touch-manipulation md:min-h-0 ${
                      isGroupActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    {icons[item.icon]}
                    <span className="flex-1">{item.label}</span>
                    <ChevronIcon open={!!isOpen} />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <ul className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-slate-700/60 pl-3">
                        {item.sub!.map((s) => {
                          const active = pathname === s.href;
                          return (
                            <li key={s.href}>
                              <Link
                                href={s.href}
                                onClick={onNavigate}
                                className={`flex items-center min-h-[44px] rounded-md py-2 pl-2 -ml-px text-sm transition-colors border-l-2 touch-manipulation md:min-h-0 ${
                                  active
                                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                                    : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                }`}
                              >
                                {s.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            }

            const active = pathname === item.href || (item.href !== "/panel" && pathname.startsWith(item.href + "/"));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center min-h-[44px] gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation md:min-h-0 ${
                    active ? "bg-amber-500/15 text-amber-400" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  {icons[item.icon]}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
