/**
 * Money helpers.
 *
 * The API returns monetary values as MongoDB Decimal128, which JSON
 * serializes as { $numberDecimal: "1234.56" } or a plain string.
 * We never do arithmetic with JS floats for storage — only for display.
 */
export function decimalToNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (typeof value === 'object' && value.$numberDecimal !== undefined) {
    return Number(value.$numberDecimal) || 0;
  }
  return 0;
}

/** Display formatter: $1,234.56 — locale-aware, no business logic. */
export function formatMoney(value, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(decimalToNumber(value));
}

/** Input → API: strings are cast to Decimal128 by Mongoose. */
export function toDecimalString(input) {
  const n = Number(String(input).replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(n)) throw new Error('Importe no válido');
  return n.toFixed(2);
}
