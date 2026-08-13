"use client";

import { motion } from "framer-motion";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { classesOpcaoDesafio } from "@/shared/components/jornada/desafios/opcao-estilo";
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
      <blockquote className="border-l-2 border-primary/50 pl-3.5 text-[15px] leading-relaxed text-foreground sm:text-[16px]">
        <TextoRico>{desafio.afirmacao}</TextoRico>
      </blockquote>
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {opcoes.map(({ valor, label }) => {
          const correta = valor === desafio.correta;
          const escolhida = escolha === valor;
          return (
            <li key={label}>
              <motion.button
                type="button"
                onClick={() => onEscolher(valor)}
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
                  className: "min-h-14 text-center text-base font-semibold",
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
