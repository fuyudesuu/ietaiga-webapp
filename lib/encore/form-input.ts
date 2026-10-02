// Conversions between editor inputs and the demo planner's stored values.
// Pure functions: the editors' only shared input rules.
import type { Currency, Trip } from "./model";

export const currencies: Currency[] = ["JPY", "USD", "AUD", "SGD"];

const isCurrency = (value: string): value is Currency =>
  (currencies as string[]).includes(value);

/** Minor units (yen, cents) from a typed amount; throws a message to show. */
export function parseMoney(
  amountInput: string,
  currencyInput: string,
  fallbackCurrency: Currency,
): { amount: number; currency: Currency } {
  const currency = isCurrency(currencyInput) ? currencyInput : fallbackCurrency;
  // A blank amount is saved as 0 (known issue: unknown should stay null).
  const typed = Number(amountInput);
  if (!Number.isFinite(typed) || typed < 0)
    throw new Error("Enter an amount of zero or more.");
  if (currency === "JPY" && !Number.isInteger(typed))
    throw new Error("Enter whole yen for JPY.");
  return {
    amount: Math.round(typed * minorUnitsPer(currency)),
    currency,
  };
}

/** The amount input's text for a stored amount in minor units. */
export function amountInputValue(amount: number, currency: Currency) {
  return String(amount / minorUnitsPer(currency));
}

const minorUnitsPer = (currency: Currency) => (currency === "JPY" ? 1 : 100);

const jstOffsetMs = 9 * 60 * 60 * 1000;

/** A stored UTC instant as a `datetime-local` value in Japan time. */
export function toJstInput(instant: string) {
  return instant
    ? new Date(new Date(instant).getTime() + jstOffsetMs)
        .toISOString()
        .slice(0, 16)
    : "";
}

/** A `datetime-local` value typed in Japan time as a UTC instant. */
export function fromJstInput(local: string) {
  return local ? new Date(local + ":00+09:00").toISOString() : "";
}

export const noTrip = "none";

/** Trip select options, led by "No trip yet". */
export function tripChoices(trips: Trip[]) {
  return [
    { value: noTrip, label: "No trip yet" },
    ...trips.map((trip) => ({
      value: trip.id,
      label: trip.cities + " · " + trip.title,
    })),
  ];
}
