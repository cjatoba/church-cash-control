"use client";

import { useState } from "react";
import type { TransferDestination } from "../_lib/transfer-destination";

const labelClassName =
  "flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300";
const inputClassName =
  "min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const destinationOptions: { value: TransferDestination; label: string; hint: string }[] = [
  { value: "volunteer", label: "Outro voluntário", hint: "" },
  { value: "external", label: "Fora da equipe", hint: "fábrica, loja…" },
];

// Botões em vez de radios: com radios, o React reiniciaria a marcação ao
// concluir a action (mesmo problema corrigido na PR #67).
export function TransferRecipientFields({
  users,
  fromUserId,
  initialDestination,
  initialToUserId,
  initialRecipientName,
}: {
  users: { id: string; name: string }[];
  fromUserId: string;
  initialDestination: TransferDestination;
  initialToUserId: string;
  initialRecipientName: string;
}) {
  const [destination, setDestination] = useState(initialDestination);
  const recipients = users.filter((user) => user.id !== fromUserId);
  const [toUserId, setToUserId] = useState(
    recipients.some((user) => user.id === initialToUserId) ? initialToUserId : "",
  );
  const toUserName = recipients.find((user) => user.id === toUserId)?.name;

  return (
    <>
      <div className={labelClassName}>
        Para quem?
        <input type="hidden" name="destination" value={destination} />
        <div className="grid grid-cols-2 gap-2">
          {destinationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={destination === option.value}
              onClick={() => {
                setDestination(option.value);
              }}
              className={
                destination === option.value
                  ? "flex min-h-12 flex-col items-center justify-center rounded-xl border-2 border-blue-700 bg-blue-50 px-2 text-base font-semibold text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100"
                  : "flex min-h-12 flex-col items-center justify-center rounded-xl border border-zinc-300 bg-white px-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              }
            >
              {option.label}
              {option.hint ? (
                <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {option.hint}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {destination === "volunteer" ? (
        <label className={labelClassName}>
          Voluntário que recebeu
          <select
            name="toUserId"
            required
            value={toUserId}
            onChange={(event) => {
              setToUserId(event.target.value);
            }}
            className={inputClassName}
          >
            <option value="" disabled>
              Escolha o voluntário
            </option>
            {recipients.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
            {toUserName
              ? `O valor passa para o "Dinheiro em mãos" de ${toUserName}.`
              : 'O valor passa para o "Dinheiro em mãos" de quem recebeu.'}
          </span>
        </label>
      ) : (
        <label className={labelClassName}>
          Para quem foi o dinheiro
          <input
            name="recipientName"
            type="text"
            placeholder="Ex.: Fábrica das cadeiras"
            required
            defaultValue={initialRecipientName}
            className={inputClassName}
          />
          <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
            O valor sai do &quot;Dinheiro em mãos&quot; (foi pago ou entregue fora da equipe).
          </span>
        </label>
      )}
    </>
  );
}
