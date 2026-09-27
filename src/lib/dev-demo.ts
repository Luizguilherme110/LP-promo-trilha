/**
 * SOMENTE DESENVOLVIMENTO (`vite dev`). Importado atrás de `import.meta.env.DEV`,
 * então não entra no build de produção.
 *
 * Serve para conferir o visual do componente que, em produção, depende de dado real:
 *   ?demo_slots=1  -> vagas com números de EXEMPLO (7 -> 6), liga também as frases
 *                     de escassez da faixa do topo
 */
import { setSlots } from "./activity";

export function runDevDemo() {
  const q = new URLSearchParams(window.location.search);
  if (q.has("demo_slots")) {
    setSlots({ hasRealCapacity: true, groupCapacity: 1024, currentGroupMembers: 1017 });
    // simula uma atualização real chegando depois (membro novo): 7 -> 6
    setTimeout(() => setSlots({ currentGroupMembers: 1018 }), 4000);
  }
}
