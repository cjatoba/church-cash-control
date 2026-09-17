import type { LoosePledgeDetail } from "../domain/loose-pledge";

export interface LoosePledgeDetailReader {
  findById(loosePledgeId: string): Promise<LoosePledgeDetail | null>;
}

export function getLoosePledgeDetail(
  repository: LoosePledgeDetailReader,
  loosePledgeId: string,
): Promise<LoosePledgeDetail | null> {
  return repository.findById(loosePledgeId);
}
