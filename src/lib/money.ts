export type CurrencyCode = "JPY" | "AUD" | "USD" | "SGD";

/** An amount in integer minor units (whole yen for JPY, cents otherwise). */
export interface Money {
  minor: number;
  currency: CurrencyCode;
}

const MINOR_DIGITS: Record<CurrencyCode, number> = { JPY: 0, AUD: 2, USD: 2, SGD: 2 };

export function formatMoney(money: Money): string {
  const digits = MINOR_DIGITS[money.currency];
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(money.minor / 10 ** digits);
}

/** Sums amounts per currency; never converts between currencies. */
export function totalsByCurrency(amounts: readonly Money[]): Money[] {
  const totals = new Map<CurrencyCode, number>();
  for (const amount of amounts) {
    totals.set(amount.currency, (totals.get(amount.currency) ?? 0) + amount.minor);
  }
  return [...totals].map(([currency, minor]) => ({ currency, minor }));
}
