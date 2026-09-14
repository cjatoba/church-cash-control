import { anonymizeDonor as computeAnonymization, type DonorState } from "../domain/donor";

export interface DonorStateReader {
  findState(id: string): Promise<DonorState | null>;
}

export interface DonorAnonymizeRepository {
  anonymize(id: string, donor: DonorState): Promise<void>;
}

export interface AnonymizeDonorDependencies {
  donorStateReader: DonorStateReader;
  donorAnonymizeRepository: DonorAnonymizeRepository;
}

export async function anonymizeDonor(
  dependencies: AnonymizeDonorDependencies,
  id: string,
): Promise<void> {
  const donor = await dependencies.donorStateReader.findState(id);
  if (!donor) {
    throw new Error("Doador não encontrado");
  }

  const anonymized = computeAnonymization(donor);
  await dependencies.donorAnonymizeRepository.anonymize(id, anonymized);
}
