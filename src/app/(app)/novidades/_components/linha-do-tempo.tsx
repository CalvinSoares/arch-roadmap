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
    <div className="mt-4 border-t border-card-border pt-3.5 sm:mt-5 sm:pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Estreou nesta entrega
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
        {roadmaps.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/roadmaps/${r.slug}`}
              className="group/est inline-flex max-w-full items-center gap-1.5 rounded-lg border border-card-border bg-background px-2 py-1.5 text-[12px] font-medium transition-colors hover:border-primary/45 hover:text-primary sm:px-2.5 sm:text-[13px]"
            >
              <span className="min-w-0 truncate">{r.titulo}</span>
              <ArrowUpRight className="size-3.5 shrink-0 opacity-60 transition-transform duration-300 group-hover/est:-translate-y-0.5 group-hover/est:translate-x-0.5" />
            </Link>
          </li>
        ))}
        {conceitos.map((c) => {
          const cat = CATEGORIAS[c.categoria];
          return (
            <li key={c.slug}>
              <Link
                href={`/conceitos/${c.slug}`}
                className="group/est inline-flex max-w-full items-center gap-1.5 rounded-lg border border-card-border bg-background px-2 py-1.5 text-[12px] font-medium transition-colors hover:border-primary/45 sm:px-2.5 sm:text-[13px]"
              >
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: cat.cssVar }}
                />
                <span className="min-w-0 truncate">{c.titulo}</span>
                <ArrowUpRight className="size-3.5 shrink-0 opacity-60 transition-transform duration-300 group-hover/est:-translate-y-0.5 group-hover/est:translate-x-0.5" />
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
      className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 pb-8 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-x-6 sm:pb-10"
    >
      {/* marcador + trilho */}
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "z-10 grid size-7 shrink-0 place-items-center rounded-lg border text-[10px] font-bold sm:size-12 sm:rounded-xl sm:text-[11px]",
            recente
              ? "border-transparent bg-primary text-primary-foreground shadow-[0_8px_22px_-10px_color-mix(in_srgb,var(--primary)_85%,transparent)]"
              : "border-card-border bg-card font-mono text-muted"
          )}
        >
          {recente ? (
            <Sparkles className="size-3.5 sm:size-5" />
          ) : (
            <span className="hidden sm:inline">{entrada.versao}</span>
          )}
          {!recente && (
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-muted sm:hidden"
            />
          )}
        </span>
        <span
          aria-hidden
          className="w-px flex-1 bg-gradient-to-b from-card-border to-transparent"
        />
      </div>

      {/* corpo da entrega */}
      <article className="min-w-0 overflow-hidden rounded-2xl border border-card-border bg-card p-3.5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="rounded-md bg-foreground/[0.06] px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
            v{entrada.versao}
          </span>
          <time dateTime={entrada.data} className="text-[12px] text-muted sm:text-[13px]">
            {formatarData(entrada.data)}
          </time>
          {recente && (
            <span className="rounded-full bg-primary/14 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Mais recente
            </span>
          )}
        </div>

        <h2 className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] sm:mt-2.5 sm:text-xl sm:leading-tight">
          {entrada.titulo}
        </h2>
        <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-muted sm:mt-2 sm:text-[15px]">
          {entrada.resumo}
        </p>

        <ul className="mt-4 space-y-3 sm:mt-5 sm:space-y-2.5">
          {entrada.mudancas.map((m, i) => {
            const meta = MUDANCA[m.tipo];
            const Icone = meta.icon;
            return (
              <li
                key={i}
                className="flex flex-col gap-1.5 sm:flex-row sm:gap-3"
              >
                <span
                  className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    color: meta.cor,
                    background: `color-mix(in srgb, ${meta.cor} 12%, transparent)`,
                  }}
                >
                  <Icone className="size-3" />
                  {meta.label}
                </span>
                <span className="min-w-0 text-[13px] leading-relaxed text-foreground sm:text-sm">
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
    <ol className="flex min-w-0 flex-col">
      {entradas.map((e, i) => (
        <Entrada key={e.versao} entrada={e} recente={i === 0} indice={i} />
      ))}
    </ol>
  );
}
