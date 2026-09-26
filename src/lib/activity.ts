/**
 * Prova social dinâmica — SOMENTE com dados reais.
 *
 * - Toasts de atividade (new_member / new_offer) vêm de PUBLIC_STATUS_ENDPOINT.
 *   Sem endpoint, sem evento válido ou evento antigo demais: nada aparece.
 * - Vagas restantes = groupCapacity - currentGroupMembers, só quando os dois
 *   números existem, são coerentes e SLOTS_ENABLED está ligado.
 * Nada aqui gera, simula ou completa dado sozinho.
 */
import {
  ACTIVITY_MAX_AGE_MIN,
  CURRENT_GROUP_MEMBERS,
  GROUP_CAPACITY,
  PUBLIC_STATUS_ENDPOINT,
  SLOTS_ENABLED,
} from "@/config/site";

/* --------------------------- Atividade ---------------------------- */

export type ActivityType = "new_member" | "new_offer";

export type ActivityEvent = {
  type: ActivityType;
  /** ISO 8601 ou epoch em ms — momento REAL em que aconteceu. */
  timestamp: string | number;
};

export type ValidActivity = { type: ActivityType; at: number };

const TYPES: readonly ActivityType[] = ["new_member", "new_offer"];

/** Valida um evento vindo de fora. Retorna null se não for confiável para exibir. */
export function parseActivity(e: unknown, now = Date.now()): ValidActivity | null {
  if (!e || typeof e !== "object") return null;
  const { type, timestamp } = e as Partial<ActivityEvent>;
  if (!type || !TYPES.includes(type)) return null;
  const at = typeof timestamp === "number" ? timestamp : Date.parse(String(timestamp ?? ""));
  if (!Number.isFinite(at)) return null;
  if (at > now + 60_000) return null; // no futuro: dado inconsistente
  if (now - at > ACTIVITY_MAX_AGE_MIN * 60_000) return null; // não é mais "recente"
  return { type, at };
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
 * Mostra um toast de atividade REAL. Evento inválido é descartado em silêncio.
 * Retorna true se o evento foi aceito para exibição.
 */
export function showActivityToast(event: ActivityEvent): boolean {
  const valid = parseActivity(event);
  if (!valid) return false;
  listeners.forEach((fn) => fn(valid));
  return true;
}

export function formatActivity(a: ValidActivity, now = Date.now()) {
  const min = Math.max(0, Math.floor((now - a.at) / 60_000));
  const ago =
    min < 1 ? "agora há pouco" : min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`;
  return a.type === "new_member"
    ? { icon: "👤", text: "Novo membro entrou no grupo", ago }
    : { icon: "🔥", text: "Nova oferta publicada no grupo", ago };
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
  enabled: boolean;
  groupCapacity: number | null;
  currentGroupMembers: number | null;
};

let slots: SlotsState = {
  enabled: SLOTS_ENABLED,
  groupCapacity: GROUP_CAPACITY,
  currentGroupMembers: CURRENT_GROUP_MEMBERS,
};
const slotListeners = new Set<(s: SlotsState) => void>();

export const getSlots = () => slots;

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

/**
 * Busca o status público UMA vez (sem polling). Sem endpoint: não faz nada.
 * Nunca envia credencial; falha de rede apenas mantém tudo oculto.
 */
export async function loadPublicStatus(): Promise<void> {
  if (!PUBLIC_STATUS_ENDPOINT || typeof window === "undefined") return;
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

    if (Array.isArray(data.recentActivity)) {
      const events = data.recentActivity
        .map((e) => ({ raw: e as ActivityEvent, ok: parseActivity(e) }))
        .filter((e) => e.ok)
        .sort((a, b) => b.ok!.at - a.ok!.at)
        .slice(0, 3);
      // Do mais antigo pro mais recente, espaçados — discreto, sem enxurrada.
      events
        .reverse()
        .forEach((e, i) => setTimeout(() => showActivityToast(e.raw), 6000 + i * 12000));
    }
  } catch {
    /* sem dado real = nada exibido */
  }
}
