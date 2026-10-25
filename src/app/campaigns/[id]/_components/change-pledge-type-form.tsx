"use client";

import { startTransition, useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { InfoIcon } from "@/app/_components/icons";
import type { FirstMonthOption } from "../_lib/first-month-options";

export interface ChangePledgeTypeState {
  error?: string;
}

export interface PledgeTypeOption {
  id: string;
  name: string;
  installmentValueLabel: string | null;
}

type SourceSummary =
  | {
      kind: "fixed";
      installmentValueLabel: string;
      pendingCount: number;
      paidCount: number;
    }
  | { kind: "loose"; contributionCount: number };

function describeChange(source: SourceSummary, target: PledgeTypeOption): string {
  if (source.kind === "fixed") {
    if (target.installmentValueLabel === null) {
      return `As ${String(source.pendingCount)} parcelas deste carnê serão apagadas e ele vira um carnê avulso, para registrar entregas de valor livre.`;
    }
    if (source.pendingCount === 0) {
      return "Todas as parcelas já foram pagas e continuam com o valor que foi pago. Só o tipo do carnê muda.";
    }
    const paidNote =
      source.paidCount > 0
        ? ` As ${String(source.paidCount)} já pagas continuam com o valor que foi pago.`
        : "";
    return `As ${String(source.pendingCount)} parcelas a pagar passam de ${source.installmentValueLabel} para ${target.installmentValueLabel}.${paidNote}`;
  }
  if (target.installmentValueLabel === null) {
    return "Só o tipo do carnê muda. As entregas já registradas continuam como estão.";
  }
  return `O carnê avulso vira um carnê de valor fixo, com parcelas de ${target.installmentValueLabel} a partir do mês escolhido acima.`;
}

export function ChangePledgeTypeForm({
  source,
  hasPayments,
  options,
  firstMonthOptions,
  action,
}: {
  source: SourceSummary;
  hasPayments: boolean;
  options: PledgeTypeOption[];
  firstMonthOptions: FirstMonthOption[];
  action: (prevState: ChangePledgeTypeState, formData: FormData) => Promise<ChangePledgeTypeState>;
}) {
  const [state, formAction, isPending] = useActionState<ChangePledgeTypeState, FormData>(
    action,
    {},
  );
  const isAvailable = (option: PledgeTypeOption) =>
    !hasPayments || (option.installmentValueLabel === null) === (source.kind === "loose");
  const [selectedId, setSelectedId] = useState(options.find(isAvailable)?.id ?? "");
  const [firstInstallmentMonth, setFirstInstallmentMonth] = useState(
    firstMonthOptions.at(-1)?.value ?? "",
  );
  const [installmentCountMode, setInstallmentCountMode] = useState("full");

  const selected = options.find((option) => option.id === selectedId);
  const isConversion =
    selected !== undefined &&
    (selected.installmentValueLabel === null) !== (source.kind === "loose");
  const needsInstallments = source.kind === "loose" && selected?.installmentValueLabel != null;
  const maxInstallmentCount =
    firstMonthOptions.find((option) => option.value === firstInstallmentMonth)
      ?.maxInstallmentCount ?? 0;
  const unavailableHint =
    source.kind === "fixed"
      ? "Indisponível: este carnê já tem parcela paga"
      : "Indisponível: este carnê já tem entrega registrada";

  if (options.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-[15px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        Esta campanha não tem outro tipo de carnê. Cadastre um em &quot;Tipos de carnê&quot;, na
        tela da campanha.
      </p>
    );
  }

  return (
    // Envio manual (sem `action` no form): com `action`, o React reinicia o
    // formulário ao concluir e os radios/select voltariam à marcação inicial
    // num erro, divergindo do estado (mesmo problema corrigido na PR #67).
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => {
          formAction(formData);
        });
      }}
      className="flex flex-col gap-5"
    >
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mx-1 mb-2 text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">
          Trocar para
        </legend>
        <div className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {options.map((option) => {
            const available = isAvailable(option);
            return (
              <label
                key={option.id}
                className={`flex min-h-16 items-center gap-4 px-4 py-3 ${
                  available ? "cursor-pointer" : "opacity-50"
                } ${option.id === selectedId ? "bg-blue-50 dark:bg-blue-950/40" : ""}`}
              >
                <input
                  type="radio"
                  name="pledgeTypeId"
                  value={option.id}
                  checked={option.id === selectedId}
                  disabled={!available}
                  onChange={() => {
                    setSelectedId(option.id);
                  }}
                  className="h-5 w-5 shrink-0"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-semibold">
                    {option.name}
                    {option.installmentValueLabel ? ` · ${option.installmentValueLabel}/mês` : ""}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {available
                      ? option.installmentValueLabel
                        ? "Valor fixo"
                        : "Valor livre, sem parcelas"
                      : unavailableHint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {needsInstallments ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[15px] font-semibold">Parcelas do novo carnê</span>
          <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
            Mês da primeira parcela
            <select
              name="firstInstallmentMonth"
              value={firstInstallmentMonth}
              onChange={(event) => {
                setFirstInstallmentMonth(event.target.value);
              }}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {firstMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 text-[15px] text-zinc-700 dark:text-zinc-300">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={installmentCountMode === "full"}
                onChange={() => {
                  setInstallmentCountMode("full");
                }}
              />
              Até o fim da campanha — {maxInstallmentCount}{" "}
              {maxInstallmentCount === 1 ? "parcela" : "parcelas"}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={installmentCountMode === "custom"}
                onChange={() => {
                  setInstallmentCountMode("custom");
                }}
              />
              Quantidade customizada
            </label>
            {installmentCountMode === "custom" ? (
              <input
                name="installmentCount"
                type="number"
                min={1}
                max={maxInstallmentCount}
                required
                className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div
          className={
            isConversion
              ? "flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              : "flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
          }
        >
          <InfoIcon className="h-6 w-6 shrink-0" />
          <p className="text-[15px]">{describeChange(source, selected)}</p>
        </div>
      ) : null}

      <SubmitButton pendingLabel="Salvando…" pending={isPending}>
        Salvar tipo novo
      </SubmitButton>
    </form>
  );
}
