"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { TrashIcon } from "@/app/_components/icons";

export interface CorrectionState {
  error?: string;
}

export type CorrectionAction = (
  prevState: CorrectionState,
  formData: FormData,
) => Promise<CorrectionState>;

export const fieldLabelClassName =
  "flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300";

export const fieldInputClassName =
  "min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function ErrorMessage({ message }: { message?: string }) {
  return message ? (
    <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
      {message}
    </p>
  ) : null;
}

// Botões em vez de radios: com radios, o React reiniciaria a marcação ao
// concluir a action (mesmo problema corrigido na PR #67).
export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: "pix", label: "Pix" },
    { value: "cash", label: "Dinheiro" },
  ];
  return (
    <div className={fieldLabelClassName}>
      Forma de pagamento
      <input type="hidden" name="paymentMethod" value={value} />
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => {
              onChange(option.value);
            }}
            className={
              value === option.value
                ? "min-h-12 rounded-xl border-2 border-blue-700 bg-blue-50 text-base font-semibold text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100"
                : "min-h-12 rounded-xl border border-zinc-300 bg-white text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DeleteSection({
  question,
  explanation,
  buttonLabel,
  confirmLabel,
  action,
}: {
  question: string;
  explanation: string;
  buttonLabel: string;
  confirmLabel: string;
  action: CorrectionAction;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<CorrectionState, FormData>(action, {});

  return (
    <section className="flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <span className="text-[17px] font-semibold">{question}</span>
      <span className="text-[15px] text-zinc-600 dark:text-zinc-400">{explanation}</span>
      {confirming ? (
        <form
          action={formAction}
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40"
        >
          <span className="text-[15px] font-semibold text-red-800 dark:text-red-300">
            {confirmLabel}
          </span>
          <ErrorMessage message={state.error} />
          <SubmitButton pendingLabel="Excluindo…" variant="dangerSolid">
            Sim, excluir
          </SubmitButton>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
            }}
            className={`${buttonBaseClassName} ${buttonClassNames.outline}`}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setConfirming(true);
          }}
          className={`${buttonBaseClassName} ${buttonClassNames.danger}`}
        >
          <TrashIcon className="h-5 w-5" />
          {buttonLabel}
        </button>
      )}
    </section>
  );
}
