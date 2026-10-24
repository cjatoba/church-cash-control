"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { BackLink } from "@/app/_components/back-link";

export interface CreateDonorState {
  error?: string;
  values?: {
    name: string;
    pledgeTypeId: string;
    installmentCountMode: string;
    installmentCount: string;
  };
}

export function DonorForm({
  campaignId,
  pledgeTypes,
  maxInstallmentCount,
  campaignEndMonthLabel,
  action,
}: {
  campaignId: string;
  pledgeTypes: { id: string; name: string; installmentValueLabel: string | null }[];
  maxInstallmentCount: number;
  campaignEndMonthLabel: string;
  action: (prevState: CreateDonorState, formData: FormData) => Promise<CreateDonorState>;
}) {
  const [state, formAction] = useActionState<CreateDonorState, FormData>(action, {});
  const [pledgeTypeId, setPledgeTypeId] = useState(state.values?.pledgeTypeId ?? "");
  const [installmentCountMode, setInstallmentCountMode] = useState(
    state.values?.installmentCountMode ?? "full",
  );

  const selectedPledgeType = pledgeTypes.find((pledgeType) => pledgeType.id === pledgeTypeId);
  const isFixedValueType = Boolean(selectedPledgeType?.installmentValueLabel);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 self-start rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 sm:self-auto sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <BackLink href={`/campaigns/${campaignId}/donors`} />
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Novo doador</h1>
      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Nome
        <input
          name="name"
          type="text"
          required
          defaultValue={state.values?.name ?? ""}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
        Tipo de carnê
        <select
          name="pledgeTypeId"
          required
          value={pledgeTypeId}
          onChange={(event) => {
            setPledgeTypeId(event.target.value);
          }}
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="" disabled>
            Selecione
          </option>
          {pledgeTypes.map((pledgeType) => (
            <option key={pledgeType.id} value={pledgeType.id}>
              {pledgeType.name} ·{" "}
              {pledgeType.installmentValueLabel
                ? `${pledgeType.installmentValueLabel}/mês`
                : "Avulso (valor livre)"}
            </option>
          ))}
        </select>
      </label>

      {isFixedValueType ? (
        <div className="flex flex-col gap-2 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          <span className="font-medium text-black dark:text-zinc-50">Quantidade de parcelas</span>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="installmentCountMode"
              value="full"
              checked={installmentCountMode === "full"}
              onChange={() => {
                setInstallmentCountMode("full");
              }}
            />
            Até o fim da campanha — {maxInstallmentCount}{" "}
            {maxInstallmentCount === 1 ? "parcela" : "parcelas"}, até {campaignEndMonthLabel}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="installmentCountMode"
              value="custom"
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
              defaultValue={state.values?.installmentCount ?? ""}
              className="min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          ) : null}
        </div>
      ) : null}

      <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
        Carnê com valor fixo: as parcelas mensais são geradas automaticamente a partir do mês atual.
        Carnê avulso: sem parcela — o doador arrecada com quem quiser e entrega o valor depois, em
        uma ou mais vezes.
      </p>
      <SubmitButton pendingLabel="Cadastrando…">Cadastrar doador e gerar carnê</SubmitButton>
    </form>
  );
}
