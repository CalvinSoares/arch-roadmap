"use client";

import { motion } from "framer-motion";
import { getConceito } from "@/shared/lib/content";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { cn } from "@/shared/utils/cn";
import type { DesafioMcq } from "@/shared/types/desafio";

export function DesafioMcqView({
  desafio,
  escolha,
  revelado,
  reduzir,
  onEscolher,
}: {
  desafio: DesafioMcq;
  escolha: string | null;
  revelado: boolean;
  reduzir: boolean;
  onEscolher: (id: string) => void;
}) {
  return (
    <div>
      <blockquote className="border-l-2 border-primary/50 pl-3.5 text-[16px] leading-relaxed text-foreground">
        <TextoRico>{desafio.enunciado}</TextoRico>
      </blockquote>
      {desafio.codigo && (
        <pre className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-canvas p-3 font-mono text-[12px] leading-relaxed sm:text-[13px]">
          <code>{desafio.codigo}</code>
        </pre>
      )}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {desafio.alternativas.map((id) => {
          const label =
            desafio.labels?.[id] ?? getConceito(id)?.titulo ?? id;
          const correta = id === desafio.correta;
          const escolhida = id === escolha;
          return (
            <li key={id}>
              <motion.button
                type="button"
                onClick={() => onEscolher(id)}
                disabled={revelado}
                whileTap={revelado ? undefined : { scale: 0.97 }}
                animate={
                  revelado && escolhida && !correta && !reduzir
                    ? { x: [0, -7, 7, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.35 }}
                className={cn(
                  "min-h-12 w-full rounded-xl border-2 border-b-4 px-3.5 py-3 text-left text-sm font-medium transition-colors",
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
