"use client";

import { useEffect, useState } from "react";

/** easeOutCubic: rápido no começo, assentando no fim. */
const suavizar = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * Número que sobe de 0 até o valor ao montar.
 *
 * O estado começa **no valor final** e só é reduzido dentro do primeiro
 * quadro: sem JS, com movimento reduzido ou se os quadros nunca chegarem
 * (aba em segundo plano), o que fica na tela é o número certo, nunca zero.
 */
export function Contador({
  valor,
  duracao = 1.1,
  atraso = 0,
}: {
  valor: number;
  duracao?: number;
  atraso?: number;
}) {
  const [n, setN] = useState(valor);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duracaoMs = duracao * 1000;
    const atrasoMs = atraso * 1000;
    let quadro = 0;
    let inicio = 0;

    const passo = (agora: number) => {
      if (!inicio) inicio = agora;
      const decorrido = agora - inicio - atrasoMs;

      if (decorrido < 0) {
        setN(0);
        quadro = requestAnimationFrame(passo);
        return;
      }

      const progresso = Math.min(1, decorrido / duracaoMs);
      setN(Math.round(suavizar(progresso) * valor));
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    };

    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao, atraso]);

  // o valor final fica sempre no DOM para leitor de tela e indexação
  return (
    <>
      <span aria-hidden>{n}</span>
      <span className="sr-only">{valor}</span>
    </>
  );
}
