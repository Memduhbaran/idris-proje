"use client";

import { useState } from "react";
import { StokGirisModal } from "@/components/panel/stok/StokGirisModal";
import { StokCikisModal } from "@/components/panel/stok/StokCikisModal";
import { StokDuzeltmeModal } from "@/components/panel/stok/StokDuzeltmeModal";
import { OdemeAlModal } from "@/components/panel/taseronluk/OdemeAlModal";
import { YeniUrunModal } from "@/components/panel/YeniUrunModal";
import { YeniProjeModal } from "@/components/panel/YeniProjeModal";
import { GiderEkleModal } from "@/components/panel/GiderEkleModal";

type ModalType = "giris" | "cikis" | "duzeltme" | "odeme" | "urun" | "proje" | "gider" | null;

const ACTIONS: { type: ModalType; label: string }[] = [
  { type: "giris", label: "Stok Girişi" },
  { type: "cikis", label: "Satış (Stok Çıkışı)" },
  { type: "duzeltme", label: "Stok Düzeltme" },
  { type: "odeme", label: "Ödeme Al" },
  { type: "urun", label: "Ürün Ekle" },
  { type: "proje", label: "Yeni Proje" },
  { type: "gider", label: "Gider Ekle" },
];

export default function QuickActionsWithModals() {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.type}
            type="button"
            onClick={() => setModal(a.type)}
            className="panel-btn-primary"
          >
            {a.label}
          </button>
        ))}
      </div>

      {modal === "giris" && <StokGirisModal onClose={() => setModal(null)} />}
      {modal === "cikis" && <StokCikisModal onClose={() => setModal(null)} />}
      {modal === "duzeltme" && <StokDuzeltmeModal onClose={() => setModal(null)} />}
      {modal === "odeme" && <OdemeAlModal onClose={() => setModal(null)} />}
      {modal === "urun" && <YeniUrunModal onClose={() => setModal(null)} />}
      {modal === "proje" && <YeniProjeModal onClose={() => setModal(null)} />}
      {modal === "gider" && <GiderEkleModal onClose={() => setModal(null)} />}
    </>
  );
}
