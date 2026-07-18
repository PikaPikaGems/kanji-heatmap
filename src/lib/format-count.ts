/** Full count with grouping separators, e.g. 7434 → "7,434". */
export const formatRawCount = (n: number) => n.toLocaleString("en-US");

/**
 * Abbreviated counts for tight layouts:
 * 7434 → "~7.4k", 10100 → "~10.1k", 101234 → "~101k".
 * Values under 1000 stay as the raw locale string.
 */
export const formatCompactCount = (n: number) => {
  if (n < 1000) return formatRawCount(n);

  const thousands = n / 1000;
  if (n >= 100_000) {
    return `~${Math.round(thousands)}k`;
  }

  const rounded = Math.round(thousands * 10) / 10;
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `~${body}k`;
};
