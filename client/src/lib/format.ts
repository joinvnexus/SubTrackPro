// Helper to convert cents to formatted dollar string
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// Parse string dollar amount (e.g. "10.99") back to cents (1099)
export function parseCurrencyToCents(amount: string | number): number {
  if (typeof amount === "number") return amount;
  const parsed = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
