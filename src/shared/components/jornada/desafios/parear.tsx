"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/utils/cn";
import { classesOpcaoDesafio } from "@/shared/components/jornada/desafios/opcao-estilo";
import type { DesafioParear } from "@/shared/types/desafio";

/**
 * Seleciona um da esquerda, depois um da direita. Confere o casamento
 * só no submit da lição (o pai lê `ligacoes` via onMudar).
 */
export function DesafioParearView({
  desafio,
  revelado,
  sementeEmbaralhe,
  onMudar,
}: {
  desafio: DesafioParear;
  revelado: boolean;
  /** Embaralha o lado direito de forma estável. */
  sementeEmbaralhe: number;
  onMudar: (ligacoes: Record<string, string>) => void;
}) {
  const direitas = useMemo(() => {
    const dirs = desafio.pares.map((p) => p.direita);
    // mulberry32 curto — só para UI
    let a = sementeEmbaralhe >>> 0;
    const rnd = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const out = [...dirs];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, [desafio.pares, sementeEmbaralhe]);

  const [ligacoes, setLigacoes] = useState<Record<string, string>>({});
  const [selecionadaEsq, setSelecionadaEsq] = useState<string | null>(null);

  useEffect(() => {
    setLigacoes({});
    setSelecionadaEsq(null);
    onMudar({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desafio.id]);

  const usadasDir = new Set(Object.values(ligacoes));
  const feitas = Object.keys(ligacoes).length;

  const tocarEsq = (esq: string) => {
    if (revelado) return;
    if (ligacoes[esq]) {
      const next = { ...ligacoes };
      delete next[esq];
      setLigacoes(next);
      onMudar(next);
      setSelecionadaEsq(null);
      return;
    }
    setSelecionadaEsq(esq);
  };

  const tocarDir = (dir: string) => {
    if (revelado || !selecionadaEsq) return;
    if (usadasDir.has(dir) && ligacoes[selecionadaEsq] !== dir) return;
    const next = { ...ligacoes, [selecionadaEsq]: dir };
    setLigacoes(next);
    onMudar(next);
    setSelecionadaEsq(null);
  };

  const limpar = () => {
    if (revelado) return;
    setLigacoes({});
    setSelecionadaEsq(null);
    onMudar({});
  };

  const mapaCorreto = Object.fromEntries(
    desafio.pares.map((p) => [p.esquerda, p.direita])
  );

  return (
    <div>
      <p className="text-[16px] leading-relaxed text-foreground">
        {desafio.enunciado}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted">
          {selecionadaEsq
            ? "Agora toque o par à direita"
            : `Esquerda → direita · ${feitas}/${desafio.pares.length}`}
        </p>
        {feitas > 0 && !revelado && (
          <button
            type="button"
            onClick={limpar}
            className="text-[12px] font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ul className="space-y-2">
          {desafio.pares.map((p) => {
            const ligada = ligacoes[p.esquerda];
            const ok =
              revelado && ligada !== undefined && ligada === mapaCorreto[p.esquerda];
            const bad =
              revelado && ligada !== undefined && ligada !== mapaCorreto[p.esquerda];
            const sel = selecionadaEsq === p.esquerda;
            return (
              <li key={p.esquerda}>
                <button
                  type="button"
                  disabled={revelado}
                  onClick={() => tocarEsq(p.esquerda)}
                  className={classesOpcaoDesafio({
                    revelado,
                    correta: !!ok,
                    escolhida: !!bad,
                    ativa: sel || (!!ligada && !revelado),
                    className:
                      "px-2.5 py-2.5 text-[13px] leading-snug break-words",
                  })}
                >
                  <span className="block">{p.esquerda}</span>
                  {ligada && (
                    <span className="mt-1 block text-[11px] font-normal text-muted break-words">
                      → {ligada}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="space-y-2">
          {direitas.map((dir) => {
            const dono = Object.entries(ligacoes).find(([, v]) => v === dir)?.[0];
            const ok =
              revelado &&
              dono !== undefined &&
              mapaCorreto[dono] === dir;
            const bad =
              revelado &&
              dono !== undefined &&
              mapaCorreto[dono] !== dir;
            return (
              <li key={dir}>
                <button
                  type="button"
                  disabled={revelado || (!selecionadaEsq && !dono)}
                  onClick={() => {
                    if (dono) {
                      const next = { ...ligacoes };
                      delete next[dono];
                      setLigacoes(next);
                      onMudar(next);
                      return;
                    }
                    tocarDir(dir);
                  }}
                  className={cn(
                    classesOpcaoDesafio({
                      revelado,
                      correta: !!ok,
                      escolhida: !!bad,
                      ativa: !!dono && !revelado,
                      className:
                        "px-2.5 py-2.5 text-[13px] leading-snug break-words",
                    }),
                    !revelado &&
                      !dono &&
                      !selecionadaEsq &&
                      "opacity-50",
                    !revelado &&
                      !!selecionadaEsq &&
                      !dono &&
                      "hover:border-primary hover:bg-primary/12"
                  )}
                >
                  {dir}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
