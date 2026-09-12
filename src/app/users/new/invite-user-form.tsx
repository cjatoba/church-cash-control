"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { TemporaryPasswordReveal } from "../_components/temporary-password-reveal";

const roleLabels = { admin: "Administrador", fundraiser: "Responsável pela arrecadação" } as const;

export interface InviteUserState {
  error?: string;
  result?: {
    email: string;
    role: "admin" | "fundraiser";
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
        message={`${state.result.email} foi cadastrado como ${roleLabels[state.result.role]}.`}
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
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
    >
      <Link
        href="/users"
        className="self-start text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Voltar para usuários
      </Link>
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
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Celular (opcional)
        <input
          name="phone"
          type="tel"
          placeholder="(11) 91234-5678"
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Papel
        <select
          name="role"
          required
          defaultValue=""
          className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        >
          <option value="" disabled>
            Selecione
          </option>
          <option value="admin">Administrador</option>
          <option value="fundraiser">Responsável pela arrecadação</option>
        </select>
      </label>
      <SubmitButton pendingLabel="Convidando…">Convidar</SubmitButton>
    </form>
  );
}
