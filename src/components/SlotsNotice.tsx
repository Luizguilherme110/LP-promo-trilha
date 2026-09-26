import { useEffect, useState } from "react";
import { computeRemainingSlots, getSlots, onSlots } from "@/lib/activity";

/**
 * Vagas restantes no grupo. Fica OCULTO enquanto não houver capacidade e
 * número de membros reais (e SLOTS_ENABLED ligado em config/site.ts).
 */
export function SlotsNotice() {
  const [state, setState] = useState(getSlots);
  useEffect(() => onSlots(setState), []);

  const remaining = computeRemainingSlots(state.groupCapacity, state.currentGroupMembers);
  if (!state.enabled || remaining === null) return null;

  const filled = state.currentGroupMembers! / state.groupCapacity!;

  return (
    <section className="mt-10" aria-label="Vagas no grupo">
      <p className="font-display text-lg font-bold tracking-wide uppercase">
        {remaining > 0 ? (
          <>
            <span className="text-highlight">{remaining.toLocaleString("pt-BR")}</span>{" "}
            {remaining === 1 ? "vaga restante" : "vagas restantes"} no grupo
          </>
        ) : (
          "Grupo cheio no momento"
        )}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface" aria-hidden="true">
        <div
          className="h-full rounded-full bg-highlight"
          style={{ width: `${Math.round(filled * 100)}%` }}
        />
      </div>
    </section>
  );
}
