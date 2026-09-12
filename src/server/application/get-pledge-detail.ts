import type { PledgeDetail } from "../domain/pledge";

export interface PledgeDetailReader {
  findById(pledgeId: string): Promise<PledgeDetail | null>;
}

export function getPledgeDetail(
  repository: PledgeDetailReader,
  pledgeId: string,
): Promise<PledgeDetail | null> {
  return repository.findById(pledgeId);
}
