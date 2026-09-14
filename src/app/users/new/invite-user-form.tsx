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
    email: string;
    phone: string;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
  };
  result?: {
    email: string;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
    temporaryPassword: string;
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

  if (state.result) {
    return (
      <TemporaryPasswordReveal
        title="Usuário convidado"
        message={`${state.result.email} foi cadastrado com acesso de ${grantedCapabilityLabels(state.result)}.`}
        temporaryPassword={state.result.temporaryPassword}
        whatsappLink={state.result.whatsappLink}
        backHref="/users"
        secondaryAction={{ onClick: onInviteAnother, label: "+ Convidar outro usuário" }}
      />
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950"
    >
      <BackLink href="/users" />
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Convidar usuário</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Uma senha temporária será gerada. Se informar o celular, você também vai poder enviar o
        convite pelo WhatsApp na próxima tela.
      </p>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        E-mail
        <input
          name="email"
          type="email"
          required
          defaultValue={state.values?.email ?? ""}
          className="rounded border border-black/[.08] px-3 py-2.5 text-base dark:border-white/[.16] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Celular (opcional)
        <input
          name="phone"
          type="tel"
          placeholder="(11) 91234-5678"
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
          Gerenciar campanhas (criar/editar/arquivar campanha, categoria, tipo de carnê)
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
      <SubmitButton pendingLabel="Convidando…">Convidar</SubmitButton>
    </form>
  );
}
