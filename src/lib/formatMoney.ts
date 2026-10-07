export function formatMoney(value: number | string | null | undefined, symbol = "R", digits = 2): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  const safe = Number.isFinite(n as number) ? (n as number) : 0;
  const body = Math.abs(safe).toLocaleString("en-ZA", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${safe < 0 ? "-" : ""}${symbol} ${body}`;
}
