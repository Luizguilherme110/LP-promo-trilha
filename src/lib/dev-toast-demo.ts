/**
 * SOMENTE DESENVOLVIMENTO / DEMONSTRAÇÃO VISUAL.
 *
 * Nomes e horários FICTÍCIOS para conferir o visual do PromoToast em `vite dev`.
 * O PromoToast só importa este arquivo com TOAST_DEMO_MODE = true E
 * `import.meta.env.DEV`; no build de produção esse import é removido, então
 * nada daqui chega ao site publicado. Nunca usar como prova social real.
 */
import type { ToastItem } from "@/config/site";

const DEMO_MESSAGE = "Acabou de entrar no grupo";

export const TOAST_NOTIFICATIONS: ReadonlyArray<{ name: string; time: string }> = [
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

export const DEMO_TOAST_ITEMS: ReadonlyArray<ToastItem> = TOAST_NOTIFICATIONS.map(
  ({ name, time }) => ({ icon: "✓", title: name, line: DEMO_MESSAGE, meta: time }),
);
