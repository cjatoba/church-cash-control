import { parseCampaign, type Campaign } from "../domain/campaign";

export interface CampaignRepository {
  create(campaign: Campaign): Promise<{ id: string }>;
}

export async function createCampaign(
  repository: CampaignRepository,
  input: unknown,
): Promise<{ id: string }> {
  const campaign = parseCampaign(input);
  return repository.create(campaign);
}
