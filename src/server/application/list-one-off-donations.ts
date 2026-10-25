import type { OneOffDonationSummary } from "../domain/one-off-donation";

export interface OneOffDonationListRepository {
  findAllByCampaign(campaignId: string): Promise<OneOffDonationSummary[]>;
}

export async function listOneOffDonations(
  repository: OneOffDonationListRepository,
  campaignId: string,
): Promise<OneOffDonationSummary[]> {
  const donations = await repository.findAllByCampaign(campaignId);
  return [...donations].sort((a, b) => b.date.getTime() - a.date.getTime());
}
