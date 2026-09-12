import { describe, expect, it } from "vitest";
import {
  generateInstallments,
  isPledgeClosed,
  parsePledgeInput,
  selectInstallmentsOutsidePeriod,
} from "@/server/domain/pledge";
import { Money } from "@/server/domain/money";
import type { PendingInstallmentCandidate, PledgeSummary } from "@/server/domain/pledge";

describe("parsePledgeInput", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    donorId: "22222222-2222-2222-2222-222222222222",
    pledgeTypeId: "33333333-3333-3333-3333-333333333333",
  };

  it("aceita dados válidos", () => {
    const pledgeInput = parsePledgeInput(validInput);

    expect(pledgeInput).toEqual(validInput);
  });

  it("rejeita campanha vazia", () => {
    expect(() => parsePledgeInput({ ...validInput, campaignId: "" })).toThrow();
  });

  it("rejeita doador vazio", () => {
    expect(() => parsePledgeInput({ ...validInput, donorId: "" })).toThrow();
  });

  it("rejeita tipo de carnê vazio", () => {
    expect(() => parsePledgeInput({ ...validInput, pledgeTypeId: "" })).toThrow();
  });
});

describe("generateInstallments", () => {
  const installmentValue = Money.fromReais(100);

  it("gera uma parcela mensal por cada mês entre o início e o fim da campanha, incluindo os dois", () => {
    const installments = generateInstallments({
      startDate: new Date("2026-03-01"),
      campaignEndDate: new Date("2026-06-30"),
      installmentValue,
    });

    expect(installments.map((installment) => installment.dueDate.toISOString())).toEqual([
      new Date("2026-03-01").toISOString(),
      new Date("2026-04-01").toISOString(),
      new Date("2026-05-01").toISOString(),
      new Date("2026-06-01").toISOString(),
    ]);
    expect(installments.every((installment) => installment.amount.equals(installmentValue))).toBe(
      true,
    );
  });

  it("gera uma única parcela quando início e fim caem no mesmo mês", () => {
    const installments = generateInstallments({
      startDate: new Date("2026-03-15"),
      campaignEndDate: new Date("2026-03-20"),
      installmentValue,
    });

    expect(installments).toHaveLength(1);
    expect(installments[0]?.dueDate).toEqual(new Date("2026-03-01"));
  });

  it("não gera parcelas quando a campanha já terminou antes do início informado", () => {
    const installments = generateInstallments({
      startDate: new Date("2026-07-01"),
      campaignEndDate: new Date("2026-06-30"),
      installmentValue,
    });

    expect(installments).toEqual([]);
  });
});

describe("isPledgeClosed", () => {
  function pledgeSummary(overrides: Partial<PledgeSummary>): PledgeSummary {
    return {
      id: "pledge-1",
      donorName: "Maria Souza",
      pledgeTypeName: "Prata",
      installmentValue: Money.fromReais(100),
      totalInstallments: 6,
      paidInstallments: 0,
      ...overrides,
    };
  }

  it("considera fechado quando todas as parcelas foram pagas", () => {
    expect(isPledgeClosed(pledgeSummary({ totalInstallments: 6, paidInstallments: 6 }))).toBe(true);
  });

  it("considera em aberto quando ainda há parcela pendente", () => {
    expect(isPledgeClosed(pledgeSummary({ totalInstallments: 6, paidInstallments: 5 }))).toBe(
      false,
    );
  });
});

describe("selectInstallmentsOutsidePeriod", () => {
  function candidate(overrides: Partial<PendingInstallmentCandidate>): PendingInstallmentCandidate {
    return {
      id: "installment-1",
      dueDate: new Date("2026-01-01"),
      paidAt: null,
      ...overrides,
    };
  }

  it("seleciona parcelas pendentes com vencimento depois do novo fim da campanha", () => {
    const installments = [
      candidate({ id: "installment-1", dueDate: new Date("2026-01-01") }),
      candidate({ id: "installment-2", dueDate: new Date("2026-02-01") }),
    ];

    const result = selectInstallmentsOutsidePeriod(installments, new Date("2026-01-31"));

    expect(result).toEqual(["installment-2"]);
  });

  it("nunca seleciona parcela já paga, mesmo fora do novo período", () => {
    const installments = [
      candidate({
        id: "installment-1",
        dueDate: new Date("2026-02-01"),
        paidAt: new Date("2026-02-05"),
      }),
    ];

    const result = selectInstallmentsOutsidePeriod(installments, new Date("2026-01-31"));

    expect(result).toEqual([]);
  });

  it("não seleciona parcelas dentro do novo período", () => {
    const installments = [candidate({ id: "installment-1", dueDate: new Date("2026-01-01") })];

    const result = selectInstallmentsOutsidePeriod(installments, new Date("2026-01-31"));

    expect(result).toEqual([]);
  });
});
