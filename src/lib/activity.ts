/**
 * Vagas do grupo — SOMENTE com dados reais.
 *
 * remainingSlots = groupCapacity - currentGroupMembers, só quando hasRealCapacity
 * é true (config ou endpoint) e os números são coerentes. Nada aqui gera,
 * simula ou completa dado sozinho (sem Math.random, sem decremento artificial).
 *
 * (O toast da página é uma demonstração fictícia, não usa dados de vagas.)
 */
import {
  CURRENT_GROUP_MEMBERS,
  GROUP_CAPACITY,
  HAS_REAL_CAPACITY,
  PUBLIC_STATUS_ENDPOINT,
  PUBLIC_STATUS_REFRESH_MS,
} from "@/config/site";

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

/** Aplica uma resposta do endpoint público de status (formato em config/site.ts). */
export function applyPublicStatus(data: unknown) {
  if (!data || typeof data !== "object") return;
  const d = data as {
    groupCapacity?: unknown;
    currentGroupMembers?: unknown;
    hasRealCapacity?: unknown;
  };
  const cap = toInt(d.groupCapacity);
  const cur = toInt(d.currentGroupMembers);
  if (cap === null && cur === null && typeof d.hasRealCapacity !== "boolean") return;
  setSlots({
    groupCapacity: cap,
    currentGroupMembers: cur,
    hasRealCapacity:
      typeof d.hasRealCapacity === "boolean" ? d.hasRealCapacity : slots.hasRealCapacity,
  });
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
 * Lê as vagas reais de PUBLIC_STATUS_ENDPOINT (se configurado) na abertura e a
 * cada PUBLIC_STATUS_REFRESH_MS, só com a aba visível. Nunca envia credencial;
 * falha de rede mantém o último estado (ou tudo oculto).
 */
export function loadPublicStatus(): void {
  if (typeof window === "undefined" || started || !PUBLIC_STATUS_ENDPOINT) return;
  started = true;
  let last = 0;
  const refresh = async () => {
    if (document.visibilityState !== "visible") return;
    last = Date.now();
    try {
      applyPublicStatus(await fetchStatus());
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
