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
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Alterar senha</h1>
      <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
        Este é seu primeiro acesso. Defina uma nova senha para continuar.
      </p>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Nova senha
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Confirmar nova senha
        <input
          name="confirmNewPassword"
          type="password"
          required
          minLength={8}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
