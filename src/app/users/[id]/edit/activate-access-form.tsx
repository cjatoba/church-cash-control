"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { TemporaryPasswordReveal } from "@/app/users/_components/temporary-password-reveal";

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

export interface ActivateAccessState {
  error?: string;
  values?: {
    phone: string;
    canManageUsers: boolean;
    canManageCampaigns: boolean;
    canReceiveFunds: boolean;
  };
  result?: {
    phone: string;
    temporaryPassword: string;
    whatsappLink: string;
  };
}

export function ActivateAccessForm({
  action,
  userName,
}: {
  action: (prevState: ActivateAccessState, formData: FormData) => Promise<ActivateAccessState>;
  userName: string;
}) {
  const [state, formAction] = useActionState<ActivateAccessState, FormData>(action, {});

  if (state.result) {
    return (
      <TemporaryPasswordReveal
        title="Acesso ativado"
        message={`${userName} agora tem acesso ao sistema, com ${grantedCapabilityLabels({
          canManageUsers: state.values?.canManageUsers ?? false,
          canManageCampaigns: state.values?.canManageCampaigns ?? false,
          canReceiveFunds: state.values?.canReceiveFunds ?? false,
        })}.`}
        temporaryPassword={state.result.temporaryPassword}
        whatsappLink={state.result.whatsappLink}
        backHref="/users"
      />
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.16] dark:bg-zinc-950"
    >
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
        Ativar acesso ao sistema
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Dê um celular a {userName} para essa pessoa poder fazer login. Uma senha temporária será
        gerada e você vai poder enviar o convite pelo WhatsApp na próxima tela.
      </p>
      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Celular
        <input
          name="phone"
          type="tel"
          placeholder="(11) 91234-5678"
          required
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
      <SubmitButton pendingLabel="Ativando…" variant="outline">
        Ativar acesso
      </SubmitButton>
    </form>
  );
}
