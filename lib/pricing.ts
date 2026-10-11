export type PriceMode = "fixed" | "from" | "quote";

export function formatPrice(mode: PriceMode, amount: number | string | null | undefined, currency = "USD", note?: string | null) {
  if (mode === "quote") return note?.trim() || "Request a quote";
  const value = Number(amount);
  if (!Number.isFinite(value)) return mode === "from" ? "Starting price on request" : "Price on request";
  const display = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  return `${mode === "from" ? "From " : ""}${display}${note?.trim() ? ` · ${note.trim()}` : ""}`;
}
