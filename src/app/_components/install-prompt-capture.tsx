"use client";

import { useEffect } from "react";
import {
  clearInstallPrompt,
  isBeforeInstallPromptEvent,
  storeInstallPrompt,
} from "@/app/_lib/install-prompt";

export function InstallPromptCapture() {
  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      if (!isBeforeInstallPromptEvent(event)) {
        return;
      }
      event.preventDefault();
      storeInstallPrompt(event);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  return null;
}
