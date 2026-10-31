"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { PencilIcon, TrashIcon } from "@/app/_components/icons";
import {
  ErrorMessage,
  PaymentMethodPicker,
  fieldInputClassName,
  fieldLabelClassName,
} from "../../_components/correction-form-parts";
import type { ActionErrorState } from "@/app/_lib/action-error-message";
import type { RevertPaymentState } from "../[pledgeId]/page";

export type CorrectPaymentState = ActionErrorState;

export function CorrectPaymentButton({
  installmentId,
  donorName,
  amountCents,
  amountLabel,
  monthLabel,
  currentPaidAtIso,
  currentPaymentMethod,
  currentReceivedByUserId,
  users,
  todayIso,
  correctAction,
  revertAction,
}: {
  installmentId: string;
  donorName: string;
  amountCents: number;
  amountLabel: string;
  monthLabel: string;
  currentPaidAtIso: string;
  currentPaymentMethod: string;
  currentReceivedByUserId: string;
  users: { id: string; name: string }[];
  todayIso: string;
  correctAction: (
    prevState: CorrectPaymentState,
    formData: FormData,
  ) => Promise<CorrectPaymentState>;
  revertAction: (prevState: RevertPaymentState, formData: FormData) => Promise<RevertPaymentState>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmingRevert, setConfirmingRevert] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(currentPaymentMethod);
  const [receivedByUserId, setReceivedByUserId] = useState(currentReceivedByUserId);
  const [correctState, correctFormAction, isCorrecting] = useActionState<
    CorrectPaymentState,
    FormData
  >(correctAction, {});
  const [revertState, revertFormAction] = useActionState<RevertPaymentState, FormData>(
    revertAction,
    {},
  );

  function openDialog() {
    setConfirmingRevert(false);
    setPaymentMethod(currentPaymentMethod);
    setReceivedByUserId(currentReceivedByUserId);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 text-[15px] font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <PencilIcon className="h-3.5 w-3.5" />
        Editar
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
              correctFormAction(formData);
            });
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="installmentId" value={installmentId} />
          <input type="hidden" name="donorName" value={donorName} />
          <input type="hidden" name="amountCents" value={amountCents} />
          <p className="text-lg font-semibold">Corrigir pagamento — {monthLabel}</p>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
            Valor da parcela: {amountLabel}
          </p>
          <ErrorMessage state={correctState} />
          <label className={fieldLabelClassName}>
            Data do pagamento
            <input
              type="date"
              name="paidAt"
              defaultValue={currentPaidAtIso}
              max={todayIso}
              required
              className={fieldInputClassName}
            />
          </label>
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
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
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <SubmitButton pendingLabel="Salvando…" pending={isCorrecting}>
              Salvar correção
            </SubmitButton>
          </div>
        </form>

        <div className="my-4 border-t border-zinc-200 dark:border-zinc-800" />

        {!confirmingRevert ? (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400">Deu baixa sem querer?</p>
            <button
              type="button"
              onClick={() => {
                setConfirmingRevert(true);
              }}
              className="flex items-center justify-center gap-1.5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-5 text-base font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <TrashIcon className="h-4 w-4" />
              Reverter para pendente
            </button>
          </div>
        ) : (
          <form action={revertFormAction} className="flex flex-col gap-3">
            <input type="hidden" name="installmentId" value={installmentId} />
            <input type="hidden" name="donorName" value={donorName} />
            <input type="hidden" name="amountCents" value={amountCents} />
            <p className="text-[15px] text-red-700 dark:text-red-400">
              Tem certeza? Isso vai apagar o registro de pagamento desta parcela.
            </p>
            <ErrorMessage state={revertState} />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmingRevert(false);
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <SubmitButton pendingLabel="Revertendo…">Sim, reverter para pendente</SubmitButton>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
