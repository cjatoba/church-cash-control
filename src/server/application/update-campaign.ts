import { parseCampaign, type Campaign } from "../domain/campaign";

export interface CampaignUpdateRepository {
  update(id: string, campaign: Campaign): Promise<void>;
}

export async function updateCampaign(
  repository: CampaignUpdateRepository,
  id: string,
  input: unknown,
): Promise<void> {
  const campaign = parseCampaign(input);
  await repository.update(id, campaign);
}
