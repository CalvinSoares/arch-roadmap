"use client";

import { useState } from "react";
import { Play, RotateCcw, TriangleAlert, Check, Ban } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import {
  simular,
  ROTEIROS,
  NIVEIS,
  NOME_ANOMALIA,
  type Nivel,
} from "@/shared/lib/isolamento";
import { cn } from "@/shared/utils/cn";

/**
 * Laboratório de concorrência.
 *
 * Duas transações intercaladas sobre a mesma linha, um nível de isolamento à
 * escolha, e a anomalia acontecendo passo a passo. Existe porque isolamento é
 * inerentemente temporal: texto explica a definição, e só a execução mostra
 * onde o dinheiro desaparece.
 *
 * Todo o cálculo vem de `lib/isolamento.ts`, que é puro e testado — aqui só
 * há apresentação e o índice do passo atual.
 */
export function IsolamentoPlayground() {
  const [roteiroId, setRoteiroId] = useState(ROTEIROS[0].id);
  const [nivel, setNivel] = useState<Nivel>("READ COMMITTED");
  const [passo, setPasso] = useState(0);

  const roteiro = ROTEIROS.find((r) => r.id === roteiroId)!;
  const resultado = simular(roteiro.passos, nivel);
  const visiveis = resultado.eventos.slice(0, passo);
  const terminou = passo >= resultado.eventos.length;

  const reiniciar = (mudanca: () => void) => {
    mudanca();
    setPasso(0);
  };

  const commitadoAgora =
    visiveis.length > 0 ? visiveis[visiveis.length - 1].commitado : 100;

  return (
    <div className="space-y-4">
      {/* controles */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Roteiro
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ROTEIROS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => reiniciar(() => setRoteiroId(r.id))}
                aria-pressed={r.id === roteiroId}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  r.id === roteiroId
                    ? "border-primary/50 bg-primary/12 text-primary"
                    : "border-card-border text-muted hover:text-foreground"
                )}
              >
                {r.nome}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Nível de isolamento
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {NIVEIS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => reiniciar(() => setNivel(n))}
                aria-pressed={n === nivel}
                className={cn(
                  "rounded-lg border px-2 py-1 font-mono text-[10px] font-medium transition-colors",
                  n === nivel
                    ? "border-primary/50 bg-primary/12 text-primary"
                    : "border-card-border text-muted hover:text-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-muted">
        {roteiro.descricao}{" "}
        <span className="text-foreground">
          Some a partir de{" "}
          <code className="font-mono text-[12px]">{roteiro.resolvidoEm}</code>.
        </span>
      </p>

      {/* a linha em disputa */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-card-border bg-background p-3.5">
        <span className="text-[13px]">
          <span className="text-muted">saldo commitado: </span>
          <span className="font-mono text-base font-bold">{commitadoAgora}</span>
        </span>
        {terminou && (
          <>
            <span className="text-[13px]">
              <span className="text-muted">em série daria: </span>
              <span className="font-mono font-semibold">
                {resultado.esperadoEmSerie}
              </span>
            </span>
            {resultado.final !== resultado.esperadoEmSerie && (
              <span
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ color: "var(--perigo)" }}
              >
                <TriangleAlert className="size-3.5" />
                diferença de {Math.abs(resultado.final - resultado.esperadoEmSerie)}
              </span>
            )}
          </>
        )}
      </div>

      {/* as duas transações, lado a lado */}
      <ol className="space-y-1.5">
        {resultado.eventos.map((e, i) => {
          const revelado = i < passo;
          const daT1 = e.passo.tx === "T1";
          return (
            <li
              key={i}
              className={cn(
                "grid grid-cols-2 gap-2 transition-opacity duration-300",
                revelado ? "opacity-100" : "opacity-25"
              )}
            >
              {[true, false].map((coluna) => {
                if (coluna !== daT1) return <span key={String(coluna)} />;
                return (
                  <div
                    key={String(coluna)}
                    className={cn(
                      "rounded-lg border p-2.5",
                      e.anomalia && revelado
                        ? "border-[var(--perigo)]/60 bg-[color-mix(in_srgb,var(--perigo)_8%,transparent)]"
                        : e.abortou && revelado
                          ? "border-[var(--alerta)]/60 bg-[color-mix(in_srgb,var(--alerta)_8%,transparent)]"
                          : "border-card-border bg-card"
                    )}
                  >
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                      {e.passo.tx}
                      <span className="font-normal text-muted">{e.passo.op}</span>
                      {revelado && e.anomalia && (
                        <TriangleAlert
                          aria-hidden
                          className="size-3"
                          style={{ color: "var(--perigo)" }}
                        />
                      )}
                      {revelado && e.abortou && (
                        <Ban
                          aria-hidden
                          className="size-3"
                          style={{ color: "var(--alerta)" }}
                        />
                      )}
                    </span>
                    {revelado && (
                      <p className="mt-1 text-[12px] leading-relaxed text-foreground">
                        {e.narracao}
                      </p>
                    )}
                  </div>
                );
              })}
            </li>
          );
        })}
      </ol>

      {/* veredito */}
      {terminou && (
        <div
          className="rounded-xl border p-3.5"
          style={
            resultado.anomalias.length > 0
              ? {
                  borderColor: "color-mix(in srgb, var(--perigo) 35%, transparent)",
                  background: "color-mix(in srgb, var(--perigo) 6%, transparent)",
                }
              : {
                  borderColor: "color-mix(in srgb, var(--ok) 35%, transparent)",
                  background: "color-mix(in srgb, var(--ok) 6%, transparent)",
                }
          }
        >
          {resultado.anomalias.length > 0 ? (
            <p className="flex items-start gap-2 text-[14px] leading-relaxed">
              <TriangleAlert
                aria-hidden
                className="mt-0.5 size-4 shrink-0"
                style={{ color: "var(--perigo)" }}
              />
              <span>
                <span className="font-semibold">
                  {resultado.anomalias.map((a) => NOME_ANOMALIA[a]).join(" + ")}
                </span>{" "}
                em <code className="font-mono text-[12px]">{nivel}</code>. Nenhuma
                transação recebeu erro — é isso que faz a anomalia ser difícil de
                achar em produção.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 text-[14px] leading-relaxed">
              <Check
                aria-hidden
                className="mt-0.5 size-4 shrink-0"
                style={{ color: "var(--ok)" }}
              />
              <span>
                Nenhuma anomalia em{" "}
                <code className="font-mono text-[12px]">{nivel}</code>
                {resultado.eventos.some((e) => e.abortou)
                  ? " — porque o banco abortou uma transação. Sem retry, isso viraria erro para o usuário."
                  : "."}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPasso((p) => p + 1)} disabled={terminou}>
          <Play className="size-4" />
          {passo === 0 ? "Executar passo a passo" : "Próximo passo"}
        </Button>
        {passo > 0 && (
          <Button variant="ghost" onClick={() => setPasso(0)}>
            <RotateCcw className="size-4" />
            Recomeçar
          </Button>
        )}
        {!terminou && passo > 0 && (
          <Button
            variant="ghost"
            onClick={() => setPasso(resultado.eventos.length)}
          >
            Ir até o fim
          </Button>
        )}
      </div>
    </div>
  );
}
