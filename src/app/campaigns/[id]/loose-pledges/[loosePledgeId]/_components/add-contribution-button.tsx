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
  users: { id: string; phone: string }[];
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
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        + Registrar contribuição
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.16] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={formAction} className="flex w-72 flex-col gap-4">
          <p className="font-semibold">Registrar contribuição</p>
          {state.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          ) : null}

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Valor (R$)
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={state.values?.amount ?? ""}
              className="rounded border border-black/[.08] px-3 py-2 text-base dark:border-white/[.16] dark:bg-black"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
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

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Recebido por
            <select
              name="receivedByUserId"
              defaultValue={receivedByUserId}
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.16] dark:bg-black"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.id === currentUserId ? `Eu mesmo (${user.phone})` : user.phone}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Data
            <input
              name="date"
              type="date"
              defaultValue={state.values?.date ?? todayIso}
              max={todayIso}
              required
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.16] dark:bg-black"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.16] dark:text-zinc-300"
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
