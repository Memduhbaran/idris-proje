"use client";

import { MuhasebeKayitModal } from "@/components/panel/muhasebe/MuhasebeKayitModal";

/** Hızlı işlemler — gider ekleme (muhasebe expense) */
export function GiderEkleModal({ onClose }: { onClose: () => void }) {
  return <MuhasebeKayitModal type="expense" onClose={onClose} />;
}
