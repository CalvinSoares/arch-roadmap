"use client";

import { motion } from "framer-motion";
import { getConceito } from "@/shared/lib/content";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { classesOpcaoDesafio } from "@/shared/components/jornada/desafios/opcao-estilo";
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
      <blockquote className="border-l-2 border-primary/50 pl-3.5 text-[15px] leading-relaxed text-foreground sm:text-[16px]">
        <TextoRico>{desafio.enunciado}</TextoRico>
      </blockquote>
      {desafio.codigo && (
        <pre className="mt-3 max-h-48 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-xl border border-card-border bg-canvas p-3 font-mono text-[12px] leading-relaxed sm:text-[13px]">
          <code className="block w-full">{desafio.codigo}</code>
        </pre>
      )}
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
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
                whileTap={revelado ? undefined : { scale: 0.98 }}
                animate={
                  revelado && escolhida && !correta && !reduzir
                    ? { x: [0, -7, 7, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.35 }}
                className={classesOpcaoDesafio({
                  revelado,
                  correta,
                  escolhida,
                })}
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
