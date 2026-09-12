import type { PledgeSummary } from "../domain/pledge";

export interface PledgeListRepository {
  findAllByCampaign(campaignId: string): Promise<PledgeSummary[]>;
}

export function listPledges(
  repository: PledgeListRepository,
  campaignId: string,
): Promise<PledgeSummary[]> {
  return repository.findAllByCampaign(campaignId);
}
