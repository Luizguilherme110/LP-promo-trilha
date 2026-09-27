import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSlots, onSlots, visibleRemainingSlots } from "@/lib/activity";
import { trackOncePerVisit } from "@/lib/tracking";

/**
 * "⏳ Vagas restantes: N" (ícone de relógio, como na referência) — só com capacidade REAL (hasRealCapacity === true e
 * números coerentes, ver config/site.ts). Atualiza sozinho quando o status real
 * muda. Sem isso, não renderiza nada.
 */
export function SlotsNotice({ className = "" }: { className?: string }) {
  const [state, setState] = useState(getSlots);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => onSlots(setState), []);

  const remaining = visibleRemainingSlots(state);

  useEffect(() => {
    const el = ref.current;
    if (remaining === null || !el || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        trackOncePerVisit("capacity_notice_view", { remaining_slots: remaining });
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [remaining]);

  if (remaining === null) return null;

  return (
    <div
      ref={ref}
      aria-label="Vagas no grupo"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 rounded-xl border border-highlight/40 bg-highlight/10 px-5 py-3 ${className}`}
    >
      <Clock aria-hidden="true" className="h-5 w-5 shrink-0 text-highlight" />
      {remaining > 0 ? (
        <p className="text-base font-semibold">
          <span aria-hidden="true">⏳</span> Vagas restantes:{" "}
          <span className="text-2xl leading-none font-extrabold text-highlight tabular-nums">
            {remaining.toLocaleString("pt-BR")}
          </span>
        </p>
      ) : (
        <p className="text-base font-semibold">Grupo cheio no momento</p>
      )}
    </div>
  );
}
