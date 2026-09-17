import type { LoosePledgeSummary } from "../domain/loose-pledge";

export interface DonorLoosePledgeSummary extends LoosePledgeSummary {
  campaignId: string;
  campaignName: string;
}

export interface DonorLoosePledgeListRepository {
  findAllByDonor(donorId: string): Promise<DonorLoosePledgeSummary[]>;
}

export function listDonorLoosePledges(
  repository: DonorLoosePledgeListRepository,
  donorId: string,
): Promise<DonorLoosePledgeSummary[]> {
  return repository.findAllByDonor(donorId);
}
