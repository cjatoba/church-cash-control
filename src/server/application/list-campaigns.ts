import type { CampaignSummary } from "../domain/campaign";

export interface CampaignListRepository {
  findAll(): Promise<CampaignSummary[]>;
}

export function listCampaigns(repository: CampaignListRepository): Promise<CampaignSummary[]> {
  return repository.findAll();
}
