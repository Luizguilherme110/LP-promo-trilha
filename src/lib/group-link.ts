/**
 * Link atual do grupo, vindo do servidor da Central (/go/<slug>?formato=json).
 *
 * Quando um convite cai (ex.: suspenso pelo WhatsApp), troca-se o destino na
 * aba Links do painel e a LP passa a usar o novo — sem republicar na Lovable.
 *
 * Nunca bloqueia a página: começa com WHATSAPP_GROUP_URL (site.ts) e só troca
 * se o servidor responder a tempo com um convite válido. Servidor fora = o link
 * fixo continua funcionando.
 */
import { GROUP_LINK_ENDPOINT, WHATSAPP_GROUP_URL } from "@/config/site";

const TIMEOUT_MS = 3000;
const RE_CONVITE = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}$/;

let atual = WHATSAPP_GROUP_URL;
let iniciado = false;

/** Link a usar no clique agora. */
export function groupLink(): string {
  return atual;
}

/** Pergunta o link atual ao servidor (1x por carregamento). */
export function resolveGroupLink(): void {
  if (iniciado || !GROUP_LINK_ENDPOINT || typeof window === "undefined") return;
  iniciado = true;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  fetch(GROUP_LINK_ENDPOINT, { signal: ctrl.signal, cache: "no-store", credentials: "omit" })
    .then((r): Promise<unknown> | null => (r.ok ? r.json() : null))
    .then((d) => {
      const bruto = d && typeof d === "object" ? (d as { url?: unknown }).url : undefined;
      const url = typeof bruto === "string" ? bruto.trim() : "";
      if (RE_CONVITE.test(url)) atual = url;
    })
    .catch(() => {
      /* servidor fora/lento: segue com o link fixo */
    })
    .finally(() => window.clearTimeout(timer));
}
