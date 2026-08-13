"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import type { DesafioDoisCodigos } from "@/shared/types/desafio";

export function DesafioDoisCodigosView({
  desafio,
  escolha,
  revelado,
  reduzir,
  onEscolher,
}: {
  desafio: DesafioDoisCodigos;
  escolha: "a" | "b" | null;
  revelado: boolean;
  reduzir: boolean;
  onEscolher: (lado: "a" | "b") => void;
}) {
  const lados: { id: "a" | "b"; code: string; rotulo: string }[] = [
    { id: "a", code: desafio.a, rotulo: "A" },
    { id: "b", code: desafio.b, rotulo: "B" },
  ];

  return (
    <div>
      <p className="text-[16px] leading-relaxed text-foreground">
        {desafio.enunciado}
      </p>
      <ul className="mt-4 grid gap-3">
        {lados.map(({ id, code, rotulo }) => {
          const correta = id === desafio.correta;
          const escolhida = id === escolha;
          return (
            <li key={id}>
              <motion.button
                type="button"
                onClick={() => onEscolher(id)}
                disabled={revelado}
                whileTap={revelado ? undefined : { scale: 0.985 }}
                animate={
                  revelado && escolhida && !correta && !reduzir
                    ? { x: [0, -7, 7, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.35 }}
                className={cn(
                  "w-full overflow-hidden rounded-xl border-2 border-b-4 text-left transition-colors",
                  !revelado &&
                    "border-card-border bg-card hover:border-primary/50",
                  revelado &&
                    correta &&
                    "border-cat-criacional bg-cat-criacional/10",
                  revelado &&
                    escolhida &&
                    !correta &&
                    "border-cat-principio bg-cat-principio/10",
                  revelado &&
                    !correta &&
                    !escolhida &&
                    "border-card-border opacity-45"
                )}
              >
                <div className="flex items-center gap-2 border-b border-card-border px-3 py-1.5">
                  <span className="grid size-6 place-items-center rounded-md bg-foreground/8 font-mono text-[11px] font-bold">
                    {rotulo}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Opção {rotulo}
                  </span>
                </div>
                <pre className="max-h-48 overflow-auto p-3 font-mono text-[11px] leading-relaxed sm:text-[12px]">
                  <code>{code}</code>
                </pre>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
