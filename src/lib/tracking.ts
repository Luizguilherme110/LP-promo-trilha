/**
 * Camada de rastreamento.
 * - Meta Pixel: instalado uma única vez no <head> (__root.tsx) com PageView;
 *   aqui só dispara o Contact (evento padrão) no clique do WhatsApp.
 * - Analytics próprio (analyticsProvider): eventos internos, UTMs, visita_id, tempo visível.
 * Sem credenciais, sem IP, sem dados pessoais, sem fingerprinting.
 */
import { ANALYTICS_ENDPOINT, LP_SLUG, WHATSAPP_GROUP_URL } from "@/config/site";

const isBrowser = () => typeof window !== "undefined";
const DEV = import.meta.env.DEV;
const log = (...a: unknown[]) => {
  if (DEV) console.info("[analytics]", ...a);
};

function session<T>(fn: (s: Storage) => T, fallback: T): T {
  try {
    return fn(window.sessionStorage);
  } catch {
    return fallback;
  }
}

/* ------------------------------ UTMs ------------------------------ */

const PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;
type TrackingParams = Partial<Record<(typeof PARAM_KEYS)[number], string>>;
const PARAMS_KEY = "pdt_campaign_params";
let memoryParams: TrackingParams = {};

/**
 * Lê UTMs/fbclid da URL e preserva na sessão da aba. Se a URL trouxer algum
 * parâmetro, o conjunto inteiro é substituído (o clique mais recente vence);
 * sem parâmetros na URL, mantém o que já estava guardado.
 */
export function captureParams(): TrackingParams {
  if (!isBrowser()) return {};
  const url = new URLSearchParams(window.location.search);
  const fromUrl: TrackingParams = {};
  for (const key of PARAM_KEYS) {
    const value = url.get(key)?.trim();
    if (value) fromUrl[key] = value.slice(0, 500);
  }
  if (Object.keys(fromUrl).length === 0) return getParams();
  memoryParams = fromUrl;
  session((s) => s.setItem(PARAMS_KEY, JSON.stringify(fromUrl)), undefined);
  return fromUrl;
}

export function getParams(): TrackingParams {
  if (!isBrowser()) return {};
  const stored = session((s) => s.getItem(PARAMS_KEY), null);
  if (!stored) return memoryParams;
  try {
    return JSON.parse(stored) as TrackingParams;
  } catch {
    return memoryParams;
  }
}

/* --------------------------- visita_id ---------------------------- */

const VISIT_KEY = "pdt_visita_id";
let memoryVisitId: string | null = null;

function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Contexto não seguro (http): randomUUID indisponível, getRandomValues existe.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** UUID aleatório por visita (sessão da aba). Não identifica a pessoa. */
export function getVisitId(): string {
  if (!isBrowser()) return "";
  const stored = session((s) => s.getItem(VISIT_KEY), null);
  if (stored) return stored;
  memoryVisitId ??= randomId();
  session((s) => s.setItem(VISIT_KEY, memoryVisitId!), undefined);
  return memoryVisitId;
}

/** true só na primeira vez que `name` acontece nesta visita. */
function firstInVisit(name: string): boolean {
  const key = `pdt_once_${name}`;
  const done = session((s) => s.getItem(key) === "1", false) || onceMemory.has(name);
  if (done) return false;
  onceMemory.add(name);
  session((s) => s.setItem(key, "1"), undefined);
  return true;
}
const onceMemory = new Set<string>();

/** trackEvent que só dispara na primeira vez desta visita (ex.: blocos vistos). */
export function trackOncePerVisit(eventName: AnalyticsEvent, data: Payload = {}) {
  if (isBrowser() && firstInVisit(eventName)) trackEvent(eventName, data);
}

/* ------------------------- Tempo visível -------------------------- */

// Soma só os intervalos com document.visibilityState === "visible".
let visibleTimeMs = 0;
let visibleSince: number | null = null;

export function getVisibleTimeMs(): number {
  if (!isBrowser()) return 0;
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
  | "page_exit"
  | "activity_toast_view"
  | "urgency_block_view"
  | "capacity_notice_view";

type Payload = Record<string, unknown>;
const queue: Payload[] = [];
const MAX_QUEUE = 200;
const FLUSH_DELAY_MS = 3000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Referrer sem query string (evita carregar tokens de terceiros). */
function cleanReferrer(): string | null {
  if (!document.referrer) return null;
  try {
    const u = new URL(document.referrer);
    return (u.origin + u.pathname).slice(0, 300);
  } catch {
    return null;
  }
}

function send(batch: Payload[]) {
  // text/plain é "CORS-safelisted": sem preflight e aceito pelo sendBeacon em todos os navegadores.
  const body = JSON.stringify({ events: batch });
  try {
    const ok =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        ANALYTICS_ENDPOINT,
        new Blob([body], { type: "text/plain;charset=UTF-8" }),
      );
    if (!ok) {
      void fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        credentials: "omit",
      }).catch(() => {});
    }
  } catch {
    /* nunca quebra a página */
  }
}

