import { describe, expect, it } from "vitest";
import { Money } from "@/server/domain/money";

describe("Money", () => {
  it("cria um valor a partir de centavos inteiros", () => {
    const money = Money.fromCents(1050);

    expect(money.toCents()).toBe(1050);
  });

  it("rejeita valores negativos", () => {
    expect(() => Money.fromCents(-1)).toThrow("Money não pode ser negativo");
  });

  it("rejeita valores fracionários de centavos", () => {
    expect(() => Money.fromCents(10.5)).toThrow("Money deve ser um número inteiro de centavos");
  });

  it("soma dois valores", () => {
    const total = Money.fromCents(500).add(Money.fromCents(250));

    expect(total.toCents()).toBe(750);
  });

  it("subtrai dois valores quando o resultado não é negativo", () => {
    const result = Money.fromCents(500).subtract(Money.fromCents(200));

    expect(result.toCents()).toBe(300);
  });

  it("rejeita subtração cujo resultado seria negativo", () => {
    expect(() => Money.fromCents(100).subtract(Money.fromCents(200))).toThrow(
      "Money não pode ser negativo",
    );
  });

  it("compara igualdade por valor", () => {
    expect(Money.fromCents(300).equals(Money.fromCents(300))).toBe(true);
    expect(Money.fromCents(300).equals(Money.fromCents(301))).toBe(false);
  });
});
