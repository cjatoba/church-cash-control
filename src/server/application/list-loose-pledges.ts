import type { LoosePledgeSummary } from "../domain/loose-pledge";

export interface LoosePledgeListRepository {
  findAllByCampaign(campaignId: string): Promise<LoosePledgeSummary[]>;
}

export function listLoosePledges(
  repository: LoosePledgeListRepository,
  campaignId: string,
): Promise<LoosePledgeSummary[]> {
  return repository.findAllByCampaign(campaignId);
}
