import Link from "next/link";
import {
  ChevronRight,
  Clock,
  Signal,
  ListOrdered,
  Zap,
  CalendarDays,
  History,
} from "lucide-react";
import { CATEGORIAS, DIFICULDADES } from "@/shared/config/categorias";
import type { Conceito } from "@/shared/types/conceito";
import type { Precisao } from "@/shared/types/quando";

/**
 * O que a precisão quer dizer, em uma frase. Vai para o `title` do chip —
 * "1994" sozinho sugere um rigor que a data não tem.
 */
const NOTA_PRECISAO: Record<Precisao, string> = {
  exata: "Data conhecida",
  aproximada: "Data aproximada",
  seculo: "Século conhecido, ano não",
  intervalo: "Aconteceu ao longo de um período",
  convencao: "Marco de referência — a ideia é mais velha que a data",
  disputada: "As fontes divergem sobre a data",
};

function Chip({
  icon: Icon,
  children,
}: {
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-background px-2.5 py-1 text-xs font-medium text-muted">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

interface Props {
  conceito: Conceito;
  tldr?: string;
  /** Nº de paradas na trilha de leitura — dá a dimensão da página. */
  totalSecoes?: number;
}

/**
 * Abertura do conceito: identidade (categoria + custo de leitura), promessa
 * (título + resumo) e a resposta curta (TL;DR) antes de qualquer teoria.
 * Quem só quer a definição resolve aqui e vai embora.
 */
export function ConceitoHero({ conceito, tldr, totalSecoes }: Props) {
  const cat = CATEGORIAS[conceito.categoria];

  return (
    <div className="space-y-4">
      {/* trilha de navegação */}
      <nav
        aria-label="Trilha de navegação"
        className="flex flex-wrap items-center gap-1 text-[13px] text-muted"
      >
        <Link href="/" className="transition-colors hover:text-[var(--acento)]">
          Início
        </Link>
        <ChevronRight className="size-3.5 opacity-50" />
        <Link
          href="/conceitos"
          className="transition-colors hover:text-[var(--acento)]"
        >
          Conceitos
        </Link>
        <ChevronRight className="size-3.5 opacity-50" />
        <span className="font-medium text-foreground">{conceito.titulo}</span>
      </nav>

      <header className="relative overflow-hidden rounded-3xl border border-card-border bg-card px-5 py-7 sm:px-8 sm:py-9">
        {/* brilho da categoria no canto */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "var(--acento)" }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{
                color: "var(--acento)",
                background: "color-mix(in srgb, var(--acento) 13%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: "var(--acento)" }}
              />
              {cat.label}
            </span>
            <Chip icon={Signal}>{DIFICULDADES[conceito.dificuldade]}</Chip>
            <Chip icon={Clock}>{conceito.tempoLeitura} min de leitura</Chip>
            {totalSecoes ? (
              <Chip icon={ListOrdered}>{totalSecoes} seções</Chip>
            ) : null}
            {conceito.nasceu && (
              <span
                title={`${NOTA_PRECISAO[conceito.nasceu.quando.precisao]} — ${conceito.nasceu.fonte}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-background px-2.5 py-1 text-xs font-medium text-muted"
              >
                <CalendarDays className="size-3.5" />
                {conceito.nasceu.quando.rotulo}
                {conceito.nasceu.quando.precisao === "disputada" && (
                  <span aria-hidden className="text-[var(--acento)]">
                    ?
                  </span>
                )}
                <span className="sr-only">
                  {` — ${NOTA_PRECISAO[conceito.nasceu.quando.precisao]}`}
                </span>
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.75rem]">
            {conceito.titulo}
          </h1>

          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted sm:text-base">
            {conceito.resumo}
          </p>

          {tldr && (
            <div
              className="mt-6 flex gap-3 rounded-2xl border p-4 sm:p-5"
              style={{
                borderColor: "color-mix(in srgb, var(--acento) 30%, transparent)",
                background: "color-mix(in srgb, var(--acento) 7%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-lg"
                style={{
                  background: "var(--acento)",
                  color: "var(--background)",
                }}
              >
                <Zap className="size-4" />
              </span>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--acento)" }}
                >
                  Em 10 segundos
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-foreground">
                  {tldr}
                </p>
              </div>
            </div>
          )}

          {/* O que veio antes do nome — é aqui que a data vira aula. */}
          {conceito.nasceu?.precursor && (
            <div className="mt-4 flex gap-3 rounded-xl border border-card-border bg-background/60 p-3.5">
              <History className="mt-0.5 size-4 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Antes de ter nome
                </p>
                <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-foreground">
                  {conceito.nasceu.precursor}
                </p>
              </div>
            </div>
          )}

          {conceito.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {conceito.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-md bg-foreground/[0.05] px-2 py-1 font-mono text-[11px] text-muted"
                >
                  #{t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
    </div>
  );
}
