import { describe, expect, it } from "vitest";
import {
  createLoosePledge,
  type LoosePledgeRepository,
} from "@/server/application/create-loose-pledge";

describe("createLoosePledge", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    donorId: "22222222-2222-2222-2222-222222222222",
  };

  it("cria o carnê avulso a partir de dados válidos", async () => {
    const saved: { campaignId: string; donorId: string }[] = [];
    const repository: LoosePledgeRepository = {
      create(input) {
        saved.push(input);
        return Promise.resolve({ id: "loose-pledge-1" });
      },
    };

    const result = await createLoosePledge(repository, validInput);

    expect(result.id).toBe("loose-pledge-1");
    expect(saved).toEqual([validInput]);
  });

  it("rejeita dados inválidos", async () => {
    const repository: LoosePledgeRepository = {
      create() {
        return Promise.resolve({ id: "loose-pledge-1" });
      },
    };

    await expect(createLoosePledge(repository, { ...validInput, donorId: "" })).rejects.toThrow();
  });
});
