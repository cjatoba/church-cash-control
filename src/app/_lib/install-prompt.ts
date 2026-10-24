// O Chrome dispara `beforeinstallprompt` uma única vez, logo que a página
// carrega — normalmente antes de a pessoa chegar na tela de instalação. Por
// isso o evento é capturado no layout raiz e guardado aqui, para a tela
// "Instalar no celular" conseguir usá-lo depois de uma navegação.

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return "prompt" in event && typeof event.prompt === "function";
}

export function storeInstallPrompt(event: BeforeInstallPromptEvent): void {
  deferredPrompt = event;
  notify();
}

export function clearInstallPrompt(): void {
  deferredPrompt = null;
  notify();
}

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function subscribeToInstallPrompt(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
