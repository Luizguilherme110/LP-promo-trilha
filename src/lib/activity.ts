/**
 * Prova social dinâmica — SOMENTE com dados reais.
 *
 * - Toasts de atividade (new_member / new_offer) vêm de RECENT_ACTIVITY
 *   (config) ou de PUBLIC_STATUS_ENDPOINT. Sem evento válido e recente: nada aparece.
 * - Vagas restantes = groupCapacity - currentGroupMembers, só quando
 *   hasRealCapacity é true (config ou endpoint) e os números são coerentes.
 * Nada aqui gera, simula ou completa dado sozinho (sem Math.random, sem nome inventado).
 */
import {
  ACTIVITY_MAX_AGE_MIN,
  CURRENT_GROUP_MEMBERS,
  GROUP_CAPACITY,
  HAS_REAL_CAPACITY,
  PUBLIC_STATUS_ENDPOINT,
  PUBLIC_STATUS_REFRESH_MS,
  RECENT_ACTIVITY,
} from "@/config/site";

/* --------------------------- Atividade ---------------------------- */

export type ActivityType = "new_member" | "new_offer";

export type ActivityEvent = {
  type: ActivityType;
  /** ISO 8601 ou epoch em ms — momento REAL em que aconteceu. */
  timestamp: string | number;
  /**
   * new_member: primeiro nome REAL de quem entrou, vindo da nossa infraestrutura.
   * Só o primeiro nome é exibido (sobrenome, número etc. são descartados).
   */
  firstName?: string;
  /** Texto opcional (ex.: "Nova promoção foi publicada"). Sem dado pessoal. */
  text?: string;
};

export type ValidActivity = {
  type: ActivityType;
  at: number;
  firstName: string | null;
  text: string | null;
};

const TYPES: readonly ActivityType[] = ["new_member", "new_offer"];
const MAX_TEXT = 80;

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, MAX_TEXT) : null;
}

/**
 * Só o primeiro nome, só letras (com acento), 2–20 caracteres. Qualquer outra
 * coisa (número de telefone, emoji, "~", apelido com símbolo) é descartada.
 */
