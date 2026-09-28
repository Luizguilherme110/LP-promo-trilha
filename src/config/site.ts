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
 * TOAST DE ATIVIDADE / DEMONSTRAÇÃO
 * ============================================================
 *
 * Os dados abaixo são somente para demonstração visual/local.
 *
 * Em produção, com `TOAST_DEMO_MODE = false`, essa lista NÃO
 * deve ser exibida.
 *
 * Futuramente essa estrutura poderá ser substituída por dados
 * reais do backend.
 */
export const TOAST_DEMO_MODE = true;

export const TOAST_NOTIFICATIONS: ReadonlyArray<{
  name: string;
  time: string;
}> = [
    { name: "João Pedro", time: "há 2 minutos" },
    { name: "Lucas Gabriel", time: "há 4 minutos" },
    { name: "Matheus Martins", time: "agora mesmo" },
    { name: "Bruno Almeida", time: "há 1 minuto" },
    { name: "Rafael Souza", time: "há 5 minutos" },
    { name: "Carlos Ribeiro", time: "agora mesmo" },
    { name: "Gabriel Costa", time: "há 2 minutos" },
    { name: "Pedro Rocha", time: "há 4 minutos" },
    { name: "Gustavo Mendes", time: "agora mesmo" },
    { name: "Felipe Carvalho", time: "há 3 minutos" },
    { name: "André Oliveira", time: "há 1 minuto" },
    { name: "Diego Moreira", time: "agora mesmo" },
    { name: "Victor Nunes", time: "há 2 minutos" },
    { name: "Thiago Ferreira", time: "há 6 minutos" },
    { name: "Leonardo Barbosa", time: "há 3 minutos" },
    { name: "Eduardo Teixeira", time: "agora mesmo" },
    { name: "Caio Cardoso", time: "há 4 minutos" },
    { name: "Nicolas Azevedo", time: "há 2 minutos" },
    { name: "Rodrigo Freitas", time: "agora mesmo" },
    { name: "Yago Andrade", time: "há 1 minuto" },
  ];

/**
 * Texto da demonstração.
 */
export const TOAST_MESSAGE = "Acabou de entrar no grupo";

/**
 * Timings do PromoToast.
 */
export const TOAST_FIRST_DELAY_MS = 2_500;
export const TOAST_SHOW_MS = 4_500;
export const TOAST_MIN_GAP_MS = 15_000;
export const TOAST_MAX_GAP_MS = 24_000;

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