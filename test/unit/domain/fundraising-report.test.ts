import { describe, expect, it } from "vitest";
import {
  DETAILED_REPORT_ENTRY_LIMIT,
  canListDetailedEntries,
  groupEntriesByMonth,
  listReportMonths,
  resolveReportPeriod,
  summarizeFundraisingReport,
  summarizeMoneyWithTeam,
  toReportDateRange,
  type ReportAggregateRow,
} from "@/server/domain/fundraising-report";
import { Money } from "@/server/domain/money";

const campaign = {
  goal: Money.fromReais(1200),
  startDate: new Date("2026-01-10"),
  endDate: new Date("2026-06-20"),
};

function row(overrides: Partial<ReportAggregateRow>): ReportAggregateRow {
  return {
    month: new Date("2026-01-01"),
    kind: "installment",
    paymentMethod: "pix",
    totalCents: 10000,
    count: 1,
    ...overrides,
  };
}

describe("resolveReportPeriod", () => {
  it("usa a campanha inteira quando nenhum mês é escolhido", () => {
    const period = resolveReportPeriod(campaign, null);

    expect(period.wholeCampaign).toBe(true);
    expect(period.firstMonth).toEqual(new Date("2026-01-01"));
    expect(period.lastMonth).toEqual(new Date("2026-06-01"));
  });

  it("aceita meses escolhidos dentro do período da campanha", () => {
    const period = resolveReportPeriod(campaign, {
      firstMonth: new Date("2026-02-15"),
      lastMonth: new Date("2026-04-03"),
    });

    expect(period.wholeCampaign).toBe(false);
    expect(period.firstMonth).toEqual(new Date("2026-02-01"));
    expect(period.lastMonth).toEqual(new Date("2026-04-01"));
  });

  it("trata a escolha de todos os meses da campanha como campanha inteira", () => {
    const period = resolveReportPeriod(campaign, {
      firstMonth: new Date("2026-01-01"),
      lastMonth: new Date("2026-06-01"),
    });

    expect(period.wholeCampaign).toBe(true);
  });

  it("rejeita mês fora do período da campanha", () => {
    expect(() =>
      resolveReportPeriod(campaign, {
        firstMonth: new Date("2025-12-01"),
        lastMonth: new Date("2026-03-01"),
      }),
    ).toThrow("Escolha meses dentro do período da campanha");
    expect(() =>
      resolveReportPeriod(campaign, {
        firstMonth: new Date("2026-03-01"),
        lastMonth: new Date("2026-07-01"),
      }),
    ).toThrow("Escolha meses dentro do período da campanha");
  });

  it("rejeita mês inicial depois do mês final", () => {
    expect(() =>
      resolveReportPeriod(campaign, {
        firstMonth: new Date("2026-04-01"),
        lastMonth: new Date("2026-02-01"),
      }),
    ).toThrow('O mês de "De" precisa vir antes do mês de "Até"');
  });
});

describe("listReportMonths", () => {
  it("lista cada mês do período, inclusive o primeiro e o último", () => {
    const months = listReportMonths({
      firstMonth: new Date("2026-11-01"),
      lastMonth: new Date("2027-02-01"),
    });

    expect(months).toEqual([
      new Date("2026-11-01"),
      new Date("2026-12-01"),
      new Date("2027-01-01"),
      new Date("2027-02-01"),
    ]);
  });
});

describe("toReportDateRange", () => {
  it("não filtra datas na campanha inteira, para o total bater com o arrecadado do painel", () => {
    expect(toReportDateRange(resolveReportPeriod(campaign, null))).toBeNull();
  });

  it("vai do primeiro dia do mês inicial até o primeiro dia depois do mês final", () => {
    const range = toReportDateRange(
      resolveReportPeriod(campaign, {
        firstMonth: new Date("2026-02-01"),
        lastMonth: new Date("2026-03-01"),
      }),
    );

    expect(range).toEqual({ from: new Date("2026-02-01"), until: new Date("2026-04-01") });
  });
});

