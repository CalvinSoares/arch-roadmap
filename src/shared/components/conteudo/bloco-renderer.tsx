import { CodeTabs } from "@/shared/components/conteudo/code-tabs";
import { AntiExemplo } from "@/shared/components/conteudo/anti-exemplo";
import { Refatoracao } from "@/shared/components/conteudo/refatoracao";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { QuandoUsar } from "@/shared/components/conteudo/quando-usar";
import { Analogia } from "@/shared/components/conteudo/analogia";
import { Passos } from "@/shared/components/conteudo/passos";
import { Aprofundar } from "@/shared/components/conteudo/aprofundar";
import { CamadasInterativas } from "@/shared/components/conteudo/camadas-interativas";
import { IlustracaoFluxo } from "@/shared/components/conteudo/ilustracao-fluxo";
import { IlustracaoEstrutura } from "@/shared/components/conteudo/ilustracao-estrutura";
import { IlustracaoAntesDepois } from "@/shared/components/conteudo/ilustracao-antes-depois";
import { CasosDeUso, Armadilhas } from "@/shared/components/conteudo/casos-de-uso";
import {
  SecaoConteudo,
  FiguraApoio,
} from "@/shared/components/conteudo/secao-conteudo";
import { Demo } from "@/shared/components/conteudo/demos/demo";
import { DiagramaClasse } from "@/shared/components/diagramas/diagrama-classe";
import { DiagramaCamadas } from "@/shared/components/diagramas/diagrama-camadas";
import { highlightCode } from "@/shared/lib/highlight";
import type { Bloco } from "@/shared/types/bloco";
import type { SecaoNav } from "@/shared/components/conteudo/conceito-subnav";

/**
 * Rótulo do tipo de seção. Serve de "gênero" da parada: o leitor sabe se
 * vai ler teoria, mexer numa demo, ver código ou tomar decisão.
 */
const ETIQUETA: Partial<Record<Bloco["tipo"], string>> = {
  secao: "Conceito",
  "camadas-nav": "Anatomia",
  demo: "Interativo",
  diagrama: "Estrutura",
  codigo: "Implementação",
  casos: "No mundo real",
  armadilhas: "Cuidado",
  quando: "Decisão",
  "anti-exemplo": "Cuidado",
  refatoracao: "Prática",
};

/** id/título de navegação para blocos que merecem entrada na subnav. */
export function navDoBloco(bloco: Bloco): SecaoNav | null {
  switch (bloco.tipo) {
    case "secao":
      return { id: bloco.id, titulo: bloco.titulo };
    case "camadas-nav":
      return { id: "camadas", titulo: bloco.titulo ?? "Camadas" };
    case "demo":
      return { id: "demo", titulo: bloco.titulo ?? "Veja funcionando" };
    case "diagrama":
      return { id: "diagrama", titulo: bloco.titulo ?? "Estrutura" };
    case "codigo":
      return { id: "codigo", titulo: bloco.titulo ?? "Código" };
    case "casos":
      return { id: "casos", titulo: bloco.titulo ?? "Casos de uso" };
    case "armadilhas":
      return { id: "armadilhas", titulo: bloco.titulo ?? "Armadilhas" };
    case "quando":
      return { id: "quando", titulo: "Quando usar" };
    case "anti-exemplo":
      // Rótulo curto e fixo: o `titulo` do bloco é descritivo ("Quando o
      // Singleton vira variável global") e destoaria dos vizinhos da trilha,
      // que são todos de duas palavras.
      return { id: "anti-exemplo", titulo: "O jeito errado" };
    case "refatoracao":
      // Mesma razão do anti-exemplo: rótulo curto e fixo, porque o `titulo`
      // do bloco é descritivo e destoaria dos vizinhos da trilha.
      return { id: "refatoracao", titulo: "Do cheiro ao padrão" };
    default:
      return null;
  }
}

/** Extrai a subnav e o TL;DR (renderizado no hero) de uma lista de blocos. */
export function extrairMetaBlocos(blocos: Bloco[]) {
  const secoes: SecaoNav[] = [];
  let tldr: string | undefined;
  for (const b of blocos) {
    if (b.tipo === "tldr") tldr = b.texto;
    const nav = navDoBloco(b);
    if (nav && !secoes.some((s) => s.id === nav.id)) secoes.push(nav);
  }
  return { secoes, tldr };
}

/** Numeração da trilha: id da seção → posição de leitura. */
function mapaDeNumeros(blocos: Bloco[]) {
  const mapa = new Map<string, number>();
  for (const b of blocos) {
    const nav = navDoBloco(b);
    if (nav && !mapa.has(nav.id)) mapa.set(nav.id, mapa.size + 1);
  }
  return mapa;
}

