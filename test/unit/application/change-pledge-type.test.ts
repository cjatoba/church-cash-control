import { describe, expect, it } from "vitest";
import {
  changePledgeType,
  getPledgeTypeChangeSource,
  listPledgeInstallmentSlots,
  type PledgeTypeChangeRepository,
} from "@/server/application/change-pledge-type";
import type { CampaignPeriodReader, PledgeTypeReader } from "@/server/application/create-pledge";
import { Money } from "@/server/domain/money";
import type { Pledge } from "@/server/domain/pledge";
import type { InstallmentSlot } from "@/server/domain/installment-repricing";

const campaignId = "campaign-1";

const pledgeTypes: Record<string, { campaignId: string; installmentValue: Money | null }> = {
  "type-50": { campaignId, installmentValue: Money.fromReais(50) },
  "type-100": { campaignId, installmentValue: Money.fromReais(100) },
  "type-loose": { campaignId, installmentValue: null },
  "type-loose-2": { campaignId, installmentValue: null },
  "type-other-campaign": { campaignId: "campaign-2", installmentValue: Money.fromReais(10) },
};

function createDependencies(source: {
  kind: "fixed" | "loose";
  pledgeTypeId: string;
  hasPayments: boolean;
}) {
  const calls: string[] = [];
  const createdFixed: Pledge[] = [];
  const repriced: InstallmentSlot[][] = [];
  const currentInstallments: InstallmentSlot[] = [
    {
      id: "i1",
      dueDate: new Date("2026-01-01"),
      amountCents: 5000,
      payment: source.hasPayments
        ? {
            paidAt: new Date("2026-01-10"),
            paidAmountCents: 10000,
            paymentMethod: "cash",
            receivedByUserId: "user-1",
            registeredByUserId: "user-1",
          }
        : null,
    },
    { id: "i2", dueDate: new Date("2026-02-01"), amountCents: 5000, payment: null },
    { id: "i3", dueDate: new Date("2026-03-01"), amountCents: 5000, payment: null },
  ];
  const repository: PledgeTypeChangeRepository = {
    findSource(kind, id) {
      return Promise.resolve(
        kind === source.kind && id === "pledge-1"
          ? { campaignId, donorId: "donor-1", ...source }
          : null,
      );
    },
    findInstallments() {
      return Promise.resolve(currentInstallments);
    },
    repriceFixed(pledgeId, pledgeTypeId, installments) {
      calls.push(`reprice ${pledgeId} ${pledgeTypeId}`);
      repriced.push(installments);
      return Promise.resolve();
    },
    relabelLoose(id, pledgeTypeId) {
      calls.push(`relabel ${id} ${pledgeTypeId}`);
      return Promise.resolve();
    },
    convertFixedToLoose(pledgeId, loosePledge) {
      calls.push(`toLoose ${pledgeId} ${loosePledge.pledgeTypeId}`);
      return Promise.resolve({ id: "loose-new" });
    },
    convertLooseToFixed(loosePledgeId, pledge) {
      calls.push(`toFixed ${loosePledgeId} ${pledge.pledgeTypeId}`);
      createdFixed.push(pledge);
      return Promise.resolve({ id: "fixed-new" });
    },
  };
  const pledgeTypeReader: PledgeTypeReader = {
    findById: (id) => Promise.resolve(pledgeTypes[id] ?? null),
  };
  const campaignReader: CampaignPeriodReader = {
    findPeriodById: () =>
      Promise.resolve({ startDate: new Date("2026-01-01"), endDate: new Date("2026-06-30") }),
  };
  return { repository, pledgeTypeReader, campaignReader, calls, createdFixed, repriced };
}

const now = new Date("2026-03-15");

