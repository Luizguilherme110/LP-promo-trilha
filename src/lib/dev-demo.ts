/**
 * SOMENTE DESENVOLVIMENTO (`vite dev`). Importado atrás de `import.meta.env.DEV`,
 * então não entra no build de produção.
 *
 * Serve para conferir o visual dos componentes que, em produção, dependem de
 * dado real:
 *   ?demo_toast=1  -> três toasts em sequência (textos de exemplo, só dev)
 *   ?demo_slots=1  -> barra de vagas com números de exemplo
 */
import { setSlots, showActivityToast } from "./activity";

export function runDevDemo() {
  const q = new URLSearchParams(window.location.search);
  // Para testes locais dispararem toasts em posições específicas da página.
  (window as Window & { __pdtShowToast?: typeof showActivityToast }).__pdtShowToast =
    showActivityToast;
  if (q.has("demo_toast")) {
    showActivityToast({ type: "new_offer", timestamp: Date.now() - 3 * 60_000 });
    showActivityToast({
      type: "new_offer",
      text: "Nova promoção foi publicada",
      timestamp: Date.now() - 60_000,
    });
    showActivityToast({ type: "new_member", timestamp: Date.now() - 20_000 });
  }
  if (q.has("demo_slots")) {
    setSlots({ hasRealCapacity: true, groupCapacity: 1024, currentGroupMembers: 1017 });
  }
}
