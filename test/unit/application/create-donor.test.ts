import { describe, expect, it } from "vitest";
import { createDonor, type DonorRepository } from "@/server/application/create-donor";
import type { Donor } from "@/server/domain/donor";

function createInMemoryDonorRepository(): DonorRepository & { saved: Donor[] } {
  const saved: Donor[] = [];
  return {
    saved,
    create(donor) {
      saved.push(donor);
      return Promise.resolve({ id: `donor-${String(saved.length)}` });
    },
  };
}

describe("createDonor", () => {
  it("persiste o doador válido e retorna o id gerado", async () => {
    const repository = createInMemoryDonorRepository();

    const result = await createDonor(repository, { name: "Maria Souza" });

    expect(result.id).toBe("donor-1");
    expect(repository.saved).toEqual([{ name: "Maria Souza" }]);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const repository = createInMemoryDonorRepository();

    await expect(createDonor(repository, { name: "" })).rejects.toThrow();
    expect(repository.saved).toHaveLength(0);
  });
});
