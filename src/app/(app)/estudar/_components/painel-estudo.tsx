"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { getConceito } from "@/shared/lib/content";
import { INTERVALOS } from "@/shared/types/estudo";
import { paraISO } from "@/shared/lib/estudo";
import { useEstudo } from "../hook/estudo.hook";
import { Quiz, TituloQuiz } from "./quiz";

/** Barra fina de progresso — o mesmo visual das métricas do construtor. */
function Barra({ feito, total }: { feito: number; total: number }) {
  const pct = total ? Math.round((feito / total) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card-border">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PainelEstudo() {
  const hoje = paraISO(new Date());
  const { hidratado, agenda, paraRevisar, proximos, trilhas, revisar } =
    useEstudo(hoje);

  const agendados = Object.keys(agenda).length;
  /**
   * A data da próxima revisão que ainda não venceu. Sem isto a tela diz só
   * "nada vencido" mesmo com conceitos na fila, e parece que nada aconteceu
   * ao concluir um item na trilha.
   */
  const proximaData = Object.values(agenda)
    .map((r) => r.proximaEm)
    .sort()
    .find((d) => d > hoje);

  // Antes da hidratação não há localStorage: mostra o esqueleto honesto, não
  // um "nada para revisar" que vai piscar e mudar.
  if (!hidratado) {
    return (
      <p className="rounded-2xl border border-dashed border-card-border p-8 text-center text-sm text-muted">
        Carregando seu progresso…
      </p>
    );
  }

  const nada = paraRevisar.length === 0 && proximos.length === 0;

  return (
    <div className="space-y-10">
      {/* ——— Revisar hoje ——— */}
      <section>
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <RotateCcw className="size-3.5" />
          Revisar hoje
        </h2>

        {paraRevisar.length === 0 ? (
          <p className="mt-4 flex gap-2 rounded-2xl border border-cat-criacional/40 bg-cat-criacional/8 p-4 text-sm leading-relaxed">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cat-criacional" />
            {agendados === 0 ? (
              <span>
                Nada na fila ainda. Conceitos que você concluir nas trilhas
                entram aqui para revisão em {INTERVALOS[0]} dia, e vão se
                espaçando a cada acerto.
              </span>
            ) : (
              <span>
                Nada vencido hoje.{" "}
                <b className="font-semibold">
                  {agendados} {agendados === 1 ? "conceito" : "conceitos"}
                </b>{" "}
                {agendados === 1 ? "está agendado" : "estão agendados"}
                {proximaData && <> — o próximo volta em {proximaData}</>}.
              </span>
            )}
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {paraRevisar.map((r) => {
              const c = getConceito(r.slug);
              if (!c) return null;
              return (
                <li
                  key={r.slug}
                  className="rounded-2xl border border-card-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link
                      href={`/conceitos/${c.slug}`}
                      className="font-semibold tracking-tight hover:text-primary"
                    >
                      {c.titulo}
                    </Link>
                    <span className="text-[11px] text-muted">
                      nível {r.nivel} · próxima em {INTERVALOS[r.nivel]}{" "}
                      {INTERVALOS[r.nivel] === 1 ? "dia" : "dias"} se acertar
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                    {c.resumo}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => revisar(r.slug, true)}>
                      <CheckCircle2 /> Lembrei
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revisar(r.slug, false)}
                    >
                      <RotateCcw /> Não lembrei
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/conceitos/${c.slug}`}>
                        Reler <ArrowUpRight />
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ——— Continue de onde parou ——— */}
      <section>
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <Compass className="size-3.5" />
          Continue de onde parou
        </h2>

        {proximos.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-card-border p-4 text-sm leading-relaxed text-muted">
            {nada
              ? "Marque itens nas trilhas para o modo estudo ter de onde partir."
              : "Você concluiu todos os conceitos das trilhas. Só revisão daqui para frente."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {proximos.map((p) => (
              <li key={p.conceitoSlug}>
                <Link
                  href={`/conceitos/${p.conceitoSlug}`}
                  className="group/prox flex items-start gap-3 rounded-2xl border border-card-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">
                      {p.conceitoTitulo}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {p.roadmapTitulo} · {p.secaoTitulo}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform duration-300 group-hover/prox:-translate-y-0.5 group-hover/prox:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ——— Quiz ——— */}
      <section>
        <TituloQuiz />
        <p className="mt-1.5 text-sm text-muted">
          Cada pergunta é uma armadilha real do catálogo, com o nome do padrão
          escondido. Responder alimenta a sua agenda de revisão.
        </p>
        <div className="mt-4">
          <Quiz hoje={hoje} onResponder={revisar} />
        </div>
      </section>

      {/* ——— Progresso por trilha ——— */}
      <section>
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <BrainCircuit className="size-3.5" />
          Suas trilhas
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {trilhas.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/roadmaps/${t.slug}`}
                className="block rounded-2xl border border-card-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium leading-snug">{t.titulo}</span>
                  <span className="shrink-0 font-mono text-[13px] tabular-nums text-muted">
                    {t.concluidos}/{t.total}
                  </span>
                </span>
                <Barra feito={t.concluidos} total={t.total} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
