"use client";

import { startTransition, useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { InfoIcon } from "@/app/_components/icons";
import {
  ErrorMessage,
  PaymentMethodPicker,
  fieldInputClassName,
  fieldLabelClassName,
  type CorrectionAction,
  type CorrectionState,
} from "./correction-form-parts";

export interface EntryFormValues {
  receivedByUserId: string;
  amount: string;
  date: string;
  paymentMethod: string;
  donorName?: string;
}

export function CorrectEntryForm({
  users,
  initialValues,
  todayIso,
  action,
}: {
  users: { id: string; name: string }[];
  initialValues: EntryFormValues;
  todayIso: string;
  action: CorrectionAction;
}) {
  const [state, formAction, isPending] = useActionState<CorrectionState, FormData>(action, {});
  const [receivedByUserId, setReceivedByUserId] = useState(initialValues.receivedByUserId);
  const [paymentMethod, setPaymentMethod] = useState(initialValues.paymentMethod);
  const previousReceiverName = users.find(
    (user) => user.id === initialValues.receivedByUserId,
  )?.name;

  return (
    // Envio manual (sem `action` no form) para o React não reiniciar os
    // campos num erro — a pessoa perderia o que já tinha corrigido.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => {
          formAction(formData);
        });
      }}
      className="flex flex-col gap-5"
    >
      <ErrorMessage state={state} />
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className={fieldLabelClassName}>
          Recebido por
          <select
            name="receivedByUserId"
            value={receivedByUserId}
            onChange={(event) => {
              setReceivedByUserId(event.target.value);
            }}
            className={fieldInputClassName}
          >
            {initialValues.receivedByUserId === "" ? <option value="">Escolha</option> : null}
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {previousReceiverName && receivedByUserId !== initialValues.receivedByUserId ? (
            <span className="text-sm font-normal text-amber-800 dark:text-amber-300">
              Antes: {previousReceiverName}
            </span>
          ) : null}
        </label>
        <label className={fieldLabelClassName}>
          Valor (R$)
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={initialValues.amount}
            className={fieldInputClassName}
          />
        </label>
        <label className={fieldLabelClassName}>
          Data
          <input
            name="date"
            type="date"
            required
            max={todayIso}
            defaultValue={initialValues.date}
            className={fieldInputClassName}
          />
        </label>
        <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        {initialValues.donorName !== undefined ? (
          <label className={fieldLabelClassName}>
            Nome de quem doou (opcional)
            <input
              name="donorName"
              type="text"
              placeholder="Em branco fica anônima"
              defaultValue={initialValues.donorName}
              className={fieldInputClassName}
            />
          </label>
        ) : null}
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <InfoIcon className="h-6 w-6 shrink-0" />
        <p className="text-[15px]">
          A correção fica no Registro de atividades, com o que era antes, o que ficou e quem
          corrigiu.
        </p>
      </div>
      <SubmitButton pendingLabel="Salvando…" pending={isPending}>
        Salvar correção
      </SubmitButton>
    </form>
  );
}
