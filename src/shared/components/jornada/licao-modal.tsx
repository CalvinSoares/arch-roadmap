"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, animate, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Heart, X, Star, RotateCcw, Undo2, Volume2, VolumeX } from "lucide-react";
import type { RecursoRoadmap } from "@/shared/types/roadmap";
import {
  gerarDesafiosLicao,
  gerarDesafiosCheckpoint,
  gerarDesafiosRevisao,
  avaliarDesafio,
  chaveXpCheckpoint,
  estrelasDaLicao,
} from "@/shared/lib/jornada/desafios";
import {
  definirSomMudo,
  somMudo,
  tocarSomJornada,
} from "@/shared/lib/jornada/som";
import { XP } from "@/shared/lib/gamificacao/xp";
import {
  DesafioView,
  precisaConferir,
  rascunhoCompleto,
} from "@/shared/components/jornada/desafio-view";
import { ROTULO_DESAFIO, type Desafio, type RespostaDesafio } from "@/shared/types/desafio";
import type { RoadmapItem } from "@/shared/types/roadmap";
import type { ProvaRespostaQuiz } from "@/shared/lib/quiz/avaliar-prova";
import { cn } from "@/shared/utils/cn";

const QUANTAS_CONCEITO = 5;
const QUANTAS_CHECKPOINT = 3;
const QUANTAS_REVISAO = 5;
const VIDAS_INICIAIS = 5;

function vibrar(padrao: number | number[]) {
  try {
    navigator.vibrate?.(padrao);
  } catch {
    /* sem suporte */
  }
}

type CallbacksComuns = {
  titulo: string;
  revisao?: boolean;
  onResponder: (
    chave: string,
    acertou: boolean,
    meta: { creditarXp: boolean; prova?: ProvaRespostaQuiz }
  ) => void;
  onConcluir: (estrelas: number) => void;
  onFechar: () => void;
};

type PropsConceito = CallbacksComuns & {
  modo: "conceito";
  conceito: string;
};

type PropsCheckpoint = CallbacksComuns & {
  modo: "checkpoint";
  roadmapSlug: string;
  item: RoadmapItem;
};

type PropsRevisao = CallbacksComuns & {
  modo: "revisao";
  /** Slugs de conceito em que o usuário mais erra. */
  slugs: string[];
};

export type LicaoModalProps = PropsConceito | PropsCheckpoint | PropsRevisao;

/**
 * Lição fullscreen da jornada: sequencia `Desafio[]` (VF, lacuna, ordenar,
 * parear, dois códigos, MCQ). Mesma casca de vidas / fila de erro / estrelas.
 */
