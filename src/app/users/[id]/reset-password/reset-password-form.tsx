"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";
import { TemporaryPasswordReveal } from "../../_components/temporary-password-reveal";

export interface ResetPasswordState {
  error?: string;
  result?: {
    name: string;
    temporaryPassword: string;
    whatsappLink: string;
  };
}

export function ResetPasswordForm({
  action,
  name,
}: {
  action: (prevState: ResetPasswordState, formData: FormData) => Promise<ResetPasswordState>;
  name: string;
}) {
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(action, {});

  if (state.result) {
    return (
      <TemporaryPasswordReveal
        title="Nova senha gerada"
        message={`Uma nova senha temporária foi gerada para ${state.result.name}.`}
        temporaryPassword={state.result.temporaryPassword}
        whatsappLink={state.result.whatsappLink}
        backHref="/users"
      />
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950"
    >
      <BackLink href="/users" />
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
        Gerar nova senha temporária
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Isso substitui a senha atual de {name} por uma nova senha temporária — a antiga deixa de
        funcionar, e a pessoa vai precisar definir uma senha nova no próximo login.
      </p>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <SubmitButton pendingLabel="Gerando…">Gerar nova senha</SubmitButton>
    </form>
  );
}
