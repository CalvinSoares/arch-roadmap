import Link from "next/link";
import { ArrowUpRight, Map, GitCompareArrows } from "lucide-react";
import { CodeTabs } from "@/shared/components/conteudo/code-tabs";
import { QuandoUsar } from "@/shared/components/conteudo/quando-usar";
import { DiagramaClasse } from "@/shared/components/diagramas/diagrama-classe";
import { DiagramaCamadas } from "@/shared/components/diagramas/diagrama-camadas";
import {
  BlocoRenderer,
  extrairMetaBlocos,
} from "@/shared/components/conteudo/bloco-renderer";
import { SecaoConteudo } from "@/shared/components/conteudo/secao-conteudo";
import {
  SubnavFita,
  SubnavTrilha,
} from "@/shared/components/conteudo/conceito-subnav";
import { ConceitoHero } from "@/shared/components/conteudo/conceito-hero";
import { OndeAparece } from "@/shared/components/conteudo/onde-aparece";
import { EmPostmortems } from "@/shared/components/conteudo/em-postmortems";
import { EmUmaLinha } from "@/shared/components/conteudo/em-uma-linha";
import { CATEGORIAS } from "@/shared/config/categorias";
import {
  getConceitos,
  roadmapsDoConceito,
  comparacoesDoConceito,
} from "@/shared/lib/content";
import { highlightCode } from "@/shared/lib/highlight";
import { QuizDoConceito } from "@/shared/components/conteudo/quiz-do-conceito";
import { todasAsArmadilhas } from "@/shared/lib/quiz";
import type { Conceito } from "@/shared/types/conceito";

