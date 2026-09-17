import type { LoosePledgeStatus } from "../domain/loose-pledge";

export interface LoosePledgeStatusRepository {
  setStatus(id: string, status: LoosePledgeStatus): Promise<void>;
}

export function closeLoosePledge(
  repository: LoosePledgeStatusRepository,
  id: string,
): Promise<void> {
  return repository.setStatus(id, "closed");
}

export function reopenLoosePledge(
  repository: LoosePledgeStatusRepository,
  id: string,
): Promise<void> {
  return repository.setStatus(id, "open");
}
