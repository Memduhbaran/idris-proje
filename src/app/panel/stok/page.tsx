"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StokGirisModal } from "@/components/panel/stok/StokGirisModal";
import { StokCikisModal } from "@/components/panel/stok/StokCikisModal";
import { StokDuzeltmeModal } from "@/components/panel/stok/StokDuzeltmeModal";
import { StokKategorilerTab } from "@/components/panel/stok/StokKategorilerTab";
import { StokUrunlerTab } from "@/components/panel/stok/StokUrunlerTab";
import { StokHareketlerTab } from "@/components/panel/stok/StokHareketlerTab";
import { StokIptalTab } from "@/components/panel/stok/StokIptalTab";

const TABS = [
  { id: "kategoriler", label: "Kategoriler" },
  { id: "urunler", label: "Ürünler" },
  { id: "hareketler", label: "Hareketler" },
  { id: "iptal", label: "İptal / Ters Kayıt" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type ModalId = "giris" | "cikis" | "duzeltme" | null;

export default function StokPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("kategoriler");
  const [modal, setModal] = useState<ModalId>(null);

  useEffect(() => {
    const t = searchParams.get("tab") as TabId | null;
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    const m = searchParams.get("modal");
    if (m === "giris" || m === "cikis" || m === "duzeltme") {
      setModal(m);
      const tabParam = searchParams.get("tab");
      const newPath = "/panel/stok" + (tabParam && TABS.some((x) => x.id === tabParam) ? `?tab=${tabParam}` : "");
      router.replace(newPath, { scroll: false });
    }
  }, []);

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Stok</h1>

      <div className="flex flex-wrap gap-2 items-center border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setModal("giris")}
          className="panel-btn-primary"
        >
          Stok Girişi
        </button>
        <button
          type="button"
          onClick={() => setModal("cikis")}
          className="panel-btn-primary"
        >
          Stok Çıkışı (Satış)
        </button>
        <button
          type="button"
          onClick={() => setModal("duzeltme")}
          className="panel-btn-primary"
        >
          Stok Düzeltme
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-white border border-slate-200 border-b-white -mb-px text-amber-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "kategoriler" && <StokKategorilerTab />}
        {tab === "urunler" && (
          <StokUrunlerTab
            initialOpenNew={searchParams.get("yeni") === "1"}
            onOpenNewConsumed={() => router.replace("/panel/stok?tab=urunler", { scroll: false })}
          />
        )}
        {tab === "hareketler" && <StokHareketlerTab />}
        {tab === "iptal" && <StokIptalTab />}
      </div>

      {modal === "giris" && <StokGirisModal onClose={() => setModal(null)} />}
      {modal === "cikis" && <StokCikisModal onClose={() => setModal(null)} />}
      {modal === "duzeltme" && <StokDuzeltmeModal onClose={() => setModal(null)} />}
    </div>
  );
}
