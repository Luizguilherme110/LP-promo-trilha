import { useEffect, useRef, useState } from "react";
import { formatActivity, onActivity, type ValidActivity } from "@/lib/activity";

const SHOW_MS = 5000;
const GAP_MS = 1200;

/**
 * Toast discreto: topo no mobile (embaixo ficam o CTA fixo e os botões), canto
 * inferior esquerdo no desktop. Só renderiza quando recebe um evento real
 * via showActivityToast(); sem evento, não existe nada na tela.
 */
export function ActivityToast() {
  const [current, setCurrent] = useState<ValidActivity | null>(null);
  const [visible, setVisible] = useState(false);
  const queue = useRef<ValidActivity[]>([]);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    const later = (fn: () => void, ms: number) => pending.push(setTimeout(fn, ms));
    const next = () => {
      const item = queue.current.shift();
      if (!item) {
        busy.current = false;
        return;
      }
      busy.current = true;
      setCurrent(item);
      later(() => setVisible(true), 20);
      later(() => {
        setVisible(false);
        later(next, GAP_MS);
      }, SHOW_MS);
    };
    const off = onActivity((a) => {
      if (queue.current.length >= 3) return;
      queue.current.push(a);
      if (!busy.current) next();
    });
    return () => {
      off();
      pending.forEach(clearTimeout);
    };
  }, []);

  if (!current) return null;
  const { icon, text, ago } = formatActivity(current);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-[calc(0.75rem+env(safe-area-inset-top))] left-3 z-40 max-w-[calc(100vw-1.5rem)] transition-all duration-300 md:top-auto md:bottom-6 md:left-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0 md:translate-y-2"
      }`}
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface py-2.5 pr-2 pl-3 text-sm shadow-lg shadow-black/30">
        <span aria-hidden="true" className="text-base">
          {icon}
        </span>
        <p className="min-w-0 leading-snug">
          <span className="font-semibold">{text}</span>
          <span className="block text-xs text-muted-foreground">{ago}</span>
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fechar aviso"
          className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
