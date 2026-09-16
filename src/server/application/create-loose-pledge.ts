import { parseLoosePledgeInput } from "../domain/loose-pledge";
import type { Money } from "../domain/money";

export interface LoosePledgeTypeReader {
  findById(
    pledgeTypeId: string,
  ): Promise<{ campaignId: string; installmentValue: Money | null } | null>;
}

export interface LoosePledgeRepository {
  create(input: { campaignId: string; donorId: string; pledgeTypeId: string }): Promise<{
    id: string;
  }>;
}

export interface CreateLoosePledgeDependencies {
  pledgeTypeReader: LoosePledgeTypeReader;
  repository: LoosePledgeRepository;
}

export async function createLoosePledge(
  dependencies: CreateLoosePledgeDependencies,
  input: unknown,
): Promise<{ id: string }> {
  const data = parseLoosePledgeInput(input);

  const pledgeType = await dependencies.pledgeTypeReader.findById(data.pledgeTypeId);
  if (pledgeType?.campaignId !== data.campaignId) {
    throw new Error("Tipo de carnê inválido para esta campanha");
  }
  if (pledgeType.installmentValue !== null) {
    throw new Error("Este tipo de carnê tem valor fixo — use o cadastro de carnê com valor fixo");
  }

  return dependencies.repository.create(data);
}
