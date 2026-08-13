"use client";

import { motion } from "framer-motion";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { cn } from "@/shared/utils/cn";
import type { DesafioVf } from "@/shared/types/desafio";

export function DesafioVfView({
  desafio,
  escolha,
  revelado,
  reduzir,
  onEscolher,
}: {
  desafio: DesafioVf;
  escolha: boolean | null;
  revelado: boolean;
  reduzir: boolean;
  onEscolher: (v: boolean) => void;
}) {
  const opcoes: { valor: boolean; label: string }[] = [
    { valor: true, label: "Verdadeiro" },
    { valor: false, label: "Falso" },
  ];

  return (
    <div>
      <blockquote className="border-l-2 border-primary/50 pl-3.5 text-[16px] leading-relaxed text-foreground">
        <TextoRico>{desafio.afirmacao}</TextoRico>
      </blockquote>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {opcoes.map(({ valor, label }) => {
          const correta = valor === desafio.correta;
          const escolhida = escolha === valor;
          return (
            <li key={label}>
              <motion.button
                type="button"
                onClick={() => onEscolher(valor)}
                disabled={revelado}
                whileTap={revelado ? undefined : { scale: 0.97 }}
                animate={
                  revelado && escolhida && !correta && !reduzir
                    ? { x: [0, -7, 7, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.35 }}
                className={cn(
                  "min-h-14 w-full rounded-xl border-2 border-b-4 px-3.5 py-3 text-center text-base font-semibold transition-colors",
                  !revelado &&
                    "border-card-border bg-card hover:border-primary/50 hover:bg-primary/5",
                  revelado &&
                    correta &&
                    "border-cat-criacional bg-cat-criacional/14",
                  revelado &&
                    escolhida &&
                    !correta &&
                    "border-cat-principio bg-cat-principio/12",
                  revelado &&
                    !correta &&
                    !escolhida &&
                    "border-card-border opacity-45"
                )}
              >
                {label}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
