import type { PledgeSummary } from "../domain/pledge";

export interface DonorPledgeSummary extends PledgeSummary {
  campaignId: string;
  campaignName: string;
}

export interface DonorPledgeListRepository {
  findAllByDonor(donorId: string): Promise<DonorPledgeSummary[]>;
}

export function listDonorPledges(
  repository: DonorPledgeListRepository,
  donorId: string,
): Promise<DonorPledgeSummary[]> {
  return repository.findAllByDonor(donorId);
}
