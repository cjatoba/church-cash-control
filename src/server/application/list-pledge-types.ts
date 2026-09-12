import type { PledgeTypeSummary } from "../domain/pledge-type";

export interface PledgeTypeListRepository {
  findAllByCampaign(campaignId: string): Promise<PledgeTypeSummary[]>;
}

export function listPledgeTypes(
  repository: PledgeTypeListRepository,
  campaignId: string,
): Promise<PledgeTypeSummary[]> {
  return repository.findAllByCampaign(campaignId);
}
