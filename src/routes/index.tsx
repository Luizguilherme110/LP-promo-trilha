import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import heroImg from "@/assets/hero-trilha.jpg";
import { WhatsAppCta } from "@/components/WhatsAppCta";
import { StickyCta } from "@/components/StickyCta";
import { trackPageView } from "@/lib/tracking";

const TITLE = "Promoção do Trilheiro | Ofertas e Cupons para Trilha";
const DESCRIPTION =
  "Ofertas, cupons e promoções para trilha, enduro, motocross e off-road. Entre gratuitamente no grupo do Promoção do Trilheiro.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const BENEFITS = [
  {
    icon: "🏍️",
    title: "Produtos para trilha",
    text: "Peças, equipamentos, acessórios e produtos para o dia a dia do trilheiro.",
  },
  {
    icon: "🎟️",
    title: "Cupons e descontos",
    text: "Quando aparecer uma boa oportunidade, você recebe no grupo.",
  },
  {
    icon: "🛒",
    title: "Ofertas selecionadas",
    text: "Promoções encontradas em diferentes lojas e marketplaces.",
  },
  {
    icon: "⚡",
    title: "Acompanhe pelo WhatsApp",
    text: "As oportunidades chegam direto no grupo.",
  },
];

function Index() {
  const heroCta = useRef<HTMLDivElement>(null);
  const secondCta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackPageView();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-xl px-5 pb-28 md:max-w-3xl md:pb-16">
        {/* HERO */}
        <section className="fade-up pt-8 md:pt-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-highlight/40 bg-highlight/10 px-3 py-1 text-xs font-semibold tracking-widest text-highlight uppercase">
            <span aria-hidden="true">🔥</span> Grupo VIP gratuito
          </p>

          <h1 className="mt-5 font-display text-5xl leading-[0.95] font-extrabold tracking-tight uppercase sm:text-6xl md:text-7xl">
            Ofertas exclusivas
            <br />
            <span className="text-highlight">para trilheiros</span>
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Cupons, descontos e oportunidades em produtos para trilha, enduro e off-road.
          </p>

          <div ref={heroCta} className="mt-6">
            <WhatsAppCta location="hero">Entrar no grupo gratuito</WhatsAppCta>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <li>✓ Entrada gratuita</li>
              <li>✓ Ofertas e cupons</li>
              <li>✓ Saia quando quiser</li>
            </ul>
          </div>

          <figure className="mt-8 overflow-hidden rounded-2xl border border-border">
            <img
              src={heroImg}
              alt="Piloto de enduro acelerando em uma trilha de barro no meio da mata"
              width={1280}
              height={960}
              fetchPriority="high"
              className="h-52 w-full object-cover sm:h-64 md:h-80"
            />
          </figure>
        </section>

        {/* EXCLUSIVIDADE */}
        <section className="mt-12 border-t border-border pt-10">
          <p className="text-xs font-semibold tracking-widest text-highlight uppercase">
            <span aria-hidden="true">🔥</span> Ofertas exclusivas
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-bold uppercase sm:text-4xl">
            Promoções que fazem sentido para quem vive no off-road.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            O grupo reúne ofertas, cupons e oportunidades encontradas em produtos para trilha,
            enduro, motocross e acessórios.
          </p>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-bold tracking-wide uppercase">
            O que você recebe no grupo
          </h2>
          <ul className="mt-6 space-y-6">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface text-xl"
                >
                  {b.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-wide uppercase">
                    {b.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {b.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* URGÊNCIA */}
        <section className="mt-12 rounded-xl border-l-4 border-highlight bg-surface p-5">
          <p className="font-display text-lg font-bold tracking-wide uppercase">
            <span aria-hidden="true">⏳</span> Não deixe passar
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Algumas promoções e cupons podem mudar ou acabar rapidamente. Entrando no grupo, você
            acompanha as próximas oportunidades.
          </p>
        </section>

        {/* COMUNIDADE (prova social real futuramente) */}
        <section className="mt-10">
          <p className="text-xs font-semibold tracking-widest text-highlight uppercase">
            <span aria-hidden="true">🔥</span> Comunidade de trilheiros
          </p>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Entre para acompanhar as próximas ofertas diretamente no WhatsApp.
          </p>
        </section>

        {/* SEGUNDO CTA */}
        <section className="mt-12 border-t border-border pt-10">
          <p className="text-xs font-semibold tracking-widest text-highlight uppercase">
            <span aria-hidden="true">🔥</span> Quero receber as ofertas
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-bold uppercase sm:text-4xl">
            Entre gratuitamente no grupo
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Entre gratuitamente no grupo e acompanhe as próximas promoções.
          </p>
          <div ref={secondCta} className="mt-5">
            <WhatsAppCta location="secondary">Entrar no WhatsApp</WhatsAppCta>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto w-full max-w-xl md:max-w-3xl">
          <p className="font-display text-lg font-bold tracking-wide uppercase">
            Promoção do Trilheiro
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Grupo gratuito de ofertas para trilha e off-road.
          </p>
        </div>
      </footer>

      <StickyCta watch={[heroCta, secondCta]} />
    </div>
  );
}
