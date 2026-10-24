"use client";

import { useState, type ReactNode } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { InfoIcon } from "@/app/_components/icons";
import type { TutorialTone } from "./_content/tutorial-steps";

export interface TutorialSlide {
  id: string;
  title: string;
  text: string;
  tip?: string;
  icon: ReactNode;
  tone: TutorialTone;
}

const toneClassNames: Record<TutorialTone, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
};

export function TutorialCarousel({
  slides,
  finish,
}: {
  slides: TutorialSlide[];
  finish: () => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) {
    return null;
  }
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex min-h-12 items-center justify-between">
        <span className="text-[15px] text-zinc-600 dark:text-zinc-400">
          {index + 1} de {slides.length}
        </span>
        {!isLast ? (
          <form action={finish}>
            <SubmitButton pendingLabel="Saindo…" variant="outline">
              Pular
            </SubmitButton>
          </form>
        ) : null}
      </header>

      <section
        aria-live="polite"
        className="flex flex-1 flex-col items-center justify-center gap-5 text-center"
      >
        <span
          className={`flex h-30 w-30 items-center justify-center rounded-[36px] ${toneClassNames[slide.tone]}`}
        >
          {slide.icon}
        </span>
        <h1 className="text-[28px] leading-tight font-bold">{slide.title}</h1>
        <p className="max-w-sm text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          {slide.text}
        </p>
        {slide.tip ? (
          <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <InfoIcon className="h-6 w-6 shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="text-[15px] text-zinc-700 dark:text-zinc-300">{slide.tip}</span>
          </div>
        ) : null}
      </section>

      <div className="flex justify-center gap-2" aria-hidden="true">
        {slides.map((item, dotIndex) => (
          <span
            key={item.id}
            className={
              dotIndex === index
                ? "h-2.5 w-7 rounded-full bg-zinc-900 dark:bg-zinc-50"
                : "h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700"
            }
          />
        ))}
      </div>

      <div className="flex gap-3">
        {!isFirst ? (
          <button
            type="button"
            onClick={() => {
              setIndex(index - 1);
            }}
            className={`${buttonBaseClassName} ${buttonClassNames.outline} min-h-14 flex-1 text-[17px] font-semibold`}
          >
            Voltar
          </button>
        ) : null}
        {isLast ? (
          <form
            action={finish}
            className="flex flex-[2] flex-col [&>button]:min-h-14 [&>button]:text-[17px]"
          >
            <SubmitButton pendingLabel="Abrindo…">Começar a usar</SubmitButton>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIndex(index + 1);
            }}
            className={`${buttonBaseClassName} ${buttonClassNames.primary} min-h-14 flex-[2] text-[17px]`}
          >
            Próximo
          </button>
        )}
      </div>
    </div>
  );
}
