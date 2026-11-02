export const TURNSTILE_SITE_KEY = "0x4AAAAAAFwA-9P8Rel6xqai";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let turnstileLoader: Promise<void> | null = null;
export function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = TURNSTILE_SRC; sc.async = true; sc.defer = true;
      sc.onload = () => resolve();
      sc.onerror = () => { turnstileLoader = null; reject(new Error("turnstile load failed")); };
      document.head.appendChild(sc);
    });
  }
  return turnstileLoader;
}
