import { updateDonorName, type Donor, type DonorState } from "../domain/donor";

export interface DonorStateReader {
  findState(id: string): Promise<DonorState | null>;
}

export interface DonorUpdateRepository {
  update(id: string, donor: Donor): Promise<void>;
}

export interface UpdateDonorDependencies {
  donorStateReader: DonorStateReader;
  donorUpdateRepository: DonorUpdateRepository;
}

export async function updateDonor(
  dependencies: UpdateDonorDependencies,
  id: string,
  input: unknown,
): Promise<void> {
  const donor = await dependencies.donorStateReader.findState(id);
  if (!donor) {
    throw new Error("Doador não encontrado");
  }

  const updated = updateDonorName(donor, input);
  await dependencies.donorUpdateRepository.update(id, updated);
}
