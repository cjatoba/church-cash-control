"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface ChangePasswordState {
  error?: string;
}

export function ChangePasswordForm({
  action,
}: {
  action: (prevState: ChangePasswordState, formData: FormData) => Promise<ChangePasswordState>;
}) {
  const [state, formAction] = useActionState<ChangePasswordState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Alterar senha</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Este é seu primeiro acesso. Defina uma nova senha para continuar.
      </p>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Nova senha
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Confirmar nova senha
        <input
          name="confirmNewPassword"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
