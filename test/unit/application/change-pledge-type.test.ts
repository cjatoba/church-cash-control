import { describe, expect, it } from "vitest";
import {
  changePledgeType,
  getPledgeTypeChangeSource,
  type PledgeTypeChangeRepository,
} from "@/server/application/change-pledge-type";
import type { CampaignPeriodReader, PledgeTypeReader } from "@/server/application/create-pledge";
import { Money } from "@/server/domain/money";
import type { Pledge } from "@/server/domain/pledge";

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
  const repository: PledgeTypeChangeRepository = {
    findSource(kind, id) {
      return Promise.resolve(
        kind === source.kind && id === "pledge-1"
          ? { campaignId, donorId: "donor-1", ...source }
          : null,
      );
    },
    repriceFixed(pledgeId, pledgeTypeId, installmentValue) {
      calls.push(`reprice ${pledgeId} ${pledgeTypeId} ${String(installmentValue.toCents())}`);
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
  return { repository, pledgeTypeReader, campaignReader, calls, createdFixed };
}

const now = new Date("2026-03-15");

describe("changePledgeType", () => {
  it("troca o tipo de um carnê de valor fixo, com o novo valor para as parcelas", async () => {
    const dependencies = createDependencies({
      kind: "fixed",
      pledgeTypeId: "type-50",
      hasPayments: true,
    });

    const result = await changePledgeType(
      dependencies,
      { sourceKind: "fixed", sourceId: "pledge-1", pledgeTypeId: "type-100" },
      now,
    );

    expect(result).toEqual({ kind: "fixed", id: "pledge-1" });
    expect(dependencies.calls).toEqual(["reprice pledge-1 type-100 10000"]);
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
