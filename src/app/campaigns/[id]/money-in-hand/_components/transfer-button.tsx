"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface TransferButtonState {
  error?: string;
  success?: boolean;
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
  action: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Repassar
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={action} className="flex w-72 flex-col gap-4">
          <p className="font-semibold">Repassar dinheiro</p>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Quem está repassando
            <select
              name="fromUserId"
              value={fromUserId}
              onChange={(event) => {
                setFromUserId(event.target.value);
              }}
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
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
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              ⚠ Registrando repasse em nome de outra pessoa
            </p>
          ) : null}

          <p className="text-zinc-600 dark:text-zinc-400">
            Saldo disponível: {currencyFormatter.format(availableBalanceCents / 100)}
          </p>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Valor a repassar (R$)
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Destinatário
            <input
              name="recipientName"
              type="text"
              placeholder="Ex.: Responsável pela compra"
              required
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Data
            <input
              name="transferDate"
              type="date"
              defaultValue={todayIso}
              max={todayIso}
              required
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Descrição (opcional)
            <input
              name="description"
              type="text"
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
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
