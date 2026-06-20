export const CARI_TYPES = ["customer", "supplier", "both"] as const;
export type CariType = (typeof CARI_TYPES)[number];

export const CARI_TYPE_LABELS: Record<CariType, string> = {
  customer: "Müşteri",
  supplier: "Tedarikçi",
  both: "Müşteri / Tedarikçi",
};

export type CariBalance = {
  openReceivable: number;
  openPayable: number;
  netBalance: number;
};

export function computeCariBalance(
  entries: { type: string; amount: number; status: string }[]
): CariBalance {
  let openReceivable = 0;
  let openPayable = 0;
  for (const e of entries) {
    if (e.status !== "open") continue;
    if (e.type === "receivable" || e.type === "term_receivable") {
      openReceivable += Math.round(e.amount);
    } else if (e.type === "payable" || e.type === "term_payable") {
      openPayable += Math.round(e.amount);
    }
  }
  return {
    openReceivable,
    openPayable,
    netBalance: openReceivable - openPayable,
  };
}
