/**
 * Configuração central do site. Edite aqui, não nos componentes.
 *
 * ATENÇÃO: tudo neste arquivo vai para o navegador (a LP é pública).
 * Nunca coloque aqui service key, senha do painel, token administrativo,
 * segredo do Supabase ou credencial de banco.
 */

export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/JQO7Au2ccCQF2C3K1E6lZd";

/** ID público do Meta Pixel (não é segredo). */
export const META_PIXEL_ID = "1100437415798248";

export const SITE_NAME = "Promoção do Trilheiro";

/** Identificador desta LP nos eventos (casa com o slug de links da Central). */
export const LP_SLUG = "promocao-do-trilheiro";

/**
 * URL pública final da LP, sem barra no fim (ex.: "https://trilheiro.com.br").
 * Vazio = og:url, og:image e canonical não são emitidos (exigem URL absoluta).
 */
export const SITE_URL = "";

/**
 * Endpoint público de analytics (POST, corpo JSON enviado como text/plain).
 * Vazio = nenhuma chamada externa; em desenvolvimento os eventos só vão pro console.
 * Só use um endpoint que NÃO exija credencial no navegador.
 */
export const ANALYTICS_ENDPOINT = "";

/**
 * Endpoint público de status (GET) com dados REAIS do grupo:
 *   { recentActivity?: [{ type: "new_member" | "new_offer", timestamp, text? }],
 *     groupCapacity?: number, currentGroupMembers?: number }
 * Vazio = sem toasts de atividade e sem vagas. Lido uma única vez por carregamento.
 */
export const PUBLIC_STATUS_ENDPOINT = "";

/** Atividade mais antiga que isso não é exibida como "recente". */
export const ACTIVITY_MAX_AGE_MIN = 180;

/**
 * Atividade recente REAL (opcional, além do endpoint). Vazio = nenhum toast.
 * Formato: { type: "new_member" | "new_offer", timestamp, text? }.
 * Nunca colocar aqui evento inventado, nome de pessoa ou dado pessoal.
 */
export const RECENT_ACTIVITY: ReadonlyArray<{
  type: "new_member" | "new_offer";
  timestamp: string | number;
  text?: string;
}> = [];

/**
 * Vagas restantes (remainingSlots = groupCapacity - currentGroupMembers).
 * hasRealCapacity: só ligue quando os dois números vierem de uma fonte REAL e
 * confiável. false (ou dado inválido) = o componente não aparece.
 */
export const HAS_REAL_CAPACITY = false;
export const GROUP_CAPACITY: number | null = null;
export const CURRENT_GROUP_MEMBERS: number | null = null;
