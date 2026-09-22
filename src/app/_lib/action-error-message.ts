import { ZodError } from "zod";

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
