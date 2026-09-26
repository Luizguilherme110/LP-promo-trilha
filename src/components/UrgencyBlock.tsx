import { useEffect, useRef } from "react";
import { SlotsNotice } from "@/components/SlotsNotice";
import { trackOncePerVisit } from "@/lib/tracking";

/**
 * Urgência sem inventar escassez: sem cronômetro, sem número falso.
 * As vagas só aparecem aqui dentro quando houver capacidade real.
 */
export function UrgencyBlock() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        trackOncePerVisit("urgency_block_view");
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="mt-12 rounded-xl border border-highlight/40 bg-highlight/10 p-5 sm:p-6"
    >
      <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-highlight uppercase">
        <span aria-hidden="true">⏳</span> Atenção
      </p>
      <h2 className="mt-2 font-display text-2xl leading-tight font-extrabold uppercase sm:text-3xl">
        Ofertas podem mudar <span className="text-highlight">rapidamente</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Alguns cupons e promoções podem acabar ou mudar sem aviso. No grupo, você recebe assim que
        elas são publicadas.
      </p>
      <SlotsNotice />
    </section>
  );
}
