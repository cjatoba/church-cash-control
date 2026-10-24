import type { Money } from "@/server/domain/money";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const shortMonthNames = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const longMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

export function formatCurrency(amount: Money): string {
  return currencyFormatter.format(amount.toCents() / 100);
}

export function formatMonthYear(date: Date): string {
  return `${shortMonthNames[date.getUTCMonth()] ?? ""}/${String(date.getUTCFullYear())}`;
}

export function formatMonthLabel(date: Date): string {
  const month = longMonthFormatter.format(date);
  return `${month.charAt(0).toUpperCase()}${month.slice(1)}/${String(date.getUTCFullYear())}`;
}
