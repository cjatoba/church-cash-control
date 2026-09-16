import { describe, expect, it } from "vitest";
import {
  createLoosePledge,
  type LoosePledgeRepository,
  type LoosePledgeTypeReader,
} from "@/server/application/create-loose-pledge";
import { Money } from "@/server/domain/money";
import type { LoosePledgeInput } from "@/server/domain/loose-pledge";

const campaignId = "11111111-1111-1111-1111-111111111111";
const donorId = "22222222-2222-2222-2222-222222222222";
const pledgeTypeId = "33333333-3333-3333-3333-333333333333";

function createDependencies(options?: {
  pledgeType?: { campaignId: string; installmentValue: Money | null } | null;
}) {
  const saved: LoosePledgeInput[] = [];
  const pledgeTypeReader: LoosePledgeTypeReader = {
    findById() {
      const pledgeType =
        options?.pledgeType === undefined
          ? { campaignId, installmentValue: null }
          : options.pledgeType;
      return Promise.resolve(pledgeType);
    },
  };
  const repository: LoosePledgeRepository & { saved: LoosePledgeInput[] } = {
    saved,
    create(input) {
      saved.push(input);
      return Promise.resolve({ id: "loose-pledge-1" });
    },
  };

  return { pledgeTypeReader, repository };
}

describe("createLoosePledge", () => {
  const validInput = { campaignId, donorId, pledgeTypeId };

  it("cria o carnê avulso quando o tipo de carnê não tem valor fixo", async () => {
    const dependencies = createDependencies();

    const result = await createLoosePledge(dependencies, validInput);

    expect(result.id).toBe("loose-pledge-1");
    expect(dependencies.repository.saved).toEqual([validInput]);
  });

  it("rejeita quando o tipo de carnê não existe", async () => {
    const dependencies = createDependencies({ pledgeType: null });

    await expect(createLoosePledge(dependencies, validInput)).rejects.toThrow();
    expect(dependencies.repository.saved).toHaveLength(0);
  });

  it("rejeita quando o tipo de carnê pertence a outra campanha", async () => {
    const dependencies = createDependencies({
      pledgeType: { campaignId: "outra-campanha", installmentValue: null },
    });

    await expect(createLoosePledge(dependencies, validInput)).rejects.toThrow();
    expect(dependencies.repository.saved).toHaveLength(0);
  });

  it("rejeita quando o tipo de carnê tem valor fixo (não é avulso)", async () => {
    const dependencies = createDependencies({
      pledgeType: { campaignId, installmentValue: Money.fromReais(100) },
    });

    await expect(createLoosePledge(dependencies, validInput)).rejects.toThrow();
    expect(dependencies.repository.saved).toHaveLength(0);
  });

  it("rejeita dados inválidos", async () => {
    const dependencies = createDependencies();

    await expect(createLoosePledge(dependencies, { ...validInput, donorId: "" })).rejects.toThrow();
  });
});
