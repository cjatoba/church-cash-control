import {
  addLoosePledgeContribution as buildContribution,
  type LoosePledgeContribution,
  type LoosePledgeStatus,
} from "../domain/loose-pledge";

export interface LoosePledgeStatusReader {
  findStatusById(loosePledgeId: string): Promise<{ status: LoosePledgeStatus } | null>;
}

export interface LoosePledgeContributionRepository {
  create(loosePledgeId: string, contribution: LoosePledgeContribution): Promise<{ id: string }>;
}

export interface AddLoosePledgeContributionDependencies {
  statusReader: LoosePledgeStatusReader;
  repository: LoosePledgeContributionRepository;
}

export async function addLoosePledgeContribution(
  dependencies: AddLoosePledgeContributionDependencies,
  loosePledgeId: string,
  input: unknown,
  registeredByUserId: string,
): Promise<{ id: string }> {
  const pledge = await dependencies.statusReader.findStatusById(loosePledgeId);
  if (!pledge) {
    throw new Error("Carnê avulso não encontrado");
  }

  const contribution = buildContribution(pledge, input, registeredByUserId);
  return dependencies.repository.create(loosePledgeId, contribution);
}
