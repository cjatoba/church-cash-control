import { describe, expect, it } from "vitest";
import {
  addLoosePledgeContribution,
  type LoosePledgeContributionRepository,
  type LoosePledgeStatusReader,
} from "@/server/application/add-loose-pledge-contribution";
import type { LoosePledgeContribution, LoosePledgeStatus } from "@/server/domain/loose-pledge";

const validInput = {
  amount: 50,
  date: "2026-03-10",
  paymentMethod: "pix",
  receivedByUserId: "user-1",
};

function createDependencies(status: LoosePledgeStatus | null) {
  const saved: { loosePledgeId: string; contribution: LoosePledgeContribution }[] = [];
  const statusReader: LoosePledgeStatusReader = {
    findStatusById() {
      return Promise.resolve(status ? { status } : null);
    },
  };
  const repository: LoosePledgeContributionRepository = {
    create(loosePledgeId, contribution) {
      saved.push({ loosePledgeId, contribution });
      return Promise.resolve({ id: `contribution-${String(saved.length)}` });
    },
  };

  return { statusReader, repository, saved };
}

describe("addLoosePledgeContribution", () => {
  it("registra a contribuição quando o carnê avulso está aberto", async () => {
    const dependencies = createDependencies("open");

    const result = await addLoosePledgeContribution(
      dependencies,
      "loose-pledge-1",
      validInput,
      "user-1",
    );

    expect(result.id).toBe("contribution-1");
    expect(dependencies.saved).toHaveLength(1);
    expect(dependencies.saved[0]?.loosePledgeId).toBe("loose-pledge-1");
    expect(dependencies.saved[0]?.contribution.amount.toCents()).toBe(5000);
  });

  it("rejeita quando o carnê avulso não existe", async () => {
    const dependencies = createDependencies(null);

    await expect(
      addLoosePledgeContribution(dependencies, "loose-pledge-1", validInput, "user-1"),
    ).rejects.toThrow("Carnê avulso não encontrado");
    expect(dependencies.saved).toHaveLength(0);
  });

  it("rejeita quando o carnê avulso está encerrado", async () => {
    const dependencies = createDependencies("closed");

    await expect(
      addLoosePledgeContribution(dependencies, "loose-pledge-1", validInput, "user-1"),
    ).rejects.toThrow("Carnê avulso encerrado");
    expect(dependencies.saved).toHaveLength(0);
  });
});
