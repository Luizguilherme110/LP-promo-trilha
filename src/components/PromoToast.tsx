import { useEffect, useRef, useState } from "react";
import { TOAST_PHRASES } from "@/config/site";
import { trackEvent } from "@/lib/tracking";

const FIRST_DELAY_MS = 5000;
const SHOW_MS = 4500;
const GAP_MS = 9000; // intervalo entre uma frase e a próxima
const RETRY_MS = 1500; // espera quando o toast cobriria um CTA

// Folga acima do toast na checagem: cobre o deslocamento da animação de entrada
// (translate-y-3 = 12px para baixo enquanto invisível) + um respiro até o botão.
// Embaixo não precisa: visível, o toast só sobe (e o CTA fixo fica logo abaixo).
const SAFE_GAP_PX = 20;

/** true se o toast (com folga) cobre algum CTA do WhatsApp visível. */
function coversCta(box: DOMRect): boolean {
  const top = box.top - SAFE_GAP_PX;
  return [...document.querySelectorAll<HTMLElement>("[data-wa-cta]")].some((el) => {
    if (el.closest('[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    return r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > top;
  });
}

/**
 * Toast discreto no canto inferior com frases de chamada fixas (TOAST_PHRASES),
 * em rotação — sem eventos, sem nomes, sem afirmar nada que não aconteceu.
 * No mobile fica acima do CTA fixo; no desktop, canto inferior esquerdo. Nunca
 * recebe clique (pointer-events: none), nunca aparece por cima de um CTA e
 * pausa com a aba oculta.
 */
export function PromoToast() {
  const [index, setIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (TOAST_PHRASES.length === 0) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let showing = false;
    let next = 0;
    let frame = 0;

    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const clearAll = () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
    const stopWatching = () => {
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
    };
    const hide = (gap = GAP_MS) => {
      stopWatching();
      clearAll();
      showing = false;
      setVisible(false);
      later(prepare, gap);
    };
    // Enquanto visível: se a rolagem trouxer um CTA para baixo do toast, ele sai.
    function onMove() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (showing && box.current && coversCta(box.current.getBoundingClientRect())) hide();
      });
    }
    const tryShow = (i: number) => {
      const el = box.current;
      if (!el) return later(() => tryShow(i), 50);
      if (document.visibilityState !== "visible" || coversCta(el.getBoundingClientRect())) {
        return later(() => tryShow(i), RETRY_MS);
      }
      showing = true;
      setVisible(true);
      trackEvent("activity_toast_view", { toast_index: i, toast_title: TOAST_PHRASES[i]!.title });
      window.addEventListener("scroll", onMove, { passive: true });
      window.addEventListener("resize", onMove, { passive: true });
      later(() => hide(), SHOW_MS);
    };
    // Troca o conteúdo ainda invisível, espera renderizar e só então mede/mostra.
    function prepare() {
      const i = next % TOAST_PHRASES.length;
      next += 1;
      setIndex(i);
      later(() => tryShow(i), 50);
    }

    later(prepare, FIRST_DELAY_MS);

    // Só em `vite dev`: testes locais pedem a próxima frase na hora.
    const devNext = () => {
      if (!showing) {
        clearAll();
        prepare();
      }
    };
    if (import.meta.env.DEV) window.addEventListener("pdt-toast-next", devNext);

    return () => {
      clearAll();
      stopWatching();
      if (frame) cancelAnimationFrame(frame);
      if (import.meta.env.DEV) window.removeEventListener("pdt-toast-next", devNext);
    };
  }, []);

  const phrase = index >= 0 ? TOAST_PHRASES[index] : undefined;
  if (!phrase) return null;

  return (
    <div
      ref={box}
      role="status"
      aria-live="off"
      aria-hidden={!visible}
      className={`pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-40 max-w-[calc(100vw-1.5rem)] transition-[opacity,transform] duration-300 ease-out md:bottom-6 md:left-6 md:max-w-xs ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface py-2.5 pr-5 pl-2.5 shadow-lg shadow-black/30">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-lg"
        >
          {phrase.icon}
        </span>
        <p className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold">{phrase.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{phrase.line}</span>
        </p>
      </div>
    </div>
  );
}
