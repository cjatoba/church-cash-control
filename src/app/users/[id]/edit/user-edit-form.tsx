"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface UserEditState {
  error?: string;
  values?: { email: string; phone: string; role: string };
}

export function UserEditForm({
  action,
  defaultValues,
  isSelf,
}: {
  action: (prevState: UserEditState, formData: FormData) => Promise<UserEditState>;
  defaultValues: { email: string; phone: string | null; role: "admin" | "fundraiser" };
  isSelf: boolean;
}) {
  const [state, formAction] = useActionState<UserEditState, FormData>(action, {});

  const email = state.values?.email ?? defaultValues.email;
  const phone = state.values?.phone ?? defaultValues.phone ?? "";
  const role = state.values?.role ?? defaultValues.role;

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
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Editar usuário</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        E-mail
        <input
          name="email"
          type="email"
          required
          defaultValue={email}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Celular (opcional)
        <input
          name="phone"
          type="tel"
          placeholder="(11) 91234-5678"
          defaultValue={phone}
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Papel
        {isSelf ? (
          <>
            <select
              disabled
              defaultValue={role}
              className="rounded border border-black/[.08] bg-zinc-100 px-3 py-2 text-zinc-500 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-500"
            >
              <option value="admin">Administrador</option>
              <option value="fundraiser">Responsável pela arrecadação</option>
            </select>
            <input type="hidden" name="role" value={role} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Você não pode alterar o próprio papel.
            </span>
          </>
        ) : (
          <select
            name="role"
            required
            defaultValue={role}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          >
            <option value="admin">Administrador</option>
            <option value="fundraiser">Responsável pela arrecadação</option>
          </select>
        )}
      </label>
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
