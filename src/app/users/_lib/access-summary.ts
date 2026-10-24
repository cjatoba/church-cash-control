import type { UserCapabilities } from "@/server/domain/user-capabilities";

const listFormatter = new Intl.ListFormat("pt-BR", { type: "conjunction" });

export function describeAccess(capabilities: UserCapabilities): string {
  const actions: string[] = [];
  if (capabilities.canManageUsers) actions.push("gerenciar usuários");
  if (capabilities.canManageCampaigns) actions.push("gerenciar campanhas");
  if (capabilities.canReceiveFunds) actions.push("receber arrecadação");

  return actions.length > 0 ? `Pode ${listFormatter.format(actions)}.` : "Pode só visualizar.";
}
