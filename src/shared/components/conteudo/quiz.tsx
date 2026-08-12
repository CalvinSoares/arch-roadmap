"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Flame,
  GitCompareArrows,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { getConceito, getComparacao } from "@/shared/lib/content";
import { sementeDoDia } from "@/shared/lib/quiz";
import {
  gerarRodada,
  gerarRodadaEntrevista,
  ROTULO_FORMATO,
  type FormatoQuiz,
} from "@/shared/lib/quiz-formatos";
import { slugComparacao } from "@/shared/types/comparacao";
import { cn } from "@/shared/utils/cn";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";

const QUANTAS = 5;
const ENTREVISTA_SEGUNDOS = 10 * 60;

function formatarCronometro(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Acertos seguidos no fim da lista — o que alimenta a chama. */
function sequenciaAtual(respostas: boolean[]): number {
  let n = 0;
  for (let i = respostas.length - 1; i >= 0 && respostas[i]; i--) n++;
  return n;
}

function melhorSequencia(respostas: boolean[]): number {
  let melhor = 0;
  let atual = 0;
  for (const r of respostas) {
    atual = r ? atual + 1 : 0;
    if (atual > melhor) melhor = atual;
  }
  return melhor;
}

/**
 * A rodada inteira num relance: um segmento por pergunta, colorido pelo
 * resultado. Substitui o "Pergunta 2 de 5" textual.
 */
function BarraDaRodada({
  total,
  respostas,
  atual,
}: {
  total: number;
  respostas: boolean[];
  atual: number;
}) {
  return (
    <div
      role="img"
      aria-label={`Pergunta ${Math.min(atual + 1, total)} de ${total}; ${
        respostas.filter(Boolean).length
      } acertos até aqui`}
      className="flex flex-1 items-center gap-1"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-300",
            i < respostas.length
              ? respostas[i]
                ? "bg-cat-criacional"
                : "bg-cat-principio"
              : i === atual
                ? "animate-pulse bg-primary"
                : "bg-card-border"
          )}
        />
      ))}
    </div>
  );
}


/**
 * A pergunta que fecha o enunciado, por formato.
 *
 * Antes era fixa ("De qual padrão é esta armadilha?"), o que passou a mentir
 * quando a rodada ganhou outros quatro formatos.
 */
const PERGUNTA_DO_FORMATO: Record<FormatoQuiz, string> = {
  armadilha: "De qual padrão é esta armadilha?",
  "onde-aparece": "Que padrão está por trás disto?",
  duelo: "Qual dos dois se comporta assim?",
  "anti-exemplo": "Qual padrão está sendo maltratado aqui?",
  postmortem: "Qual conceito teria contido o estrago?",
  "explique-erro": "Qual princípio foi violado?",
};
interface Props {
  /** ISO do dia — define a semente, então o quiz do dia é estável. */
  hoje: string;
  /** Registra o resultado na agenda de revisão do conceito sorteado. */
  onResponder?: (slug: string, acertou: boolean) => void;
  /** Limita o sorteio a estes conceitos. Sem escopo, vale o catálogo inteiro. */
  escopo?: readonly string[];
  /** Quantas perguntas por rodada. */
  quantidade?: number;
  /** Formatos habilitados. Vazio ou ausente = todos. */
  formatos?: readonly FormatoQuiz[];
  /** Texto do estado final quando não há perguntas suficientes. */
  vazio?: string;
  /**
   * 5 explique-erro + 2 duelos, cronômetro de 10 min.
   * Ignora `quantidade`/`formatos`.
   */
  entrevista?: boolean;
}

