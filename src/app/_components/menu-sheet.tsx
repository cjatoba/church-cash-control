"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { buttonBaseClassName, buttonClassNames } from "./button-styles";
import { roundIconButtonClassName } from "./page-header";
import { XMarkIcon } from "./icons";

const OPEN_MENU_EVENT = "app:open-menu";

const SWIPE_TO_CLOSE_DISTANCE_PX = 80;

export function requestMenuOpen(): void {
  window.dispatchEvent(new Event(OPEN_MENU_EVENT));
}

export function OpenMenuButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={requestMenuOpen}
      className={`${buttonBaseClassName} ${buttonClassNames.primaryLarge}`}
    >
      {label}
    </button>
  );
}

// Abrir o menu empilha uma entrada no histórico: assim o botão voltar do
// Android (e o gesto de voltar do iPhone) fecha o menu em vez de sair da
// tela que está por baixo. Fechar desfaz essa entrada; um link tocado dentro
// do menu a substitui pela tela nova, para não sobrar uma entrada "fantasma"
// que exigiria voltar duas vezes.
export function MenuSheet({
  children,
  onOpenChange,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const historyEntryPushedRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    function open() {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) {
        return;
      }
      window.history.pushState({ menuSheet: true }, "");
      historyEntryPushedRef.current = true;
      dialog.showModal();
      onOpenChange(true);
    }

    function handlePopState() {
      if (!historyEntryPushedRef.current) {
        return;
      }
      historyEntryPushedRef.current = false;
      dialogRef.current?.close();
    }

    window.addEventListener(OPEN_MENU_EVENT, open);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener(OPEN_MENU_EVENT, open);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onOpenChange]);

  useEffect(() => {
    historyEntryPushedRef.current = false;
    dialogRef.current?.close();
  }, [pathname]);

  function dismiss() {
    if (historyEntryPushedRef.current) {
      window.history.back();
      return;
    }
    dialogRef.current?.close();
  }

  function navigateFromMenu(href: string) {
    const replacesMenuEntry = historyEntryPushedRef.current;
    historyEntryPushedRef.current = false;
    dialogRef.current?.close();
    if (replacesMenuEntry) {
      router.replace(href);
    } else {
      router.push(href);
    }
  }

  function resetSwipe() {
    touchStartYRef.current = null;
    dialogRef.current?.style.removeProperty("transform");
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="menu-sheet-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={() => {
        onOpenChange(false);
        resetSwipe();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismiss();
        }
      }}
      onClickCapture={(event) => {
        const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
        const href = anchor?.getAttribute("href");
        if (href?.startsWith("/")) {
          event.preventDefault();
          event.stopPropagation();
          navigateFromMenu(href);
        }
      }}
      className="bottom-sheet mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-xl rounded-t-3xl bg-zinc-100 p-0 text-zinc-900 backdrop:bg-black/45 dark:border-t dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:backdrop:bg-black/60"
    >
      <div className="flex max-h-[90dvh] flex-col">
        <div
          onTouchStart={(event) => {
            touchStartYRef.current = event.touches[0]?.clientY ?? null;
          }}
          onTouchMove={(event) => {
            const startY = touchStartYRef.current;
            const currentY = event.touches[0]?.clientY;
            if (startY === null || currentY === undefined) {
              return;
            }
            const distance = Math.max(0, currentY - startY);
            dialogRef.current?.style.setProperty("transform", `translateY(${String(distance)}px)`);
          }}
          onTouchEnd={(event) => {
            const startY = touchStartYRef.current;
            const endY = event.changedTouches[0]?.clientY;
            if (
              startY !== null &&
              endY !== undefined &&
              endY - startY > SWIPE_TO_CLOSE_DISTANCE_PX
            ) {
              dismiss();
              return;
            }
            resetSwipe();
          }}
          className="flex shrink-0 touch-none flex-col gap-3 px-5 pt-2 pb-4"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-10 self-center rounded-full bg-zinc-400 dark:bg-zinc-600"
          />
          <header className="flex items-center justify-between gap-3">
            <h2 id="menu-sheet-title" className="text-2xl font-bold">
              Menu
            </h2>
            <button
              type="button"
              onClick={() => {
                dismiss();
              }}
              aria-label="Fechar menu"
              className={roundIconButtonClassName}
            >
              <XMarkIcon />
            </button>
          </header>
        </div>
        <div className="flex flex-col gap-6 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </dialog>
  );
}
