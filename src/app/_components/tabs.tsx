"use client";

import { useState, type ReactNode } from "react";

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({
  label,
  tabs,
  initialTabId,
}: {
  label: string;
  tabs: TabDefinition[];
  initialTabId: string;
}) {
  const [selectedTabId, setSelectedTabId] = useState(initialTabId);
  const selectedTab = tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={label}
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-zinc-200 p-1 dark:bg-zinc-800"
      >
        {tabs.map((tab) => {
          const selected = tab.id === selectedTab?.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setSelectedTabId(tab.id);
              }}
              className={
                selected
                  ? "min-h-12 rounded-xl bg-white text-base font-semibold text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "min-h-12 rounded-xl text-base font-medium text-zinc-700 dark:text-zinc-300"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{selectedTab?.content}</div>
    </div>
  );
}
