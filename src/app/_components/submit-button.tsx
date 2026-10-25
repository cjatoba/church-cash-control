"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonBaseClassName, buttonClassNames, type ButtonVariant } from "./button-styles";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  pending: pendingOverride,
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: ButtonVariant;
  // Para formulários enviados manualmente (onSubmit), em que useFormStatus
  // não enxerga o envio em andamento.
  pending?: boolean;
}) {
  const formStatus = useFormStatus();
  const pending = pendingOverride ?? formStatus.pending;

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonBaseClassName} ${buttonClassNames[variant]}`}
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
            />
          </svg>
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
