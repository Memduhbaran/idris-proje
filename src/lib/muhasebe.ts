export const ACCOUNTING_TYPES = [
  "income",
  "expense",
  "receivable",
  "payable",
] as const;

export type AccountingType = (typeof ACCOUNTING_TYPES)[number];

export const ACCOUNTING_TYPE_LABELS: Record<AccountingType, string> = {
  income: "Gelir",
  expense: "Gider",
  receivable: "Alacak",
  payable: "Borç",
};

const LEGACY_TYPE_LABELS: Record<string, string> = {
  term_receivable: "Alacak",
  term_payable: "Borç",
};

export function getAccountingTypeLabel(type: string): string {
  return (
    ACCOUNTING_TYPE_LABELS[type as AccountingType] ??
    LEGACY_TYPE_LABELS[type] ??
    type
  );
}

export const SETTLEABLE_TYPES: AccountingType[] = ["receivable", "payable"];

export function isReceivableType(type: string): boolean {
  return type === "receivable" || type === "term_receivable";
}

export function isPayableType(type: string): boolean {
  return type === "payable" || type === "term_payable";
}

/** Taşeron Payment → muhasebe gelir bağlantısı (nakit raporunda çift sayımı önler) */
export const PAYMENT_INCOME_NOTE_PREFIX = "payment:";

export function paymentIncomeNote(paymentId: string): string {
  return `${PAYMENT_INCOME_NOTE_PREFIX}${paymentId}`;
}

export function mirroredPaymentIds(incomes: { note: string | null }[]): Set<string> {
  const ids = new Set<string>();
  for (const e of incomes) {
    if (e.note?.startsWith(PAYMENT_INCOME_NOTE_PREFIX)) {
      ids.add(e.note.slice(PAYMENT_INCOME_NOTE_PREFIX.length));
    }
  }
  return ids;
}
