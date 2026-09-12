import { parsePledgeType, type PledgeType } from "../domain/pledge-type";

export interface PledgeTypeRepository {
  create(pledgeType: PledgeType): Promise<{ id: string }>;
}

export async function createPledgeType(
  repository: PledgeTypeRepository,
  input: unknown,
): Promise<{ id: string }> {
  const pledgeType = parsePledgeType(input);
  return repository.create(pledgeType);
}
