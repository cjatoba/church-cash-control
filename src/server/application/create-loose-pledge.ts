import { parseLoosePledgeInput } from "../domain/loose-pledge";

export interface LoosePledgeRepository {
  create(input: { campaignId: string; donorId: string }): Promise<{ id: string }>;
}

export async function createLoosePledge(
  repository: LoosePledgeRepository,
  input: unknown,
): Promise<{ id: string }> {
  const data = parseLoosePledgeInput(input);
  return repository.create(data);
}
