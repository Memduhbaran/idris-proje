/** TL tam sayı formatı — binlik ayırıcı nokta, kuruş yok */

export function parseMoneyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Math.round(Number(digits));
}

export function formatMoneyTL(amount: number): string {
  const n = Math.round(amount);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatMoneyDisplay(amount: number): string {
  return `${formatMoneyTL(amount)} ₺`;
}
