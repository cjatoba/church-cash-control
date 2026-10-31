"use client";

import { startTransition, useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import {
  ErrorMessage,
  fieldInputClassName,
  fieldLabelClassName,
  type CorrectionAction,
  type CorrectionState,
} from "./correction-form-parts";
import { TransferRecipientFields } from "./transfer-recipient-fields";
import type { TransferDestination } from "../_lib/transfer-destination";

export interface TransferFormValues {
  fromUserId: string;
  destination: TransferDestination;
  toUserId: string;
  recipientName: string;
  amount: string;
  transferDate: string;
  description: string;
}

export function CorrectTransferForm({
  users,
  initialValues,
  todayIso,
  action,
}: {
  users: { id: string; name: string }[];
  initialValues: TransferFormValues;
  todayIso: string;
  action: CorrectionAction;
}) {
  const [state, formAction, isPending] = useActionState<CorrectionState, FormData>(action, {});
  const [fromUserId, setFromUserId] = useState(initialValues.fromUserId);
  const previousName = users.find((user) => user.id === initialValues.fromUserId)?.name;

  return (
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
          Quem repassou
          <select
            name="fromUserId"
            value={fromUserId}
            onChange={(event) => {
              setFromUserId(event.target.value);
            }}
            className={fieldInputClassName}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {previousName && fromUserId !== initialValues.fromUserId ? (
            <span className="text-sm font-normal text-amber-800 dark:text-amber-300">
              Antes: {previousName}
            </span>
          ) : null}
        </label>
        <TransferRecipientFields
          users={users}
          fromUserId={fromUserId}
          initialDestination={initialValues.destination}
          initialToUserId={initialValues.toUserId}
          initialRecipientName={initialValues.recipientName}
        />
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
            name="transferDate"
            type="date"
            required
            max={todayIso}
            defaultValue={initialValues.transferDate}
            className={fieldInputClassName}
          />
        </label>
        <label className={fieldLabelClassName}>
          Descrição (opcional)
          <input
            name="description"
            type="text"
            defaultValue={initialValues.description}
            className={fieldInputClassName}
          />
        </label>
      </div>
      <SubmitButton pendingLabel="Salvando…" pending={isPending}>
        Salvar correção
      </SubmitButton>
    </form>
  );
}
