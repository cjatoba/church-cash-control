"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";

export interface ChangeOwnPasswordState {
  error?: string;
}

export function ChangeOwnPasswordForm({
  action,
}: {
  action: (
    prevState: ChangeOwnPasswordState,
    formData: FormData,
  ) => Promise<ChangeOwnPasswordState>;
}) {
  const [state, formAction] = useActionState<ChangeOwnPasswordState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950"
    >
      <BackLink href="/" />
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Trocar senha</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Senha atual
        <input
          name="currentPassword"
          type="password"
          required
          className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Nova senha
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Confirmar nova senha
        <input
          name="confirmNewPassword"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
        />
      </label>
      <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
