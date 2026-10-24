"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface TransferState {
  error?: string;
  values?: {
    fromUserId: string;
    amount: string;
    recipientName: string;
    transferDate: string;
    description: string;
  };
}

export function TransferButton({
  balances,
  currentUserId,
  todayIso,
  action,
}: {
  balances: { userId: string; userLabel: string; balanceCents: number }[];
  currentUserId: string;
  todayIso: string;
  action: (prevState: TransferState, formData: FormData) => Promise<TransferState>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<TransferState, FormData>(action, {});
  const [fromUserId, setFromUserId] = useState(currentUserId);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const availableBalanceCents = balances.find((b) => b.userId === fromUserId)?.balanceCents ?? 0;

  function openDialog() {
    setFromUserId(currentUserId);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Repassar
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-lg font-semibold">Repassar dinheiro</p>
          {state.error ? (
            <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
              {state.error}
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Quem está repassando
            <select
              name="fromUserId"
              value={fromUserId}
              onChange={(event) => {
                setFromUserId(event.target.value);
              }}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {balances.map((balance) => (
                <option key={balance.userId} value={balance.userId}>
                  {balance.userId === currentUserId
                    ? `Eu mesmo (${balance.userLabel})`
                    : balance.userLabel}
                </option>
              ))}
            </select>
          </label>
          {fromUserId !== currentUserId ? (
            <p className="rounded-xl bg-amber-50 p-3 text-[15px] text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              ⚠ Registrando repasse em nome de outra pessoa
            </p>
          ) : null}

          <p className="text-zinc-600 dark:text-zinc-400">
            Saldo disponível: {currencyFormatter.format(availableBalanceCents / 100)}
          </p>

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Valor a repassar (R$)
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
            Destinatário
            <input
              name="recipientName"
              type="text"
              placeholder="Ex.: Responsável pela compra"
              required
              defaultValue={state.values?.recipientName ?? ""}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Data
            <input
              name="transferDate"
              type="date"
              defaultValue={state.values?.transferDate ?? todayIso}
              max={todayIso}
              required
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Descrição (opcional)
            <input
              name="description"
              type="text"
              defaultValue={state.values?.description ?? ""}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <SubmitButton pendingLabel="Registrando…">Confirmar repasse</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
