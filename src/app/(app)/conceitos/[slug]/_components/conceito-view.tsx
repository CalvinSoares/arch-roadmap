import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/shared/components/global/ui/badge";
import { Card } from "@/shared/components/global/ui/card";
import { CodeTabs } from "@/shared/components/conteudo/code-tabs";
import { QuandoUsar } from "@/shared/components/conteudo/quando-usar";
import { DiagramaClasse } from "@/shared/components/diagramas/diagrama-classe";
import { DiagramaCamadas } from "@/shared/components/diagramas/diagrama-camadas";
import {
  BlocoRenderer,
  extrairMetaBlocos,
} from "@/shared/components/conteudo/bloco-renderer";
import { ConceitoSubnav } from "@/shared/components/conteudo/conceito-subnav";
import { CATEGORIAS } from "@/shared/config/categorias";
import { getConceitos } from "@/shared/lib/content";
import { highlightCode } from "@/shared/lib/highlight";
import type { Conceito } from "@/shared/types/conceito";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function TagsDoConceito({ conceito }: { conceito: Conceito }) {
  const cat = CATEGORIAS[conceito.categoria];
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className={cat.badge}>{cat.label}</Badge>
      {conceito.tags.map((t) => (
        <Badge key={t} className="bg-muted/12 text-muted">
          #{t}
        </Badge>
      ))}
    </div>
  );
}

function Relacionados({ conceito }: { conceito: Conceito }) {
  const relacionados = getConceitos(conceito.relacionados);
  if (relacionados.length === 0) return null;
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Relacionados
      </p>
      <ul className="mt-2 space-y-1">
        {relacionados.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/conceitos/${r.slug}`}
              className="flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted/10"
            >
              <span>
                {r.titulo}
                <span className="ml-2 text-xs text-muted">{r.resumo.slice(0, 60)}…</span>
              </span>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export async function ConceitoView({ conceito }: { conceito: Conceito }) {
  // ——— v3: blocos com subnav (tem "secao" ou "tldr") ———
  if (conceito.blocos?.some((b) => b.tipo === "secao" || b.tipo === "tldr")) {
    const { secoes, tldr } = extrairMetaBlocos(conceito.blocos);
    return (
      <div className="space-y-6">
        <TagsDoConceito conceito={conceito} />
        {tldr && (
          <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/8 p-4">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-[15px] leading-relaxed">
              <b className="mr-1 text-primary">Em 10 segundos:</b>
              {tldr}
            </p>
          </div>
        )}
        <div className="gap-8 lg:grid lg:grid-cols-[190px_minmax(0,1fr)]">
          <ConceitoSubnav secoes={secoes} />
          <article className="mt-4 min-w-0 space-y-10 lg:mt-0">
            <BlocoRenderer blocos={conceito.blocos} />
            <Relacionados conceito={conceito} />
          </article>
        </div>
      </div>
    );
  }

  // ——— blocos v1 (sem subnav) ———
  if (conceito.blocos) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <article className="min-w-0 space-y-8">
          <TagsDoConceito conceito={conceito} />
          <BlocoRenderer blocos={conceito.blocos} />
        </article>
        <aside
        aria-label="Conteúdo relacionado"
        className="space-y-4 lg:sticky lg:top-6 lg:self-start"
      >
          <Relacionados conceito={conceito} />
        </aside>
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
    <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
      <article className="min-w-0 space-y-8">
        <TagsDoConceito conceito={conceito} />
        <div className="prose-doc space-y-8">
          <Secao titulo="O problema">
            {conceito.problema.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Secao>

          <Secao titulo="A solução">
            {conceito.solucao.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Secao>

          {conceito.mermaid && (
            <Secao titulo="Estrutura (diagrama de classes)">
              <DiagramaClasse source={conceito.mermaid} />
            </Secao>
          )}

          {conceito.camadas && conceito.camadas.length > 0 && (
            <Secao titulo="Onde atua (camadas)">
              <DiagramaCamadas camadas={conceito.camadas} />
            </Secao>
          )}

          <Secao titulo="Código">
            <CodeTabs exemplos={exemplos} />
          </Secao>

          <Secao titulo="Quando usar × evitar">
            <QuandoUsar
              quandoUsar={conceito.quandoUsar}
              quandoEvitar={conceito.quandoEvitar}
            />
          </Secao>
        </div>
      </article>
      <aside
        aria-label="Conteúdo relacionado"
        className="space-y-4 lg:sticky lg:top-6 lg:self-start"
      >
        <Relacionados conceito={conceito} />
      </aside>
    </div>
  );
}
