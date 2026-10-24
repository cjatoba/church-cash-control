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
        message={
          <>
            Nova senha temporária gerada para <strong>{state.result.name}</strong>.
          </>
        }
        temporaryPassword={state.result.temporaryPassword}
        whatsappLink={state.result.whatsappLink}
        backHref="/users"
      />
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <BackLink href="/users" />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Gerar nova senha temporária
      </h1>
      <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
        Isso substitui a senha atual de {name} por uma nova senha temporária — a antiga deixa de
        funcionar, e a pessoa vai precisar definir uma senha nova no próximo login.
      </p>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Gerando…">Gerar nova senha</SubmitButton>
    </form>
  );
}
