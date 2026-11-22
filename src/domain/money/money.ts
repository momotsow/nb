// Money is integer ZAR cents end to end. No floats, no negatives.
// Pure domain module: no framework, Prisma or provider imports.

export type Cents = number & { readonly __brand: "ZarCents" };

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export function cents(n: number): Cents {
  if (!Number.isSafeInteger(n)) {
    throw new MoneyError("Amount must be a safe integer number of cents");
  }
  if (n < 0) {
    throw new MoneyError("Amount must not be negative");
  }
  return n as Cents;
}

export function add(a: Cents, b: Cents): Cents {
  return cents(a + b);
}

export function mul(a: Cents, qty: number): Cents {
  if (!Number.isSafeInteger(qty) || qty < 0) {
    throw new MoneyError("Quantity must be a non-negative safe integer");
  }
  return cents(a * qty);
}

export function sum(values: readonly Cents[]): Cents {
  return values.reduce<Cents>((acc, v) => add(acc, v), cents(0));
}

const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

export function formatZar(c: Cents): string {
  // Integer arithmetic for the split; formatter only sees an exact 2dp value.
  return zar.format(c / 100);
}
