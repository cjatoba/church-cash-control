"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { TemporaryPasswordReveal } from "../../_components/temporary-password-reveal";

export interface ResetPasswordState {
  error?: string;
  result?: {
    email: string;
    temporaryPassword: string;
    whatsappLink?: string;
  };
}

export function ResetPasswordForm({
  action,
  email,
}: {
  action: (prevState: ResetPasswordState, formData: FormData) => Promise<ResetPasswordState>;
  email: string;
}) {
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(action, {});

  if (state.result) {
    return (
      <TemporaryPasswordReveal
        title="Nova senha gerada"
        message={`Uma nova senha temporária foi gerada para ${state.result.email}.`}
        temporaryPassword={state.result.temporaryPassword}
        whatsappLink={state.result.whatsappLink}
        backHref="/users"
      />
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <Link
        href="/users"
        className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Voltar para usuários
      </Link>
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
        Gerar nova senha temporária
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {email} ainda não trocou a senha. Isso substitui a senha temporária anterior — a antiga
        deixa de funcionar.
      </p>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <SubmitButton pendingLabel="Gerando…">Gerar nova senha</SubmitButton>
    </form>
  );
}
