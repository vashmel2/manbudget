export function peso(cents: number, opts: { bare?: boolean; plus?: boolean } = {}): string {
  const neg = cents < 0;
  const v = Math.abs(Math.round(cents / 100));
  const s = v.toLocaleString("en-PH");
  const sign = neg ? "−" : opts.plus ? "+" : "";
  return opts.bare ? sign + s : sign + "₱" + s;
}

export function pesoK(cents: number): string {
  const a = Math.abs(cents / 100);
  if (a >= 1000) {
    return (cents < 0 ? "−" : "") + "₱" + (a / 1000).toFixed(a >= 10000 ? 0 : 1) + "k";
  }
  return peso(cents);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
