"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import { classesOpcaoDesafio } from "@/shared/components/jornada/desafios/opcao-estilo";
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
      <p className="text-[15px] leading-relaxed text-foreground sm:text-[16px]">
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
                whileTap={revelado ? undefined : { scale: 0.99 }}
                animate={
                  revelado && escolhida && !correta && !reduzir
                    ? { x: [0, -7, 7, -4, 4, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.35 }}
                className={cn(
                  classesOpcaoDesafio({
                    revelado,
                    correta,
                    escolhida,
                  }),
                  "overflow-hidden p-0"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 border-b px-3 py-2",
                    revelado && correta
                      ? "border-cat-criacional/35 bg-cat-criacional/10"
                      : revelado && escolhida && !correta
                        ? "border-cat-principio/35 bg-cat-principio/10"
                        : "border-card-border bg-foreground/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-md font-mono text-[12px] font-bold",
                      revelado && correta
                        ? "bg-cat-criacional text-white"
                        : revelado && escolhida && !correta
                          ? "bg-cat-principio text-white"
                          : "bg-primary/18 text-primary"
                    )}
                  >
                    {rotulo}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                    Opção {rotulo}
                  </span>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted/80">
                    {revelado
                      ? correta
                        ? "Certo"
                        : escolhida
                          ? "Errado"
                          : ""
                      : "Toque para escolher"}
                  </span>
                </div>
                <pre className="max-h-56 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed sm:text-[12.5px]">
                  <code className="block w-full">{code}</code>
                </pre>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
