"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Play, Lock } from "lucide-react";
import type { Roadmap } from "@/shared/types/roadmap";
import { useRoadmapProgress } from "@/shared/hook/use-roadmap-progress";
import { useDesempenhoQuiz } from "@/shared/hook/use-desempenho-quiz";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";
import {
  montarJornada,
  progressoJornada,
  type EstadoNo,
} from "@/shared/lib/gamificacao/jornada";
import { LicaoModal } from "@/shared/components/jornada/licao-modal";
import { cn } from "@/shared/utils/cn";

/** Estrelas por nó, persistidas por dispositivo (como o progresso anônimo). */
type MapaEstrelas = Record<string, number>;
const ESTRELAS_VAZIO: MapaEstrelas = {};

/** Cores de unidade — ciclo pelas categorias do tema, dá vida sem ruído. */
const CORES_UNIDADE = [
  "var(--cat-seguranca)",
  "var(--cat-estrutural)",
  "var(--cat-criacional)",
  "var(--cat-dados)",
  "var(--cat-resiliencia)",
  "var(--cat-comportamental)",
];

const W = 100; // largura lógica (%)
const PAD_TOP = 34;
const ROW_H = 104;
const AMP = 32;
const BANNER_H = 84;

interface NoPlano {
  id: string;
  titulo: string;
  conceito?: string;
  estado: EstadoNo;
  estrelas: number; // 0 = sem estrelas (checkpoint ou não jogado)
  unidadeInicio?: { titulo: string; descricao?: string; cor: string };
  x: number;
  y: number;
  indice: number;
}

