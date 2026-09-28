import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import logo96 from "@/assets/logo-trilheiro-96.webp";
import logo192 from "@/assets/logo-trilheiro-192.webp";
import logo288 from "@/assets/logo-trilheiro-288.webp";
import { GroupPrints } from "@/components/GroupPrints";
import { PromoToast } from "@/components/PromoToast";
import { SlotsNotice } from "@/components/SlotsNotice";
import { StickyCta } from "@/components/StickyCta";
import { TopBanner } from "@/components/TopBanner";
import { UrgencyBlock } from "@/components/UrgencyBlock";
import { WhatsAppCta } from "@/components/WhatsAppCta";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { loadPublicStatus } from "@/lib/activity";
import { initAnalytics } from "@/lib/tracking";

const TITLE = "Promoção do Trilheiro | Ofertas e Cupons para Trilha";
const DESCRIPTION =
  "Ofertas, cupons e promoções para trilha, enduro, motocross e off-road. Entre gratuitamente no grupo do Promoção do Trilheiro.";

// og:url / og:image / canonical precisam de URL absoluta: só saem com SITE_URL definido.
const absolute = SITE_URL
  ? [
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: `${SITE_URL}/og-image.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Piloto de enduro em uma trilha de barro" },
    ]
  : [];

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      ...absolute,
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: SITE_URL ? [{ rel: "canonical", href: `${SITE_URL}/` }] : [],
  }),
});

const BENEFITS = [
  {
    icon: "🏍️",
    title: "Produtos para trilha",
    text: "Peças, pneus, equipamentos e acessórios para trilha, enduro e motocross.",
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
    title: "Direto no WhatsApp",
    text: "Sem cadastro e sem app novo. As oportunidades chegam no grupo.",
  },
];

function Index() {
  const heroCta = useRef<HTMLDivElement>(null);
  const secondCta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAnalytics();
    void loadPublicStatus();
    if (import.meta.env.DEV) void import("@/lib/dev-demo").then((m) => m.runDevDemo());
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBanner />
      <main className="mx-auto w-full max-w-xl px-5 pb-28 md:max-w-3xl md:pb-16">
        {/* HERO — gancho de exclusividade + CTA principal */}
        <section className="fade-up pt-8 md:pt-14">
          <div className="flex items-center gap-3">
            <img
              src={logo96}
              srcSet={`${logo96} 96w, ${logo192} 192w, ${logo288} 288w`}
              sizes="(min-width: 768px) 80px, 64px"
              alt="Logo do grupo Promoções do Trilheiro"
              width={96}
              height={96}
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-full md:h-20 md:w-20"
            />
            <p className="inline-flex items-center gap-2 rounded-full border border-highlight/40 bg-highlight/10 px-3 py-1 text-xs font-semibold tracking-widest text-highlight uppercase">
              <span aria-hidden="true">🔥</span> Grupo VIP gratuito
            </p>
          </div>

          <h1 className="mt-5 font-display text-[2.75rem] leading-[0.95] font-extrabold tracking-tight uppercase min-[360px]:text-5xl sm:text-6xl md:text-7xl">
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
            </ul>
          </div>

          {/* VAGAS — só com capacidade real; oculto sem dado */}
          <SlotsNotice className="mt-4" />

          {/* PROVA — prints reais do grupo rodando em carrossel */}
          <GroupPrints className="mt-8" />
        </section>

        {/* GRUPO VIP GRATUITO — o que é o grupo */}
        <section className="mt-12 border-t border-border pt-10">
          <p className="text-xs font-semibold tracking-widest text-highlight uppercase">
            Como funciona
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-bold uppercase sm:text-4xl">
            Receba promoções, cupons e oportunidades direto no WhatsApp.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Ofertas em produtos para trilha, enduro, motocross e off-road: equipamentos, peças,
            pneus e acessórios.
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

        {/* URGÊNCIA — sem cronômetro nem número inventado; vagas reais aparecem dentro */}
        <UrgencyBlock />

        {/* SEGUNDO CTA */}
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-3xl leading-tight font-bold uppercase sm:text-4xl">
            Entre gratuitamente no grupo
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Um clique e você começa a receber as próximas promoções.
          </p>
          <div ref={secondCta} className="mt-5">
            <WhatsAppCta location="secondary">Entrar no WhatsApp</WhatsAppCta>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto w-full max-w-xl md:max-w-3xl">
          <p className="font-display text-lg font-bold tracking-wide uppercase">{SITE_NAME}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Grupo gratuito de ofertas para trilha e off-road. As compras são feitas direto nas
            lojas; alguns links são de afiliado.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Esta página usa o Meta Pixel e métricas anônimas de navegação. Não coletamos nome,
            telefone ou e-mail.
          </p>
        </div>
      </footer>

      <StickyCta watch={[heroCta, secondCta]} />
      <PromoToast />
    </div>
  );
}
