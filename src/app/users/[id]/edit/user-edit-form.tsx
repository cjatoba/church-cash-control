"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface UserEditState {
  error?: string;
  values?: {
    email: string;
    phone: string;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
  };
}

export function UserEditForm({
  action,
  defaultValues,
  isSelf,
}: {
  action: (prevState: UserEditState, formData: FormData) => Promise<UserEditState>;
  defaultValues: {
    email: string;
    phone: string | null;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
  };
  isSelf: boolean;
}) {
  const [state, formAction] = useActionState<UserEditState, FormData>(action, {});

  const email = state.values?.email ?? defaultValues.email;
  const phone = state.values?.phone ?? defaultValues.phone ?? "";
  const canManageUsers = state.values?.canManageUsers ?? defaultValues.canManageUsers;
  const canManageCampaigns = state.values?.canManageCampaigns ?? defaultValues.canManageCampaigns;
  const canReceiveFunds = state.values?.canReceiveFunds ?? defaultValues.canReceiveFunds;

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
      <div className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <span>O que essa pessoa pode fazer?</span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="canManageUsers"
            disabled={isSelf}
            defaultChecked={canManageUsers}
            className="disabled:opacity-50"
          />
          Gerenciar usuários
        </label>
        {isSelf ? (
          <>
            <input type="hidden" name="canManageUsers" value={canManageUsers ? "on" : ""} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Você não pode alterar a própria capacidade de gerenciar usuários.
            </span>
          </>
        ) : null}
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canManageCampaigns" defaultChecked={canManageCampaigns} />
          Gerenciar campanhas (criar/editar/arquivar campanha, categoria, tipo de carnê)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="canReceiveFunds" defaultChecked={canReceiveFunds} />
          Receber arrecadação (cadastrar doador, dar baixa em parcela, registrar doação/repasse)
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Sem marcar nenhuma opção, a pessoa só consegue visualizar as informações do app.
        </span>
      </div>
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