export function JornadaPath({ roadmap }: { roadmap: Roadmap }) {
  const totalNos = useMemo(
    () => roadmap.sections.reduce((n, s) => n + s.items.length, 0),
    [roadmap]
  );
  const { statusDe, definir } = useRoadmapProgress(roadmap.slug, totalNos);
  const { registrar } = useDesempenhoQuiz();
  const [estrelas, setEstrelas] = useArmazenamentoLocal<MapaEstrelas>(
    `DevMappa:jornada-estrelas:${roadmap.slug}`,
    ESTRELAS_VAZIO
  );
  const router = useRouter();
  const reduzir = useReducedMotion();
  const [licao, setLicao] = useState<NoPlano | null>(null);
  const [recemConcluido, setRecemConcluido] = useState<string | null>(null);

  const { nos, altura, contagem } = useMemo(() => {
    const unidades = montarJornada(roadmap.sections, statusDe);
    const contagem = progressoJornada(roadmap.sections, statusDe);
    const plano: NoPlano[] = [];
    let i = 0;
    let y = PAD_TOP;
    unidades.forEach((u, ui) => {
      u.nos.forEach((no, ni) => {
        if (ni === 0) y += BANNER_H;
        // Arredonda: `Math.sin` difere no último dígito entre SSR e navegador,
        // o que causaria hydration mismatch no `d` do SVG.
        const x = Math.round((W / 2 + Math.sin(i * 0.85) * AMP) * 1000) / 1000;
        plano.push({
          ...no,
          estrelas: no.estado === "done" ? (estrelas[no.id] ?? 0) : 0,
          x,
          y,
          indice: i,
          unidadeInicio:
            ni === 0
              ? {
                  titulo: u.titulo,
                  descricao: u.descricao,
                  cor: CORES_UNIDADE[ui % CORES_UNIDADE.length],
                }
              : undefined,
        });
        y += ROW_H;
        i++;
      });
    });
    return { nos: plano, altura: y + 24, contagem };
  }, [roadmap, statusDe, estrelas]);

  const aoTocar = (no: NoPlano) => {
    if (no.conceito) {
      setLicao(no);
    } else if (no.estado !== "done") {
      definir(no.id, "done");
      setRecemConcluido(no.id);
      toast.success("Nó concluído");
    } else {
      router.push(`/roadmaps/${roadmap.slug}`);
    }
  };

  const concluirLicao = (no: NoPlano, estrelasGanhas: number) => {
    setEstrelas({ ...estrelas, [no.id]: estrelasGanhas });
    definir(no.id, "done");
    setRecemConcluido(no.id);
    setLicao(null);
  };

  const pct = contagem.total
    ? Math.round((contagem.concluidos / contagem.total) * 100)
    : 0;

  return (
    <div>
      {/* progresso geral da jornada */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--glow-c)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-muted">
          {contagem.concluidos}/{contagem.total}
        </span>
      </div>

      <div className="relative mx-auto max-w-md" style={{ height: altura }}>
        {/* conectores sinuosos (desenham na entrada) */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${altura}`}
          preserveAspectRatio="none"
        >
          {nos.slice(1).map((no, idx) => {
            const a = nos[idx];
            const midY = (a.y + no.y) / 2;
            const feito = a.estado === "done" && no.estado !== "locked";
            return (
              <motion.path
                key={no.id}
                d={`M ${a.x} ${a.y} C ${a.x} ${midY}, ${no.x} ${midY}, ${no.x} ${no.y}`}
                fill="none"
                stroke={
                  feito
                    ? "color-mix(in srgb, var(--glow-c) 55%, var(--card-border))"
                    : "var(--card-border)"
                }
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={
                  reduzir
                    ? { duration: 0 }
                    : { duration: 0.5, delay: 0.1 + idx * 0.025 }
                }
              />
            );
          })}
        </svg>

        {/* banners de unidade */}
        {nos.map(
          (no) =>
            no.unidadeInicio && (
              <div
                key={`b-${no.id}`}
                className="absolute inset-x-0 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white shadow-[var(--shadow-md)]"
                style={{ top: no.y - BANNER_H + 6, background: no.unidadeInicio.cor }}
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold tracking-tight">
                    {no.unidadeInicio.titulo}
                  </h2>
                  {no.unidadeInicio.descricao && (
                    <p className="truncate text-[12.5px] opacity-90">
                      {no.unidadeInicio.descricao}
                    </p>
                  )}
                </div>
              </div>
            )
        )}

        {/* nós */}
        {nos.map((no) => (
          <NoBotao
            key={no.id}
            no={no}
            onTocar={aoTocar}
            reduzir={!!reduzir}
            celebrar={no.id === recemConcluido && no.estado === "done"}
          />
        ))}
      </div>

      {licao && licao.conceito && (
        <LicaoModal
          conceito={licao.conceito}
          titulo={licao.titulo}
          onResponder={registrar}
          onConcluir={(e) => concluirLicao(licao, e)}
          onFechar={() => setLicao(null)}
        />
      )}
    </div>
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
            className="absolute left-1/2 top-1/2 text-[var(--glow-c)]"
            initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 1,
              x: Math.round(Math.cos(ang) * 46),
              y: Math.round(Math.sin(ang) * 46),
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
  const icone =
    no.estado === "done" ? (
      <Star className="size-6" fill="currentColor" />
    ) : no.estado === "current" ? (
      <Play className="size-6" fill="currentColor" />
    ) : (
      <Lock className="size-5" />
    );

  const conteudo = (
    <>
      {no.estado === "done" && no.estrelas > 0 && (
        <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 gap-0.5">
          {Array.from({ length: no.estrelas }, (_, k) => (
            <Star
              key={k}
              className="size-3 text-[var(--glow-c)] drop-shadow-[0_1px_0_rgba(0,0,0,0.15)]"
              fill="currentColor"
            />
          ))}
        </span>
      )}
      {celebrar && !reduzir && <Burst />}
      <span
        className={cn(
          "relative grid size-16 place-items-center rounded-full shadow-[var(--shadow-md)]",
          no.estado === "done" &&
            "bg-gradient-to-b from-[var(--glow-c)] to-[#a9821c] text-white",
          no.estado === "current" &&
            "bg-gradient-to-b from-primary to-[color-mix(in_srgb,var(--primary)_70%,var(--glow-c))] text-primary-foreground",
          no.estado === "locked" && "bg-foreground/10 text-muted shadow-none"
        )}
      >
        {no.estado === "current" && (
          <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-40" />
        )}
        {icone}
      </span>
      {no.estado === "current" && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-primary bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-sm)]">
          Começar
        </span>
      )}
      <span className="mt-1.5 block w-32 text-center text-[12px] font-medium leading-tight text-muted">
        {no.titulo}
      </span>
    </>
  );

  const estiloPos = { left: `${no.x}%`, top: no.y } as const;
  const anim = {
    initial: { scale: 0.4, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: reduzir
      ? { duration: 0 }
      : { delay: 0.1 + no.indice * 0.025, type: "spring" as const, stiffness: 380, damping: 24 },
    style: { ...estiloPos, x: "-50%", y: "-50%" },
  };

  if (no.estado === "locked") {
    return (
      <motion.div
        className="absolute flex flex-col items-center"
        aria-disabled
        title="Conclua o nó anterior para desbloquear"
        {...anim}
      >
        {conteudo}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => onTocar(no)}
      className="absolute flex flex-col items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`${no.titulo}${no.estado === "current" ? " — começar lição" : ""}`}
      whileTap={{ scale: 0.92 }}
      {...anim}
    >
      {conteudo}
    </motion.button>
  );
}
