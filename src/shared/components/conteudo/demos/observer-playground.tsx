"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, LineChart, Mail, FileText } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";

const OBSERVADORES = [
  { id: "grafico", label: "Gráfico", icon: LineChart, reacao: (v: number) => `atualiza ponto → ${v}` },
  { id: "email", label: "Alerta e-mail", icon: Mail, reacao: (v: number) => `dispara e-mail (R$ ${v})` },
  { id: "log", label: "Log/Auditoria", icon: FileText, reacao: (v: number) => `registra R$ ${v}` },
];

/** Demo: o sujeito publica um preço e todos os observadores reagem ao vivo. */
export function ObserverPlayground() {
  const [preco, setPreco] = useState(100);
  const [tick, setTick] = useState(0);

  const publicar = () => {
    setPreco((p) => Math.max(1, p + Math.round((Math.random() - 0.4) * 20)));
    setTick((t) => t + 1);
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="flex flex-col items-center gap-4">
        {/* Sujeito */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border-2 border-primary/60 bg-primary/12 px-4 py-2 font-semibold">
            <Bell className="size-4 text-primary" /> Sujeito · preço = R$ {preco}
          </div>
          <Button size="sm" onClick={publicar}>
            Publicar novo preço
          </Button>
        </div>

        {/* Conector */}
        <div className="h-4 w-px border-l-2 border-dashed border-card-border" />

        {/* Observadores */}
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {OBSERVADORES.map((o) => {
            const Icon = o.icon;
            return (
              <motion.div
                key={`${o.id}-${tick}`}
                initial={tick === 0 ? false : { scale: 0.96, borderColor: "var(--primary)" }}
                animate={{ scale: 1, borderColor: "var(--card-border)" }}
                transition={{ duration: 0.5 }}
                className="rounded-lg border bg-background p-3 text-center"
              >
                <Icon className="mx-auto size-4 text-muted" />
                <p className="mt-1 text-sm font-medium">{o.label}</p>
                <p className="mt-0.5 text-xs text-muted">{o.reacao(preco)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Um clique, uma notificação → os 3 observadores reagem sem o sujeito saber quem são.
      </p>
    </div>
  );
}
