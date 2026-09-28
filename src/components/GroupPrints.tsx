import print1_240 from "@/assets/print-grupo-1-240.webp";
import print1_480 from "@/assets/print-grupo-1-480.webp";
import print2_240 from "@/assets/print-grupo-2-240.webp";
import print2_480 from "@/assets/print-grupo-2-480.webp";
import print3_240 from "@/assets/print-grupo-3-240.webp";
import print3_480 from "@/assets/print-grupo-3-480.webp";
import print4_240 from "@/assets/print-grupo-4-240.webp";
import print4_480 from "@/assets/print-grupo-4-480.webp";
import print5_240 from "@/assets/print-grupo-5-240.webp";
import print5_480 from "@/assets/print-grupo-5-480.webp";
import print6_240 from "@/assets/print-grupo-6-240.webp";
import print6_480 from "@/assets/print-grupo-6-480.webp";

// Prints reais do grupo (2026-09-27). No cabeçalho, a linha com nomes de membros foi tapada.
const PRINTS = [
  { s: print1_240, l: print1_480, alt: "bota motocross Thor Blitz XR por R$ 1.179,00" },
  { s: print2_240, l: print2_480, alt: "kit de ferramentas com 46 peças por R$ 27,50" },
  { s: print3_240, l: print3_480, alt: "pneu Borilli aro 21 7 Days Enduro por R$ 366,69" },
  { s: print4_240, l: print4_480, alt: "shampoo automotivo Sandet Det Mol 5 L por R$ 129,90" },
  { s: print5_240, l: print5_480, alt: "horímetro digital para moto por R$ 49,90" },
  { s: print6_240, l: print6_480, alt: "pneu Borilli EXC 110/100-18 por R$ 358 no pix" },
];

function PrintSet({ copy }: { copy: boolean }) {
  return (
    // pr em vez de gap: as duas cópias precisam ter largura idêntica pro loop em -50% não pular.
    <ul aria-hidden={copy || undefined} className={`flex shrink-0 ${copy ? "motion-reduce:hidden" : ""}`}>
      {PRINTS.map((p, i) => (
        <li key={i} className="shrink-0 pr-3 md:pr-4">
          <img
            src={p.l}
            srcSet={`${p.s} 240w, ${p.l} 480w`}
            sizes="(min-width: 768px) 224px, 184px"
            alt={copy ? "" : `Oferta publicada no grupo: ${p.alt}`}
            width={480}
            height={826}
            decoding="async"
            className="aspect-[7/12] w-46 rounded-2xl border border-border bg-surface object-cover object-top shadow-lg md:w-56"
          />
        </li>
      ))}
    </ul>
  );
}

/** Carrossel contínuo dos prints do grupo, com fade nas bordas. Sem JS: só CSS. */
export function GroupPrints({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="fade-x -mx-5 overflow-hidden motion-reduce:overflow-x-auto md:mx-0">
        <div className="marquee flex w-max">
          <PrintSet copy={false} />
          <PrintSet copy />
        </div>
      </div>
      <figcaption className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-highlight" />
        Ofertas reais publicadas no grupo
      </figcaption>
    </figure>
  );
}
