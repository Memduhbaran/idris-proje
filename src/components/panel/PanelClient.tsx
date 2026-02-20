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
      <div className="fixed inset-0 z-40 md:hidden">
        {sidebarOpen && (
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}
        <div
          className={`absolute left-0 top-0 bottom-0 w-60 z-50 transform transition-transform duration-200 ease-out md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-60 z-30">
        <Sidebar />
      </div>
      <TopBar userName={userName} onMenuClick={() => setSidebarOpen(true)} />
      <main className="pl-0 md:pl-60 pt-14 min-h-screen p-4 md:p-6">{children}</main>
    </div>
  );
}
