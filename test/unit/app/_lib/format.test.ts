import { describe, expect, it } from "vitest";
import { formatCurrency, formatMonthLabel, formatMonthYear } from "@/app/_lib/format";
import { Money } from "@/server/domain/money";

describe("formatCurrency", () => {
  it("formata centavos como reais", () => {
    expect(formatCurrency(Money.fromCents(123456))).toBe("R$ 1.234,56");
  });
});

describe("formatMonthYear", () => {
  it("mostra o mês abreviado e o ano", () => {
    expect(formatMonthYear(new Date("2026-12-31T00:00:00Z"))).toBe("dez/2026");
  });
});

describe("formatMonthLabel", () => {
  it("mostra o mês por extenso com inicial maiúscula e o ano", () => {
    expect(formatMonthLabel(new Date("2026-03-01T00:00:00Z"))).toBe("Março/2026");
  });
});
