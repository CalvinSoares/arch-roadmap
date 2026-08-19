"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import { classesOpcaoDesafio } from "@/shared/components/jornada/desafios/opcao-estilo";
import type { DesafioOrdenar } from "@/shared/types/desafio";

/**
 * Ordenar por toque: toca os itens na ordem desejada; toque de novo desfaz.
 * Sem drag; funciona bem no mobile.
 */
export function DesafioOrdenarView({
  desafio,
  revelado,
  onMudar,
}: {
  desafio: DesafioOrdenar;
  revelado: boolean;
  /** Ordem montada pelo usuário (ids). */
  onMudar: (ordem: string[]) => void;
}) {
  // Sem effect de reset: o pai remonta com key={desafio.id} ao trocar.
  const [ordem, setOrdem] = useState<string[]>([]);

  const labelDe = (id: string) =>
    desafio.itens.find((x) => x.id === id)?.label ?? id;

  const tocar = (id: string) => {
    if (revelado) return;
    setOrdem((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      onMudar(next);
      return next;
    });
  };

  const limpar = () => {
    if (revelado) return;
    setOrdem([]);
    onMudar([]);
  };

  const posicao = (id: string) => {
    const i = ordem.indexOf(id);
    return i >= 0 ? i + 1 : null;
  };

  return (
    <div>
      <p className="text-[16px] leading-relaxed text-foreground">
        {desafio.enunciado}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted">
          Toque na ordem certa · {ordem.length}/{desafio.itens.length}
        </p>
        {ordem.length > 0 && !revelado && (
          <button
            type="button"
            onClick={limpar}
            className="text-[12px] font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {ordem.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {ordem.map((id, i) => (
            <li
              key={`${id}-${i}`}
              className="max-w-full truncate rounded-md bg-primary/12 px-2 py-1 font-mono text-[11px] font-semibold text-primary"
            >
              {i + 1}. {labelDe(id)}
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-4 space-y-2">
        {desafio.itens.map((item) => {
          const pos = posicao(item.id);
          const idxCorreto = desafio.ordemCorreta.indexOf(item.id);
          const certoAqui =
            revelado && pos !== null && pos - 1 === idxCorreto;
          const erradoAqui =
            revelado && pos !== null && pos - 1 !== idxCorreto;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => tocar(item.id)}
                disabled={revelado}
                className={classesOpcaoDesafio({
                  revelado,
                  correta: certoAqui,
                  escolhida: erradoAqui,
                  ativa: pos !== null,
                  className: "flex items-center gap-3",
                })}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-bold",
                    pos !== null
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground/8 text-muted"
                  )}
                >
                  {pos ?? "·"}
                </span>
                <span className="min-w-0 leading-snug">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
