import { describe, expect, it } from "vitest";
import {
  calculateMonthlyGoal,
  countMonthsInPeriod,
  isMonthlyGoalReached,
} from "@/server/domain/monthly-progress";
import { Money } from "@/server/domain/money";
import type { MonthlyProgress } from "@/server/domain/monthly-progress";

describe("countMonthsInPeriod", () => {
  it("conta 1 mês quando início e fim caem no mesmo mês", () => {
    expect(countMonthsInPeriod(new Date("2026-03-05"), new Date("2026-03-20"))).toBe(1);
  });

  it("conta os meses inclusive entre início e fim", () => {
    expect(countMonthsInPeriod(new Date("2026-03-01"), new Date("2026-08-31"))).toBe(6);
  });

  it("conta corretamente quando o período atravessa o fim do ano", () => {
    expect(countMonthsInPeriod(new Date("2026-11-01"), new Date("2027-02-28"))).toBe(4);
  });
});

describe("calculateMonthlyGoal", () => {
  it("divide a meta igualmente pelos meses do período", () => {
    const monthlyGoal = calculateMonthlyGoal(
      Money.fromReais(600),
      new Date("2026-01-01"),
      new Date("2026-06-30"),
    );

    expect(monthlyGoal.toCents()).toBe(10000);
  });

  it("arredonda quando a divisão não é exata", () => {
    const monthlyGoal = calculateMonthlyGoal(
      Money.fromReais(100),
      new Date("2026-01-01"),
      new Date("2026-03-31"),
    );

    expect(monthlyGoal.toCents()).toBe(3333);
  });
});

describe("isMonthlyGoalReached", () => {
  function progress(overrides: Partial<MonthlyProgress>): MonthlyProgress {
    return {
      month: new Date("2026-09-01"),
      monthlyGoal: Money.fromReais(100),
      receivedTotal: Money.fromReais(0),
      paid: [],
      pending: [],
      ...overrides,
    };
  }

  it("considera atingida quando o total recebido é maior ou igual à meta", () => {
    expect(isMonthlyGoalReached(progress({ receivedTotal: Money.fromReais(100) }))).toBe(true);
    expect(isMonthlyGoalReached(progress({ receivedTotal: Money.fromReais(150) }))).toBe(true);
  });

  it("considera não atingida quando o total recebido é menor que a meta", () => {
    expect(isMonthlyGoalReached(progress({ receivedTotal: Money.fromReais(50) }))).toBe(false);
  });
});
