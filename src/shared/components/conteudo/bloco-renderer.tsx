import { CodeTabs } from "@/shared/components/conteudo/code-tabs";
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
            <p key={j}>{p}</p>
          ))}
        </section>
      );

    case "secao":
      return (
        <SecaoConteudo key={i} {...chrome!}>
          <div className="prose-doc max-w-[68ch]">
            {bloco.resumo.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
          {bloco.extensao && bloco.extensao.length > 0 && (
            <Aprofundar paragrafos={bloco.extensao.length}>
              {bloco.extensao.map((p, j) => (
                <p key={j}>{p}</p>
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
