import { useEffect, useRef, useState } from "react";
import { TOAST_PHRASES } from "@/config/site";
import { trackEvent } from "@/lib/tracking";

const FIRST_DELAY_MS = 2500;
const SHOW_MS = 4500;
const MIN_GAP_MS = 15000;
const MAX_GAP_MS = 24000;
const RETRY_MS = 1500;
const SAFE_GAP_PX = 20;

function coversCta(box: DOMRect): boolean {
  const top = box.top - SAFE_GAP_PX;

  return [...document.querySelectorAll<HTMLElement>("[data-wa-cta]")].some(
    (el) => {
      if (el.closest('[aria-hidden="true"]')) return false;

      const r = el.getBoundingClientRect();

      return (
        r.left < box.right &&
        r.right > box.left &&
        r.top < box.bottom &&
        r.bottom > top
      );
    },
  );
}

export function PromoToast() {
  const [index, setIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (TOAST_PHRASES.length === 0 || dismissed) return;

    const timers = new Set<ReturnType<typeof setTimeout>>();

    let showing = false;
    let nextIndex = 0;
    let frame = 0;

    const schedule = (fn: () => void, ms: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);

      timers.add(timer);
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

        if (
          showing &&
          box.current &&
          coversCta(box.current.getBoundingClientRect())
        ) {
          hide();
        }
      });
    };

    const tryShow = (i: number) => {
      const el = box.current;

      if (!el) {
        schedule(() => tryShow(i), 50);
        return;
      }

      if (
        document.visibilityState !== "visible" ||
        coversCta(el.getBoundingClientRect())
      ) {
        schedule(() => tryShow(i), RETRY_MS);
        return;
      }

      showing = true;
      setVisible(true);

      trackEvent("activity_toast_view", {
        toast_index: i,
        toast_title: TOAST_PHRASES[i]!.title,
      });

      window.addEventListener("scroll", onMove, { passive: true });
      window.addEventListener("resize", onMove, { passive: true });

      schedule(() => hide(), SHOW_MS);
    };

    const prepare = () => {
      const i = nextIndex % TOAST_PHRASES.length;
      nextIndex += 1;

      setIndex(i);

      schedule(() => tryShow(i), 50);
    };

    const randomGap = () =>
      Math.floor(Math.random() * (MAX_GAP_MS - MIN_GAP_MS + 1)) +
      MIN_GAP_MS;

    const handleVisibility = () => {
      if (document.visibilityState !== "visible" && showing) {
        hide(0);
      }
    };

    schedule(prepare, FIRST_DELAY_MS);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimers();
      stopWatching();

      if (frame) {
        cancelAnimationFrame(frame);
      }

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dismissed]);

  const toast = index >= 0 ? TOAST_PHRASES[index] : undefined;

  if (!toast || dismissed) return null;

  return (
    <div
      ref={box}
      role="status"
      aria-live="off"
      aria-hidden={!visible}
      className={`pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 z-40 max-w-[calc(100vw-1.5rem)] transition-[opacity,transform] duration-500 ease-out md:bottom-6 md:left-6 md:max-w-xs ${visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
        }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface py-2.5 pr-5 pl-2.5 shadow-lg shadow-black/30">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-lg"
        >
          {toast.icon}
        </span>

        <p className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold">
            {toast.title}
          </span>

          <span className="mt-0.5 block text-xs text-muted-foreground">
            {toast.line}
          </span>
        </p>

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setVisible(false);
          }}
          // Invisível = não recebe toque nem foco (senão fica um ✕ fantasma no canto).
          tabIndex={visible ? 0 : -1}
          className={`${visible ? "pointer-events-auto" : "pointer-events-none"} shrink-0 border-none bg-transparent p-1 text-base text-white/40 transition-colors hover:text-white`}
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </div>
  );
}