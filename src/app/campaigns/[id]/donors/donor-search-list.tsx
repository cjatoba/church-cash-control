"use client";

import { useState, type ReactNode } from "react";
import { matchesDonorName } from "@/server/domain/donor-search";
import { XMarkIcon } from "@/app/_components/icons";

export interface DonorSearchItem {
  key: string;
  donorName: string;
  content: ReactNode;
}

function describeCount(visible: number, searching: boolean): string {
  if (searching) {
    return visible === 1 ? "1 doador encontrado" : `${String(visible)} doadores encontrados`;
  }
  return visible === 1 ? "1 doador" : `${String(visible)} doadores`;
}

export function DonorSearchList({ items }: { items: DonorSearchItem[] }) {
  const [query, setQuery] = useState("");
  const searching = query.trim() !== "";
  const visibleItems = items.filter((item) => matchesDonorName(item.donorName, query));

  return (
    <section className="flex flex-col gap-3">
      <div className="relative flex items-center">
        <SearchIcon />
        <label htmlFor="donor-search" className="sr-only">
          Pesquisar doador pelo nome
        </label>
        <input
          id="donor-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Pesquisar pelo nome"
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-14 w-full rounded-full border border-zinc-300 bg-white pr-14 pl-12 text-[17px] text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-900 focus:outline-2 focus:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus:border-zinc-50 dark:focus:outline-zinc-50 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query !== "" ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
            }}
            aria-label="Limpar pesquisa"
            className="absolute right-1.5 flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="mx-1 text-[15px] text-zinc-600 dark:text-zinc-400">
        {describeCount(visibleItems.length, searching)}
      </p>

      {visibleItems.length > 0 ? (
        <ul className="flex flex-col divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {visibleItems.map((item) => (
            <li key={item.key} className="flex flex-col">
              {item.content}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[17px] font-semibold">Nenhum doador encontrado</p>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
            Confira se o nome está escrito certo.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
            }}
            className="min-h-12 rounded-full border border-zinc-300 bg-white px-5 text-base font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Limpar pesquisa
          </button>
        </div>
      )}
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
      className="pointer-events-none absolute left-4 h-6 w-6 text-zinc-600 dark:text-zinc-400"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
