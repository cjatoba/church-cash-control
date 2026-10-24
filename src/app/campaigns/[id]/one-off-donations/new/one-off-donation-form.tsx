"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";

export interface CreateOneOffDonationState {
  error?: string;
  success?: string;
  values?: {
    donorName: string;
    amount: string;
    date: string;
    paymentMethod: string;
    receivedByUserId: string;
  };
}

function ReceivedBySelect({
  users,
  currentUserId,
  defaultReceivedByUserId,
}: {
  users: { id: string; name: string }[];
  currentUserId: string;
  defaultReceivedByUserId: string;
}) {
  const [receivedByUserId, setReceivedByUserId] = useState(defaultReceivedByUserId);

  return (
    <>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Recebido por
        <select
          name="receivedByUserId"
          value={receivedByUserId}
          onChange={(event) => {
            setReceivedByUserId(event.target.value);
          }}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.id === currentUserId ? `Eu mesmo (${user.name})` : user.name}
            </option>
          ))}
        </select>
      </label>
      {receivedByUserId !== currentUserId ? (
        <p className="rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          ⚠ Registrando em nome de outra pessoa
        </p>
      ) : null}
    </>
  );
}

export function OneOffDonationForm({
  users,
  currentUserId,
  backHref,
  action,
}: {
  users: { id: string; name: string }[];
  backHref: string;
  currentUserId: string;
  action: (
    prevState: CreateOneOffDonationState,
    formData: FormData,
  ) => Promise<CreateOneOffDonationState>;
}) {
  const [state, formAction] = useActionState<CreateOneOffDonationState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <BackLink href={backHref} />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Doação sem carnê</h1>
      <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
        Para quem contribui sem ter um carnê.
      </p>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-green-50 p-3 text-[15px] text-green-800 dark:bg-green-950/50 dark:text-green-300">
          Doação registrada com sucesso. Preencha de novo para registrar outra, ou toque em Voltar.
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Nome do doador
        <input
          name="donorName"
          type="text"
          placeholder="Nome (ou deixe em branco p/ anônimo)"
          defaultValue={state.values?.donorName ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Valor (R$)
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={state.values?.amount ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Data
        <input
          name="date"
          type="date"
          required
          defaultValue={state.values?.date ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Forma de pagamento
        <div className="flex gap-4 pt-1">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-zinc-300 px-4 text-base dark:border-zinc-700">
            <input
              type="radio"
              name="paymentMethod"
              value="pix"
              defaultChecked={(state.values?.paymentMethod ?? "pix") === "pix"}
              required
              className="h-4 w-4"
            />
            Pix
          </label>
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-zinc-300 px-4 text-base dark:border-zinc-700">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              defaultChecked={state.values?.paymentMethod === "cash"}
              className="h-4 w-4"
            />
            Dinheiro
          </label>
        </div>
      </label>
      <ReceivedBySelect
        key={state.success ?? "initial"}
        users={users}
        currentUserId={currentUserId}
        defaultReceivedByUserId={state.values?.receivedByUserId ?? currentUserId}
      />
      <SubmitButton pendingLabel="Registrando…">Registrar doação</SubmitButton>
    </form>
  );
}
