import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSlots, onSlots, visibleRemainingSlots } from "@/lib/activity";
import { trackOncePerVisit } from "@/lib/tracking";

const SYNTHETIC_START = 7;
const SYNTHETIC_FLOOR = 2;
const SYNTHETIC_STEP_MS = 8_000;

/**
 * "⏳ Vagas restantes: N" (ícone de relógio, como na referência).
 * Uma capacidade real e coerente sempre tem prioridade. Sem essa integração,
 * usa a urgência visual de sessão: começa em 7 e reduz até 2 a cada 8 segundos.
 */
export function SlotsNotice({ className = "" }: { className?: string }) {
  const [state, setState] = useState(getSlots);
  const [syntheticRemaining, setSyntheticRemaining] = useState(SYNTHETIC_START);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => onSlots(setState), []);

  const realRemaining = visibleRemainingSlots(state);
  const remaining = realRemaining ?? syntheticRemaining;

  useEffect(() => {
    if (realRemaining !== null) return;
    const id = window.setInterval(() => {
      setSyntheticRemaining((current) => Math.max(SYNTHETIC_FLOOR, current - 1));
    }, SYNTHETIC_STEP_MS);
    return () => window.clearInterval(id);
  }, [realRemaining]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        trackOncePerVisit("capacity_notice_view", {
          remaining_slots: remaining,
          capacity_source: realRemaining === null ? "session_countdown" : "real",
        });
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [realRemaining, remaining]);

  return (
    <div
      ref={ref}
      aria-label="Vagas no grupo"
      aria-live="polite"
      className={`mx-auto flex w-fit items-center gap-2.5 rounded-xl border border-highlight/40 bg-highlight/10 px-5 py-3 ${className}`}
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
