import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SITE_NAME } from "@/config/site";

// Página exigida pela Meta pra pôr o app do Instagram em modo Live / App Review
// (URL de Política de Privacidade, Termos e instruções de exclusão de dados).
// Não carrega o analytics próprio (initAnalytics só roda na "/").
const TITLE = `Política de Privacidade e Termos | ${SITE_NAME}`;
const UPDATED_AT = "4 de outubro de 2026";
const INSTAGRAM = "@trilheiro_promo";
const INSTAGRAM_URL = "https://www.instagram.com/trilheiro_promo/";

export const Route = createFileRoute("/privacidade")({
  component: Privacidade,
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content: `Como o ${SITE_NAME} trata dados na página, no Instagram e no grupo de WhatsApp.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6 border-t border-border pt-8">
      <h2 className="font-display text-2xl font-bold tracking-wide uppercase">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Privacidade() {
  const contato = (
    <a href={INSTAGRAM_URL} className="text-highlight underline underline-offset-2">
      {INSTAGRAM}
    </a>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-xl px-5 py-10 md:max-w-3xl md:py-14">
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-2">
          ← Voltar
        </Link>
        <h1 className="mt-6 font-display text-4xl leading-none font-extrabold tracking-tight uppercase">
          Privacidade e Termos
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {SITE_NAME} — última atualização: {UPDATED_AT}.
        </p>

        <Section id="privacidade" title="Política de Privacidade">
          <p>
            O {SITE_NAME} é um grupo gratuito de ofertas para trilha e off-road. Coletamos o mínimo
            necessário para funcionar e não vendemos nem compartilhamos dados com terceiros, exceto
            os serviços citados abaixo.
          </p>
          <p>
            <strong className="text-foreground">Nesta página:</strong> usamos o Meta Pixel e
            métricas anônimas de navegação (página visitada, tempo na página, rolagem, cliques no
            botão do WhatsApp e a origem da visita, como parâmetros UTM). Não coletamos nome,
            telefone ou e-mail.
          </p>
          <p>
            <strong className="text-foreground">No Instagram ({INSTAGRAM}):</strong> quando você
            comenta uma palavra-chave (ex.: "eu quero") em uma publicação nossa, nosso sistema usa
            a API oficial do Instagram para ler esse comentário e enviar a você uma mensagem no
            direct com o link pedido. Para isso tratamos o identificador da sua conta, o nome de
            usuário, o texto e a data do comentário. Esses dados servem só para enviar a mensagem,
            evitar mensagens repetidas e contar quantas pessoas pediram o link. Não enviamos outras
            mensagens além da resposta ao seu comentário e às mensagens que você nos mandar.
          </p>
          <p>
            <strong className="text-foreground">No grupo de WhatsApp:</strong> ao entrar, seu
            número fica visível para os administradores e participantes, como em qualquer grupo do
            WhatsApp. Você pode sair a qualquer momento.
          </p>
          <p>
            Os dados ficam guardados por até 12 meses e depois são apagados, ou antes disso se você
            pedir (veja abaixo).
          </p>
        </Section>

        <Section id="exclusao" title="Exclusão de dados">
          <p>
            Para pedir a exclusão dos seus dados, mande uma mensagem no direct do Instagram para{" "}
            {contato} escrevendo "excluir meus dados". Apagamos em até 30 dias tudo o que tivermos
            ligado à sua conta e confirmamos pelo próprio direct.
          </p>
          <p>
            Você também pode remover o acesso a qualquer momento: basta não comentar mais as
            palavras-chave e, no WhatsApp, sair do grupo.
          </p>
        </Section>

        <Section id="termos" title="Termos de Uso">
          <p>
            O grupo e as mensagens automáticas são gratuitos. Divulgamos ofertas de lojas como
            Mercado Livre e Shopee; as compras são feitas direto nas lojas, que são responsáveis
            pelos produtos, preços, entregas e trocas. Alguns links são de afiliado, o que não muda
            o preço para você.
          </p>
          <p>
            Preços e cupons podem mudar ou acabar sem aviso. Confira sempre na loja antes de
            comprar. Podemos remover do grupo quem enviar spam ou desrespeitar outros participantes.
          </p>
          <p>Dúvidas: fale com a gente no direct do Instagram, {contato}.</p>
        </Section>
      </main>
    </div>
  );
}