export function LicaoModal(props: LicaoModalProps) {
  const { titulo, revisao = false, onResponder, onConcluir, onFechar } = props;
  const [rodada, setRodada] = useState(0);
  const [semente] = useState(() => Math.floor(Math.random() * 1_000_000));
  /** Replay / revisão de pontos fracos não farm XP de quiz. */
  const [creditarXp, setCreditarXp] = useState(
    !revisao && props.modo !== "revisao"
  );
  const [mudo, setMudo] = useState(() => somMudo());

  const modo = props.modo;
  const conceitoSlug = props.modo === "conceito" ? props.conceito : null;
  const checkpointItem = props.modo === "checkpoint" ? props.item : null;
  const roadmapSlug = props.modo === "checkpoint" ? props.roadmapSlug : null;
  const slugsRevisao = props.modo === "revisao" ? props.slugs : null;

  const desafios = useMemo(() => {
    if (modo === "conceito" && conceitoSlug) {
      return gerarDesafiosLicao({
        slug: conceitoSlug,
        semente: semente + rodada,
        quantas: QUANTAS_CONCEITO,
      });
    }
    if (modo === "checkpoint" && checkpointItem && roadmapSlug) {
      return gerarDesafiosCheckpoint({
        roadmapSlug,
        item: checkpointItem,
        semente: semente + rodada,
        quantas: QUANTAS_CHECKPOINT,
      });
    }
    if (modo === "revisao" && slugsRevisao && slugsRevisao.length > 0) {
      return gerarDesafiosRevisao({
        slugs: slugsRevisao,
        semente: semente + rodada,
        quantas: QUANTAS_REVISAO,
      });
    }
    return [];
  }, [
    modo,
    conceitoSlug,
    checkpointItem,
    roadmapSlug,
    slugsRevisao,
    semente,
    rodada,
  ]);

  const chaveXp =
    modo === "conceito" && conceitoSlug
      ? conceitoSlug
      : modo === "revisao"
        ? "revisao:pontos-fracos"
        : chaveXpCheckpoint(roadmapSlug ?? "?", checkpointItem?.id ?? "?");

  const [i, setI] = useState(0);
  const [resposta, setResposta] = useState<RespostaDesafio | null>(null);
  const [rascunho, setRascunho] = useState<RespostaDesafio | null>(null);
  const [corretas, setCorretas] = useState<Set<string>>(new Set());
  const [erradas, setErradas] = useState<Set<string>>(new Set());
  const [filaExtra, setFilaExtra] = useState<Desafio[]>([]);
  const [erros, setErros] = useState(0);
  const [vidas, setVidas] = useState(VIDAS_INICIAIS);
  const [ultimoOk, setUltimoOk] = useState(false);
  const [ultimaExplicacao, setUltimaExplicacao] = useState("");
  const reduzir = useReducedMotion();

  const sequencia = useMemo(
    () => [...desafios, ...filaExtra],
    [desafios, filaExtra]
  );
  const desafio = sequencia[i];
  const revelado = resposta !== null;
  const emRevisao = i >= desafios.length;
  const terminou =
    desafios.length > 0 && corretas.size >= desafios.length && !revelado;

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  useEffect(() => {
    if (terminou) {
      vibrar([15, 60, 15, 60, 30]);
      tocarSomJornada("conclusao", { reduzir: !!reduzir });
    }
  }, [terminou, reduzir]);

  const aplicarResposta = (r: RespostaDesafio) => {
    if (revelado || !desafio) return;
    const { ok, explicacao } = avaliarDesafio(desafio, r);
    setResposta(r);
    setUltimoOk(ok);
    setUltimaExplicacao(explicacao);

    const sementeEfetiva = semente + rodada;
    const quantas =
      modo === "checkpoint"
        ? QUANTAS_CHECKPOINT
        : modo === "revisao"
          ? QUANTAS_REVISAO
          : QUANTAS_CONCEITO;

    const prova: ProvaRespostaQuiz | undefined = emRevisao
      ? undefined // fila de erro: desafio pode não estar no lote regenerável
      : {
          kind: "desafio-jornada",
          modo:
            modo === "conceito"
              ? "conceito"
              : modo === "checkpoint"
                ? "checkpoint"
                : "revisao",
          semente: sementeEfetiva,
          desafioId: desafio.id,
          quantas,
          slug: conceitoSlug ?? undefined,
          roadmapSlug: roadmapSlug ?? undefined,
          itemId: checkpointItem?.id,
          slugs: slugsRevisao ? [...slugsRevisao] : undefined,
          resposta: r,
        };

    onResponder(chaveXp, ok, { creditarXp: creditarXp && !!prova, prova });
    vibrar(ok ? 15 : [30, 40, 30]);
    tocarSomJornada(ok ? "acerto" : "erro", { reduzir: !!reduzir });
    if (ok) {
      setCorretas((s) => new Set(s).add(desafio.id));
    } else {
      setErros((e) => e + 1);
      setErradas((s) => new Set(s).add(desafio.id));
      setVidas((v) => Math.max(0, v - 1));
      setFilaExtra((f) => [...f, desafio]);
    }
  };

  const avancar = () => {
    if (resposta === null) return;
    setResposta(null);
    setRascunho(null);
    setI((n) => n + 1);
  };

  const praticarDeNovo = () => {
    setCreditarXp(false);
    setRodada((r) => r + 1);
    setI(0);
    setResposta(null);
    setRascunho(null);
    setCorretas(new Set());
    setErradas(new Set());
    setFilaExtra([]);
    setErros(0);
    setVidas(VIDAS_INICIAIS);
  };

  const estrelas = estrelasDaLicao(desafios.length, erros);
  const xpGanho =
    corretas.size * XP.quizAcerto +
    (revisao || modo === "revisao" ? 0 : XP.noConcluido);

  const alternarMute = () => {
    const next = !mudo;
    setMudo(next);
    definirSomMudo(next);
  };

  const podeConferir =
    !!desafio &&
    precisaConferir(desafio) &&
    !revelado &&
    rascunhoCompleto(desafio, rascunho);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={`Lição: ${titulo}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Sair da lição"
          className="rounded-lg p-1 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <X className="size-6" />
        </button>
        <div
          className="flex flex-1 items-center gap-1"
          role="img"
          aria-label={`${corretas.size} de ${desafios.length} desafios resolvidos`}
        >
          {desafios.map((d) => (
            <motion.span
              key={d.id}
              layout
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-300",
                corretas.has(d.id)
                  ? "bg-cat-criacional"
                  : d.id === desafio?.id
                    ? "animate-pulse bg-primary"
                    : erradas.has(d.id)
                      ? "bg-cat-principio"
                      : "bg-card-border"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={alternarMute}
          aria-label={mudo ? "Ativar som" : "Silenciar som"}
          title={mudo ? "Som desligado" : "Som ligado"}
          className="rounded-lg p-1 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {mudo ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        <span
          className={cn(
            "flex items-center gap-1 font-bold tabular-nums",
            vidas > 0 ? "text-[#e0473a]" : "text-muted"
          )}
        >
          <Heart className="size-5" fill="currentColor" />
          {vidas}
        </span>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        {props.modo === "checkpoint" &&
          checkpointItem?.recursos &&
          checkpointItem.recursos.length > 0 &&
          i === 0 &&
          !revelado && (
            <RecursosCheckpoint recursos={checkpointItem.recursos} />
          )}
        {desafios.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-muted">
              Não foi possível montar desafios para este nó. Tente de novo.
            </p>
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold"
            >
              Fechar
            </button>
          </div>
        ) : terminou ? (
          <TelaFinal
            estrelas={estrelas}
            erros={erros}
            xp={xpGanho}
            revisao={revisao}
            reduzir={!!reduzir}
            onPraticar={praticarDeNovo}
            onConcluir={() => onConcluir(estrelas)}
          />
        ) : (
          desafio && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${desafio.id}:${i}`}
                initial={reduzir ? { opacity: 0 } : { opacity: 0, x: 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? { opacity: 0 } : { opacity: 0, x: -48 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="pt-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      color: "var(--primary)",
                      background:
                        "color-mix(in srgb, var(--primary) 12%, transparent)",
                    }}
                  >
                    {ROTULO_DESAFIO[desafio.tipo]}
                  </span>
                  {props.modo === "checkpoint" && (
                    <span className="rounded-md bg-foreground/6 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                      Checkpoint
                    </span>
                  )}
                  {props.modo === "revisao" && (
                    <span className="rounded-md bg-cat-principio/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cat-principio">
                      Revisão
                    </span>
                  )}
                  {emRevisao && (
                    <span className="flex items-center gap-1 rounded-md bg-cat-principio/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-cat-principio">
                      <Undo2 className="size-3" />
                      Erro anterior, tente de novo
                    </span>
                  )}
                </div>

                <DesafioView
                  desafio={desafio}
                  revelado={revelado}
                  reduzir={!!reduzir}
                  resposta={resposta}
                  onResponder={aplicarResposta}
                  onRascunho={setRascunho}
                />

                {podeConferir && rascunho && (
                  <button
                    type="button"
                    onClick={() => aplicarResposta(rascunho)}
                    className="mt-4 w-full rounded-xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground shadow-[0_4px_0_color-mix(in_srgb,var(--primary)_55%,#000)] transition-transform active:translate-y-0.5"
                  >
                    Conferir
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          )
        )}
      </div>

      <AnimatePresence>
        {!terminou && desafios.length > 0 && revelado && desafio && (
          <motion.div
            initial={reduzir ? { opacity: 0 } : { y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduzir ? { opacity: 0 } : { y: 64, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "border-t px-5 py-4",
              ultimoOk
                ? "border-cat-criacional/40 bg-cat-criacional/10"
                : "border-cat-principio/40 bg-cat-principio/10"
            )}
          >
            <div className="mx-auto max-w-2xl">
              <p className="text-[13px] leading-relaxed text-foreground">
                <span className="font-semibold">
                  {ultimoOk ? "Isso! " : "Quase. Volta no fim da lição. "}
                </span>
                {ultimaExplicacao}
                {props.modo === "conceito" && (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={`/conceitos/${props.conceito}`}
                      className="font-medium text-primary hover:underline"
                    >
                      ver conceito
                    </Link>
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={avancar}
                autoFocus
                className={cn(
                  "mt-3 w-full rounded-xl px-3 py-3 text-sm font-bold transition-transform active:translate-y-0.5",
                  ultimoOk
                    ? "bg-accent text-white shadow-[0_4px_0_color-mix(in_srgb,var(--accent)_55%,#000)]"
                    : "bg-primary text-primary-foreground shadow-[0_4px_0_color-mix(in_srgb,var(--primary)_55%,#000)]"
                )}
              >
                {corretas.size >= desafios.length ? "Ver resultado" : "Continuar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ROTULO_RECURSO: Record<RecursoRoadmap["tipo"], string> = {
  doc: "doc",
  artigo: "artigo",
  spec: "spec",
  video: "vídeo",
  curso: "curso",
  ferramenta: "ferramenta",
};

function RecursosCheckpoint({ recursos }: { recursos: RecursoRoadmap[] }) {
  return (
    <div className="mb-5 mt-2 rounded-xl border border-card-border bg-foreground/[0.03] px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        Para estudar
      </p>
      <ul className="mt-2 space-y-1.5">
        {recursos.map((r) => (
          <li key={r.href}>
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-lg px-1 py-1 text-sm transition-colors hover:text-primary"
            >
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted transition-colors group-hover:text-primary" />
              <span className="min-w-0 leading-snug">
                <span className="font-medium">{r.titulo}</span>
                <span className="ml-1.5 text-[11px] text-muted">
                  {r.fonte ? `${r.fonte} · ` : ""}
                  {ROTULO_RECURSO[r.tipo]}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContadorXp({ ate, reduzir }: { ate: number; reduzir: boolean }) {
  const [valor, setValor] = useState(reduzir ? ate : 0);
  useEffect(() => {
    if (reduzir) return;
    const controle = animate(0, ate, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setValor(Math.round(v)),
    });
    return () => controle.stop();
  }, [ate, reduzir]);
  return <>{valor}</>;
}

function TelaFinal({
  estrelas,
  erros,
  xp,
  revisao,
  reduzir,
  onPraticar,
  onConcluir,
}: {
  estrelas: number;
  erros: number;
  xp: number;
  revisao: boolean;
  reduzir: boolean;
  onPraticar: () => void;
  onConcluir: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
      <motion.div
        className="text-6xl"
        initial={reduzir ? false : { scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
      >
        {erros === 0 ? "🏆" : "🎉"}
      </motion.div>

      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <motion.span
            key={n}
            initial={reduzir ? false : { scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{
              delay: reduzir ? 0 : 0.25 + n * 0.18,
              type: "spring",
              stiffness: 380,
              damping: 14,
            }}
          >
            <Star
              className={cn(
                "size-9",
                n <= estrelas ? "text-[var(--glow-c)]" : "text-foreground/15"
              )}
              fill="currentColor"
            />
          </motion.span>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-foreground">
        {revisao ? "Prática concluída!" : "Lição concluída!"}
      </h2>
      <p className="text-sm text-muted">
        {erros === 0
          ? "Rodada limpa, sem nenhum erro."
          : `${erros} ${erros === 1 ? "erro corrigido" : "erros corrigidos"} no caminho.`}
      </p>

      <div className="rounded-2xl border-2 border-[var(--glow-c)] px-6 py-3 text-lg font-black tabular-nums text-[var(--glow-c)]">
        +<ContadorXp ate={xp} reduzir={reduzir} /> XP
      </div>

      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={onConcluir}
          autoFocus
          className="w-full rounded-xl bg-accent px-3 py-3 text-sm font-bold text-white shadow-[0_4px_0_color-mix(in_srgb,var(--accent)_55%,#000)] transition-transform active:translate-y-0.5"
        >
          Concluir
        </button>
        <button
          type="button"
          onClick={onPraticar}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-card-border px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <RotateCcw className="size-4" />
          Praticar de novo
        </button>
      </div>
    </div>
  );
}
