/**
 * Camada simples de analytics + UTM.
 * Sem credenciais, sem dados pessoais. Pronta para integração futura.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

type TrackingParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORAGE_KEY = "pdt_campaign_params";

function readStored(): TrackingParams {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Lê os parâmetros da URL, mescla com a sessão e persiste. */
export function captureParams(): TrackingParams {
  if (typeof window === "undefined") return {};
  const url = new URLSearchParams(window.location.search);
  const fromUrl: TrackingParams = {};
  for (const key of UTM_KEYS) {
    const value = url.get(key);
    if (value) fromUrl[key] = value;
  }
  const merged = { ...readStored(), ...fromUrl };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* sessão indisponível: segue sem persistir */
  }
  return merged;
}

export function getParams(): TrackingParams {
  return readStored();
}

/** Anexa os parâmetros preservados a uma URL de destino. */
export function withParams(target: string): string {
  const params = getParams();
  const entries = Object.entries(params);
  if (entries.length === 0) return target;
  try {
    const url = new URL(target);
    for (const [key, value] of entries) url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return target;
  }
}

type EventName = "page_view" | "whatsapp_click";

function track(event: EventName, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const data = {
    event,
    ...payload,
    ...getParams(),
    referrer: document.referrer || null,
    timestamp: new Date().toISOString(),
  };

  // Ponto único de integração futura (backend, Pixel, GA...).
  const w = window as unknown as { dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(data);
  if (typeof w.fbq === "function") {
    w.fbq("trackCustom", event, data);
  }
  if (import.meta.env.DEV) console.info("[analytics]", data);
}

export function trackPageView() {
  captureParams();
  track("page_view", { path: window.location.pathname });
}

export function trackWhatsAppClick(location: string) {
  track("whatsapp_click", { location });
}
