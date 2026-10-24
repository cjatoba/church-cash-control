"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";

export interface UserEditState {
  error?: string;
  values?: {
    name: string;
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
  backHref,
}: {
  action: (prevState: UserEditState, formData: FormData) => Promise<UserEditState>;
  defaultValues: {
    name: string;
    phone: string | null;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
  };
  isSelf: boolean;
  backHref: string;
}) {
  const [state, formAction] = useActionState<UserEditState, FormData>(action, {});

  const name = state.values?.name ?? defaultValues.name;
  const hasAccess = defaultValues.phone !== null;
  const phone = state.values?.phone ?? defaultValues.phone ?? "";
  const canManageUsers = state.values?.canManageUsers ?? defaultValues.canManageUsers;
  const canManageCampaigns = state.values?.canManageCampaigns ?? defaultValues.canManageCampaigns;
  const canReceiveFunds = state.values?.canReceiveFunds ?? defaultValues.canReceiveFunds;

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <BackLink href={backHref} />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Editar voluntário</h1>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Nome
        <input
          name="name"
          type="text"
          placeholder="Nome do voluntário"
          required
          defaultValue={name}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      {hasAccess ? (
        <>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Celular
            <input
              name="phone"
              type="tel"
              placeholder="(11) 91234-5678"
              required
              defaultValue={phone}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <div className="flex flex-col gap-2 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            <span>O que essa pessoa pode fazer?</span>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700">
              <input
                type="checkbox"
                name="canManageUsers"
                disabled={isSelf}
                defaultChecked={canManageUsers}
                className="h-4 w-4 disabled:opacity-50"
              />
              Gerenciar usuários
            </label>
            {isSelf ? (
              <>
                <input type="hidden" name="canManageUsers" value={canManageUsers ? "on" : ""} />
                <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
                  Você não pode alterar a própria capacidade de gerenciar usuários.
                </span>
              </>
            ) : null}
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700">
              <input
                type="checkbox"
                name="canManageCampaigns"
                defaultChecked={canManageCampaigns}
                className="h-4 w-4"
              />
              Gerenciar campanhas (criar/editar/arquivar campanha, tipo de carnê)
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700">
              <input
                type="checkbox"
                name="canReceiveFunds"
                defaultChecked={canReceiveFunds}
                className="h-4 w-4"
              />
              Receber arrecadação (cadastrar doador, dar baixa em parcela, registrar doação/repasse)
            </label>
            <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
              Sem marcar nenhuma opção, a pessoa só consegue visualizar as informações do app.
            </span>
          </div>
        </>
      ) : (
        <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
          Esse voluntário não tem acesso ao sistema.
        </p>
      )}
      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
    </form>
  );
}
