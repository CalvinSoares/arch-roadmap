"use client";

import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star,
  Check,
  Crown,
  Gift,
  Trophy,
  RotateCcw,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import type { Roadmap, RecursoRoadmap } from "@/shared/types/roadmap";
import { useRoadmapProgress } from "@/shared/hook/use-roadmap-progress";
import { useDesempenhoQuiz } from "@/shared/hook/use-desempenho-quiz";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";
import {
  montarJornada,
  progressoJornada,
  type EstadoNo,
} from "@/shared/lib/gamificacao/jornada";
import { ehChaveCheckpoint } from "@/shared/lib/jornada/desafios";
import { slugsFracos } from "@/shared/lib/desempenho";
import type { ProvaRespostaQuiz } from "@/shared/lib/quiz/avaliar-prova";
import { registrarEstrelasNo, abrirBau } from "@/server/gamificacao/jornada";
import { LicaoModal } from "@/shared/components/jornada/licao-modal";
import { MetaDiaria } from "@/shared/components/jornada/meta-diaria";
import { cn } from "@/shared/utils/cn";

/** Estrelas por nó, persistidas por dispositivo (como o progresso anônimo). */
type MapaEstrelas = Record<string, number>;
const ESTRELAS_VAZIO: MapaEstrelas = {};

/** Cores de unidade: ciclo pelas categorias do tema. */
const CORES_UNIDADE = [
  "var(--cat-seguranca)",
  "var(--cat-estrutural)",
  "var(--cat-criacional)",
  "var(--cat-dados)",
  "var(--cat-resiliencia)",
  "var(--cat-comportamental)",
];

const W = 100; // largura lógica (%)
const DISCO = 70; // diâmetro do nó (px)
/**
 * Distância vertical entre centros de nós. Precisa caber: disco (70) + rótulo
 * de 2 linhas (~34) + respiro; senão o rótulo de um nó encosta no disco do
 * seguinte (era a sobreposição vista no print). 150 dá folga confortável.
 */
const ROW_H = 150;
/**
 * Amplitude do zigue-zague (%). AMP maior + fase menor afasta horizontalmente
 * nós vizinhos, então discos/decorações nunca colam mesmo perto do centro.
 */
const AMP = 34;
const FASE = 0.62;
/**
 * Respiro no topo de cada unidade. Os nós são ancorados pelo TOPO DO DISCO
 * (`top: y - DISCO/2`), então a bolha "COMEÇAR" (40px acima do disco) do 1º nó
 * fica em `y - 75`; precisa sobrar espaço pra ela não sumir sob o banner.
 */
const PAD_UNIT_TOP = 118;
const PAD_UNIT_BOTTOM = 34;

interface NoPlano {
  id: string;
  titulo: string;
  conceito?: string;
  descricao?: string;
  recursos?: RecursoRoadmap[];
  estado: EstadoNo;
  estrelas: number;
  x: number; // % dentro da unidade
  y: number; // px, centro do disco dentro da unidade
  indice: number; // global, dá o desenho contínuo da curva
  /** Marco dentro da unidade (1, 2, 3…). */
  numeroNaUnidade: number;
}

interface Decoracao {
  x: number;
  y: number;
  /** Acende quando o trecho correspondente da trilha foi alcançado. */
  ativa: boolean;
}

interface UnidadePlano {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  cor: string;
  nos: NoPlano[];
  altura: number;
  completa: boolean;
  concluidos: number;
  bau?: Decoracao;
  /** Revisão de pontos fracos; acende quando a unidade fecha. */
  revisao?: Decoracao;
  trofeu: Decoracao;
}

