import { describe, expect, it } from "vitest";
import {
  createPledge,
  type CampaignPeriodReader,
  type PledgeRepository,
  type PledgeTypeReader,
} from "@/server/application/create-pledge";
import { Money } from "@/server/domain/money";
import type { Pledge } from "@/server/domain/pledge";

const campaignId = "11111111-1111-1111-1111-111111111111";
const donorId = "22222222-2222-2222-2222-222222222222";
const pledgeTypeId = "33333333-3333-3333-3333-333333333333";

function createDependencies(options?: {
  campaignEndDate?: Date | null;
  pledgeType?: { campaignId: string; installmentValue: Money } | null;
}) {
  const saved: Pledge[] = [];
  const campaignReader: CampaignPeriodReader = {
    findPeriodById() {
      const endDate =
        options?.campaignEndDate === undefined ? new Date("2026-06-30") : options.campaignEndDate;
      return Promise.resolve(endDate ? { endDate } : null);
    },
  };
  const pledgeTypeReader: PledgeTypeReader = {
    findById() {
      const pledgeType =
        options?.pledgeType === undefined
          ? { campaignId, installmentValue: Money.fromReais(100) }
          : options.pledgeType;
      return Promise.resolve(pledgeType);
    },
  };
  const pledgeRepository: PledgeRepository & { saved: Pledge[] } = {
    saved,
    create(pledge) {
      saved.push(pledge);
      return Promise.resolve({ id: `pledge-${String(saved.length)}` });
    },
  };

  return { campaignReader, pledgeTypeReader, pledgeRepository };
}

describe("createPledge", () => {
  const validInput = { campaignId, donorId, pledgeTypeId };

  it("gera as parcelas mensais até o fim da campanha e persiste o carnê", async () => {
    const dependencies = createDependencies();

    const result = await createPledge(dependencies, validInput, new Date("2026-03-15"));

    expect(result.id).toBe("pledge-1");
    expect(dependencies.pledgeRepository.saved).toHaveLength(1);
    const pledge = dependencies.pledgeRepository.saved[0];
    expect(pledge?.campaignId).toBe(campaignId);
    expect(pledge?.donorId).toBe(donorId);
    expect(pledge?.pledgeTypeId).toBe(pledgeTypeId);
    expect(pledge?.installments).toHaveLength(4);
    expect(pledge?.installments[0]?.amount.toCents()).toBe(10000);
  });

  it("rejeita quando o tipo de carnê não existe", async () => {
    const dependencies = createDependencies({ pledgeType: null });

    await expect(createPledge(dependencies, validInput, new Date("2026-03-15"))).rejects.toThrow();
    expect(dependencies.pledgeRepository.saved).toHaveLength(0);
  });

  it("rejeita quando o tipo de carnê pertence a outra campanha", async () => {
    const dependencies = createDependencies({
      pledgeType: { campaignId: "outra-campanha", installmentValue: Money.fromReais(100) },
    });

    await expect(createPledge(dependencies, validInput, new Date("2026-03-15"))).rejects.toThrow();
    expect(dependencies.pledgeRepository.saved).toHaveLength(0);
  });

  it("rejeita quando a campanha não existe", async () => {
    const dependencies = createDependencies({ campaignEndDate: null });

    await expect(createPledge(dependencies, validInput, new Date("2026-03-15"))).rejects.toThrow();
    expect(dependencies.pledgeRepository.saved).toHaveLength(0);
  });

  it("rejeita quando a campanha já terminou", async () => {
    const dependencies = createDependencies({ campaignEndDate: new Date("2026-01-31") });

    await expect(createPledge(dependencies, validInput, new Date("2026-03-15"))).rejects.toThrow();
    expect(dependencies.pledgeRepository.saved).toHaveLength(0);
  });
});
