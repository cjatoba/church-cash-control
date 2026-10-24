"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";
import { TemporaryPasswordReveal } from "../_components/temporary-password-reveal";
import { describeAccess } from "../_lib/access-summary";

export interface InviteUserState {
  error?: string;
  values?: {
    name: string;
    hasAccess: boolean;
    phone: string;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
  };
  result?: {
    name: string;
    phone?: string;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
    temporaryPassword?: string;
    whatsappLink?: string;
  };
}

type InviteAction = (prevState: InviteUserState, formData: FormData) => Promise<InviteUserState>;

export function InviteUserForm({ action }: { action: InviteAction }) {
  const [formKey, setFormKey] = useState(0);

  return (
    <InviteUserFormFields
      key={formKey}
      action={action}
      onInviteAnother={() => {
        setFormKey((key) => key + 1);
      }}
    />
  );
}

function InviteUserFormFields({
  action,
  onInviteAnother,
}: {
  action: InviteAction;
  onInviteAnother: () => void;
}) {
  const [state, formAction] = useActionState<InviteUserState, FormData>(action, {});
  const [hasAccess, setHasAccess] = useState(state.values?.hasAccess ?? true);

  if (state.result) {
    if (state.result.phone && state.result.temporaryPassword && state.result.whatsappLink) {
      return (
        <TemporaryPasswordReveal
          title="Convite pronto"
          message={
            <>
              <strong>{state.result.name}</strong> já pode entrar no app.{" "}
              {describeAccess(state.result)}
            </>
          }
          temporaryPassword={state.result.temporaryPassword}
          whatsappLink={state.result.whatsappLink}
          backHref="/users"
          secondaryAction={{ onClick: onInviteAnother, label: "Cadastrar outro voluntário" }}
        />
      );
    }

    return (
      <div className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Voluntário cadastrado
        </h1>
        <p className="rounded-xl bg-green-50 p-3 text-[15px] text-green-800 dark:bg-green-950/50 dark:text-green-300">
          Cadastro de <strong>{state.result.name}</strong> concluído, sem acesso ao app.
        </p>
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onInviteAnother}
            className="min-h-11 text-left text-[15px] text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            + Cadastrar outro voluntário
          </button>
          <BackLink href="/users" />
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <BackLink href="/users" />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cadastrar voluntário</h1>
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
          defaultValue={state.values?.name ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="hasAccess"
          checked={hasAccess}
          onChange={(event) => {
            setHasAccess(event.target.checked);
          }}
          className="h-4 w-4"
        />
        Este voluntário vai acessar o sistema (fazer login)?
      </label>

      {hasAccess ? (
        <>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
            Uma senha temporária será gerada e você vai poder enviar o convite pelo WhatsApp na
            próxima tela.
          </p>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Celular
            <input
              name="phone"
              type="tel"
              placeholder="(11) 91234-5678"
              required={hasAccess}
              defaultValue={state.values?.phone ?? ""}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <div className="flex flex-col gap-2 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            <span>O que essa pessoa pode fazer?</span>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700">
              <input
                type="checkbox"
                name="canManageUsers"
                defaultChecked={state.values?.canManageUsers ?? false}
                className="h-4 w-4"
              />
              Gerenciar usuários
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700">
              <input
                type="checkbox"
                name="canManageCampaigns"
                defaultChecked={state.values?.canManageCampaigns ?? false}
                className="h-4 w-4"
              />
              Gerenciar campanhas (criar/editar/arquivar campanha, tipo de carnê)
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700">
              <input
                type="checkbox"
                name="canReceiveFunds"
                defaultChecked={state.values?.canReceiveFunds ?? false}
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
          Esse voluntário fica cadastrado só para identificação (ex.: aparecer como &quot;Recebido
          por&quot;), sem conseguir entrar no app.
        </p>
      )}

      <SubmitButton pendingLabel="Salvando…">
        {hasAccess ? "Convidar" : "Cadastrar voluntário"}
      </SubmitButton>
    </form>
  );
}
