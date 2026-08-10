import { CodeTabs } from "@/shared/components/conteudo/code-tabs";
import { QuandoUsar } from "@/shared/components/conteudo/quando-usar";
import { Analogia } from "@/shared/components/conteudo/analogia";
import { Passos } from "@/shared/components/conteudo/passos";
import { Aprofundar } from "@/shared/components/conteudo/aprofundar";
import { CamadasInterativas } from "@/shared/components/conteudo/camadas-interativas";
import { IlustracaoFluxo } from "@/shared/components/conteudo/ilustracao-fluxo";
import { CasosDeUso, Armadilhas } from "@/shared/components/conteudo/casos-de-uso";
import { Demo } from "@/shared/components/conteudo/demos/demo";
import { DiagramaClasse } from "@/shared/components/diagramas/diagrama-classe";
import { DiagramaCamadas } from "@/shared/components/diagramas/diagrama-camadas";
import { highlightCode } from "@/shared/lib/highlight";
import type { Bloco } from "@/shared/types/bloco";
import type { SecaoNav } from "@/shared/components/conteudo/conceito-subnav";

function Titulo({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xl font-semibold">{children}</h2>;
}

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

async function renderBloco(bloco: Bloco, i: number) {
  const nav = navDoBloco(bloco);
  const secProps = nav ? { id: nav.id, className: "scroll-mt-28" } : {};

  switch (bloco.tipo) {
    case "tldr":
      return null; // renderizado no hero via extrairMetaBlocos
    case "texto":
      return (
        <section key={i} className="prose-doc">
          {bloco.titulo && <Titulo>{bloco.titulo}</Titulo>}
          {bloco.paragrafos.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </section>
      );
    case "secao":
      return (
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo}</Titulo>
          <div className="prose-doc">
            {bloco.resumo.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </div>
          {bloco.extensao && bloco.extensao.length > 0 && (
            <Aprofundar>
              {bloco.extensao.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </Aprofundar>
          )}
        </section>
      );
    case "analogia":
      return (
        <section key={i}>
          <Analogia emoji={bloco.emoji} titulo={bloco.titulo} texto={bloco.texto} />
        </section>
      );
    case "passos":
      return (
        <section key={i}>
          {bloco.titulo && <Titulo>{bloco.titulo}</Titulo>}
          <Passos passos={bloco.passos} />
        </section>
      );
    case "ilustracao":
      return (
        <section key={i}>
          <IlustracaoFluxo
            atores={bloco.atores}
            setas={bloco.setas}
            direcao={bloco.direcao}
            legenda={bloco.legenda}
          />
        </section>
      );
    case "camadas-nav":
      return (
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo ?? "Camadas"}</Titulo>
          <CamadasInterativas camadas={bloco.camadas} />
        </section>
      );
    case "casos":
      return (
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo ?? "Casos de uso"}</Titulo>
          <CasosDeUso casos={bloco.casos} />
        </section>
      );
    case "armadilhas":
      return (
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo ?? "Armadilhas comuns"}</Titulo>
          <Armadilhas itens={bloco.itens} />
        </section>
      );
    case "diagrama":
      return (
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo ?? "Estrutura"}</Titulo>
          <DiagramaClasse source={bloco.mermaid} />
        </section>
      );
    case "camadas":
      return (
        <section key={i}>
          {bloco.titulo && <Titulo>{bloco.titulo}</Titulo>}
          <DiagramaCamadas camadas={bloco.camadas} />
        </section>
      );
    case "demo":
      return (
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo ?? "Veja funcionando"}</Titulo>
          <Demo id={bloco.demo} />
        </section>
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
        <section key={i} {...secProps}>
          <Titulo>{bloco.titulo ?? "Código"}</Titulo>
          <CodeTabs exemplos={exemplos} />
        </section>
      );
    }
    case "quando":
      return (
        <section key={i} {...secProps}>
          <Titulo>Quando usar × evitar</Titulo>
          <QuandoUsar quandoUsar={bloco.usar} quandoEvitar={bloco.evitar} />
        </section>
      );
    default:
      return null;
  }
}

/** Renderiza a lista de blocos ricos de um conceito (server component). */
export async function BlocoRenderer({ blocos }: { blocos: Bloco[] }) {
  const rendered = await Promise.all(blocos.map((b, i) => renderBloco(b, i)));
  return <div className="space-y-10">{rendered}</div>;
}
