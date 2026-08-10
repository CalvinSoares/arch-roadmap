import Link from "next/link";
import { Sparkles, Wand2, Wrench, BookOpen, ArrowUpRight } from "lucide-react";
import { RevealItem } from "@/shared/components/global/ui/reveal";
import { CATEGORIAS } from "@/shared/config/categorias";
import { getConceitos, listRoadmaps } from "@/shared/lib/content";
import { formatarData } from "@/shared/lib/novidades";
import { cn } from "@/shared/utils/cn";
import type { Novidade, TipoMudanca } from "@/shared/types/novidade";

const MUDANCA: Record<
  TipoMudanca,
  { label: string; cor: string; icon: typeof Sparkles }
> = {
  conteudo: { label: "Conteúdo", cor: "var(--cat-criacional)", icon: BookOpen },
  novo: { label: "Novo", cor: "var(--primary)", icon: Sparkles },
  melhoria: { label: "Melhoria", cor: "var(--cat-estrutural)", icon: Wand2 },
  correcao: { label: "Correção", cor: "var(--alerta)", icon: Wrench },
};

/** Atalhos para o conteúdo que estreou numa entrega. */
function ConteudoEstreante({ entrada }: { entrada: Novidade }) {
  const conceitos = getConceitos(entrada.conceitos ?? []);
  const roadmaps = listRoadmaps().filter((r) =>
    (entrada.roadmaps ?? []).includes(r.slug)
  );
  if (conceitos.length === 0 && roadmaps.length === 0) return null;

  return (
    <div className="mt-5 border-t border-card-border pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Estreou nesta entrega
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {roadmaps.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/roadmaps/${r.slug}`}
              className="group/est inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:border-primary/45 hover:text-primary"
            >
              {r.titulo}
              <ArrowUpRight className="size-3.5 opacity-60 transition-transform duration-300 group-hover/est:-translate-y-0.5 group-hover/est:translate-x-0.5" />
            </Link>
          </li>
        ))}
        {conceitos.map((c) => {
          const cat = CATEGORIAS[c.categoria];
          return (
            <li key={c.slug}>
              <Link
                href={`/conceitos/${c.slug}`}
                className="group/est inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-background px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:border-primary/45"
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full"
                  style={{ background: cat.cssVar }}
                />
                {c.titulo}
                <ArrowUpRight className="size-3.5 opacity-60 transition-transform duration-300 group-hover/est:-translate-y-0.5 group-hover/est:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Entrada({
  entrada,
  recente,
  indice,
}: {
  entrada: Novidade;
  recente: boolean;
  indice: number;
}) {
  return (
    <RevealItem
      indice={Math.min(indice, 4)}
      className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 pb-10 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-x-6"
    >
        {/* marcador + trilho */}
        <div className="relative flex flex-col items-center">
          <span
            className={cn(
              "z-10 grid size-10 shrink-0 place-items-center rounded-xl border text-[11px] font-bold sm:size-12",
              recente
                ? "border-transparent bg-primary text-primary-foreground shadow-[0_8px_22px_-10px_color-mix(in_srgb,var(--primary)_85%,transparent)]"
                : "border-card-border bg-card font-mono text-muted"
            )}
          >
            {recente ? <Sparkles className="size-5" /> : entrada.versao}
          </span>
          <span
            aria-hidden
            className="w-px flex-1 bg-gradient-to-b from-card-border to-transparent"
          />
        </div>

        {/* corpo da entrega */}
        <article className="min-w-0 rounded-2xl border border-card-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-foreground/[0.06] px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
              v{entrada.versao}
            </span>
            <time
              dateTime={entrada.data}
              className="text-[13px] text-muted"
            >
              {formatarData(entrada.data)}
            </time>
            {recente && (
              <span className="rounded-full bg-primary/14 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                Mais recente
              </span>
            )}
          </div>

          <h2 className="mt-2.5 text-xl font-semibold leading-tight tracking-[-0.02em]">
            {entrada.titulo}
          </h2>
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">
            {entrada.resumo}
          </p>

          <ul className="mt-5 space-y-2.5">
            {entrada.mudancas.map((m, i) => {
              const meta = MUDANCA[m.tipo];
              const Icone = meta.icon;
              return (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      color: meta.cor,
                      background: `color-mix(in srgb, ${meta.cor} 12%, transparent)`,
                    }}
                  >
                    <Icone className="size-3" />
                    {meta.label}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">
                    {m.texto}
                  </span>
                </li>
              );
            })}
          </ul>

          <ConteudoEstreante entrada={entrada} />
        </article>
    </RevealItem>
  );
}

export function LinhaDoTempo({ entradas }: { entradas: Novidade[] }) {
  return (
    <ol className="flex flex-col">
      {entradas.map((e, i) => (
        <Entrada key={e.versao} entrada={e} recente={i === 0} indice={i} />
      ))}
    </ol>
  );
}
