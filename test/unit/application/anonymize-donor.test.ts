import { describe, expect, it } from "vitest";
import {
  anonymizeDonor,
  type DonorActivityRedactor,
  type DonorAnonymizeRepository,
  type DonorStateReader,
} from "@/server/application/anonymize-donor";
import type { DonorState } from "@/server/domain/donor";

function createDependencies(donor: DonorState | null) {
  const anonymizations: { id: string; donor: DonorState }[] = [];
  const redactions: { donorId: string; replacementName: string }[] = [];

  const donorStateReader: DonorStateReader = {
    findState() {
      return Promise.resolve(donor);
    },
  };
  const donorAnonymizeRepository: DonorAnonymizeRepository = {
    anonymize(id, anonymizedDonor) {
      anonymizations.push({ id, donor: anonymizedDonor });
      return Promise.resolve();
    },
  };

  const activityRedactor: DonorActivityRedactor = {
    redactDonor(donorId, replacementName) {
      redactions.push({ donorId, replacementName });
      return Promise.resolve();
    },
  };

  return {
    donorStateReader,
    donorAnonymizeRepository,
    activityRedactor,
    anonymizations,
    redactions,
  };
}

describe("anonymizeDonor", () => {
  it("remove o nome de um doador existente e marca a data de remoção", async () => {
    const dependencies = createDependencies({ name: "Maria Souza", anonymizedAt: null });

    await anonymizeDonor(dependencies, "donor-1");

    expect(dependencies.anonymizations).toHaveLength(1);
    expect(dependencies.anonymizations[0]?.id).toBe("donor-1");
    expect(dependencies.anonymizations[0]?.donor.name).toBe("Doador removido");
    expect(dependencies.anonymizations[0]?.donor.anonymizedAt).toBeInstanceOf(Date);
  });

  it("apaga o nome do doador também do registro de atividades", async () => {
    const dependencies = createDependencies({ name: "Maria Souza", anonymizedAt: null });

    await anonymizeDonor(dependencies, "donor-1");

    expect(dependencies.redactions).toEqual([
      { donorId: "donor-1", replacementName: "Doador anonimizado" },
    ]);
  });

  it("rejeita remover um doador inexistente", async () => {
    const dependencies = createDependencies(null);

    await expect(anonymizeDonor(dependencies, "donor-1")).rejects.toThrow();
    expect(dependencies.anonymizations).toHaveLength(0);
  });

  it("rejeita remover um doador que já foi removido", async () => {
    const dependencies = createDependencies({
      name: "Doador removido",
      anonymizedAt: new Date("2026-01-01"),
    });

    await expect(anonymizeDonor(dependencies, "donor-1")).rejects.toThrow();
    expect(dependencies.anonymizations).toHaveLength(0);
    expect(dependencies.redactions).toHaveLength(0);
  });
});
