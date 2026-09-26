import { useEffect, useState } from "react";
import { getSlots, onSlots, visibleRemainingSlots } from "@/lib/activity";

/**
 * "🔥 Restam N vagas" — só com capacidade REAL (hasRealCapacity === true e
 * números coerentes, ver config/site.ts). Sem isso, não renderiza nada.
 */
export function SlotsNotice() {
  const [state, setState] = useState(getSlots);
  useEffect(() => onSlots(setState), []);

  const remaining = visibleRemainingSlots(state);
  if (remaining === null) return null;

  const filled = state.currentGroupMembers! / state.groupCapacity!;

  return (
    <div className="mt-4 border-t border-highlight/20 pt-4" aria-label="Vagas no grupo">
      <p className="font-display text-lg font-bold tracking-wide uppercase">
        <span aria-hidden="true">🔥</span>{" "}
        {remaining > 0 ? (
          <>
            {remaining === 1 ? "Resta" : "Restam"}{" "}
            <span className="text-highlight">{remaining.toLocaleString("pt-BR")}</span>{" "}
            {remaining === 1 ? "vaga" : "vagas"} no grupo
          </>
        ) : (
          "Grupo cheio no momento"
        )}
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/30"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-highlight"
          style={{ width: `${Math.round(filled * 100)}%` }}
        />
      </div>
    </div>
  );
}
