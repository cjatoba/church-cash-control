import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";

describe("toFriendlyErrorMessage", () => {
  it("usa a mensagem de um erro lançado pelo domínio/aplicação", () => {
    const message = toFriendlyErrorMessage(new Error("E-mail já cadastrado"), "fallback");

    expect(message).toBe("E-mail já cadastrado");
  });

  it("usa a mensagem de fallback para erro de validação do Zod", () => {
    const zodError = z.email().safeParse("não-é-email").error;

    const message = toFriendlyErrorMessage(zodError, "Confira os dados informados.");

    expect(message).toBe("Confira os dados informados.");
  });

  it("usa a mensagem de fallback para valores que não são Error", () => {
    const message = toFriendlyErrorMessage("algo inesperado", "fallback");

    expect(message).toBe("fallback");
  });
});
