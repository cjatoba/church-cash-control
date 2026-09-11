"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface LoginState {
  error?: string;
}

export function LoginForm({
  action,
  redirectTo,
  passwordChangedMessage,
}: {
  action: (prevState: LoginState, formData: FormData) => Promise<LoginState>;
  redirectTo: string;
  passwordChangedMessage: boolean;
}) {
  const [state, formAction] = useActionState<LoginState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Entrar</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {passwordChangedMessage ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          Senha alterada com sucesso. Faça login com a nova senha.
        </p>
      ) : null}
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Senha
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
