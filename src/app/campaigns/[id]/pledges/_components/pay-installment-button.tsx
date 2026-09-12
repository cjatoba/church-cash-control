"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export function PayInstallmentButton({
  installmentId,
  monthLabel,
  amountLabel,
  todayIso,
  users,
  currentUserId,
  action,
}: {
  installmentId: string;
  monthLabel: string;
  amountLabel: string;
  todayIso: string;
  users: { id: string; email: string }[];
  currentUserId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [receivedByUserId, setReceivedByUserId] = useState(currentUserId);

  function openDialog() {
    setPickingDate(false);
    setReceivedByUserId(currentUserId);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Dar baixa
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={action} className="flex w-72 flex-col gap-4">
          <input type="hidden" name="installmentId" value={installmentId} />
          <div>
            <p className="font-semibold">Dar baixa — {monthLabel}</p>
            <p className="text-zinc-600 dark:text-zinc-400">{amountLabel}</p>
          </div>

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
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

          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Recebido por
            <select
              name="receivedByUserId"
              value={receivedByUserId}
              onChange={(event) => {
                setReceivedByUserId(event.target.value);
              }}
              className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.id === currentUserId ? `Eu mesmo (${user.email})` : user.email}
                </option>
              ))}
            </select>
          </label>
          {receivedByUserId !== currentUserId ? (
            <p className="rounded bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              ⚠ Registrando em nome de outra pessoa
            </p>
          ) : null}

          {!pickingDate ? (
            <div className="flex flex-col gap-3">
              <input type="hidden" name="paidAt" value={todayIso} />
              <SubmitButton pendingLabel="Registrando…">Confirmar com data de hoje</SubmitButton>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPickingDate(true);
                  }}
                  className="flex-1 rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
                >
                  Escolher outra data
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="flex-1 rounded-full border border-black/[.08] px-4 py-2.5 text-sm text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                Data do pagamento
                <input
                  type="date"
                  name="paidAt"
                  defaultValue={todayIso}
                  max={todayIso}
                  required
                  autoFocus
                  className="rounded border border-black/[.08] px-3 py-2.5 dark:border-white/[.145] dark:bg-black"
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
                <SubmitButton pendingLabel="Registrando…">Confirmar</SubmitButton>
              </div>
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
