import { formatZar, type Cents } from "@/domain/money/money";

/** Machine-readable decimal derived with integer arithmetic only (no float drift). */
function decimal(c: Cents): string {
  return `${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
}

export type PriceProps = { amount: Cents; className?: string };

export function Price({ amount, className = "" }: PriceProps) {
  return (
    <data value={decimal(amount)} className={className || undefined}>
      {formatZar(amount)}
    </data>
  );
}
