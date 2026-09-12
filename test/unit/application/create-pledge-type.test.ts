import { describe, expect, it } from "vitest";
import {
  createPledgeType,
  type PledgeTypeRepository,
} from "@/server/application/create-pledge-type";
import type { PledgeType } from "@/server/domain/pledge-type";

function createInMemoryPledgeTypeRepository(): PledgeTypeRepository & { saved: PledgeType[] } {
  const saved: PledgeType[] = [];
  return {
    saved,
    create(pledgeType) {
      saved.push(pledgeType);
      return Promise.resolve({ id: `pledge-type-${String(saved.length)}` });
    },
  };
}

describe("createPledgeType", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    name: "Bronze",
    installmentValue: 50,
  };

  it("persiste o tipo de carnê válido e retorna o id gerado", async () => {
    const repository = createInMemoryPledgeTypeRepository();

    const result = await createPledgeType(repository, validInput);

    expect(result.id).toBe("pledge-type-1");
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.name).toBe("Bronze");
    expect(repository.saved[0]?.installmentValue.toCents()).toBe(5000);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryPledgeTypeRepository();

    await expect(createPledgeType(repository, { ...validInput, name: "" })).rejects.toThrow();
    expect(repository.saved).toHaveLength(0);
  });
});