describe("changePledgeType", () => {
  it("troca o tipo de um carnê de valor fixo, recontando o que já foi pago no valor novo", async () => {
    const dependencies = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-100",
      hasPayments: true,
    });

    const result = await changePledgeType(
      dependencies,
      { sourceKind: "fixed", sourceId: "pledge-1", pledgeTypeId: "type-50" },
      now,
    );

    expect(result).toEqual({ kind: "fixed", id: "pledge-1" });
    expect(dependencies.calls).toEqual(["reprice pledge-1 type-50"]);
    const installments = dependencies.repriced[0] ?? [];
    expect(installments.map((item) => item.payment?.paidAmountCents ?? "a pagar")).toEqual([
      5000,
      5000,
      "a pagar",
    ]);
    expect(installments.every((item) => item.amountCents === 5000)).toBe(true);
  });

  it("troca o tipo de um carnê avulso por outro avulso", async () => {
    const dependencies = createDependencies({
      kind: "loose",
      pledgeTypeId: "type-loose",
      hasPayments: true,
    });

    const result = await changePledgeType(
      dependencies,
      { sourceKind: "loose", sourceId: "pledge-1", pledgeTypeId: "type-loose-2" },
      now,
    );

    expect(result).toEqual({ kind: "loose", id: "pledge-1" });
    expect(dependencies.calls).toEqual(["relabel pledge-1 type-loose-2"]);
  });

  it("converte carnê de valor fixo sem pagamento em avulso", async () => {
    const dependencies = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-50",
      hasPayments: false,
    });

    const result = await changePledgeType(
      dependencies,
      { sourceKind: "fixed", sourceId: "pledge-1", pledgeTypeId: "type-loose" },
      now,
    );

    expect(result).toEqual({ kind: "loose", id: "loose-new" });
    expect(dependencies.calls).toEqual(["toLoose pledge-1 type-loose"]);
  });

  it("converte carnê avulso sem entrega em valor fixo, gerando parcelas do mês escolhido", async () => {
    const dependencies = createDependencies({
      kind: "loose",
      pledgeTypeId: "type-loose",
      hasPayments: false,
    });

    const result = await changePledgeType(
      dependencies,
      {
        sourceKind: "loose",
        sourceId: "pledge-1",
        pledgeTypeId: "type-100",
        firstInstallmentMonth: "2026-02",
        installmentCount: "3",
      },
      now,
    );

    expect(result).toEqual({ kind: "fixed", id: "fixed-new" });
    const installments = dependencies.createdFixed[0]?.installments ?? [];
    expect(installments.map((item) => item.dueDate.toISOString().slice(0, 7))).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
    ]);
    expect(installments[0]?.amount.toCents()).toBe(10000);
    expect(dependencies.createdFixed[0]?.donorId).toBe("donor-1");
  });

  it("rejeita tipo de carnê de outra campanha", async () => {
    const dependencies = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-50",
      hasPayments: false,
    });

    await expect(
      changePledgeType(
        dependencies,
        { sourceKind: "fixed", sourceId: "pledge-1", pledgeTypeId: "type-other-campaign" },
        now,
      ),
    ).rejects.toThrow("Tipo de carnê inválido para esta campanha");
    expect(dependencies.calls).toEqual([]);
  });

  it("rejeita quando o carnê não existe", async () => {
    const dependencies = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-50",
      hasPayments: false,
    });

    await expect(
      changePledgeType(
        dependencies,
        { sourceKind: "loose", sourceId: "pledge-1", pledgeTypeId: "type-100" },
        now,
      ),
    ).rejects.toThrow("Carnê não encontrado");
  });

  it("não converte carnê com pagamento entre valor fixo e avulso", async () => {
    const dependencies = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-50",
      hasPayments: true,
    });

    await expect(
      changePledgeType(
        dependencies,
        { sourceKind: "fixed", sourceId: "pledge-1", pledgeTypeId: "type-loose" },
        now,
      ),
    ).rejects.toThrow("já tem pagamento registrado");
    expect(dependencies.calls).toEqual([]);
  });
});

describe("getPledgeTypeChangeSource", () => {
  it("devolve o tipo atual e se o carnê já tem pagamento, para montar a tela de correção", async () => {
    const { repository } = createDependencies({
      kind: "loose",
      pledgeTypeId: "type-loose",
      hasPayments: true,
    });

    const source = await getPledgeTypeChangeSource(repository, "loose", "pledge-1");

    expect(source).toEqual({
      campaignId,
      donorId: "donor-1",
      kind: "loose",
      pledgeTypeId: "type-loose",
      hasPayments: true,
    });
  });
});

describe("listPledgeInstallmentSlots", () => {
  it("devolve as parcelas do carnê, com o que já foi pago, para prever a troca de valor", async () => {
    const { repository } = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-100",
      hasPayments: true,
    });

    const slots = await listPledgeInstallmentSlots(repository, "pledge-1");

    expect(slots.map((slot) => slot.payment?.paidAmountCents ?? null)).toEqual([10000, null, null]);
  });
});
