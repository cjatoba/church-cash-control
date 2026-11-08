"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import type { ActionErrorState } from "@/app/_lib/action-error-message";
import { formatCurrency } from "@/app/_lib/format";
import { Money } from "@/server/domain/money";
import { ErrorMessage } from "../../_components/correction-form-parts";

export type PayInstallmentState = ActionErrorState;

const secondaryButtonClassName =
  "flex-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const fieldClassName =
  "min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

function toReaisInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function toCents(value: string): number | null {
  const reais = Number(value);
  return value.trim() === "" || !Number.isFinite(reais) ? null : Math.round(reais * 100);
}

export function PayInstallmentButton({
  installmentId,
  donorName,
  monthLabel,
  installmentAmountLabel,
  remainingCents,
  buttonLabel,
  todayIso,
  users,
  currentUserId,
  action,
}: {
  installmentId: string;
  donorName: string;
  monthLabel: string;
  installmentAmountLabel: string;
  remainingCents: number;
  buttonLabel: string;
  todayIso: string;
  users: { id: string; name: string }[];
  currentUserId: string;
  action: (prevState: PayInstallmentState, formData: FormData) => Promise<PayInstallmentState>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [receivedByUserId, setReceivedByUserId] = useState(currentUserId);
  const [amount, setAmount] = useState(toReaisInput(remainingCents));
  const [state, formAction, isPending] = useActionState<PayInstallmentState, FormData>(action, {});
  const amountCents = toCents(amount);
  const leftAfterCents =
    amountCents !== null && amountCents > 0 && amountCents < remainingCents
      ? remainingCents - amountCents
      : null;

  function openDialog() {
    setPickingDate(false);
    setReceivedByUserId(currentUserId);
    setAmount(toReaisInput(remainingCents));
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center justify-center gap-2 min-h-12 rounded-full bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {buttonLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(() => {
              formAction(formData);
            });
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="installmentId" value={installmentId} />
          <input type="hidden" name="donorName" value={donorName} />
          <div>
            <p className="text-lg font-semibold">
              {buttonLabel} — {monthLabel}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {donorName} · parcela de {installmentAmountLabel}
            </p>
          </div>
          <ErrorMessage state={state} />

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Valor recebido (R$)
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={toReaisInput(remainingCents)}
              required
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
              }}
              className={fieldClassName}
            />
            {leftAfterCents !== null ? (
              <span className="rounded-lg bg-amber-50 px-3 py-2 text-[15px] font-normal text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                Menos que o que falta: a parcela fica em aberto mostrando{" "}
                <strong>falta {formatCurrency(Money.fromCents(leftAfterCents))}</strong>.
              </span>
            ) : (
              <span className="text-[14px] font-normal text-zinc-500 dark:text-zinc-400">
                Já vem com o valor que falta. Troque só se o doador entregou menos.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Forma de pagamento
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2">
                <input type="radio" name="paymentMethod" value="pix" defaultChecked required />
                Pix
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="paymentMethod" value="cash" />
                Dinheiro
              </label>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Recebido por
            <select
              name="receivedByUserId"
              value={receivedByUserId}
              onChange={(event) => {
                setReceivedByUserId(event.target.value);
              }}
              className={fieldClassName}
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

          {!pickingDate ? (
            <div className="flex flex-col gap-3">
              <input type="hidden" name="paidAt" value={todayIso} />
              <SubmitButton pendingLabel="Registrando…" pending={isPending}>
                Confirmar com data de hoje
              </SubmitButton>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPickingDate(true);
                  }}
                  className={secondaryButtonClassName}
                >
                  Escolher outra data
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className={secondaryButtonClassName}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
                Data do pagamento
                <input
                  type="date"
                  name="paidAt"
                  defaultValue={todayIso}
                  max={todayIso}
                  required
                  autoFocus
                  className={fieldClassName}
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className={secondaryButtonClassName}
                >
                  Cancelar
                </button>
                <SubmitButton pendingLabel="Registrando…" pending={isPending}>
                  Confirmar
                </SubmitButton>
              </div>
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
