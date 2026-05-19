/** Format a number as ₦1,234.56 */
export const formatNGN = (val: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(val);

/**
 * Strip non-digits then re-format with commas.
 * e.g. "10000" → "10,000"
 */
export const formatAmountInput = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
};

/** Parse a formatted string like "10,000" back to a plain number */
export const parseAmount = (formatted: string): number =>
  Number(formatted.replace(/,/g, "")) || 0;

/** Create a unique idempotency key per withdrawal attempt */
export const createIdempotencyKey = (): string =>
  `withdrawal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