export function Quiz({
  hoje,
  onResponder,
  escopo,
  quantidade = QUANTAS,
  formatos,
  vazio,
  entrevista = false,
}: Props) {
  const [rodada, setRodada] = useState(0);
  const [escolha, setEscolha] = useState<string | null>(null);
  /** Um boolean por pergunta já respondida — dela derivam placar e sequência. */
  const [respostas, setRespostas] = useState<boolean[]>([]);
  const [restante, setRestante] = useState(ENTREVISTA_SEGUNDOS);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // a rodada entra na semente: "jogar de novo" traz perguntas diferentes,
  // mas a primeira rodada do dia é sempre a mesma.
  const perguntas = useMemo(() => {
    const semente = sementeDoDia(hoje) + rodada;
    if (entrevista) return gerarRodadaEntrevista(semente, escopo);
    return gerarRodada({
      semente,
      quantas: quantidade,
      escopo,
      formatos,
    });
  }, [hoje, rodada, quantidade, escopo, formatos, entrevista]);

  // enquanto há escolha em aberto, o índice é a última resposta dada
  const indice = escolha === null ? respostas.length : respostas.length - 1;
  const pergunta = perguntas[indice];
  const terminou =
    (perguntas.length > 0 &&
      respostas.length >= perguntas.length &&
      !escolha) ||
    tempoEsgotado;

  const acertos = respostas.filter(Boolean).length;
  const sequencia = sequenciaAtual(respostas);

  useEffect(() => {
    if (!entrevista) return;
    setRestante(ENTREVISTA_SEGUNDOS);
    setTempoEsgotado(false);
  }, [entrevista, rodada]); // reinicia o relógio a cada rodada

  useEffect(() => {
    if (!entrevista || terminou) return;
    if (restante <= 0) {
      setTempoEsgotado(true);
      setEscolha(null);
      return;
    }
    const id = window.setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [entrevista, terminou, restante]);

  /**
   * Ao avançar, o feedback desmonta e o foco morreria no body — leitor de
   * tela e teclado se perdem. Devolve o foco ao card e garante que o topo da
   * pergunta nova esteja visível (`nearest` rola só o necessário).
   */
  useEffect(() => {
    if (escolha === null && respostas.length > 0) {
      cardRef.current?.focus({ preventScroll: true });
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [escolha, respostas.length]);

  if (perguntas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-card-border p-5 text-center text-sm text-muted">
        {vazio ?? "Não há armadilhas suficientes para montar um quiz aqui."}
      </p>
    );
  }

  const responder = (slug: string) => {
    if (escolha || !pergunta || tempoEsgotado) return;
    setEscolha(slug);
    const acertou = slug === pergunta.correta;
    setRespostas((r) => [...r, acertou]);
    onResponder?.(pergunta.correta, acertou);
  };

  const avancar = () => setEscolha(null);

  const recomecar = () => {
    setRodada((r) => r + 1);
    setEscolha(null);
    setRespostas([]);
    setRestante(ENTREVISTA_SEGUNDOS);
    setTempoEsgotado(false);
  };

  /* ——— Tela final ——— */
  if (terminou) {
    const erradas = perguntas.filter((_, i) => respostas[i] === false);
    const naoRespondidas = tempoEsgotado
      ? perguntas.slice(respostas.length)
      : [];
    const paraReler = [...erradas, ...naoRespondidas];
    const melhor = melhorSequencia(respostas);
    const respondidas = respostas.length;
    return (
      <div className="rounded-2xl border border-card-border bg-card p-6">
        <div className="flex items-center gap-3">
          <BarraDaRodada
            total={perguntas.length}
            respostas={
              tempoEsgotado
                ? [
                    ...respostas,
                    ...Array(perguntas.length - respostas.length).fill(false),
                  ]
                : respostas
            }
            atual={perguntas.length}
          />
        </div>

        <p className="mt-4 text-center text-3xl font-semibold tracking-tight">
          {acertos}
          <span className="text-muted">
            /{tempoEsgotado ? respondidas : perguntas.length}
          </span>
        </p>
        <p className="mt-1 text-center text-sm text-muted">
          {tempoEsgotado
            ? `Tempo esgotado · ${respondidas} de ${perguntas.length} respondidas.`
            : acertos === perguntas.length
              ? entrevista
                ? "Gabaritou a entrevista."
                : "Gabaritou. As armadilhas não te pegam."
              : melhor >= 2
                ? `Melhor sequência: ${melhor} seguidas.`
                : "Cada erro aqui embaixo é uma releitura de 5 minutos."}
        </p>

        {paraReler.length > 0 && (
          <div className="mt-5 border-t border-card-border pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              Para reler
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {[...new Map(paraReler.map((p) => [p.correta, p])).values()].map(
                (p) => {
                  const c = getConceito(p.correta);
                  if (!c) return null;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/conceitos/${p.correta}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cat-principio/40 bg-cat-principio/8 px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:border-cat-principio"
                      >
                        {c.titulo}
                        <ArrowUpRight className="size-3.5 opacity-60" />
                      </Link>
                    </li>
                  );
                }
              )}
            </ul>
          </div>
        )}

        <div className="mt-5 text-center">
          <Button variant="outline" size="sm" onClick={recomecar} autoFocus>
            <RotateCcw /> {entrevista ? "Outra entrevista" : "Outra rodada"}
          </Button>
        </div>
      </div>
    );
  }

  if (!pergunta) return null;

  const revelado = escolha !== null;
  const acertou = escolha === pergunta.correta;
  // o duelo entre o que você escolheu e a resposta certa, se estiver registrado
  const duelo =
    revelado && !acertou && escolha
      ? getComparacao(slugComparacao(escolha, pergunta.correta))
      : undefined;

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      className="rounded-2xl border border-card-border bg-card p-5 outline-none sm:p-6"
    >
      {entrevista && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Entrevista · 10 min
          </p>
          <span
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              restante <= 60 ? "text-[var(--perigo)]" : "text-foreground"
            )}
            aria-live="polite"
          >
            {formatarCronometro(restante)}
          </span>
        </div>
      )}
      {/* ——— Cabeçalho: progresso da rodada + sequência ——— */}
      <div className="flex items-center gap-3">
        <BarraDaRodada
          total={perguntas.length}
          respostas={revelado ? respostas.slice(0, -1) : respostas}
          atual={indice}
        />
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 font-mono text-[13px] tabular-nums",
            sequencia >= 2 ? "text-primary" : "text-muted"
          )}
          title={sequencia >= 2 ? `${sequencia} acertos seguidos` : undefined}
        >
          {sequencia >= 2 && <Flame className="size-3.5" aria-hidden />}
          {acertos}/{perguntas.length}
        </span>
      </div>

      {/* ——— Enunciado, com o formato rotulado ———
          O rótulo não é decoração: com cinco formatos misturados na mesma
          rodada, sem ele o leitor não sabe se está diante de uma armadilha,
          de um trecho de biblioteca ou de um incidente real. ——— */}
      <figure className="mt-4">
        <figcaption className="mb-2 flex items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: "var(--primary)",
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            {ROTULO_FORMATO[pergunta.formato ?? "armadilha"]}
          </span>
          <span className="text-[13px] font-medium text-muted">
            {PERGUNTA_DO_FORMATO[pergunta.formato ?? "armadilha"]}
          </span>
        </figcaption>
        <blockquote className="border-l-2 border-primary/50 pl-3.5 text-[15px] leading-relaxed">
          <TextoRico>{pergunta.enunciado}</TextoRico>
        </blockquote>
        {pergunta.codigo && (
          <pre className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-canvas p-3 font-mono text-[12px] leading-relaxed text-foreground sm:text-[13px]">
            <code>{pergunta.codigo}</code>
          </pre>
        )}
        <figcaption className="sr-only">
          {PERGUNTA_DO_FORMATO[pergunta.formato ?? "armadilha"]}
        </figcaption>
      </figure>

      {/* ——— Alternativas: grid 2×2 (os rótulos são curtos) ——— */}
      <ul className="mt-3 grid grid-cols-2 gap-2">
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
                aria-pressed={escolhida}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  !revelado &&
                    "border-card-border hover:border-primary/60 hover:bg-primary/5",
                  revelado && correta && "border-cat-criacional bg-cat-criacional/12",
                  revelado &&
                    escolhida &&
                    !correta &&
                    "border-cat-principio bg-cat-principio/12",
                  revelado && !correta && !escolhida && "border-card-border opacity-45"
                )}
              >
                <span className="min-w-0">{c.titulo}</span>
                {revelado && correta && (
                  <CheckCircle2
                    aria-label="resposta certa"
                    className="size-4 shrink-0 text-cat-criacional"
                  />
                )}
                {revelado && escolhida && !correta && (
                  <XCircle
                    aria-label="sua escolha"
                    className="size-4 shrink-0 text-cat-principio"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* ——— Feedback + avanço ——— */}
      {revelado && escolha && (
        <div
          aria-live="polite"
          className={cn(
            "mt-3 rounded-xl border p-3.5",
            acertou
              ? "border-cat-criacional/40 bg-cat-criacional/8"
              : "border-cat-principio/40 bg-cat-principio/8"
          )}
        >
          <p className="text-[13px] leading-relaxed">
            <span className="font-semibold">
              {acertou ? "Isso. " : ""}
              {pergunta.explicacao}
            </span>{" "}
            — de{" "}
            <Link
              href={`/conceitos/${pergunta.correta}`}
              className="font-medium text-primary hover:underline"
            >
              {getConceito(pergunta.correta)?.titulo}
              <ArrowUpRight className="ml-0.5 inline size-3.5" />
            </Link>
            .
          </p>

          {duelo && (
            <Link
              href={`/comparar/${duelo.slug}`}
              className="mt-2.5 flex items-start gap-2 rounded-lg border border-card-border bg-background px-3 py-2 text-[13px] leading-snug transition-colors hover:border-primary/60"
            >
              <GitCompareArrows className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>
                Confundiu com{" "}
                <b className="font-semibold">{getConceito(escolha)?.titulo}</b>?
                É um duelo clássico — veja os dois lado a lado.
              </span>
            </Link>
          )}

          {/*
            autoFocus: o navegador rola até o elemento focado, então o botão
            nunca nasce fora da tela — era preciso rolar à mão para achá-lo.
            De brinde, Enter avança.
          */}
          <Button size="sm" className="mt-3" onClick={avancar} autoFocus>
            {respostas.length === perguntas.length ? "Ver resultado" : "Próxima"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Cabeçalho da seção — separado para a página compor sem duplicar estilo. */
export function TituloQuiz() {
  return (
    <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
      <CircleHelp className="size-3.5" />
      Quiz das armadilhas
    </h2>
  );
}
