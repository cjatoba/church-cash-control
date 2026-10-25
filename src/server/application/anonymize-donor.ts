import {
  ANONYMIZED_DONOR_NAME,
  anonymizeDonor as computeAnonymization,
  type DonorState,
} from "../domain/donor";

export interface DonorStateReader {
  findState(id: string): Promise<DonorState | null>;
}

export interface DonorAnonymizeRepository {
  anonymize(id: string, donor: DonorState): Promise<void>;
}

// O registro de atividades guarda o nome como retrato do momento; sem isso,
// o nome continuaria lá mesmo depois do pedido de exclusão (LGPD).
export interface DonorActivityRedactor {
  redactDonor(donorId: string, replacementName: string): Promise<void>;
}

export interface AnonymizeDonorDependencies {
  donorStateReader: DonorStateReader;
  donorAnonymizeRepository: DonorAnonymizeRepository;
  activityRedactor: DonorActivityRedactor;
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
  await dependencies.activityRedactor.redactDonor(id, ANONYMIZED_DONOR_NAME);
}