describe("summarizeFundraisingReport", () => {
  it("soma o arrecadado e compara com a meta da campanha inteira", () => {
    const summary = summarizeFundraisingReport(campaign, resolveReportPeriod(campaign, null), [
      row({ totalCents: 30000, count: 3 }),
      row({ kind: "one_off_donation", paymentMethod: "cash", totalCents: 15000, count: 2 }),
    ]);

    expect(summary.goal.toCents()).toBe(120000);
    expect(summary.raised.toCents()).toBe(45000);
    expect(summary.progressPercentage).toBe(38);
    expect(summary.amountLeftToGoal.toCents()).toBe(75000);
    expect(summary.entryCount).toBe(5);
  });

  it("usa a meta mensal vezes o número de meses quando o período é parcial", () => {
    const period = resolveReportPeriod(campaign, {
      firstMonth: new Date("2026-02-01"),
      lastMonth: new Date("2026-04-01"),
    });

    const summary = summarizeFundraisingReport(campaign, period, []);

    expect(summary.goal.toCents()).toBe(60000);
    expect(summary.raised.toCents()).toBe(0);
  });

  it("mostra todos os meses do período, mesmo os sem arrecadação, com a meta de cada mês", () => {
    const summary = summarizeFundraisingReport(campaign, resolveReportPeriod(campaign, null), [
      row({ month: new Date("2026-02-01"), totalCents: 5000 }),
      row({ month: new Date("2026-02-01"), kind: "loose_contribution", totalCents: 2500 }),
    ]);

    expect(summary.byMonth).toHaveLength(6);
    expect(summary.byMonth[0]?.raised.toCents()).toBe(0);
    expect(summary.byMonth[1]?.month).toEqual(new Date("2026-02-01"));
    expect(summary.byMonth[1]?.raised.toCents()).toBe(7500);
    expect(summary.byMonth[1]?.goal?.toCents()).toBe(20000);
  });

  it("inclui, sem meta, um mês fora da campanha que tenha entrada registrada", () => {
    const summary = summarizeFundraisingReport(campaign, resolveReportPeriod(campaign, null), [
      row({ month: new Date("2025-12-01"), totalCents: 4000 }),
    ]);

    expect(summary.byMonth[0]?.month).toEqual(new Date("2025-12-01"));
    expect(summary.byMonth[0]?.goal).toBeNull();
    expect(summary.byMonth[0]?.raised.toCents()).toBe(4000);
    expect(summary.byMonth).toHaveLength(7);
  });

  it("separa o total por tipo de entrada, sempre nos três tipos", () => {
    const summary = summarizeFundraisingReport(campaign, resolveReportPeriod(campaign, null), [
      row({ kind: "installment", totalCents: 10000, count: 2 }),
      row({ kind: "installment", paymentMethod: "cash", totalCents: 5000, count: 1 }),
      row({ kind: "one_off_donation", totalCents: 2000, count: 1 }),
    ]);

    expect(summary.byKind.map((item) => [item.kind, item.count, item.total.toCents()])).toEqual([
      ["installment", 3, 15000],
      ["loose_contribution", 0, 0],
      ["one_off_donation", 1, 2000],
    ]);
  });

  it("separa o total por forma de pagamento, com forma não informada só quando existir", () => {
    const withoutUnknown = summarizeFundraisingReport(
      campaign,
      resolveReportPeriod(campaign, null),
      [row({ paymentMethod: "pix", totalCents: 7000 })],
    );
    expect(
      withoutUnknown.byPaymentMethod.map((item) => [item.paymentMethod, item.total.toCents()]),
    ).toEqual([
      ["pix", 7000],
      ["cash", 0],
    ]);

    const withUnknown = summarizeFundraisingReport(campaign, resolveReportPeriod(campaign, null), [
      row({ paymentMethod: null, totalCents: 3000 }),
    ]);
    expect(withUnknown.byPaymentMethod.at(-1)?.paymentMethod).toBeNull();
    expect(withUnknown.byPaymentMethod.at(-1)?.total.toCents()).toBe(3000);
  });

  it("não deixa o que falta para a meta ficar negativo quando a meta foi passada", () => {
    const summary = summarizeFundraisingReport(campaign, resolveReportPeriod(campaign, null), [
      row({ totalCents: 150000 }),
    ]);

    expect(summary.amountLeftToGoal.toCents()).toBe(0);
    expect(summary.progressPercentage).toBe(125);
  });
});

describe("canListDetailedEntries", () => {
  it(`libera a lista de entradas até ${String(DETAILED_REPORT_ENTRY_LIMIT)} entradas`, () => {
    expect(canListDetailedEntries(DETAILED_REPORT_ENTRY_LIMIT)).toBe(true);
    expect(canListDetailedEntries(DETAILED_REPORT_ENTRY_LIMIT + 1)).toBe(false);
  });
});

describe("summarizeMoneyWithTeam", () => {
  it("lista só quem ainda está com dinheiro, do maior para o menor saldo, e soma o total", () => {
    const summary = summarizeMoneyWithTeam([
      { userLabel: "Ana Exemplo", balance: Money.fromReais(100) },
      { userLabel: "Bruno Exemplo", balance: Money.fromReais(0) },
      { userLabel: "Carla Exemplo", balance: Money.fromReais(250) },
    ]);

    expect(summary.total.toCents()).toBe(35000);
    expect(summary.holders.map((holder) => holder.userLabel)).toEqual([
      "Carla Exemplo",
      "Ana Exemplo",
    ]);
  });
});

describe("groupEntriesByMonth", () => {
  it("agrupa as entradas por mês em ordem de data, com o subtotal de cada mês", () => {
    const groups = groupEntriesByMonth([
      { date: new Date("2026-02-10"), amount: Money.fromReais(30) },
      { date: new Date("2026-01-20"), amount: Money.fromReais(10) },
      { date: new Date("2026-01-05"), amount: Money.fromReais(20) },
    ]);

    expect(groups.map((group) => group.month)).toEqual([
      new Date("2026-01-01"),
      new Date("2026-02-01"),
    ]);
    expect(groups[0]?.entries.map((entry) => entry.date)).toEqual([
      new Date("2026-01-05"),
      new Date("2026-01-20"),
    ]);
    expect(groups[0]?.total.toCents()).toBe(3000);
    expect(groups[1]?.total.toCents()).toBe(3000);
  });
});
