"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";

export function PayInstallmentButton({
  installmentId,
  monthLabel,
  amountLabel,
  todayIso,
  action,
}: {
  installmentId: string;
  monthLabel: string;
  amountLabel: string;
  todayIso: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pickingDate, setPickingDate] = useState(false);

  function openDialog() {
    setPickingDate(false);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Dar baixa
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-lg border border-black/[.08] bg-white p-6 text-sm text-black shadow-lg backdrop:bg-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50"
      >
        <form action={action} className="flex w-64 flex-col gap-4">
          <input type="hidden" name="installmentId" value={installmentId} />
          <div>
            <p className="font-semibold">Dar baixa — {monthLabel}</p>
            <p className="text-zinc-600 dark:text-zinc-400">{amountLabel}</p>
          </div>

          {!pickingDate ? (
            <div className="flex flex-col gap-2">
              <input type="hidden" name="paidAt" value={todayIso} />
              <SubmitButton pendingLabel="Registrando…">Confirmar com data de hoje</SubmitButton>
              <button
                type="button"
                onClick={() => {
                  setPickingDate(true);
                }}
                className="text-xs text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Escolher outra data
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="text-xs text-zinc-500 hover:text-black dark:text-zinc-500 dark:hover:text-zinc-50"
              >
                Cancelar
              </button>
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
                  className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="rounded-full border border-black/[.08] px-4 py-1.5 text-xs text-zinc-700 dark:border-white/[.145] dark:text-zinc-300"
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
