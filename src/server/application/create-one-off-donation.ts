import { parseOneOffDonation, type OneOffDonation } from "../domain/one-off-donation";

export interface OneOffDonationRepository {
  create(donation: OneOffDonation): Promise<{ id: string }>;
}

export async function createOneOffDonation(
  repository: OneOffDonationRepository,
  input: unknown,
): Promise<{ id: string }> {
  const donation = parseOneOffDonation(input);
  return repository.create(donation);
}
