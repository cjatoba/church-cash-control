"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface LoginState {
  error?: string;
  // Nunca inclui a senha aqui: só o celular é preservado em caso de erro,
  // por boa prática de segurança (nunca repopular campo de senha).
  values?: { phone: string };
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
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Entrar</h1>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {passwordChangedMessage ? (
        <p className="text-[15px] text-green-700 dark:text-green-400">
          Senha alterada com sucesso. Faça login com a nova senha.
        </p>
      ) : null}
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Celular
        <input
          name="phone"
          type="tel"
          placeholder="(11) 91234-5678"
          required
          defaultValue={state.values?.phone ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Senha
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
