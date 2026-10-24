"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { AppIconTile } from "@/app/_components/app-icon-tile";
import { SectionTitle } from "@/app/_components/card";
import { appIconColorOptions, appIconGlyph, appIconLabels } from "@/app/_lib/app-icon-catalog";
import {
  appIconColors,
  appIcons,
  type AppBranding,
  type AppIcon,
  type AppIconColor,
} from "@/server/domain/app-branding";

export interface AppBrandingFormState {
  error?: string;
  saved?: boolean;
  values?: AppBranding;
}

const inputClassName =
  "min-h-12 rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function AppBrandingForm({
  current,
  action,
}: {
  current: AppBranding;
  action: (prevState: AppBrandingFormState, formData: FormData) => Promise<AppBrandingFormState>;
}) {
  const [state, formAction] = useActionState<AppBrandingFormState, FormData>(action, {});
  const initial = state.values ?? current;
  const [name, setName] = useState(initial.name);
  const [shortName, setShortName] = useState(initial.shortName);
  const [icon, setIcon] = useState<AppIcon>(initial.icon);
  const [color, setColor] = useState<AppIconColor>(initial.color);
  const background = appIconColorOptions[color].hex;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-800 p-6 dark:bg-zinc-900">
        <span className="text-sm text-zinc-300">Como fica na tela do celular</span>
        <AppIconTile glyph={appIconGlyph(icon, name)} background={background} size={72} />
        <span className="max-w-full truncate text-sm text-white">{shortName || " "}</span>
      </section>

      {state.error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] text-red-800 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <div className="flex flex-col gap-2 rounded-xl bg-green-50 p-4 text-[15px] text-green-900 dark:bg-green-950/50 dark:text-green-200">
          <span>
            Personalização salva. O nome novo já aparece no app; no celular, o ícone instalado
            atualiza sozinho no Android em alguns dias, e no iPhone é preciso instalar de novo.
          </span>
          <Link href="/menu" className="self-start font-semibold underline">
            Voltar para o menu
          </Link>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Nome do app
          <input
            name="name"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
          Nome curto (embaixo do ícone)
          <input
            name="shortName"
            type="text"
            required
            maxLength={12}
            value={shortName}
            onChange={(event) => {
              setShortName(event.target.value);
            }}
            className={inputClassName}
          />
          <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
            Até 12 letras, para não ficar cortado.
          </span>
        </label>
      </section>

      {/* Ícone e cor vão em campos ocultos ligados ao estado, não em radios:
          ao concluir a action o React reinicia o formulário, e radios voltariam
          a marcar a opção da carga da página — inclusive no próximo envio. */}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <section className="flex flex-col gap-2">
        <SectionTitle>Ícone</SectionTitle>
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {appIcons.map((option) => {
            const selected = icon === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setIcon(option);
                }}
                className={
                  selected
                    ? "flex min-h-21 flex-col items-center gap-1.5 rounded-xl border-2 border-blue-700 bg-blue-50 p-2 dark:border-blue-400 dark:bg-blue-950/40"
                    : "flex min-h-21 flex-col items-center gap-1.5 rounded-xl border-2 border-transparent p-2"
                }
              >
                <AppIconTile glyph={appIconGlyph(option, name)} background={background} size={48} />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  {appIconLabels[option]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Cor de fundo</SectionTitle>
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {appIconColors.map((option) => {
            const selected = color === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setColor(option);
                }}
                className="flex min-h-16 flex-col items-center gap-1.5 p-1"
              >
                <span
                  className={
                    selected
                      ? "h-10 w-10 rounded-full ring-3 ring-blue-700 ring-offset-2 dark:ring-blue-400 dark:ring-offset-zinc-900"
                      : "h-10 w-10 rounded-full"
                  }
                  style={{ background: appIconColorOptions[option].hex }}
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  {appIconColorOptions[option].label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <SubmitButton pendingLabel="Salvando…">Salvar</SubmitButton>
      <p className="mx-1 text-sm text-zinc-600 dark:text-zinc-400">
        No Android, o ícone novo aparece sozinho em alguns dias. No iPhone, quem já instalou precisa
        remover e instalar de novo.
      </p>
    </form>
  );
}
