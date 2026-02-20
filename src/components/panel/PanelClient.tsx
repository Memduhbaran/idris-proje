"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function PanelClient({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobil: overlay sadece menü açıkken — full-screen wrapper yok, tıklamalar main'e ulaşır */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      {/* Mobil: sidebar drawer */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-64 max-w-[85vw] z-50 transform transition-transform duration-200 ease-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {/* Masaüstü: sabit sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-60 z-30">
        <Sidebar />
      </div>
      <TopBar userName={userName} onMenuClick={() => setSidebarOpen(true)} />
      <main className="pt-14 min-h-screen pl-4 pr-4 pb-4 md:pl-[calc(15rem+1.5rem)] md:pr-6 md:pb-6">{children}</main>
    </div>
  );
}
