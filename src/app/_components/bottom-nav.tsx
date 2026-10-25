"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { selectBottomNavTab, type BottomNavTab } from "@/app/_lib/bottom-nav";
import { HomeIcon, MenuIcon } from "./icons";

// O espaçador reserva no fim da página a mesma altura da barra fixa, para
// ela nunca cobrir o último conteúdo. A área segura cobre a barra de gestos
// do iPhone quando o app está instalado (exige viewport-fit=cover).
const BAR_HEIGHT_CLASS_NAME = "h-[calc(4.75rem+env(safe-area-inset-bottom))]";

export function BottomNav() {
  const activeTab = selectBottomNavTab(usePathname());
  if (activeTab === null) {
    return null;
  }

  return (
    <>
      <div aria-hidden="true" className={`shrink-0 ${BAR_HEIGHT_CLASS_NAME}`} />
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-900"
      >
        <ul className="mx-auto grid h-[4.75rem] w-full max-w-xl grid-cols-2 gap-2 px-6">
          <BottomNavItem
            href="/"
            label="Início"
            icon={<HomeIcon />}
            tab="home"
            activeTab={activeTab}
          />
          <BottomNavItem
            href="/menu"
            label="Menu"
            icon={<MenuIcon />}
            tab="menu"
            activeTab={activeTab}
          />
        </ul>
      </nav>
    </>
  );
}

function BottomNavItem({
  href,
  label,
  icon,
  tab,
  activeTab,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tab: BottomNavTab;
  activeTab: BottomNavTab;
}) {
  const active = tab === activeTab;

  return (
    <li className="flex">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-1 ${
          active
            ? "font-bold text-zinc-900 dark:text-zinc-50"
            : "font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        }`}
      >
        <span
          className={`flex h-8 w-16 items-center justify-center rounded-full ${
            active ? "bg-zinc-200 dark:bg-zinc-700" : ""
          }`}
        >
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </Link>
    </li>
  );
}
