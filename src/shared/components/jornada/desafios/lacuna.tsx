"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import type { DesafioLacuna } from "@/shared/types/desafio";

export function DesafioLacunaView({
  desafio,
  escolha,
  revelado,
  reduzir,
  onEscolher,
}: {
  desafio: DesafioLacuna;
  escolha: string | null;
  revelado: boolean;
  reduzir: boolean;
  onEscolher: (opcao: string) => void;
}) {
  return (
    <div>
      <p className="text-[16px] leading-relaxed text-foreground">
        {desafio.fraseAntes}
        <span
          className={cn(
            "mx-1 inline-block min-w-[4.5rem] rounded-md border-b-2 px-1.5 text-center font-semibold",
            revelado && escolha === desafio.correta
              ? "border-cat-criacional text-cat-criacional"
              : revelado
                ? "border-cat-principio text-cat-principio"
                : "border-primary/50 text-primary"
          )}
        >
          {escolha ?? "····"}
        </span>
        {desafio.fraseDepois}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {desafio.opcoes.map((op) => {
          const correta = op === desafio.correta;
          const escolhida = op === escolha;
          return (
            <li key={op}>
              <motion.button
                type="button"
                onClick={() => onEscolher(op)}
                disabled={revelado}
                whileTap={revelado ? undefined : { scale: 0.97 }}
                animate={
                  revelado && escolhida && !correta && !reduzir
                    ? { x: [0, -7, 7, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.35 }}
                className={cn(
                  "rounded-xl border-2 border-b-4 px-3.5 py-2.5 text-sm font-medium transition-colors",
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
                {op}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
