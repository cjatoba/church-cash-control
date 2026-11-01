"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { selectBottomNavTab, type BottomNavTab } from "@/app/_lib/bottom-nav";
import { HomeIcon, MenuIcon } from "./icons";
import { MenuSheet, requestMenuOpen } from "./menu-sheet";

// O espaçador reserva no fim da página a mesma altura da barra fixa, para
// ela nunca cobrir o último conteúdo. A área segura cobre a barra de gestos
// do iPhone quando o app está instalado (exige viewport-fit=cover).
const BAR_HEIGHT_CLASS_NAME = "h-[calc(4.75rem+env(safe-area-inset-bottom))]";

export function BottomNav({ menu }: { menu: ReactNode }) {
  const pathTab = selectBottomNavTab(usePathname());
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathTab === null) {
    return null;
  }

  const activeTab = menuOpen ? "menu" : pathTab;

  return (
    <>
      <div aria-hidden="true" className={`shrink-0 print:hidden ${BAR_HEIGHT_CLASS_NAME}`} />
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t print:hidden border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-900"
      >
        <ul className="mx-auto grid h-[4.75rem] w-full max-w-xl grid-cols-2 gap-2 px-6">
          <li className="flex">
            <Link
              href="/"
              aria-current={activeTab === "home" ? "page" : undefined}
              className={bottomNavItemClassName("home", activeTab)}
            >
              <BottomNavItemContent
                label="Início"
                icon={<HomeIcon />}
                active={activeTab === "home"}
              />
            </Link>
          </li>
          <li className="flex">
            <button
              type="button"
              onClick={requestMenuOpen}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={bottomNavItemClassName("menu", activeTab)}
            >
              <BottomNavItemContent
                label="Menu"
                icon={<MenuIcon />}
                active={activeTab === "menu"}
              />
            </button>
          </li>
        </ul>
      </nav>
      <MenuSheet onOpenChange={setMenuOpen}>{menu}</MenuSheet>
    </>
  );
}

function bottomNavItemClassName(tab: BottomNavTab, activeTab: BottomNavTab): string {
  return `flex flex-1 flex-col items-center justify-center gap-1 ${
    tab === activeTab
      ? "font-bold text-zinc-900 dark:text-zinc-50"
      : "font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
  }`;
}

function BottomNavItemContent({
  label,
  icon,
  active,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <>
      <span
        className={`flex h-8 w-16 items-center justify-center rounded-full ${
          active ? "bg-zinc-200 dark:bg-zinc-700" : ""
        }`}
      >
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </>
  );
}
