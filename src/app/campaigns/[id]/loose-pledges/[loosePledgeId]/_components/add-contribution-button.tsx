"use client";

import { useActionState, useRef } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export interface AddContributionState {
  error?: string;
  values?: { amount: string; date: string; paymentMethod: string; receivedByUserId: string };
}

export function AddContributionButton({
  users,
  currentUserId,
  todayIso,
  action,
}: {
  users: { id: string; name: string }[];
  currentUserId: string;
  todayIso: string;
  action: (prevState: AddContributionState, formData: FormData) => Promise<AddContributionState>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<AddContributionState, FormData>(action, {});
  const receivedByUserId = state.values?.receivedByUserId ?? currentUserId;

  function openDialog() {
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-lg font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        + Registrar entrega
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-lg font-semibold">Registrar entrega</p>
          {state.error ? (
            <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
              {state.error}
            </p>
          ) : null}

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
            Forma de pagamento
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pix"
                  defaultChecked={(state.values?.paymentMethod ?? "pix") === "pix"}
                  required
                />
                Pix
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  defaultChecked={state.values?.paymentMethod === "cash"}
                />
                Dinheiro
              </label>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Recebido por
            <select
              name="receivedByUserId"
              defaultValue={receivedByUserId}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.id === currentUserId ? `Eu mesmo (${user.name})` : user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Data
            <input
              name="date"
              type="date"
              defaultValue={state.values?.date ?? todayIso}
              max={todayIso}
              required
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
            <SubmitButton pendingLabel="Registrando…">Confirmar</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
