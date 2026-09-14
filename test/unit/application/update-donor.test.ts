import { describe, expect, it } from "vitest";
import {
  updateDonor,
  type DonorStateReader,
  type DonorUpdateRepository,
} from "@/server/application/update-donor";
import type { Donor, DonorState } from "@/server/domain/donor";

function createDependencies(donor: DonorState | null) {
  const updates: { id: string; donor: Donor }[] = [];

  const donorStateReader: DonorStateReader = {
    findState() {
      return Promise.resolve(donor);
    },
  };
  const donorUpdateRepository: DonorUpdateRepository = {
    update(id, updatedDonor) {
      updates.push({ id, donor: updatedDonor });
      return Promise.resolve();
    },
  };

  return { donorStateReader, donorUpdateRepository, updates };
}

describe("updateDonor", () => {
  it("corrige o nome de um doador existente", async () => {
    const dependencies = createDependencies({ name: "Maria Souza", anonymizedAt: null });

    await updateDonor(dependencies, "donor-1", { name: "Maria S. Souza" });

    expect(dependencies.updates).toEqual([{ id: "donor-1", donor: { name: "Maria S. Souza" } }]);
  });

  it("rejeita corrigir um doador inexistente", async () => {
    const dependencies = createDependencies(null);

    await expect(updateDonor(dependencies, "donor-1", { name: "Maria Souza" })).rejects.toThrow();
    expect(dependencies.updates).toHaveLength(0);
  });

  it("rejeita corrigir um doador já removido", async () => {
    const dependencies = createDependencies({
      name: "Doador removido",
      anonymizedAt: new Date("2026-01-01"),
    });

    await expect(updateDonor(dependencies, "donor-1", { name: "Maria Souza" })).rejects.toThrow();
    expect(dependencies.updates).toHaveLength(0);
  });

  it("rejeita entrada inválida sem persistir nada", async () => {
    const dependencies = createDependencies({ name: "Maria Souza", anonymizedAt: null });

    await expect(updateDonor(dependencies, "donor-1", { name: "" })).rejects.toThrow();
    expect(dependencies.updates).toHaveLength(0);
  });
});
