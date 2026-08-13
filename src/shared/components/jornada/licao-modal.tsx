"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, X, Star, ArrowUpRight } from "lucide-react";
import { getConceito } from "@/shared/lib/content";
import { gerarRodada, ROTULO_FORMATO } from "@/shared/lib/quiz-formatos";
import { XP } from "@/shared/lib/gamificacao/xp";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { cn } from "@/shared/utils/cn";

const QUANTAS = 5;
const VIDAS_INICIAIS = 5;

/**
 * A lição jogável de um nó da jornada (P2). Reaproveita o **sorteador de
 * perguntas** do quiz (`gerarRodada`, filtrado pelo conceito do nó) e monta a
 * casca estilo Duolingo por cima: barra de progresso, **vidas soft** (perde ao
 * errar, mas nunca trava — "reter com respeito"), feedback imediato e tela final
 * com XP/estrelas.
 *
 * Servidor-autoritativo: cada resposta é reportada via `onResponder` (que concede
 * o XP idempotente no servidor); concluir chama `onConcluir`, que marca o nó.
 */
export function LicaoModal({
  conceito,
  titulo,
  onResponder,
  onConcluir,
  onFechar,
}: {
  conceito: string;
  titulo: string;
  onResponder: (slug: string, acertou: boolean) => void;
  /** Recebe as estrelas (0–3) para o path persistir e exibir no nó. */
  onConcluir: (estrelas: number) => void;
  onFechar: () => void;
}) {
  // Semente estável por abertura, mas variada entre tentativas.
  const [semente] = useState(() => Math.floor(Math.random() * 1_000_000));
  const perguntas = useMemo(
    () => gerarRodada({ semente, quantas: QUANTAS, escopo: [conceito] }),
    [semente, conceito]
  );

  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<boolean[]>([]);
  const [vidas, setVidas] = useState(VIDAS_INICIAIS);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const pergunta = perguntas[i];
  const revelado = escolha !== null;
  const terminou = perguntas.length > 0 && i >= perguntas.length;
  const acertos = respostas.filter(Boolean).length;

  const responder = (slug: string) => {
    if (revelado || !pergunta) return;
    setEscolha(slug);
    const acertou = slug === pergunta.correta;
    setRespostas((r) => [...r, acertou]);
    onResponder(pergunta.correta, acertou);
    if (!acertou) setVidas((v) => Math.max(0, v - 1));
  };
  const avancar = () => {
    setEscolha(null);
    setI((n) => n + 1);
  };

  const estrelas =
    perguntas.length === 0
      ? 0
      : acertos === perguntas.length
        ? 3
        : acertos / perguntas.length >= 0.6
          ? 2
          : 1;
  const xpGanho = acertos * XP.quizAcerto + XP.noConcluido;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={`Lição: ${titulo}`}>
      {/* topo: fechar + progresso + vidas */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Sair da lição"
          className="rounded-lg p-1 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <X className="size-6" />
        </button>
        <div className="flex flex-1 items-center gap-1" role="img" aria-label={`Pergunta ${Math.min(i + 1, perguntas.length)} de ${perguntas.length}`}>
          {perguntas.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-300",
                idx < respostas.length
                  ? respostas[idx]
                    ? "bg-cat-criacional"
                    : "bg-cat-principio"
                  : idx === i && !terminou
                    ? "bg-primary"
                    : "bg-card-border"
              )}
            />
          ))}
        </div>
        <span className="flex items-center gap-1 font-bold tabular-nums text-[#e0473a]">
          <Heart className="size-5" fill="currentColor" />
          {vidas}
        </span>
      </div>

      {/* corpo */}
      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-5 pb-6">
        {perguntas.length === 0 ? (
          <FallbackSemPerguntas titulo={titulo} conceito={conceito} onConcluir={() => onConcluir(0)} />
        ) : terminou ? (
          <TelaFinal
            acertos={acertos}
            total={perguntas.length}
            estrelas={estrelas}
            xp={xpGanho}
            onConcluir={() => onConcluir(estrelas)}
          />
        ) : (
          pergunta && (
            <div className="pt-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: "var(--primary)", background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
                >
                  {ROTULO_FORMATO[pergunta.formato ?? "armadilha"]}
                </span>
              </div>
              <blockquote className="border-l-2 border-primary/50 pl-3.5 text-[16px] leading-relaxed text-foreground">
                <TextoRico>{pergunta.enunciado}</TextoRico>
              </blockquote>
              {pergunta.codigo && (
                <pre className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-canvas p-3 font-mono text-[12px] leading-relaxed sm:text-[13px]">
                  <code>{pergunta.codigo}</code>
                </pre>
              )}

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {pergunta.alternativas.map((slug) => {
                  const c = getConceito(slug);
                  if (!c) return null;
                  const correta = slug === pergunta.correta;
                  const escolhida = slug === escolha;
                  return (
                    <li key={slug}>
                      <button
                        type="button"
                        onClick={() => responder(slug)}
                        disabled={revelado}
                        className={cn(
                          "min-h-12 w-full rounded-xl border-2 border-b-4 px-3.5 py-3 text-left text-sm font-medium transition-colors",
                          !revelado && "border-card-border bg-card hover:bg-primary/5",
                          revelado && correta && "border-cat-criacional bg-cat-criacional/14",
                          revelado && escolhida && !correta && "border-cat-principio bg-cat-principio/12",
                          revelado && !correta && !escolhida && "border-card-border opacity-45"
                        )}
                      >
                        {c.titulo}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}
      </div>

      {/* rodapé de feedback + avanço */}
      {!terminou && perguntas.length > 0 && revelado && pergunta && (
        <div
          className={cn(
            "border-t px-5 py-4",
            escolha === pergunta.correta
              ? "border-cat-criacional/40 bg-cat-criacional/10"
              : "border-cat-principio/40 bg-cat-principio/10"
          )}
        >
          <div className="mx-auto max-w-lg">
            <p className="text-[13px] leading-relaxed text-foreground">
              <span className="font-semibold">
                {escolha === pergunta.correta ? "Isso! " : "Quase. "}
              </span>
              {pergunta.explicacao} — de{" "}
              <Link href={`/conceitos/${pergunta.correta}`} className="font-medium text-primary hover:underline">
                {getConceito(pergunta.correta)?.titulo}
                <ArrowUpRight className="ml-0.5 inline size-3.5" />
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={avancar}
              className="mt-3 w-full rounded-xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground shadow-[0_4px_0_color-mix(in_srgb,var(--primary)_55%,#000)] transition-transform active:translate-y-0.5"
            >
              {respostas.length >= perguntas.length ? "Ver resultado" : "Continuar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TelaFinal({
  acertos,
  total,
  estrelas,
  xp,
  onConcluir,
}: {
  acertos: number;
  total: number;
  estrelas: number;
  xp: number;
  onConcluir: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="text-6xl">{acertos === total ? "🏆" : "🎉"}</div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            className={cn("size-8", n <= estrelas ? "text-[var(--glow-c)]" : "text-foreground/15")}
            fill="currentColor"
          />
        ))}
      </div>
      <h2 className="text-2xl font-bold text-foreground">Lição concluída!</h2>
      <p className="text-sm text-muted">
        {acertos}/{total} certas
      </p>
      <div className="rounded-2xl border-2 border-[var(--glow-c)] px-6 py-3 text-lg font-black text-[var(--glow-c)]">
        +{xp} XP
      </div>
      <button
        type="button"
        onClick={onConcluir}
        className="mt-2 w-full max-w-xs rounded-xl bg-accent px-3 py-3 text-sm font-bold text-white shadow-[0_4px_0_color-mix(in_srgb,var(--accent)_55%,#000)] transition-transform active:translate-y-0.5"
      >
        Concluir
      </button>
    </div>
  );
}

function FallbackSemPerguntas({
  titulo,
  conceito,
  onConcluir,
}: {
  titulo: string;
  conceito: string;
  onConcluir: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="text-5xl">📖</div>
      <h2 className="text-xl font-bold text-foreground">{titulo}</h2>
      <p className="max-w-sm text-sm text-muted">
        Ainda não há perguntas prontas para este nó. Leia o conceito e marque como
        concluído para seguir.
      </p>
      <Link
        href={`/conceitos/${conceito}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        Abrir o conceito →
      </Link>
      <button
        type="button"
        onClick={onConcluir}
        className="mt-2 w-full max-w-xs rounded-xl bg-accent px-3 py-3 text-sm font-bold text-white transition-transform active:translate-y-0.5"
      >
        Marcar como concluído
      </button>
    </div>
  );
}
