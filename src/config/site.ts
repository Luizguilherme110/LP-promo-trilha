/**
 * Configuração central do site. Edite aqui, não nos componentes.
 *
 * ATENÇÃO: tudo neste arquivo vai para o navegador (a LP é pública).
 * Nunca coloque aqui service key, senha do painel, token administrativo,
 * segredo do Supabase ou credencial de banco.
 */

export const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/JQO7Au2ccCQF2C3K1E6lZd";

/** ID público do Meta Pixel (não é segredo). */
export const META_PIXEL_ID = "1100437415798248";

export const SITE_NAME = "Promoção do Trilheiro";

/** Identificador desta LP nos eventos. */
export const LP_SLUG = "promocao-do-trilheiro";

/**
 * URL pública final da LP, sem barra no fim.
 * Vazio = og:url, og:image e canonical não são emitidos.
 */
export const SITE_URL = "";

/**
 * Endpoint público de analytics.
 * Vazio = nenhuma chamada externa.
 */
export const ANALYTICS_ENDPOINT = "";

/**
 * Endpoint público de status com dados reais do grupo.
 *
 * Resposta esperada:
 * {
 *   groupCapacity?: number,
 *   currentGroupMembers?: number,
 *   hasRealCapacity?: boolean
 * }
 *
 * Vazio = componente de vagas desativado.
 */
export const PUBLIC_STATUS_ENDPOINT = "";

/** Intervalo de atualização do status público. */
export const PUBLIC_STATUS_REFRESH_MS = 60_000;

/**
 * ============================================================
 * TOAST (PromoToast)
 * ============================================================
 *
 * Duas fontes de conteúdo, separadas:
 * - PÚBLICA (site publicado): TOAST_PHRASES, logo abaixo. Frases de chamada
 *   verdadeiras sobre o grupo — não são eventos nem pessoas.
 * - DEMONSTRAÇÃO (só `vite dev`): nomes/horários FICTÍCIOS em
 *   lib/dev-toast-demo.ts. Usada só com TOAST_DEMO_MODE = true E em
 *   desenvolvimento; não entra no build de produção. Nunca é prova social real.
 */
export const TOAST_DEMO_MODE = true;

export type ToastItem = {
  icon: string;
  title: string;
  line: string;
  /** Linha extra opcional (ex.: horário, só na demonstração). */
  meta?: string;
};

/**
 * Timings do PromoToast.
 */
export const TOAST_FIRST_DELAY_MS = 2_500;
export const TOAST_SHOW_MS = 4_500;
export const TOAST_MIN_GAP_MS = 15_000;
export const TOAST_MAX_GAP_MS = 24_000;

/** Conteúdo PÚBLICO do toast (é o que aparece no site publicado). */
export const TOAST_PHRASES: ReadonlyArray<ToastItem> = [
  { icon: "🔥", title: "Novas ofertas todo dia", line: "direto no WhatsApp" },
  { icon: "🎟️", title: "Cupons e descontos", line: "publicados no grupo" },
  { icon: "✅", title: "Entrar é grátis", line: "é só tocar no botão verde" },
  { icon: "🏍️", title: "Peças, pneus e equipamentos", line: "para trilha, enduro e motocross" },
  { icon: "⚡", title: "Promoções podem acabar rápido", line: "entre para não perder" },
];

/**
 * Vagas restantes:
 *
 * remainingSlots =
 *   groupCapacity - currentGroupMembers
 *
 * Só ativar quando os valores vierem de uma fonte real
 * e confiável.
 */
export const HAS_REAL_CAPACITY = false;

export const GROUP_CAPACITY: number | null = null;

export const CURRENT_GROUP_MEMBERS: number | null = null;

/**
 * Quando as vagas reais restantes ficarem abaixo deste limite,
 * a LP pode ativar mensagens específicas de urgência.
 */
export const LOW_SLOTS_THRESHOLD = 50;