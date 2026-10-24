"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export function PayInstallmentButton({
  installmentId,
  donorName,
  amountCents,
  monthLabel,
  amountLabel,
  todayIso,
  users,
  currentUserId,
  action,
}: {
  installmentId: string;
  donorName: string;
  amountCents: number;
  monthLabel: string;
  amountLabel: string;
  todayIso: string;
  users: { id: string; name: string }[];
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
        className="flex items-center justify-center gap-2 min-h-12 rounded-full bg-zinc-900 px-6 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Dar baixa
      </button>
      <dialog
        ref={dialogRef}
        className="w-[min(92vw,24rem)] rounded-2xl border border-zinc-200 bg-white p-6 text-base text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="installmentId" value={installmentId} />
          <input type="hidden" name="donorName" value={donorName} />
          <input type="hidden" name="amountCents" value={amountCents} />
          <div>
            <p className="text-lg font-semibold">Dar baixa — {monthLabel}</p>
            <p className="text-zinc-600 dark:text-zinc-400">{amountLabel}</p>
          </div>

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
                  className="flex-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Escolher outra data
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="flex-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
