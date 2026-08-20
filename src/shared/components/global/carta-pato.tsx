"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail, X } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";

/**
 * Easter egg da home. De vez em quando uma carta atravessa a tela enquanto o
 * visitante está no topo da página; clicar nela abre o patoDev.
 *
 * A travessia é uma animação CSS (`.carta-voo` em globals.css), não framer: o
 * transform fica com um dono só e o hover consegue congelar a carta, senão ela
 * fugiria do cursor.
 */

/** Espera entre uma carta e a próxima. */
const ESPERA_MIN_MS = 700;
const ESPERA_MAX_MS = 1_000;
/** Travessia da tela. O hover congela a carta, então dá para clicar. */
const VOO_MIN_S = 13;
const VOO_MAX_S = 18;
/** Sem animação, a carta fica parada por este tempo e sai. */
const PARADA_MS = 12_000;

interface Carta {
  id: number;
  /** Altura na tela, em % da viewport. */
  topo: number;
  daEsquerda: boolean;
  duracao: number;
  giro: number;
}

const entre = (min: number, max: number) => min + Math.random() * (max - min);

function novaCarta(id: number): Carta {
  return {
    id,
    topo: entre(20, 68),
    daEsquerda: Math.random() > 0.5,
    duracao: entre(VOO_MIN_S, VOO_MAX_S),
    giro: entre(-6, 6),
  };
}

export function CartaPato() {
  const sentinela = useRef<HTMLSpanElement>(null);
  const reduzir = useReducedMotion();

  const [noTopo, setNoTopo] = useState(false);
  const [carta, setCarta] = useState<Carta | null>(null);
  const [aberto, setAberto] = useState(false);
  const proximoId = useRef(1);

  // IntersectionObserver na mão em vez do useInView do framer porque aqui o
  // observador faz duas coisas: liga/desliga o sorteio e recolhe a carta que
  // já estava em voo quando o hero sai da tela.
  useEffect(() => {
    const alvo = sentinela.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        setNoTopo(entrada.isIntersecting);
        if (!entrada.isIntersecting) setCarta(null);
      },
      { rootMargin: "-80px" }
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  // Agenda a próxima carta: só com o hero à vista, uma por vez e o modal
  // fechado. O sorteio mora no callback do timer porque Math.random durante a
  // renderização quebraria a hidratação.
  useEffect(() => {
    if (!noTopo || carta || aberto) return;
    const id = window.setTimeout(
      () => setCarta(novaCarta(proximoId.current++)),
      entre(ESPERA_MIN_MS, ESPERA_MAX_MS)
    );
    return () => window.clearTimeout(id);
  }, [noTopo, carta, aberto]);

  // Com movimento reduzido não há animação para terminar, então um timer
  // recolhe a carta no lugar do onAnimationEnd.
  useEffect(() => {
    if (!carta || !reduzir || aberto) return;
    const id = window.setTimeout(() => setCarta(null), PARADA_MS);
    return () => window.clearTimeout(id);
  }, [carta, reduzir, aberto]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const abrir = () => {
    setCarta(null);
    setAberto(true);
  };

  return (
    <>
      {/* Diz se o hero ainda está na tela. */}
      <span
        ref={sentinela}
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />

      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {carta && !aberto && (
          <button
            key={carta.id}
            type="button"
            onClick={abrir}
            onAnimationEnd={() => setCarta(null)}
            aria-label="Abrir a carta do patoDev"
            title="Tem uma carta para você"
            // p-2 dá folga de alvo em volta do disco: o quadrado clicável fica
            // perto de 60px, e passar o mouse congela a travessia.
            className="carta-voo group pointer-events-auto absolute left-0 p-2 focus-visible:outline-none"
            style={
              {
                top: `${carta.topo}%`,
                "--carta-de": carta.daEsquerda ? "-12vw" : "112vw",
                "--carta-para": carta.daEsquerda ? "112vw" : "-12vw",
                "--carta-duracao": `${carta.duracao}s`,
                "--carta-giro": `${carta.giro}deg`,
              } as React.CSSProperties
            }
          >
            <span className="grid size-11 place-items-center rounded-xl bg-white text-neutral-800 shadow-[0_8px_28px_rgba(0,0,0,0.3)] ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <Mail className="size-5" />
            </span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {aberto && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="carta-pato-titulo"
            onClick={() => setAberto(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              animate={reduzir ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={
                reduzir
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 240, damping: 20 }
              }
              className="relative w-full max-w-sm rounded-2xl border border-card-border bg-card p-5 text-center shadow-[var(--shadow-lg)]"
            >
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="absolute right-2 top-2 grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-5" />
                <span className="sr-only">Fechar</span>
              </button>

              <Image
                src="/patodev.png"
                alt="Pato apontando para a tela"
                width={650}
                height={592}
                sizes="(max-width: 640px) 80vw, 320px"
                className="mx-auto h-auto w-full max-w-[260px]"
              />

              <p
                id="carta-pato-titulo"
                className="mt-3 text-lg font-semibold leading-snug tracking-tight"
              >
                Pra você deixar de ser um dev PATO!
              </p>

              <Button className="mt-4" onClick={() => setAberto(false)} autoFocus>
                Bora estudar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
