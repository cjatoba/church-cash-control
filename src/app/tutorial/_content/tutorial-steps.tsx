import type { ReactNode } from "react";
import type { GuideItem } from "@/server/domain/onboarding";
import {
  BanknotesIcon,
  CurrencyIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
} from "@/app/_components/icons";

// Toda mudança de tela ou fluxo precisa revisar estes textos (regra do
// CLAUDE.md, seção "Ajuda e tutorial").

export type TutorialTone = "green" | "blue" | "amber" | "violet" | "rose";

export interface TutorialStep extends GuideItem {
  id: string;
  title: string;
  text: string;
  tip?: string;
  icon: ReactNode;
  tone: TutorialTone;
}

const iconClassName = "h-14 w-14";

export function buildTutorialSteps(greeting: string): TutorialStep[] {
  return [
    {
      id: "welcome",
      title: greeting,
      text: "Que bom ter você aqui. Neste app você acompanha as campanhas de arrecadação da igreja: quem contribuiu, quanto falta para a meta e com quem está o dinheiro.",
      icon: <CurrencyIcon className={iconClassName} />,
      tone: "green",
    },
    {
      id: "campaigns",
      title: "Suas campanhas",
      text: "A tela inicial mostra cada campanha com o valor arrecadado e a meta. Toque numa campanha para ver tudo sobre ela.",
      icon: <RectangleStackIcon className={iconClassName} />,
      tone: "blue",
    },
    {
      id: "new-campaign",
      requires: "canManageCampaigns",
      title: "Comece pela campanha",
      text: 'Para começar, toque em "Nova campanha" na tela inicial. Depois, cadastre os tipos de carnê e os doadores dela.',
      icon: <PlusIcon className={iconClassName} />,
      tone: "blue",
    },
    {
      id: "receive",
      requires: "canReceiveFunds",
      title: "Registrar recebimento",
      text: 'Recebeu dinheiro? Entre na campanha e toque em "Registrar recebimento". O app pergunta o que você recebeu e guia o resto.',
      tip: "Serve para parcela de carnê, entrega de carnê avulso ou doação sem carnê.",
      icon: <PlusIcon className={iconClassName} />,
      tone: "amber",
    },
    {
      id: "money-in-hand",
      title: "Dinheiro em mãos",
      text: "Mostra com quem está cada valor recebido e os repasses de uma pessoa para outra, para ninguém perder a conta. Toque numa pessoa para ver de onde veio cada valor e corrigir o que foi lançado errado.",
      icon: <BanknotesIcon className={iconClassName} />,
      tone: "violet",
    },
    {
      id: "help",
      title: "Precisa de ajuda?",
      text: 'Use a barra de baixo da tela: "Início" volta para a tela inicial de qualquer lugar, e em "Menu" fica a "Ajuda", com o passo a passo de cada parte do app — e este tutorial, para rever quando quiser.',
      icon: <QuestionMarkCircleIcon className={iconClassName} />,
      tone: "rose",
    },
  ];
}