async function renderBloco(
  bloco: Bloco,
  i: number,
  numeros: Map<string, number>
) {
  const nav = navDoBloco(bloco);
  const chrome = nav
    ? {
        id: nav.id,
        numero: numeros.get(nav.id),
        etiqueta: ETIQUETA[bloco.tipo],
        titulo: nav.titulo,
      }
    : null;

  switch (bloco.tipo) {
    case "tldr":
      return null; // renderizado no hero via extrairMetaBlocos

    case "texto":
      return (
        <section key={i} className="prose-doc">
          {bloco.titulo && (
            <h3 className="mb-2 text-lg font-semibold tracking-tight">
              {bloco.titulo}
            </h3>
          )}
          {bloco.paragrafos.map((p, j) => (
            <p key={j}><TextoRico>{p}</TextoRico></p>
          ))}
        </section>
      );

    case "secao":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <div className="prose-doc max-w-[68ch]">
            {bloco.resumo.map((p, j) => (
              <p key={j}><TextoRico>{p}</TextoRico></p>
            ))}
          </div>
          {bloco.extensao && bloco.extensao.length > 0 && (
            <Aprofundar paragrafos={bloco.extensao.length}>
              {bloco.extensao.map((p, j) => (
                <p key={j}><TextoRico>{p}</TextoRico></p>
              ))}
            </Aprofundar>
          )}
        </SecaoConteudo>
      );

    case "analogia":
      return (
        <Analogia
          key={i}
          emoji={bloco.emoji}
          titulo={bloco.titulo}
          texto={bloco.texto}
        />
      );

    case "passos":
      return (
        <FiguraApoio key={i} etiqueta="Passo a passo" titulo={bloco.titulo}>
          <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
            <Passos passos={bloco.passos} />
          </div>
        </FiguraApoio>
      );

    case "ilustracao":
      if (bloco.arquetipo === "estrutura")
        return (
          <FiguraApoio key={i} etiqueta="Como se organiza">
            <IlustracaoEstrutura blocos={bloco.blocos} legenda={bloco.legenda} />
          </FiguraApoio>
        );
      if (bloco.arquetipo === "antes-depois")
        return (
          <FiguraApoio key={i} etiqueta="Sem o padrão × com o padrão">
            <IlustracaoAntesDepois
              antes={bloco.antes}
              depois={bloco.depois}
              legenda={bloco.legenda}
            />
          </FiguraApoio>
        );
      return (
        <FiguraApoio key={i} etiqueta="Como se encaixa">
          <IlustracaoFluxo
            atores={bloco.atores}
            setas={bloco.setas}
            direcao={bloco.direcao}
            legenda={bloco.legenda}
          />
        </FiguraApoio>
      );

    case "camadas-nav":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <CamadasInterativas camadas={bloco.camadas} />
        </SecaoConteudo>
      );

    case "casos":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <CasosDeUso casos={bloco.casos} />
        </SecaoConteudo>
      );

    case "armadilhas":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <Armadilhas itens={bloco.itens} />
        </SecaoConteudo>
      );

    case "diagrama":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <DiagramaClasse source={bloco.mermaid} />
        </SecaoConteudo>
      );

    case "camadas":
      return (
        <FiguraApoio key={i} etiqueta="Camadas" titulo={bloco.titulo}>
          <DiagramaCamadas camadas={bloco.camadas} />
        </FiguraApoio>
      );

    case "demo":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <p className="mb-4 max-w-[68ch] text-[15px] leading-relaxed text-muted">
            Mexa nos controles: a teoria acima vira comportamento observável.
          </p>
          <Demo id={bloco.demo} />
        </SecaoConteudo>
      );

    case "codigo": {
      const exemplos = await Promise.all(
        bloco.exemplos.map(async (ex) => ({
          lang: ex.lang,
          code: ex.code,
          html: await highlightCode(ex.code, ex.lang),
        }))
      );
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <CodeTabs exemplos={exemplos} />
        </SecaoConteudo>
      );
    }

    case "refatoracao": {
      // uma etapa por highlight: a 0 é o ponto de partida, as outras os passos
      const etapas = await Promise.all([
        { titulo: "Como está", motivo: bloco.cheiro, ex: bloco.inicio },
        ...bloco.passos.map((p) => ({ titulo: p.titulo, motivo: p.motivo, ex: p.depois })),
      ].map(async (e) => ({
        titulo: e.titulo,
        motivo: e.motivo,
        html: await highlightCode(e.ex.code, e.ex.lang),
      })));
      return (
        <Refatoracao
          key={i}
          titulo={bloco.titulo}
          cheiro={bloco.cheiro}
          etapas={etapas}
          veredito={bloco.veredito}
        />
      );
    }

    case "anti-exemplo": {
      const { codigo, ...resto } = bloco;
      const exemplos = [
        {
          lang: codigo.lang,
          code: codigo.code,
          html: await highlightCode(codigo.code, codigo.lang),
        },
      ];
      // Sem <SecaoConteudo>: o bloco tem moldura própria, em vermelho,
      // justamente para não se parecer com o conteúdo que ensina o certo.
      return <AntiExemplo key={i} {...resto} exemplos={exemplos} />;
    }

    case "quando":
      return (
        <SecaoConteudo key={i} {...chrome!} titulo="Quando usar × quando evitar">
          <QuandoUsar quandoUsar={bloco.usar} quandoEvitar={bloco.evitar} />
        </SecaoConteudo>
      );

    default:
      return null;
  }
}

/** Renderiza a lista de blocos ricos de um conceito (server component). */
export async function BlocoRenderer({ blocos }: { blocos: Bloco[] }) {
  const numeros = mapaDeNumeros(blocos);
  const rendered = await Promise.all(
    blocos.map((b, i) => renderBloco(b, i, numeros))
  );
  return <div className="space-y-12">{rendered}</div>;
}
