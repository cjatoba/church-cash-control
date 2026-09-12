import { describe, expect, it } from "vitest";
import {
  createOneOffDonation,
  type OneOffDonationRepository,
} from "@/server/application/create-one-off-donation";
import type { OneOffDonation } from "@/server/domain/one-off-donation";

function createInMemoryOneOffDonationRepository(): OneOffDonationRepository & {
  saved: OneOffDonation[];
} {
  const saved: OneOffDonation[] = [];
  return {
    saved,
    create(donation) {
      saved.push(donation);
      return Promise.resolve({ id: `one-off-donation-${String(saved.length)}` });
    },
  };
}

describe("createOneOffDonation", () => {
  const validInput = {
    campaignId: "11111111-1111-1111-1111-111111111111",
    donorName: "João Pereira",
    amount: 50,
    date: "2026-03-10",
  };

  it("persiste a doação avulsa válida e retorna o id gerado", async () => {
    const repository = createInMemoryOneOffDonationRepository();

    const result = await createOneOffDonation(repository, validInput);

    expect(result.id).toBe("one-off-donation-1");
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.donorName).toBe("João Pereira");
    expect(repository.saved[0]?.amount.toCents()).toBe(5000);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryOneOffDonationRepository();

    await expect(createOneOffDonation(repository, { ...validInput, amount: 0 })).rejects.toThrow();
    expect(repository.saved).toHaveLength(0);
  });
});
