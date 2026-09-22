"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";
import { TemporaryPasswordReveal } from "../_components/temporary-password-reveal";

function grantedCapabilityLabels(capabilities: {
  canManageUsers: boolean;
  canManageCampaigns: boolean;
  canReceiveFunds: boolean;
}): string {
  const labels: string[] = [];
  if (capabilities.canManageUsers) labels.push("gerenciar usuários");
  if (capabilities.canManageCampaigns) labels.push("gerenciar campanhas");
  if (capabilities.canReceiveFunds) labels.push("receber arrecadação");
  return labels.length > 0 ? labels.join(", ") : "só visualização";
}

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
          title="Usuário convidado"
          message={`${state.result.name} foi cadastrado(a) com acesso de ${grantedCapabilityLabels(state.result)}.`}
          temporaryPassword={state.result.temporaryPassword}
          whatsappLink={state.result.whatsappLink}
          backHref="/users"
          secondaryAction={{ onClick: onInviteAnother, label: "+ Convidar outro usuário" }}
        />
      );
    }

    return (
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Voluntário cadastrado
        </h1>
        <p className="rounded bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {state.result.name} foi cadastrado(a) como voluntário(a), sem acesso ao sistema.
        </p>
        <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.16]">
          <button
            type="button"
            onClick={onInviteAnother}
            className="text-left text-sm text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-zinc-50"
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
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950"
    >
      <BackLink href="/users" />
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Convidar usuário</h1>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Nome
        <input
          name="name"
          type="text"
          placeholder="Nome do voluntário"
          required
          defaultValue={state.values?.name ?? ""}
          className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
        />
      </label>

      <label className="flex items-center gap-2.5 rounded border border-black/[.08] px-3 py-2.5 text-sm text-zinc-700 dark:border-white/[.16] dark:text-zinc-300">
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Uma senha temporária será gerada e você vai poder enviar o convite pelo WhatsApp na
            próxima tela.
          </p>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Celular
            <input
              name="phone"
              type="tel"
              placeholder="(11) 91234-5678"
              required={hasAccess}
              defaultValue={state.values?.phone ?? ""}
              className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
            />
          </label>
          <div className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span>O que essa pessoa pode fazer?</span>
            <label className="flex items-center gap-2.5 rounded border border-black/[.08] px-3 py-2.5 dark:border-white/[.16]">
              <input
                type="checkbox"
                name="canManageUsers"
                defaultChecked={state.values?.canManageUsers ?? false}
                className="h-4 w-4"
              />
              Gerenciar usuários
            </label>
            <label className="flex items-center gap-2.5 rounded border border-black/[.08] px-3 py-2.5 dark:border-white/[.16]">
              <input
                type="checkbox"
                name="canManageCampaigns"
                defaultChecked={state.values?.canManageCampaigns ?? false}
                className="h-4 w-4"
              />
              Gerenciar campanhas (criar/editar/arquivar campanha, tipo de carnê)
            </label>
            <label className="flex items-center gap-2.5 rounded border border-black/[.08] px-3 py-2.5 dark:border-white/[.16]">
              <input
                type="checkbox"
                name="canReceiveFunds"
                defaultChecked={state.values?.canReceiveFunds ?? false}
                className="h-4 w-4"
              />
              Receber arrecadação (cadastrar doador, dar baixa em parcela, registrar doação/repasse)
            </label>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Sem marcar nenhuma opção, a pessoa só consegue visualizar as informações do app.
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