export const analyticsProvider = {
  trackEvent(eventName: AnalyticsEvent, data: Payload = {}) {
    if (!isBrowser()) return;
    const p = getParams();
    const event: Payload = {
      event_name: eventName,
      visita_id: getVisitId(),
      timestamp: new Date().toISOString(),
      slug: LP_SLUG,
      pagina: window.location.pathname,
      campanha: p.utm_campaign ?? null,
      utm_source: p.utm_source ?? null,
      utm_medium: p.utm_medium ?? null,
      utm_campaign: p.utm_campaign ?? null,
      utm_content: p.utm_content ?? null,
      utm_term: p.utm_term ?? null,
      fbclid: p.fbclid ?? null,
      referrer: cleanReferrer(),
      user_agent: navigator.userAgent,
      visible_time_ms: getVisibleTimeMs(),
      ...data,
    };
    queue.push(event);
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    log(eventName, event);
    if (ANALYTICS_ENDPOINT && !flushTimer) {
      flushTimer = setTimeout(() => analyticsProvider.flushEvents(), FLUSH_DELAY_MS);
    }
  },

  /** Envia a fila. Sem endpoint configurado: não faz chamadas externas. */
  flushEvents() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!isBrowser() || !ANALYTICS_ENDPOINT || queue.length === 0) return;
    send(queue.splice(0, queue.length));
  },

  /** Cópia da fila local (inspeção/testes). Com endpoint, só contém o que ainda não foi enviado. */
  getQueue: () => [...queue],
};

export const trackEvent = analyticsProvider.trackEvent;
export const flushEvents = analyticsProvider.flushEvents;

/* --------------------------- Meta Pixel --------------------------- */

type PixelWindow = Window & {
  fbq?: (...a: unknown[]) => void;
  __pdtAnalytics?: typeof analyticsProvider;
};

/* ------------------------ Clique WhatsApp ------------------------- */

let lastClickAt = 0;

/**
 * Função única para todos os CTAs do WhatsApp. Não bloqueia a navegação:
 * o <a href> abre o grupo normalmente; aqui só registramos.
 */
export function trackWhatsAppClick(location: string) {
  if (!isBrowser()) return;
  // Toque duplo acidental não vira dois cliques.
  const now = performance.now();
  if (now - lastClickAt < 800) return;
  lastClickAt = now;

  trackEvent("whatsapp_click", { location, destino: WHATSAPP_GROUP_URL });
  flushEvents();
  const w = window as PixelWindow;
  // Evento padrão Contact (contato via chat), não custom: o Meta Ads otimiza por ele.
  if (typeof w.fbq === "function") w.fbq("track", "Contact", { content_name: "grupo_whatsapp" });
}

/* ------------------------- Inicialização -------------------------- */

let initialized = false;

/** Inicia toda a instrumentação uma única vez por carregamento. */
export function initAnalytics() {
  if (!isBrowser() || initialized) return;
  initialized = true;
  if (DEV) (window as PixelWindow).__pdtAnalytics = analyticsProvider;

  captureParams();
  getVisitId();
  trackEvent("page_view", { visible_time_ms: 0 });

  // --- Tempo visível + marcos de engajamento (5s / 15s reais, 1x por visita)
  let timers: ReturnType<typeof setTimeout>[] = [];
  const milestones = [
    ["engaged_5s", 5000],
    ["engaged_15s", 15000],
  ] as const;
  const pending = new Set<string>(
    milestones
      .map(([n]) => n)
      .filter((n) => !session((s) => s.getItem(`pdt_once_${n}`) === "1", false)),
  );
  const schedule = () => {
    timers.forEach(clearTimeout);
    timers = [];
    for (const [name, ms] of milestones) {
      if (!pending.has(name)) continue;
      timers.push(
        setTimeout(
          () => {
            pending.delete(name);
            if (firstInVisit(name)) trackEvent(name);
          },
          Math.max(0, ms - getVisibleTimeMs()),
        ),
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

  // --- page_exit: mobile raramente dispara pagehide ao trocar de app, então a
  // aba ficar oculta também conta como saída. Um evento por ocultação; se a
  // pessoa voltar e sair de novo, sai outro com o tempo acumulado (vale o último).
  let exitSent = false;
  let exitCount = 0;
  const exit = (reason: "hidden" | "pagehide") => {
    pause();
    if (!exitSent) {
      exitSent = true;
      exitCount += 1;
      trackEvent("page_exit", { exit_reason: reason, exit_count: exitCount });
    }
    flushEvents();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      exitSent = false;
      resume();
    } else exit("hidden");
  });
  window.addEventListener("pagehide", () => exit("pagehide"));
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && document.visibilityState === "visible") {
      exitSent = false;
      resume();
    }
  });
  if (document.visibilityState === "visible") resume();

  // --- scroll_50: fundo da tela passou da metade do documento. 1x por visita.
  if (!session((s) => s.getItem("pdt_once_scroll_50") === "1", false)) {
    let ticking = false;
    const check = () => {
      ticking = false;
      const doc = document.documentElement;
      const reached = (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
      if (reached >= 0.5) {
        window.removeEventListener("scroll", onScroll);
        if (firstInVisit("scroll_50"))
          trackEvent("scroll_50", { scroll_ratio: Number(reached.toFixed(2)) });
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // --- cta_view: primeiro CTA real do WhatsApp visível. 1x por visita.
  const ctas = document.querySelectorAll<HTMLElement>("[data-wa-cta]");
  if (
    ctas.length &&
    "IntersectionObserver" in window &&
    !session((s) => s.getItem("pdt_once_cta_view") === "1", false)
  ) {
    const ctaObs = new IntersectionObserver(
      (entries) => {
        const hit = entries.find(
          (e) => e.isIntersecting && !(e.target as HTMLElement).closest('[aria-hidden="true"]'),
        );
        if (!hit) return;
        ctaObs.disconnect();
        if (firstInVisit("cta_view")) {
          trackEvent("cta_view", {
            location: (hit.target as HTMLElement).dataset["waCta"] ?? null,
          });
        }
      },
      { threshold: 0.5 },
    );
    ctas.forEach((el) => ctaObs.observe(el));
  }
}