export function cleanFirstName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const first = v.trim().split(/\s+/)[0] ?? "";
  if (!/^[\p{L}][\p{L}'-]{1,19}$/u.test(first)) return null;
  return first.charAt(0).toLocaleUpperCase("pt-BR") + first.slice(1).toLocaleLowerCase("pt-BR");
}

/** Valida um evento vindo de fora. Retorna null se não for confiável para exibir. */
export function parseActivity(e: unknown, now = Date.now()): ValidActivity | null {
  if (!e || typeof e !== "object") return null;
  const { type, timestamp, text, firstName } = e as Partial<ActivityEvent>;
  if (!type || !TYPES.includes(type)) return null;
  const at = typeof timestamp === "number" ? timestamp : Date.parse(String(timestamp ?? ""));
  if (!Number.isFinite(at)) return null;
  if (at > now + 60_000) return null; // no futuro: dado inconsistente
  if (now - at > ACTIVITY_MAX_AGE_MIN * 60_000) return null; // não é mais "recente"
  return {
    type,
    at,
    firstName: type === "new_member" ? cleanFirstName(firstName) : null,
    text: cleanText(text),
  };
}

type Listener = (a: ValidActivity) => void;
const listeners = new Set<Listener>();
const seen = new Set<string>(); // evita repetir o mesmo evento a cada atualização

export function onActivity(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Mostra um toast de atividade REAL ({ type, timestamp, firstName?, text? }).
 * Evento inválido, antigo ou já exibido é descartado em silêncio.
 * Retorna true se foi aceito para exibição.
 */
export function showActivityToast(event: ActivityEvent): boolean {
  const valid = parseActivity(event);
  if (!valid) return false;
  const key = `${valid.type}|${valid.at}|${valid.firstName ?? ""}|${valid.text ?? ""}`;
  if (seen.has(key)) return false;
  seen.add(key);
  listeners.forEach((fn) => fn(valid));
  return true;
}

function ago(at: number, now: number) {
  const min = Math.max(0, Math.floor((now - at) / 60_000));
  if (min < 2) return "agora";
  if (min < 60) return `há ${min} min`;
  return `há ${Math.floor(min / 60)} h`;
}

/** Conteúdo do toast: avatar (inicial ou ícone), título e linha de apoio. */
export function formatActivity(a: ValidActivity, now = Date.now()) {
  const when = ago(a.at, now);
  if (a.type === "new_member") {
    return a.firstName
      ? { avatar: a.firstName.charAt(0), title: a.firstName, line: `entrou no grupo ${when}` }
      : { avatar: "👤", title: "Novo membro", line: `entrou no grupo ${when}` };
  }
  return { avatar: "🔥", title: a.text ?? "Nova oferta", line: `publicada no grupo ${when}` };
}

/** Enfileira eventos reais em sequência: do mais antigo pro mais recente, no máximo 3. */
function queueRecent(list: readonly unknown[], firstDelayMs: number) {
  const events = list
    .map((e) => ({ raw: e as ActivityEvent, ok: parseActivity(e) }))
    .filter((e) => e.ok)
    .sort((a, b) => a.ok!.at - b.ok!.at)
    .slice(-3);
  events.forEach((e, i) => setTimeout(() => showActivityToast(e.raw), firstDelayMs + i * 100));
}

/* ----------------------------- Vagas ------------------------------ */

/** null = não há dado real suficiente para mostrar vagas. */
export function computeRemainingSlots(
  groupCapacity: number | null | undefined,
  currentGroupMembers: number | null | undefined,
): number | null {
  if (!Number.isInteger(groupCapacity) || !Number.isInteger(currentGroupMembers)) return null;
  const cap = groupCapacity as number;
  const cur = currentGroupMembers as number;
  if (cap <= 0 || cur < 0 || cur > cap) return null;
  return cap - cur;
}

export type SlotsState = {
  /** true só quando a capacidade vem de uma fonte REAL e confiável. */
  hasRealCapacity: boolean;
  groupCapacity: number | null;
  currentGroupMembers: number | null;
};

let slots: SlotsState = {
  hasRealCapacity: HAS_REAL_CAPACITY,
  groupCapacity: GROUP_CAPACITY,
  currentGroupMembers: CURRENT_GROUP_MEMBERS,
};
const slotListeners = new Set<(s: SlotsState) => void>();

export const getSlots = () => slots;

/** Vagas a exibir, ou null (componente oculto). */
export function visibleRemainingSlots(s: SlotsState = slots): number | null {
  if (s.hasRealCapacity !== true) return null;
  return computeRemainingSlots(s.groupCapacity, s.currentGroupMembers);
}

export function setSlots(next: Partial<SlotsState>) {
  slots = { ...slots, ...next };
  slotListeners.forEach((fn) => fn(slots));
}

export function onSlots(fn: (s: SlotsState) => void) {
  slotListeners.add(fn);
  return () => {
    slotListeners.delete(fn);
  };
}

/* ------------------------ Fonte de dados -------------------------- */

const toInt = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : null);
const FIRST_TOAST_DELAY_MS = 6000;

/** Aplica uma resposta do endpoint público de status (formato em config/site.ts). */
export function applyPublicStatus(data: unknown, firstDelayMs = FIRST_TOAST_DELAY_MS) {
  if (!data || typeof data !== "object") return;
  const d = data as {
    recentActivity?: unknown;
    groupCapacity?: unknown;
    currentGroupMembers?: unknown;
    hasRealCapacity?: unknown;
  };
  const cap = toInt(d.groupCapacity);
  const cur = toInt(d.currentGroupMembers);
  if (cap !== null || cur !== null || typeof d.hasRealCapacity === "boolean") {
    setSlots({
      groupCapacity: cap,
      currentGroupMembers: cur,
      hasRealCapacity:
        typeof d.hasRealCapacity === "boolean" ? d.hasRealCapacity : slots.hasRealCapacity,
    });
  }
  if (Array.isArray(d.recentActivity)) queueRecent(d.recentActivity, firstDelayMs);
}

async function fetchStatus(): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(PUBLIC_STATUS_ENDPOINT, {
      signal: ctrl.signal,
      credentials: "omit",
      cache: "no-store",
    });
    return res.ok ? await res.json() : null;
  } finally {
    clearTimeout(t);
  }
}

let started = false;

/**
 * Carrega atividade/vagas reais: RECENT_ACTIVITY da config e, se configurado,
 * PUBLIC_STATUS_ENDPOINT — na abertura e depois a cada PUBLIC_STATUS_REFRESH_MS,
 * só com a aba visível (sem polling em segundo plano). Nunca envia credencial;
 * falha de rede apenas mantém o último estado (ou tudo oculto).
 */
export function loadPublicStatus(): void {
  if (typeof window === "undefined" || started) return;
  started = true;
  if (RECENT_ACTIVITY.length) queueRecent(RECENT_ACTIVITY, FIRST_TOAST_DELAY_MS);
  if (!PUBLIC_STATUS_ENDPOINT) return;

  let last = 0;
  let first = true;
  const refresh = async () => {
    if (document.visibilityState !== "visible") return;
    last = Date.now();
    try {
      applyPublicStatus(await fetchStatus(), first ? FIRST_TOAST_DELAY_MS : 0);
      first = false;
    } catch {
      /* sem dado real = nada muda */
    }
  };
  void refresh();
  setInterval(() => void refresh(), Math.max(30_000, PUBLIC_STATUS_REFRESH_MS));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - last > PUBLIC_STATUS_REFRESH_MS) {
      void refresh();
    }
  });
}
