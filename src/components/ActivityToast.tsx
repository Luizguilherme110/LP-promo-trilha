import { useEffect, useRef, useState } from "react";
import { formatActivity, onActivity, type ValidActivity } from "@/lib/activity";
import { trackEvent } from "@/lib/tracking";

const SHOW_MS = 4500;
const GAP_MS = 8000; // intervalo entre toasts em sequência
const RETRY_MS = 1500; // espera quando o toast cobriria um CTA
const MAX_RETRIES = 20;
const MAX_QUEUE = 3;

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
 * Toast discreto no canto inferior: no mobile fica acima do CTA fixo; no desktop,
 * canto inferior esquerdo. Nunca recebe clique (pointer-events: none), nunca
 * aparece por cima de um CTA e mostra um por vez. Só existe quando recebe um
 * evento REAL via showActivityToast(); sem evento, nada é renderizado.
 */
export function ActivityToast() {
  const [current, setCurrent] = useState<ValidActivity | null>(null);
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const queue: ValidActivity[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let busy = false;
    let showing: ValidActivity | null = null;
    let frame = 0;

    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const stopWatching = () => {
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
    };
    const hide = () => {
      stopWatching();
      timers.forEach(clearTimeout);
      timers.clear();
      showing = null;
      setVisible(false);
      later(next, GAP_MS);
    };
    // Enquanto visível: se a rolagem trouxer um CTA para baixo do toast, ele sai.
    function onMove() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (showing && box.current && coversCta(box.current.getBoundingClientRect())) hide();
      });
    }
    const tryShow = (item: ValidActivity, attempt: number) => {
      const el = box.current;
      if (!el) return later(() => tryShow(item, attempt), 50);
      if (coversCta(el.getBoundingClientRect())) {
        if (attempt >= MAX_RETRIES) return next(); // desiste deste, segue a fila
        return later(() => tryShow(item, attempt + 1), RETRY_MS);
      }
      showing = item;
      setVisible(true);
      trackEvent("activity_toast_view", {
        activity_type: item.type,
        activity_has_name: !!item.firstName, // o nome em si nunca vai pro analytics
        activity_age_min: Math.max(0, Math.floor((Date.now() - item.at) / 60_000)),
      });
      window.addEventListener("scroll", onMove, { passive: true });
      window.addEventListener("resize", onMove, { passive: true });
      later(hide, SHOW_MS);
    };
    function next() {
      const item = queue.shift();
      if (!item) {
        busy = false;
        return;
      }
      busy = true;
      setCurrent(item);
      later(() => tryShow(item, 0), 50); // espera renderizar (invisível) pra medir
    }

    const off = onActivity((a) => {
      if (queue.length >= MAX_QUEUE) return;
      queue.push(a);
      if (!busy) next();
    });
    return () => {
      off();
      stopWatching();
      timers.forEach(clearTimeout);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (!current) return null;
  const { avatar, title, line } = formatActivity(current);
  const isInitial = current.type === "new_member" && !!current.firstName;

  return (
    <div
      ref={box}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-40 max-w-[calc(100vw-1.5rem)] transition-[opacity,transform] duration-300 ease-out md:bottom-6 md:left-6 md:max-w-xs ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface py-2.5 pr-5 pl-2.5 shadow-lg shadow-black/30">
        <span
          aria-hidden="true"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            isInitial
              ? "bg-brand font-display text-lg font-bold text-brand-foreground"
              : "bg-background text-lg"
          }`}
        >
          {avatar}
        </span>
        <p className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{line}</span>
        </p>
      </div>
    </div>
  );
}