/** Duelos em que este conceito entra — derivado do registro de comparações. */
function ConfundidoCom({ slug }: { slug: string }) {
  const duelos = comparacoesDoConceito(slug);
  if (duelos.length === 0) return null;

  return (
    <section className="min-w-0 border-t border-card-border pt-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Costuma ser confundido com
      </h2>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {duelos.map((d) => (
          <li key={d.slug} className="min-w-0">
            <Link
              href={`/comparar/${d.slug}`}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-card-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/60"
            >
              <GitCompareArrows className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0 truncate font-medium">
                {d.outro.titulo}
              </span>
              <span className="shrink-0 text-muted">· ver comparação</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Volta do roadmap: em que trilhas este conceito aparece. Derivado dos
 * roadmaps, então nunca diverge deles.
 */
function EmRoadmaps({ slug }: { slug: string }) {
  const ocorrencias = roadmapsDoConceito(slug);
  if (ocorrencias.length === 0) return null;

  return (
    <section className="border-t border-card-border pt-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Onde isto aparece
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {ocorrencias.map((o) => (
          <li key={`${o.roadmapSlug}:${o.secaoTitulo}`}>
            <Link
              href={`/roadmaps/${o.roadmapSlug}`}
              className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/60"
            >
              <Map className="size-3.5 shrink-0 text-primary" />
              <span className="font-medium">{o.roadmapTitulo}</span>
              <span className="text-muted">· {o.secaoTitulo}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Fecho da página: para onde ir depois de entender este conceito. */
function Relacionados({ conceito }: { conceito: Conceito }) {
  const relacionados = getConceitos(conceito.relacionados);
  if (relacionados.length === 0) return null;

  return (
    <section className="border-t border-card-border pt-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Continue por aqui
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {relacionados.map((r) => {
          const cat = CATEGORIAS[r.categoria];
          return (
            <li key={r.slug}>
              <Link
                href={`/conceitos/${r.slug}`}
                className="group/rel flex h-full items-start gap-3 rounded-2xl border border-card-border bg-card p-4 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                style={{ ["--acento" as string]: cat.cssVar }}
              >
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: cat.cssVar }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-snug">{r.titulo}</span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted">
                    {r.resumo}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform duration-300 group-hover/rel:-translate-y-0.5 group-hover/rel:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function ConceitoView({ conceito }: { conceito: Conceito }) {
  const cat = CATEGORIAS[conceito.categoria];
  // toda a página herda o acento da categoria daqui
  const acento = { ["--acento" as string]: cat.cssVar };

  // ——— v3: blocos com trilha de seções ———
  if (conceito.blocos?.some((b) => b.tipo === "secao" || b.tipo === "tldr")) {
    const { secoes, tldr } = extrairMetaBlocos(conceito.blocos);
    return (
      <div style={acento} className="space-y-6">
        <ConceitoHero
          conceito={conceito}
          tldr={tldr}
          totalSecoes={secoes.length}
        />
        <SubnavFita secoes={secoes} />
        <div className="gap-12 xl:grid xl:grid-cols-[minmax(0,1fr)_14rem]">
          <article className="min-w-0 space-y-12 pt-2">
            <BlocoRenderer blocos={conceito.blocos} />
            <QuizDoConceito

              slug={conceito.slug}

              titulo={conceito.titulo}

              total={todasAsArmadilhas([conceito.slug]).length}

            />
            {conceito.ondeAparece && <OndeAparece itens={conceito.ondeAparece} />}
            <EmUmaLinha emUmaLinha={conceito.emUmaLinha} custo={conceito.custo} />
            <EmPostmortems slug={conceito.slug} />
            <ConfundidoCom slug={conceito.slug} />
            <EmRoadmaps slug={conceito.slug} />
            <Relacionados conceito={conceito} />
          </article>
          <SubnavTrilha secoes={secoes} />
        </div>
      </div>
    );
  }

  // ——— blocos v1 (sem trilha de seções) ———
  if (conceito.blocos) {
    return (
      <div style={acento} className="space-y-6">
        <ConceitoHero conceito={conceito} />
        <article className="min-w-0 space-y-12">
          <BlocoRenderer blocos={conceito.blocos} />
          <QuizDoConceito

            slug={conceito.slug}

            titulo={conceito.titulo}

            total={todasAsArmadilhas([conceito.slug]).length}

          />
          {conceito.ondeAparece && <OndeAparece itens={conceito.ondeAparece} />}
          <EmUmaLinha emUmaLinha={conceito.emUmaLinha} custo={conceito.custo} />
          <EmPostmortems slug={conceito.slug} />
          <ConfundidoCom slug={conceito.slug} />
          <EmRoadmaps slug={conceito.slug} />
          <Relacionados conceito={conceito} />
        </article>
      </div>
    );
  }

  // ——— layout clássico (sem blocos) ———
  const exemplos = await Promise.all(
    conceito.exemplos.map(async (ex) => ({
      lang: ex.lang,
      code: ex.code,
      html: await highlightCode(ex.code, ex.lang),
    }))
  );

  return (
    <div style={acento} className="space-y-6">
      <ConceitoHero conceito={conceito} />
      <article className="min-w-0 space-y-12">
        <SecaoConteudo numero={1} etiqueta="Conceito" titulo="O problema">
          <div className="prose-doc max-w-[68ch]">
            {conceito.problema.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </SecaoConteudo>

        <SecaoConteudo numero={2} etiqueta="Conceito" titulo="A solução">
          <div className="prose-doc max-w-[68ch]">
            {conceito.solucao.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </SecaoConteudo>

        {conceito.mermaid && (
          <SecaoConteudo numero={3} etiqueta="Estrutura" titulo="Estrutura">
            <DiagramaClasse source={conceito.mermaid} />
          </SecaoConteudo>
        )}

        {conceito.camadas && conceito.camadas.length > 0 && (
          <SecaoConteudo numero={4} etiqueta="Anatomia" titulo="Onde atua">
            <DiagramaCamadas camadas={conceito.camadas} />
          </SecaoConteudo>
        )}

        <SecaoConteudo numero={5} etiqueta="Implementação" titulo="Código">
          <CodeTabs exemplos={exemplos} />
        </SecaoConteudo>

        <SecaoConteudo
          numero={6}
          etiqueta="Decisão"
          titulo="Quando usar × quando evitar"
        >
          <QuandoUsar
            quandoUsar={conceito.quandoUsar}
            quandoEvitar={conceito.quandoEvitar}
          />
        </SecaoConteudo>

        <QuizDoConceito


          slug={conceito.slug}


          titulo={conceito.titulo}


          total={todasAsArmadilhas([conceito.slug]).length}


        />

        {conceito.ondeAparece && <OndeAparece itens={conceito.ondeAparece} />}

        <EmUmaLinha emUmaLinha={conceito.emUmaLinha} custo={conceito.custo} />

        <EmPostmortems slug={conceito.slug} />

        <ConfundidoCom slug={conceito.slug} />

        <EmRoadmaps slug={conceito.slug} />

        <Relacionados conceito={conceito} />
      </article>
    </div>
  );
}
