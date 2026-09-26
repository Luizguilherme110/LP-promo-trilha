/**
 * Prova social dinâmica — SOMENTE com dados reais.
 *
 * - Toasts de atividade (new_member / new_offer) vêm de RECENT_ACTIVITY
 *   (config) ou de PUBLIC_STATUS_ENDPOINT. Sem evento válido e recente: nada aparece.
 * - Vagas restantes = groupCapacity - currentGroupMembers, só quando
 *   hasRealCapacity é true (flag HAS_REAL_CAPACITY + números reais coerentes).
 * Nada aqui gera, simula ou completa dado sozinho (sem Math.random, sem nomes).
 */
import {
  ACTIVITY_MAX_AGE_MIN,
  CURRENT_GROUP_MEMBERS,
  GROUP_CAPACITY,
  HAS_REAL_CAPACITY,
  PUBLIC_STATUS_ENDPOINT,
  RECENT_ACTIVITY,
} from "@/config/site";

/* --------------------------- Atividade ---------------------------- */

export type ActivityType = "new_member" | "new_offer";

export type ActivityEvent = {
  type: ActivityType;
  /** ISO 8601 ou epoch em ms — momento REAL em que aconteceu. */
  timestamp: string | number;
  /**
   * Texto opcional vindo da NOSSA infraestrutura (ex.: "Nova promoção foi publicada").
   * Sem nome de pessoa, telefone ou outro dado pessoal. Ausente = texto padrão do tipo.
   */
  text?: string;
};

export type ValidActivity = { type: ActivityType; at: number; text: string | null };

const TYPES: readonly ActivityType[] = ["new_member", "new_offer"];
const MAX_TEXT = 80;

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, MAX_TEXT) : null;
}

/** Valida um evento vindo de fora. Retorna null se não for confiável para exibir. */
export function parseActivity(e: unknown, now = Date.now()): ValidActivity | null {
  if (!e || typeof e !== "object") return null;
  const { type, timestamp, text } = e as Partial<ActivityEvent>;
  if (!type || !TYPES.includes(type)) return null;
  const at = typeof timestamp === "number" ? timestamp : Date.parse(String(timestamp ?? ""));
  if (!Number.isFinite(at)) return null;
  if (at > now + 60_000) return null; // no futuro: dado inconsistente
  if (now - at > ACTIVITY_MAX_AGE_MIN * 60_000) return null; // não é mais "recente"
  return { type, at, text: cleanText(text) };
}

type Listener = (a: ValidActivity) => void;
const listeners = new Set<Listener>();

export function onActivity(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Mostra um toast de atividade REAL ({ type, text?, timestamp }). Evento inválido
 * ou antigo é descartado em silêncio. Retorna true se foi aceito para exibição.
 */
export function showActivityToast(event: ActivityEvent): boolean {
  const valid = parseActivity(event);
  if (!valid) return false;
  listeners.forEach((fn) => fn(valid));
  return true;
}

const DEFAULTS: Record<ActivityType, { icon: string; text: string }> = {
  new_member: { icon: "👤", text: "Novo membro entrou no grupo" },
  new_offer: { icon: "🔥", text: "Nova oferta publicada no grupo" },
};

export function formatActivity(a: ValidActivity, now = Date.now()) {
  const min = Math.max(0, Math.floor((now - a.at) / 60_000));
  const ago =
    min < 1 ? "agora há pouco" : min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`;
  const d = DEFAULTS[a.type];
  return { icon: d.icon, text: a.text ?? d.text, ago };
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

/**
 * Carrega atividade/vagas reais UMA vez (sem polling): RECENT_ACTIVITY da config
 * e, se configurado, PUBLIC_STATUS_ENDPOINT. Nunca envia credencial; falha de
 * rede apenas mantém tudo oculto.
 */
export async function loadPublicStatus(): Promise<void> {
  if (typeof window === "undefined") return;
  if (RECENT_ACTIVITY.length) queueRecent(RECENT_ACTIVITY, FIRST_TOAST_DELAY_MS);
  if (!PUBLIC_STATUS_ENDPOINT) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(PUBLIC_STATUS_ENDPOINT, {
      signal: ctrl.signal,
      credentials: "omit",
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return;
    const data = (await res.json()) as {
      recentActivity?: unknown;
      groupCapacity?: unknown;
      currentGroupMembers?: unknown;
    };

    const cap = toInt(data.groupCapacity);
    const cur = toInt(data.currentGroupMembers);
    if (cap !== null || cur !== null) setSlots({ groupCapacity: cap, currentGroupMembers: cur });

    if (Array.isArray(data.recentActivity)) queueRecent(data.recentActivity, FIRST_TOAST_DELAY_MS);
  } catch {
    /* sem dado real = nada exibido */
  }
}
