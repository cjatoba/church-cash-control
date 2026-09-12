import { parseDonor, type Donor } from "../domain/donor";

export interface DonorRepository {
  create(donor: Donor): Promise<{ id: string }>;
}

export async function createDonor(
  repository: DonorRepository,
  input: unknown,
): Promise<{ id: string }> {
  const donor = parseDonor(input);
  return repository.create(donor);
}
