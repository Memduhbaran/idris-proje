export const ACCOUNTING_TYPES = [
  "income",
  "expense",
  "receivable",
  "payable",
  "term_receivable",
  "term_payable",
] as const;

export type AccountingType = (typeof ACCOUNTING_TYPES)[number];

export const ACCOUNTING_TYPE_LABELS: Record<AccountingType, string> = {
  income: "Gelir",
  expense: "Gider",
  receivable: "Alacak",
  payable: "Borç",
  term_receivable: "Vadeli Alacak",
  term_payable: "Vadeli Borç",
};

export const SETTLEABLE_TYPES: AccountingType[] = [
  "receivable",
  "payable",
  "term_receivable",
  "term_payable",
];

export function isReceivableType(type: string): boolean {
  return type === "receivable" || type === "term_receivable";
}

export function isPayableType(type: string): boolean {
  return type === "payable" || type === "term_payable";
}

export function isTermType(type: string): boolean {
  return type === "term_receivable" || type === "term_payable";
}
