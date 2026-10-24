import type { UserCapabilities } from "./user-capabilities";

export type CapabilityRequirement = keyof UserCapabilities;

export interface GuideItem {
  requires?: CapabilityRequirement;
}

// Tutorial e Ajuda só ensinam o que a pessoa consegue fazer: explicar uma
// tela que ela não tem permissão de abrir só confundiria.
export function selectAvailableGuideItems<T extends GuideItem>(
  items: readonly T[],
  capabilities: UserCapabilities,
): T[] {
  return items.filter((item) => item.requires === undefined || capabilities[item.requires]);
}
