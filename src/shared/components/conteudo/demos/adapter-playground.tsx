"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plug, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { cn } from "@/shared/utils/cn";

/** Demo: sem Adapter as interfaces não encaixam; com Adapter a chamada é traduzida. */
export function AdapterPlayground() {
  const [ligado, setLigado] = useState(false);
  const [msg, setMsg] = useState("Olá");

  const chamadaCliente = `enviar("${msg}")`;
  const chamadaSdk = `dispatch({ body: "${msg}" })`;

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-muted">Mensagem</label>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="flex-1 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="sm" variant={ligado ? "primary" : "outline"} onClick={() => setLigado((v) => !v)}>
          <Plug /> {ligado ? "Adapter ligado" : "Ligar Adapter"}
        </Button>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {/* Cliente */}
        <div className="flex-1 rounded-lg border border-card-border bg-background p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">Cliente</p>
          <code className="text-xs">{chamadaCliente}</code>
        </div>

        <ConectorStatus ligado={ligado} />

        {/* Adapter (aparece quando ligado) */}
        <AnimatePresence>
          {ligado && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              className="rounded-lg border-2 border-primary bg-primary/12 p-3 text-center"
            >
              <p className="text-xs font-semibold text-primary">Adapter</p>
              <code className="text-[11px] text-muted">traduz ⇄</code>
            </motion.div>
          )}
        </AnimatePresence>

        {ligado && <ConectorStatus ligado />}

        {/* SDK */}
        <div className="flex-1 rounded-lg border border-card-border bg-background p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">SDK externo</p>
          <code className="text-xs">{chamadaSdk}</code>
        </div>
      </div>

      <div
        className={cn(
          "mt-4 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium",
          ligado ? "bg-cat-criacional/12 text-cat-criacional" : "bg-cat-arquitetura/12 text-cat-arquitetura"
        )}
      >
        {ligado ? (
          <>
            <Check className="size-4" /> Entregue — o Adapter traduziu {chamadaCliente} → {chamadaSdk}
          </>
        ) : (
          <>
            <X className="size-4" /> Interface incompatível — o cliente não fala a língua do SDK
          </>
        )}
      </div>
    </div>
  );
}

function ConectorStatus({ ligado }: { ligado: boolean }) {
  return (
    <ArrowRight
      className={cn(
        "mx-auto size-5 rotate-90 sm:rotate-0",
        ligado ? "text-cat-criacional" : "text-cat-arquitetura opacity-60"
      )}
    />
  );
}
