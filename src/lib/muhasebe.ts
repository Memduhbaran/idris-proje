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
