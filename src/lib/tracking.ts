/**
 * Camada de rastreamento.
 * - Meta Pixel: apenas PageView e WhatsAppClick.
 * - Analytics próprio (analyticsProvider): eventos internos, UTMs, visita_id, tempo visível.
 * Sem credenciais, sem IP, sem dados pessoais, sem fingerprinting.
 */
import { ANALYTICS_ENDPOINT, META_PIXEL_ID } from "@/config/site";

const isBrowser = () => typeof window !== "undefined";
const DEV = import.meta.env.DEV;
const log = (...a: unknown[]) => {
  if (DEV) console.info("[analytics]", ...a);
};

/* ------------------------------ UTMs ------------------------------ */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;
type TrackingParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;
const PARAMS_KEY = "pdt_campaign_params";

function readStored(): TrackingParams {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(sessionStorage.getItem(PARAMS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Lê os parâmetros da URL, mescla com a sessão e persiste. */
export function captureParams(): TrackingParams {
  if (!isBrowser()) return {};
  const url = new URLSearchParams(window.location.search);
  const fromUrl: TrackingParams = {};
  for (const key of UTM_KEYS) {
    const value = url.get(key);
    if (value) fromUrl[key] = value;
  }
  const merged = { ...readStored(), ...fromUrl };
  try {
    sessionStorage.setItem(PARAMS_KEY, JSON.stringify(merged));
  } catch {
    /* sessão indisponível */
  }
  return merged;
}

export function getParams(): TrackingParams {
  return readStored();
}

/** Anexa os parâmetros preservados a uma URL de destino. */
export function withParams(target: string): string {
  const entries = Object.entries(getParams());
  if (entries.length === 0) return target;
  try {
    const url = new URL(target);
    for (const [k, v] of entries) url.searchParams.set(k, v);
    return url.toString();
  } catch {
    return target;
  }
}

/* --------------------------- visita_id ---------------------------- */

const VISIT_KEY = "pdt_visita_id";
let memoryVisitId: string | null = null;

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "v-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** UUID aleatório por sessão da aba. Não identifica a pessoa. */
export function getVisitId(): string {
  if (!isBrowser()) return "";
  try {
    let id = sessionStorage.getItem(VISIT_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(VISIT_KEY, id);
    }
    return id;
  } catch {
    memoryVisitId ??= randomId();
    return memoryVisitId;
  }
}

/* ------------------------- Tempo visível -------------------------- */

let visibleTimeMs = 0;
let visibleSince: number | null = null;

export function getVisibleTimeMs(): number {
  return Math.round(visibleTimeMs + (visibleSince !== null ? performance.now() - visibleSince : 0));
}

/* ----------------------- analyticsProvider ------------------------ */

export type AnalyticsEvent =
  | "page_view"
  | "engaged_5s"
  | "engaged_15s"
  | "scroll_50"
  | "cta_view"
  | "whatsapp_click"
  | "page_exit";

type Payload = Record<string, unknown>;
const queue: Payload[] = [];

export const analyticsProvider = {
  trackEvent(eventName: AnalyticsEvent, data: Payload = {}) {
    if (!isBrowser()) return;
    const p = getParams();
    const event: Payload = {
      visita_id: getVisitId(),
      event_name: eventName,
      timestamp: new Date().toISOString(),
      slug: window.location.pathname,
      campanha: p.utm_campaign ?? null,
      utm_source: p.utm_source ?? null,
      utm_medium: p.utm_medium ?? null,
      utm_campaign: p.utm_campaign ?? null,
      utm_content: p.utm_content ?? null,
      utm_term: p.utm_term ?? null,
      fbclid: p.fbclid ?? null,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      ...data,
    };
    queue.push(event);
    log(eventName, data);
  },

  /** Envia a fila. Sem endpoint configurado: não faz chamadas externas. */
  flushEvents() {
    if (!isBrowser() || queue.length === 0) return;
    if (!ANALYTICS_ENDPOINT) {
      if (queue.length > 200) queue.splice(0, queue.length - 200);
      return;
    }
    const batch = queue.splice(0, queue.length);
    const body = JSON.stringify({ events: batch });
    try {
      const ok =
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([body], { type: "application/json" }));
      if (!ok) {
        void fetch(ANALYTICS_ENDPOINT, {
          method: "POST",
          body,
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
        }).catch(() => {});
      }
    } catch {
      /* nunca quebra a página */
    }
  },

  /** Somente para inspeção em desenvolvimento. */
  getQueue: () => [...queue],
};

export const trackEvent = analyticsProvider.trackEvent;
export const flushEvents = analyticsProvider.flushEvents;

/* --------------------------- Meta Pixel --------------------------- */

type Fbq = ((...a: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
type PixelWindow = Window & { fbq?: Fbq; _fbq?: Fbq; __pdtPixelInit?: boolean };

// Países onde o Pixel só pode rodar com consentimento (sem banner: não carrega).
const CONSENT_COUNTRIES = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH".split(" "),
);

let pixelAllowed = false;

async function regionAllowsPixel(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch("/cdn-cgi/trace", { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return false;
    const loc = /(?:^|\n)loc=([A-Z0-9]{2})/.exec(await res.text())?.[1];
    if (!loc || loc === "XX" || loc === "T1") return false;
    return !CONSENT_COUNTRIES.has(loc);
  } catch {
    return false;
  }
}

function loadPixel() {
  const w = window as PixelWindow;
  if (w.__pdtPixelInit) return;
  w.__pdtPixelInit = true;
  if (!w.fbq) {
    const n: Fbq = function (...args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      if (n.callMethod) (n.callMethod as (...a: unknown[]) => void)(...args);
      else n.queue!.push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    w.fbq = n;
    w._fbq = n;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq!("init", META_PIXEL_ID);
  w.fbq!("track", "PageView");
  log("Meta Pixel carregado + PageView");
}

async function initPixel() {
  if (!META_PIXEL_ID) return;
  pixelAllowed = await regionAllowsPixel();
  if (pixelAllowed) loadPixel();
  else log("Meta Pixel não carregado (região exige consentimento ou não identificada)");
}

/* ------------------------ Clique WhatsApp ------------------------- */

/** Função única para todos os CTAs do WhatsApp. Não bloqueia a navegação. */
export function trackWhatsAppClick(location: string) {
  if (!isBrowser()) return;
  trackEvent("whatsapp_click", { location, tempo_visivel_ms: getVisibleTimeMs() });
  flushEvents();
  const w = window as PixelWindow;
  if (pixelAllowed && typeof w.fbq === "function") w.fbq("trackCustom", "WhatsAppClick");
}

/* ------------------------- Inicialização -------------------------- */

let initialized = false;

/** Inicia toda a instrumentação uma única vez por carregamento. */
export function initAnalytics() {
  if (!isBrowser() || initialized) return;
  initialized = true;

  captureParams();
  getVisitId();
  trackEvent("page_view");
  void initPixel();

  // Tempo visível + marcos de engajamento
  const fired = new Set<string>();
  let timers: ReturnType<typeof setTimeout>[] = [];
  const schedule = () => {
    timers.forEach(clearTimeout);
    timers = [];
    for (const [name, ms] of [["engaged_5s", 5000], ["engaged_15s", 15000]] as const) {
      if (fired.has(name)) continue;
      const wait = ms - getVisibleTimeMs();
      timers.push(
        setTimeout(() => {
          if (fired.has(name)) return;
          fired.add(name);
          trackEvent(name, { tempo_visivel_ms: getVisibleTimeMs() });
        }, Math.max(0, wait)),
      );
    }
  };
  const pause = () => {
    if (visibleSince !== null) {
      visibleTimeMs += performance.now() - visibleSince;
      visibleSince = null;
    }
    timers.forEach(clearTimeout);
    timers = [];
  };
  const resume = () => {
    if (visibleSince === null) visibleSince = performance.now();
    schedule();
  };
  if (document.visibilityState === "visible") resume();

  let exited = false;
  const exit = () => {
    pause();
    if (!exited) {
      exited = true;
      trackEvent("page_exit", { tempo_visivel_ms: getVisibleTimeMs() });
    }
    flushEvents();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resume();
    else {
      pause();
      flushEvents();
    }
  });
  window.addEventListener("pagehide", exit);

  // Scroll 50% com sentinela (sem listener de scroll)
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;left:0;width:1px;height:1px;pointer-events:none;";
  const place = () => {
    sentinel.style.top = `${Math.round(document.documentElement.scrollHeight * 0.5)}px`;
  };
  document.body.style.position ||= "relative";
  document.body.appendChild(sentinel);
  place();
  window.addEventListener("load", place, { once: true });
  const scrollObs = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      trackEvent("scroll_50");
      scrollObs.disconnect();
      sentinel.remove();
    }
  });
  scrollObs.observe(sentinel);

  // cta_view: primeiro CTA do WhatsApp visível
  const ctas = document.querySelectorAll("[data-wa-cta]");
  if (ctas.length) {
    const ctaObs = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting && (e.target as HTMLElement).offsetParent !== null);
        if (hit) {
          trackEvent("cta_view", { location: (hit.target as HTMLElement).dataset.waCta });
          ctaObs.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    ctas.forEach((el) => ctaObs.observe(el));
  }
}
