"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Direcao = "cima" | "baixo" | "esquerda" | "direita" | "nenhuma";

const DESLOCAMENTO: Record<Direcao, { x?: number; y?: number }> = {
  cima: { y: 18 },
  baixo: { y: -18 },
  esquerda: { x: 18 },
  direita: { x: -18 },
  nenhuma: {},
};

interface OpcoesReveal {
  /** Índice na lista; vira o atraso da cascata. */
  indice?: number;
  atraso?: number;
  direcao?: Direcao;
  /** Anima só quando entra na viewport (default) ou já na montagem. */
  aoAparecer?: boolean;
}

type RevealProps = Omit<HTMLMotionProps<"div">, "ref"> & OpcoesReveal;
type RevealItemProps = Omit<HTMLMotionProps<"li">, "ref"> & OpcoesReveal;

/** Props de animação compartilhadas pelas duas variantes. */
function animacao({
  indice = 0,
  atraso = 0,
  direcao = "cima",
  aoAparecer = true,
}: OpcoesReveal) {
  const final = { opacity: 1, x: 0, y: 0 };
  return {
    initial: { opacity: 0, ...DESLOCAMENTO[direcao] },
    ...(aoAparecer
      ? { whileInView: final, viewport: { once: true, margin: "-60px" } }
      : { animate: final }),
    transition: {
      duration: 0.5,
      delay: atraso + indice * 0.06,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
}

/**
 * Entrada em cascata: opacidade + deslocamento, com atraso derivado do
 * índice. `prefers-reduced-motion` é respeitado pelo próprio framer-motion
 * (além da regra global em `globals.css`).
 */
export function Reveal({
  indice,
  atraso,
  direcao,
  aoAparecer,
  children,
  ...props
}: RevealProps) {
  return (
    <motion.div {...animacao({ indice, atraso, direcao, aoAparecer })} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Mesma entrada, renderizando o próprio `<li>`. Use dentro de `<ul>`/`<ol>`:
 * envolver o item em uma `div` quebraria a relação lista → item.
 */
export function RevealItem({
  indice,
  atraso,
  direcao,
  aoAparecer,
  children,
  ...props
}: RevealItemProps) {
  return (
    <motion.li {...animacao({ indice, atraso, direcao, aoAparecer })} {...props}>
      {children}
    </motion.li>
  );
}
