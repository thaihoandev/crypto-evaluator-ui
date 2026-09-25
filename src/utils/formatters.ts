/**
 * Helper utility to format crypto prices dynamically based on magnitude.
 * Prevents small-priced coins (like PEPE, BONK, SHIB) from truncating to $0.0000.
 */
export function formatDynamicPrice(price: number | null | undefined): string {
  if (price === undefined || price === null || isNaN(price)) return '---';
  const absP = Math.abs(price);
  if (absP === 0) return '0.00';

  let maxDecimals = 2;
  if (absP < 0.00001) maxDecimals = 8;
  else if (absP < 0.001) maxDecimals = 7;
  else if (absP < 0.05) maxDecimals = 6;
  else if (absP < 1) maxDecimals = 5;
  else if (absP < 10) maxDecimals = 4;
  else if (absP < 1000) maxDecimals = 2;
  else maxDecimals = 2;

  const minDecimals = Math.min(2, maxDecimals);

  return price.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}
