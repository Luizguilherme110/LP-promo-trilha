import { useEffect, useRef, useState } from "react";
import {
  TOAST_DEMO_MODE,
  TOAST_NOTIFICATIONS,
  TOAST_FIRST_DELAY_MS,
  TOAST_SHOW_MS,
  TOAST_MIN_GAP_MS,
  TOAST_MAX_GAP_MS,
} from "@/config/site";
import { trackEvent } from "@/lib/tracking";

const items = TOAST_NOTIFICATIONS;

const RETRY_MS = 1500;
const SAFE_GAP_PX = 20;

function coversCta(box: DOMRect): boolean {
  const top = box.top - SAFE_GAP_PX;
  return [...document.querySelectorAll<HTMLElement>("[data-wa-cta]")].some((el) => {
    if (el.closest('[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    return r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > top;
  });
}

/** Fisher–Yates; evita que o 1º item repita o último mostrado. */
function shuffle(length: number, avoidFirst: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  if (arr.length > 1 && arr[0] === avoidFirst) {
    const k = 1 + Math.floor(Math.random() * (arr.length - 1));
    [arr[0], arr[k]] = [arr[k]!, arr[0]!];
  }
  return arr;
}

const randomGap = () => Math.floor(Math.random() * (TOAST_MAX_GAP_MS - TOAST_MIN_GAP_MS + 1)) + TOAST_MIN_GAP_MS;

export function PromoToast() {
  const [index, setIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const orderRef = useRef<number[]>([]);
  const positionRef = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const timers = new Set<ReturnType<typeof setTimeout>>();
    let showing = false;
    let frame = 0;
    let last = -1;
    let pausedTask: (() => void) | null = null;

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        // Aba oculta: não consome timers; retoma ao voltar.
        if (document.visibilityState !== "visible") {
          pausedTask = fn;
          return;
        }
        fn();
      }, ms);
      timers.add(t);
    };
    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };

    const stopWatching = () => {
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
    };

    const hide = (gap = randomGap()) => {
      stopWatching();
      showing = false;
      setVisible(false);
      clearTimers();
      schedule(prepare, gap);
    };

    const onMove = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (showing && box.current && coversCta(box.current.getBoundingClientRect())) hide();
      });
    };

    const tryShow = (i: number) => {
      const el = box.current;
      if (!el) return schedule(() => tryShow(i), 50);
      if (coversCta(el.getBoundingClientRect())) return schedule(() => tryShow(i), RETRY_MS);

      showing = true;
      setVisible(true);
      trackEvent("activity_toast_view", { toast_index: i });
      window.addEventListener("scroll", onMove, { passive: true });
      window.addEventListener("resize", onMove, { passive: true });
      schedule(() => hide(), TOAST_SHOW_MS);
    };

    const prepare = () => {
      if (positionRef.current >= orderRef.current.length) {
        orderRef.current = shuffle(items.length, last);
        positionRef.current = 0;
      }
      const i = orderRef.current[positionRef.current]!;
      positionRef.current += 1;
      last = i;
      setIndex(i);
      schedule(() => tryShow(i), 50);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        if (showing) {
          stopWatching();
          showing = false;
          setVisible(false);
          clearTimers();
          pausedTask = prepare;
        }
        return;
      }
      if (pausedTask) {
        const fn = pausedTask;
        pausedTask = null;
        clearTimers();
        schedule(fn, fn === prepare ? randomGap() : 0);
      }
    };

    orderRef.current = [];
    positionRef.current = 0;
    schedule(prepare, TOAST_FIRST_DELAY_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimers();
      stopWatching();
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (items.length === 0) return null;

  const currentToast = index >= 0 ? items[index] : undefined;
  if (!currentToast) return null;

  return (
    <div
      ref={box}
      role="status"
      aria-live="off"
      aria-hidden={!visible}
      className={`pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-40 max-w-[calc(100vw-1.5rem)] transition-[opacity,transform] duration-500 ease-out md:bottom-6 md:left-6 md:max-w-xs ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface py-2.5 pr-3 pl-2.5 shadow-lg shadow-black/30">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-lg font-bold text-brand-foreground"
        >
          ✓
        </span>
        <p className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold text-foreground">{currentToast.name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">Acabou de entrar no grupo</span>
        </p>
      </div>
    </div>
  );
}
