"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, Zap, PiggyBank } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const ESTRATEGIAS = {
  normal: { label: "Normal", icon: Truck, prazo: "5 dias", calc: (p: number) => p * 2 + 5 },
  expressa: { label: "Expressa", icon: Zap, prazo: "1 dia", calc: (p: number) => p * 4 + 20 },
  economica: { label: "Econômica", icon: PiggyBank, prazo: "12 dias", calc: (p: number) => p * 1 },
} as const;

type Chave = keyof typeof ESTRATEGIAS;

/** Demo: trocar a estratégia recalcula o frete na hora, sem mudar o "contexto". */
export function StrategyPlayground() {
  const [chave, setChave] = useState<Chave>("normal");
  const [peso, setPeso] = useState(3);
  const estrategia = ESTRATEGIAS[chave];
  const custo = estrategia.calc(peso);

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ESTRATEGIAS) as Chave[]).map((k) => {
          const e = ESTRATEGIAS[k];
          const Icon = e.icon;
          const ativo = k === chave;
          return (
            <button
              key={k}
              onClick={() => setChave(k)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                ativo
                  ? "border-primary bg-primary/12 font-medium text-primary"
                  : "border-card-border hover:border-primary/50"
              )}
            >
              <Icon className="size-4" /> {e.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-muted">Peso (kg)</label>
        <input
          type="range"
          min={1}
          max={20}
          value={peso}
          onChange={(e) => setPeso(Number(e.target.value))}
          className="flex-1 accent-[var(--primary)]"
        />
        <span className="w-10 text-right text-sm font-medium">{peso}</span>
      </div>

      <div className="mt-4 rounded-lg border border-card-border bg-background p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-muted">
          Frete ({estrategia.label} · {estrategia.prazo})
        </p>
        <motion.p
          key={`${chave}-${peso}`}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mt-1 text-3xl font-semibold text-primary"
        >
          R$ {custo.toFixed(2)}
        </motion.p>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        O cálculo (algoritmo) é trocável em runtime — o cliente só conhece a interface
        <code className="mx-1">calcularFrete(peso)</code>.
      </p>
    </div>
  );
}
