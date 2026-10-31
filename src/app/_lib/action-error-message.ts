import { ZodError } from "zod";
import { FundsAlreadyTransferredError } from "@/server/domain/money-entry-correction";

// Erros lançados pelo próprio domínio/aplicação (ex.: "Celular já cadastrado")
// já vêm com mensagem amigável em português — mostramos direto. Erros de
// validação do Zod (formato inválido) e qualquer outra exceção inesperada
// caem no fallback, para nunca vazar detalhe técnico pro usuário.
export function toFriendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export interface ActionErrorState {
  error?: string;
  fixTransferHref?: string;
}

export function toActionErrorState(
  error: unknown,
  fallback: string,
  campaignId: string,
): ActionErrorState {
  return {
    error: toFriendlyErrorMessage(error, fallback),
    ...(error instanceof FundsAlreadyTransferredError
      ? {
          fixTransferHref: `/campaigns/${campaignId}/money-in-hand/${error.receiverUserId}?tab=transfers`,
        }
      : {}),
  };
}