export function JornadaPath({
  roadmap,
  estrelasServidor = {},
  bausAbertos = [],
}: {
  roadmap: Roadmap;
  /** Estrelas vindas da conta (sincronizam entre dispositivos). */
  estrelasServidor?: Record<string, number>;
  /** Refs de baú já abertos (`bau:<slug>:<seção>`), vindos do ledger. */
  bausAbertos?: string[];
}) {
  const totalNos = useMemo(
    () => roadmap.sections.reduce((n, s) => n + s.items.length, 0),
    [roadmap]
  );
  const { statusDe, definir, resetar } = useRoadmapProgress(
    roadmap.slug,
    totalNos
  );
  const { desempenho, registrar } = useDesempenhoQuiz();
  const registrarNaJornada = useCallback(
    (
      chave: string,
      acertou: boolean,
      meta: { creditarXp: boolean; prova?: ProvaRespostaQuiz }
    ) => {
      registrar(chave, acertou, {
        creditarXp: meta.creditarXp,
        toastXp: false,
        desempenhoLocal:
          !ehChaveCheckpoint(chave) && !chave.startsWith("revisao:"),
        prova: meta.prova,
      });
    },
    [registrar]
  );
  const fracosGlobais = useMemo(
    () => slugsFracos(desempenho).slice(0, 8),
    [desempenho]
  );
  const { status: auth } = useSession();
  const logado = auth === "authenticated";
  const [estrelas, setEstrelas] = useArmazenamentoLocal<MapaEstrelas>(
    `DevMappa:jornada-estrelas:${roadmap.slug}`,
    ESTRELAS_VAZIO
  );
  const reduzir = useReducedMotion();
  const [licao, setLicao] = useState<NoPlano | null>(null);
  const [revisaoSlugs, setRevisaoSlugs] = useState<string[] | null>(null);
  const [recemConcluido, setRecemConcluido] = useState<string | null>(null);
  const [confirmandoReset, setConfirmandoReset] = useState(false);
  /** Baús abertos (servidor + os abertos nesta sessão). */
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(bausAbertos)
  );
  /** Festa manual do troféu: contador pra re-disparar o confete no clique. */
  const [festa, setFesta] = useState<{ unidade: string; n: number } | null>(
    null
  );

  const { unidades, contagem } = useMemo(() => {
    const cruas = montarJornada(roadmap.sections, statusDe);
    const contagem = progressoJornada(roadmap.sections, statusDe);
    let g = 0; // índice global, curva contínua através das unidades

    const unidades: UnidadePlano[] = cruas.map((u, ui) => {
      const nos: NoPlano[] = u.nos.map((no, ni) => {
        // Arredonda: `Math.sin` difere no último dígito entre SSR e navegador.
        const x = Math.round((W / 2 + Math.sin(g * FASE) * AMP) * 1000) / 1000;
        const y = PAD_UNIT_TOP + ni * ROW_H;
        g++;
        return {
          ...no,
          estrelas:
            no.estado === "done"
              ? Math.max(estrelas[no.id] ?? 0, estrelasServidor[no.id] ?? 0)
              : 0,
          x,
          y,
          indice: g - 1,
          numeroNaUnidade: ni + 1,
        };
      });

      const completa = nos.length > 0 && nos.every((n) => n.estado === "done");
      const concluidos = nos.filter((n) => n.estado === "done").length;
      const meio = Math.floor(nos.length / 2);
      const ultimo = nos[nos.length - 1];

      /**
       * Decoração sempre a 34% de distância do nó de referência, pro lado
       * oposto ao centro. O espelho ingênuo (100 − x) caía EM CIMA do nó
       * quando ele estava perto do centro (baú/troféu atravessando o disco).
       * Clamp mantém dentro do canvas.
       */
      const ladoOposto = (x: number) => {
        const alvo = x >= W / 2 ? x - 34 : x + 34;
        return Math.round(Math.max(12, Math.min(88, alvo)) * 1000) / 1000;
      };

      return {
        id: u.id,
        numero: ui + 1,
        titulo: u.titulo,
        descricao: u.descricao,
        cor: CORES_UNIDADE[ui % CORES_UNIDADE.length],
        nos,
        altura: PAD_UNIT_TOP + nos.length * ROW_H + PAD_UNIT_BOTTOM,
        completa,
        concluidos,
        // Baú no meio da unidade (só quando há corpo pra isso), do lado oposto.
        bau:
          nos.length >= 4
            ? {
                x: ladoOposto(nos[meio].x),
                y: nos[meio].y,
                ativa: nos[meio].estado === "done",
              }
            : undefined,
        // Revisão: ao lado do 2º nó (ou do meio se unidade curta), acende ao fechar.
        revisao:
          nos.length >= 2
            ? {
                x: ladoOposto(nos[Math.min(1, nos.length - 1)].x),
                y: nos[Math.min(1, nos.length - 1)].y + 28,
                ativa: completa,
              }
            : undefined,
        // Troféu ao lado do último nó; acende quando a unidade fecha.
        trofeu: ultimo
          ? { x: ladoOposto(ultimo.x), y: ultimo.y, ativa: completa }
          : { x: W / 2, y: PAD_UNIT_TOP, ativa: false },
      };
    });

    return { unidades, contagem };
  }, [roadmap, statusDe, estrelas, estrelasServidor]);

  const abrirRevisao = (u: UnidadePlano) => {
    if (!u.revisao?.ativa) {
      toast("Complete a unidade para revisar 🔄");
      return;
    }
    const conceitosUnidade = new Set(
      u.nos.map((n) => n.conceito).filter((c): c is string => !!c)
    );
    const daUnidade = fracosGlobais.filter((s) => conceitosUnidade.has(s));
    const slugs =
      daUnidade.length > 0
        ? daUnidade
        : fracosGlobais.length > 0
          ? fracosGlobais
          : [...conceitosUnidade].slice(0, 5);
    if (slugs.length === 0) {
      toast("Ainda não há conceitos nesta unidade para revisar.");
      return;
    }
    setLicao(null);
    setRevisaoSlugs(slugs);
  };

  const aoTocar = (no: NoPlano) => {
    if (no.estado === "locked") {
      toast("Conclua o nó anterior para desbloquear 🔒");
      return;
    }
    // Conceito ou checkpoint: ambos abrem lição com desafios verificáveis.
    setRevisaoSlugs(null);
    setLicao(no);
  };

  const abrirBauDaUnidade = async (u: UnidadePlano) => {
    if (!u.bau) return;
    const ref = `bau:${roadmap.slug}:${u.id}`;
    if (abertos.has(ref)) {
      toast.success("Baú já coletado ✓");
      return;
    }
    if (!u.bau.ativa) {
      toast("Chegue até aqui para abrir o baú 🎁");
      return;
    }
    if (!logado) {
      toast("Entre para coletar recompensas 🎁");
      return;
    }
    const r = await abrirBau(roadmap.slug, u.id).catch(() => null);
    if (r?.ok) {
      setAbertos((prev) => new Set(prev).add(ref));
      if (r.jaAberto) toast.success("Baú já coletado ✓");
      else toast.success("+25 XP e +1 freeze de streak! 🎁");
    } else if (r?.erro === "ainda não alcançado") {
      toast.error("Sua conta ainda não registrou este trecho. Refaça o nó logado.");
    } else {
      toast.error("Não deu pra abrir o baú agora.");
    }
  };

  const refazerTrilha = () => {
    resetar(); // zera o progresso local da trilha (o XP já ganho fica no ledger)
    setEstrelas(ESTRELAS_VAZIO);
    setRecemConcluido(null);
    setConfirmandoReset(false);
    toast.success("Trilha zerada, bora de novo!");
  };

  const concluirLicao = (no: NoPlano, estrelasGanhas: number) => {
    const melhor = Math.max(estrelas[no.id] ?? 0, estrelasGanhas);
    setEstrelas({ ...estrelas, [no.id]: melhor });
    definir(no.id, "done");
    if (logado) {
      void registrarEstrelasNo(no.id, estrelasGanhas).catch(() => {
        /* offline/erro; o local já refletiu */
      });
    }
    setRecemConcluido(no.id);
    setLicao(null);
  };

  const pct = contagem.total
    ? Math.round((contagem.concluidos / contagem.total) * 100)
    : 0;

  return (
    <div>
      {/* No desktop a meta diária vive no rail lateral (P7); aqui só no mobile. */}
      <div className="lg:hidden">
        <MetaDiaria />
      </div>

      {/* progresso geral da jornada + refazer trilha */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--glow-c)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-muted">
          {contagem.concluidos}/{contagem.total}
        </span>
        {contagem.concluidos > 0 &&
          (confirmandoReset ? (
            <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold">
              <span className="text-muted">Zerar a trilha?</span>
              <button
                type="button"
                onClick={refazerTrilha}
                className="rounded-lg bg-cat-principio/15 px-2 py-1 text-cat-principio transition-colors hover:bg-cat-principio/25"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoReset(false)}
                className="rounded-lg border border-card-border px-2 py-1 text-muted transition-colors hover:bg-foreground/5"
              >
                Não
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoReset(true)}
              title="Refazer a trilha do zero (o XP já ganho fica)"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-card-border px-2 py-1 text-[12px] font-semibold text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Refazer
            </button>
          ))}
      </div>

      <div className="mx-auto max-w-md space-y-3">
        {unidades.map((u) => (
          <section key={u.id}>
            {/*
              Banner sticky: cartão tingido pela cor da unidade, legível nos
              dois temas (nada de texto branco sobre pastel).
            */}
            <div
              className="sticky top-16 z-10 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur-md"
              style={{
                background: `color-mix(in srgb, ${u.cor} 14%, var(--card))`,
                borderColor: `color-mix(in srgb, ${u.cor} 45%, transparent)`,
              }}
            >
              <div className="min-w-0">
                <span
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    background: `color-mix(in srgb, ${u.cor} 18%, transparent)`,
                    color: u.cor,
                  }}
                >
                  Unidade {u.numero}
                  {u.completa && " · concluída ✓"}
                </span>
                <h2
                  className="mt-1 truncate text-sm font-bold tracking-tight"
                  style={{
                    color: `color-mix(in srgb, ${u.cor} 55%, var(--foreground))`,
                  }}
                >
                  {u.titulo}
                </h2>
                {u.descricao && (
                  <p className="truncate text-[12.5px] text-muted">
                    {u.descricao}
                  </p>
                )}
              </div>
              <span
                className="shrink-0 font-mono text-[12px] font-semibold tabular-nums"
                style={{ color: u.cor }}
              >
                {u.concluidos}/{u.nos.length}
              </span>
            </div>

            {/* Canvas da unidade, sem linhas ligando os nós (estilo Duolingo). */}
            <div
              className="relative overflow-x-clip"
              style={{ height: u.altura }}
            >
              {u.bau && (
                <Bauzinho
                  dec={u.bau}
                  aberto={abertos.has(`bau:${roadmap.slug}:${u.id}`)}
                  onAbrir={() => void abrirBauDaUnidade(u)}
                  reduzir={!!reduzir}
                />
              )}
              {u.revisao && (
                <RevisaoBotao
                  dec={u.revisao}
                  onAbrir={() => abrirRevisao(u)}
                  reduzir={!!reduzir}
                />
              )}
              <TrofeuUnidade
                dec={u.trofeu}
                cor={u.cor}
                reduzir={!!reduzir}
                confeteKey={
                  festa?.unidade === u.id
                    ? `manual-${festa.n}`
                    : u.completa && u.nos.some((n) => n.id === recemConcluido)
                      ? `auto-${recemConcluido}`
                      : null
                }
                onFesta={() => {
                  if (!u.completa) {
                    toast("Complete a unidade para o troféu 🏆");
                    return;
                  }
                  setFesta((f) => ({ unidade: u.id, n: (f?.n ?? 0) + 1 }));
                  toast.success(`Unidade ${u.numero} concluída! 🏆`);
                }}
              />

              {u.nos.map((no) => (
                <NoBotao
                  key={no.id}
                  no={no}
                  onTocar={aoTocar}
                  reduzir={!!reduzir}
                  celebrar={no.id === recemConcluido && no.estado === "done"}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {licao && licao.conceito && (
        <LicaoModal
          modo="conceito"
          conceito={licao.conceito}
          titulo={licao.titulo}
          revisao={licao.estado === "done"}
          onResponder={registrarNaJornada}
          onConcluir={(e) => concluirLicao(licao, e)}
          onFechar={() => setLicao(null)}
        />
      )}

      {licao && !licao.conceito && (
        <LicaoModal
          modo="checkpoint"
          roadmapSlug={roadmap.slug}
          item={{
            id: licao.id,
            titulo: licao.titulo,
            descricao: licao.descricao,
            recursos: licao.recursos,
          }}
          titulo={licao.titulo}
          revisao={licao.estado === "done"}
          onResponder={registrarNaJornada}
          onConcluir={(e) => concluirLicao(licao, e)}
          onFechar={() => setLicao(null)}
        />
      )}

      {revisaoSlugs && (
        <LicaoModal
          modo="revisao"
          slugs={revisaoSlugs}
          titulo="Revisão de pontos fracos"
          revisao
          onResponder={registrarNaJornada}
          onConcluir={() => {
            setRevisaoSlugs(null);
            toast.success("Revisão concluída 🔄");
          }}
          onFechar={() => setRevisaoSlugs(null)}
        />
      )}
    </div>
  );
}

/** Entrada por scroll: estoura quando entra na tela (uma vez só). */
function entradaPorScroll(reduzir: boolean, atraso = 0) {
  return {
    initial: { scale: 0.3, opacity: 0 },
    whileInView: { scale: 1, opacity: 1 },
    viewport: { once: true, margin: "-40px 0px" },
    transition: reduzir
      ? { duration: 0 }
      : {
          type: "spring" as const,
          stiffness: 340,
          damping: 22,
          delay: atraso,
        },
  };
}

/** Checkpoint de revisão: revisita erros e conceitos fracos da trilha. */
function RevisaoBotao({
  dec,
  onAbrir,
  reduzir,
}: {
  dec: Decoracao;
  onAbrir: () => void;
  reduzir: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onAbrir}
      aria-label={
        dec.ativa
          ? "Abrir revisão de pontos fracos"
          : "Revisão ainda bloqueada. Complete a unidade"
      }
      title={dec.ativa ? "Revisar pontos fracos" : "Complete a unidade"}
      className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl transition-transform hover:scale-105 active:scale-95"
      style={{
        left: `${dec.x}%`,
        top: dec.y,
        background: dec.ativa
          ? "color-mix(in srgb, var(--cat-principio) 18%, var(--card))"
          : "color-mix(in srgb, var(--foreground) 7%, var(--canvas))",
        boxShadow: dec.ativa
          ? "0 5px 0 color-mix(in srgb, var(--cat-principio) 50%, #333)"
          : "0 5px 0 color-mix(in srgb, var(--foreground) 16%, var(--canvas))",
      }}
      {...entradaPorScroll(reduzir)}
      animate={
        dec.ativa && !reduzir
          ? { scale: 1, opacity: 1, rotate: [0, -6, 6, 0] }
          : undefined
      }
      transition={
        dec.ativa && !reduzir
          ? { rotate: { repeat: Infinity, repeatDelay: 2.8, duration: 0.55 } }
          : undefined
      }
    >
      <RefreshCw
        className={cn(
          "size-5",
          dec.ativa ? "text-cat-principio" : "text-foreground/25"
        )}
      />
    </motion.button>
  );
}

/** Baú de recompensa no meio da unidade. Abre uma vez (+XP e +freeze). */
function Bauzinho({
  dec,
  aberto,
  onAbrir,
  reduzir,
}: {
  dec: Decoracao;
  aberto: boolean;
  onAbrir: () => void;
  reduzir: boolean;
}) {
  const acende = dec.ativa || aberto;
  return (
    <motion.button
      type="button"
      onClick={onAbrir}
      aria-label={
        aberto
          ? "Baú já coletado"
          : dec.ativa
            ? "Abrir baú de recompensas"
            : "Baú ainda não alcançado"
      }
      className="absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl transition-transform hover:scale-105 active:scale-95"
      style={{
        left: `${dec.x}%`,
        top: dec.y,
        background: acende
          ? "color-mix(in srgb, var(--glow-c) 22%, var(--card))"
          : "color-mix(in srgb, var(--foreground) 7%, var(--canvas))",
        boxShadow: acende
          ? "0 5px 0 color-mix(in srgb, var(--glow-c) 55%, #6b4e00)"
          : "0 5px 0 color-mix(in srgb, var(--foreground) 16%, var(--canvas))",
      }}
      {...entradaPorScroll(reduzir)}
      animate={
        dec.ativa && !aberto && !reduzir
          ? { scale: 1, opacity: 1, rotate: [0, -4, 4, 0] }
          : undefined
      }
      transition={
        dec.ativa && !aberto && !reduzir
          ? { rotate: { repeat: Infinity, repeatDelay: 2.4, duration: 0.5 } }
          : undefined
      }
    >
      {aberto ? (
        <Check className="size-6 text-[var(--glow-c)]" strokeWidth={3} />
      ) : (
        <Gift
          className={cn(
            "size-6",
            dec.ativa ? "text-[var(--glow-c)]" : "text-foreground/25"
          )}
        />
      )}
    </motion.button>
  );
}

/** Confete one-shot: dispara ao fechar a unidade (e no clique do troféu). */
function Confete({ cor }: { cor: string }) {
  const cores = [cor, "var(--glow-c)", "var(--primary)"];
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
      {Array.from({ length: 14 }, (_, k) => {
        const ang = (k / 14) * Math.PI * 2;
        const dist = 42 + (k % 3) * 16;
        return (
          <motion.span
            key={k}
            className="absolute left-1/2 top-1/2 h-2 w-1 rounded-sm"
            style={{ background: cores[k % 3] }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{
              opacity: 0,
              x: Math.round(Math.cos(ang) * dist),
              y: Math.round(Math.sin(ang) * dist + 18),
              scale: 0.6,
              rotate: k % 2 ? 220 : -220,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

/** Troféu ao lado do último nó. Acende quando a unidade fecha, com confete. */
function TrofeuUnidade({
  dec,
  cor,
  reduzir,
  confeteKey,
  onFesta,
}: {
  dec: Decoracao;
  cor: string;
  reduzir: boolean;
  /** Não-nulo = solta o confete (a key troca pra re-disparar no clique). */
  confeteKey: string | null;
  onFesta: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onFesta}
      aria-label={dec.ativa ? "Unidade concluída!" : "Complete a unidade"}
      title={dec.ativa ? "Unidade concluída!" : "Complete a unidade"}
      className="absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl transition-transform hover:scale-105 active:scale-95"
      style={{
        left: `${dec.x}%`,
        top: dec.y,
        background: dec.ativa
          ? `color-mix(in srgb, ${cor} 20%, var(--card))`
          : "color-mix(in srgb, var(--foreground) 7%, var(--canvas))",
        boxShadow: dec.ativa
          ? `0 5px 0 color-mix(in srgb, ${cor} 55%, #333)`
          : "0 5px 0 color-mix(in srgb, var(--foreground) 16%, var(--canvas))",
      }}
      {...entradaPorScroll(reduzir)}
    >
      <Trophy
        className={cn(
          "size-6",
          dec.ativa ? "text-[var(--glow-c)]" : "text-foreground/25"
        )}
      />
      {dec.ativa && !reduzir && (
        <span className="absolute inset-0 animate-pulse rounded-2xl bg-[var(--glow-c)] opacity-15" />
      )}
      {confeteKey !== null && !reduzir && <Confete key={confeteKey} cor={cor} />}
    </motion.button>
  );
}

/** Pequeno estouro de estrelas quando um nó acaba de ser concluído. */
function Burst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 6 }, (_, k) => {
        const ang = (k / 6) * Math.PI * 2;
        return (
          <motion.span
            key={k}
            className="absolute left-1/2 top-8 text-[var(--glow-c)]"
            initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 1,
              x: Math.round(Math.cos(ang) * 48),
              y: Math.round(Math.sin(ang) * 48),
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <Star className="size-3" fill="currentColor" />
          </motion.span>
        );
      })}
    </span>
  );
}

function NoBotao({
  no,
  onTocar,
  reduzir,
  celebrar,
}: {
  no: NoPlano;
  onTocar: (no: NoPlano) => void;
  reduzir: boolean;
  celebrar: boolean;
}) {
  const lendario = no.estado === "done" && no.estrelas >= 3;

  /**
   * O visual "botão 3D" do Duolingo: disco chapado + borda de espessura embaixo
   * (box-shadow sólido), que afunda no toque. Cores por CSS vars pra conviver
   * com o press via classes (`group-active`).
   */
  const visual =
    no.estado === "done"
      ? {
          "--disc-bg": "var(--glow-c)",
          "--disc-rim": "color-mix(in srgb, var(--glow-c) 62%, #4a3600)",
        }
      : no.estado === "current"
        ? {
            "--disc-bg": "var(--primary)",
            "--disc-rim": "color-mix(in srgb, var(--primary) 62%, #200a00)",
          }
        : {
            "--disc-bg":
              "color-mix(in srgb, var(--foreground) 10%, var(--canvas))",
            "--disc-rim":
              "color-mix(in srgb, var(--foreground) 20%, var(--canvas))",
          };

  // Ícone semântico (conteúdo primeiro, à la DevMappa): lição = estrela,
  // checkpoint de leitura = livro, concluído = check, 3★ = coroa.
  const icone = lendario ? (
    <Crown className="size-7" fill="currentColor" />
  ) : no.estado === "done" ? (
    <Check className="size-7" strokeWidth={3.5} />
  ) : !no.conceito ? (
    <BookOpen
      className={cn("size-6", no.estado === "locked" && "text-foreground/25")}
    />
  ) : no.estado === "current" ? (
    <Star className="size-7" fill="currentColor" />
  ) : (
    <Star className="size-6 text-foreground/25" fill="currentColor" />
  );

  const conteudo = (
    <>
      {/* glow ambiente do nó atual */}
      {no.estado === "current" && !reduzir && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2.5 left-1/2 size-[90px] -translate-x-1/2 rounded-[30px] bg-primary/25 blur-xl"
        />
      )}
      {lendario && !reduzir && (
        <span
          aria-hidden
          className="absolute -inset-x-1.5 -top-1.5 h-[76px] animate-pulse rounded-[26px] bg-[var(--glow-c)] opacity-40 blur-md"
        />
      )}
      {no.estado === "done" && no.estrelas > 0 && (
        <span className="absolute -top-3 left-1/2 z-[1] flex -translate-x-1/2 gap-0.5">
          {Array.from({ length: no.estrelas }, (_, k) => (
            <Star
              key={k}
              className="size-3 text-[var(--glow-c)] drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]"
              fill="currentColor"
            />
          ))}
        </span>
      )}
      {celebrar && !reduzir && <Burst />}

      {/*
        Disco-botão em squircle, a mesma forma do logo e do medalhão de nível.
        Diferencia o path do visual do Duolingo sem perder o tato de botão 3D.
      */}
      <span
        className={cn(
          "relative grid size-[70px] place-items-center rounded-[22px]",
          "bg-[var(--disc-bg)] shadow-[0_7px_0_var(--disc-rim)]",
          "transition-[transform,box-shadow] duration-100",
          no.estado !== "locked" &&
            "group-active:translate-y-[7px] group-active:shadow-[0_0_0_var(--disc-rim)]",
          no.estado === "done" && "text-white",
          no.estado === "current" && "text-primary-foreground"
        )}
      >
        {no.estado === "current" && (
          <span className="absolute -inset-1 animate-ping rounded-[24px] border-2 border-primary opacity-30" />
        )}
        {icone}
        {/* marco da trilha, numeração mono */}
        <span
          className={cn(
            "absolute -bottom-1.5 -right-1.5 z-[1] rounded-md border border-card-border bg-card px-1 font-mono text-[10px] font-semibold leading-4",
            no.estado === "current" ? "text-primary" : "text-muted"
          )}
        >
          {no.numeroNaUnidade}
        </span>
      </span>

      {no.estado === "current" && (
        <motion.span
          className="absolute -top-10 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-primary bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-sm)]"
          animate={reduzir ? undefined : { y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          Começar
        </motion.span>
      )}
      {no.estado === "done" && (
        <span className="pointer-events-none absolute -top-10 left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-[var(--glow-c)] bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--glow-c)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          Praticar
        </span>
      )}

      {/* rótulo com hierarquia: o atual aceso, futuro apagado */}
      <span
        className={cn(
          "mt-2 line-clamp-2 block w-28 text-center text-[13px] font-semibold leading-tight sm:w-32",
          no.estado === "current"
            ? "text-foreground"
            : no.estado === "done"
              ? "text-muted"
              : "text-muted/60"
        )}
      >
        {no.titulo}
      </span>
    </>
  );

  /**
   * Ancorado pelo DISCO (top = centro − raio), não pelo botão inteiro: a altura
   * variável do rótulo não desloca mais nada. Era a causa da bolha "COMEÇAR"
   * invadir o banner e dos desalinhamentos verticais.
   */
  const anim = {
    ...entradaPorScroll(reduzir, (no.indice % 4) * 0.05),
    style: {
      left: `${no.x}%`,
      top: no.y - DISCO / 2,
      x: "-50%",
      ...(visual as Record<string, string>),
    },
  };

  if (no.estado === "locked") {
    return (
      <motion.button
        type="button"
        onClick={() => onTocar(no)}
        className="group absolute flex cursor-not-allowed flex-col items-center rounded-2xl outline-none"
        aria-disabled
        aria-label={`${no.titulo} (bloqueado)`}
        title="Conclua o nó anterior para desbloquear"
        whileTap={reduzir ? undefined : { rotate: [0, -3, 3, 0] }}
        {...anim}
      >
        {conteudo}
      </motion.button>
    );
  }

  const rotulo =
    no.estado === "current"
      ? ": começar lição"
      : no.estado === "done"
        ? ": praticar de novo"
        : "";

  return (
    <motion.button
      type="button"
      onClick={() => onTocar(no)}
      className="group absolute flex flex-col items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`${no.titulo}${rotulo}`}
      whileHover={reduzir ? undefined : { scale: 1.04 }}
      {...anim}
    >
      {conteudo}
    </motion.button>
  );
}
