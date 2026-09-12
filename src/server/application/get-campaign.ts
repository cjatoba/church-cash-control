import type { Campaign } from "../domain/campaign";

export interface CampaignDetail extends Campaign {
  active: boolean;
}

export interface CampaignDetailRepository {
  findById(id: string): Promise<CampaignDetail | null>;
}

export function getCampaign(
  repository: CampaignDetailRepository,
  id: string,
): Promise<CampaignDetail | null> {
  return repository.findById(id);
}
