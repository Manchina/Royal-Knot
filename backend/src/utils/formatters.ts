/**
 * Format numbers into Indian Rupees currency string (e.g. ₹1,26,000)
 */
export function formatInr(val: number): string {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

/**
 * Format numbers into Crores or Lakhs representation
 */
export function formatInrCr(val: number): string {
  return `₹${(val / 10000000).toFixed(2)} Cr`;
}

export function formatInrLakhs(val: number): string {
  return `₹${(val / 100000).toFixed(2)} L`;
}
