import { describe, expect, it } from "vitest";
import {
  getDetailedFundraisingReport,
  getFundraisingReport,
  type DetailedReportReader,
  type FundraisingReportDependencies,
  type ReportEntry,
} from "@/server/application/get-fundraising-report";
import {
  DETAILED_REPORT_ENTRY_LIMIT,
  resolveReportPeriod,
} from "@/server/domain/fundraising-report";
import type { ReportDateRange } from "@/server/domain/fundraising-report";
import { Money } from "@/server/domain/money";

const campaign = {
  goal: Money.fromReais(600),
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-06-30"),
};

function dependencies(
  overrides: Partial<FundraisingReportDependencies> = {},
  calls: { ranges: (ReportDateRange | null)[] } = { ranges: [] },
): FundraisingReportDependencies {
  return {
    campaignReader: {
      findById: () => Promise.resolve(campaign),
    },
    reportReader: {
      sumEntries(_campaignId, range) {
        calls.ranges.push(range);
        return Promise.resolve([
          {
            month: new Date("2026-02-01"),
            kind: "installment",
            paymentMethod: "pix",
            totalCents: 20000,
            count: 2,
          },
        ]);
      },
      sumPaidOutsideTeam(_campaignId, range) {
        calls.ranges.push(range);
        return Promise.resolve(15000);
      },
    },
    moneyInHandReader: {
      getTotalsByCampaign: () =>
        Promise.resolve([
          {
            userId: "user-1",
            userLabel: "Ana Exemplo",
            receivedCents: 20000,
            transferredCents: 15000,
            entryCount: 2,
            transferCount: 1,
          },
          {
            userId: "user-2",
            userLabel: "Bruno Exemplo",
            receivedCents: 0,
            transferredCents: 0,
            entryCount: 0,
            transferCount: 0,
          },
        ]),
    },
    ...overrides,
  };
}

describe("getFundraisingReport", () => {
  it("resume a arrecadação e mostra para onde foi o dinheiro", async () => {
    const report = await getFundraisingReport(dependencies(), "campaign-1", null);

    expect(report.summary.raised.toCents()).toBe(20000);
    expect(report.summary.goal.toCents()).toBe(60000);
    expect(report.paidOutsideTeam.toCents()).toBe(15000);
    expect(report.withTeam.total.toCents()).toBe(5000);
    expect(report.withTeam.holders.map((holder) => holder.userLabel)).toEqual(["Ana Exemplo"]);
  });

  it("consulta só os meses escolhidos quando o período é parcial", async () => {
    const calls = { ranges: [] as (ReportDateRange | null)[] };

    await getFundraisingReport(dependencies({}, calls), "campaign-1", {
      firstMonth: new Date("2026-02-01"),
      lastMonth: new Date("2026-03-01"),
    });

    expect(calls.ranges).toEqual([
      { from: new Date("2026-02-01"), until: new Date("2026-04-01") },
      { from: new Date("2026-02-01"), until: new Date("2026-04-01") },
    ]);
  });

  it("rejeita campanha que não existe", async () => {
    await expect(
      getFundraisingReport(
        dependencies({ campaignReader: { findById: () => Promise.resolve(null) } }),
        "campaign-x",
        null,
      ),
    ).rejects.toThrow("Campanha não encontrada");
  });
});

function entry(date: string): ReportEntry {
  return {
    kind: "installment",
    date: new Date(date),
    donorLabel: "Maria Exemplo",
    paymentMethod: "pix",
    receivedByLabel: "Ana Exemplo",
    amount: Money.fromReais(50),
    dueDate: new Date(date),
  };
}

const detailedReader: DetailedReportReader = {
  findEntries: () => Promise.resolve([entry("2026-02-10"), entry("2026-01-05")]),
  findTransfers: () =>
    Promise.resolve([
      {
        date: new Date("2026-03-01"),
        fromLabel: "Ana Exemplo",
        toLabel: "Fornecedor Exemplo",
        toVolunteer: false,
        amount: Money.fromReais(80),
      },
    ]),
};

describe("getDetailedFundraisingReport", () => {
  const period = resolveReportPeriod(campaign, null);

  it("lista as entradas agrupadas por mês e os repasses do período", async () => {
    const report = await getDetailedFundraisingReport(
      detailedReader,
      { canReceiveFunds: true },
      "campaign-1",
      period,
      2,
    );

    if (report.status !== "ready") {
      throw new Error("esperava o relatório detalhado pronto");
    }
    expect(report.months.map((group) => group.month)).toEqual([
      new Date("2026-01-01"),
      new Date("2026-02-01"),
    ]);
    expect(report.transfers).toHaveLength(1);
  });

  it("não lista entradas quando o período passa do limite, pedindo um período menor", async () => {
    let queried = false;
    const report = await getDetailedFundraisingReport(
      {
        ...detailedReader,
        findEntries() {
          queried = true;
          return Promise.resolve([]);
        },
      },
      { canReceiveFunds: true },
      "campaign-1",
      period,
      DETAILED_REPORT_ENTRY_LIMIT + 1,
    );

    expect(report).toEqual({
      status: "too_many_entries",
      entryCount: DETAILED_REPORT_ENTRY_LIMIT + 1,
      limit: DETAILED_REPORT_ENTRY_LIMIT,
    });
    expect(queried).toBe(false);
  });

  it("só libera a versão detalhada para quem recebe arrecadação", async () => {
    await expect(
      getDetailedFundraisingReport(
        detailedReader,
        { canReceiveFunds: false },
        "campaign-1",
        period,
        2,
      ),
    ).rejects.toThrow("Só quem recebe arrecadação pode ver o relatório detalhado");
  });
});
