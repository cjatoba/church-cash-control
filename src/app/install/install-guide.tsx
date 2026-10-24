"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Tabs } from "@/app/_components/tabs";
import { buttonBaseClassName, buttonClassNames } from "@/app/_components/button-styles";
import { CheckCircleIcon, DownloadIcon, PlusSquareIcon, ShareIcon } from "@/app/_components/icons";
import {
  clearInstallPrompt,
  getInstallPrompt,
  subscribeToInstallPrompt,
} from "@/app/_lib/install-prompt";

const standaloneQuery = "(display-mode: standalone)";

function subscribeToDisplayMode(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(standaloneQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => {
    mediaQuery.removeEventListener("change", onChange);
  };
}

function isRunningInstalled(): boolean {
  return window.matchMedia(standaloneQuery).matches;
}

function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </ol>
  );
}

function Step({
  number,
  children,
  icon,
}: {
  number: number;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
        {number}
      </span>
      <span className="flex-1 text-[17px]">{children}</span>
      {icon ? <span className="shrink-0 text-blue-700 dark:text-blue-400">{icon}</span> : null}
    </li>
  );
}

function AndroidInstructions() {
  const installPrompt = useSyncExternalStore(
    subscribeToInstallPrompt,
    getInstallPrompt,
    () => null,
  );

  async function install() {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    clearInstallPrompt();
  }

  return (
    <div className="flex flex-col gap-4">
      {installPrompt ? (
        <>
          <button
            type="button"
            onClick={() => {
              void install();
            }}
            className={`${buttonBaseClassName} ${buttonClassNames.primaryLarge}`}
          >
            <DownloadIcon />
            Instalar agora
          </button>
          <p className="mx-1 text-[15px] text-zinc-600 dark:text-zinc-400">
            Se preferir, faça pelo menu do Chrome:
          </p>
        </>
      ) : (
        <p className="mx-1 text-[15px] text-zinc-600 dark:text-zinc-400">
          Abra este site pelo <strong>Chrome</strong> e siga os passos:
        </p>
      )}
      <Steps>
        <Step number={1}>
          Toque nos <strong>três pontinhos</strong> no canto de cima
        </Step>
        <Step number={2}>
          Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>
        </Step>
        <Step number={3}>
          Confirme em <strong>Instalar</strong>
        </Step>
      </Steps>
    </div>
  );
}

function IphoneInstructions() {
  return (
    <div className="flex flex-col gap-4">
      <p className="mx-1 text-[15px] text-zinc-600 dark:text-zinc-400">
        No iPhone, abra este site pelo <strong>Safari</strong> e siga os passos:
      </p>
      <Steps>
        <Step number={1} icon={<ShareIcon />}>
          Toque no botão <strong>Compartilhar</strong>, na barra de baixo
        </Step>
        <Step number={2} icon={<PlusSquareIcon />}>
          Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>
        </Step>
        <Step number={3}>
          Toque em <strong>Adicionar</strong>, no canto de cima
        </Step>
      </Steps>
    </div>
  );
}

export function InstallGuide({ initialTab }: { initialTab: "android" | "iphone" }) {
  const installed = useSyncExternalStore(subscribeToDisplayMode, isRunningInstalled, () => false);

  if (installed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-5 text-[17px] text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
        <CheckCircleIcon className="h-7 w-7 shrink-0" />O app já está instalado neste celular.
      </div>
    );
  }

  return (
    <Tabs
      label="Tipo de celular"
      initialTabId={initialTab}
      tabs={[
        { id: "android", label: "Android", content: <AndroidInstructions /> },
        { id: "iphone", label: "iPhone", content: <IphoneInstructions /> },
      ]}
    />
  );
}
