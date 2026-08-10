"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Database, BookOpen, Zap } from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";

/**
 * Demo: um comando escreve no write store e, via projeção (evento), o read
 * model é atualizado — com uma janela de consistência eventual.
 */
export function CqrsPlayground() {
  const [escritos, setEscritos] = useState(0);
  const [lidos, setLidos] = useState(0);
  const [projetando, setProjetando] = useState(false);

  const enviarComando = () => {
    const novo = escritos + 1;
    setEscritos(novo);
    setProjetando(true);
    // projeção assíncrona → consistência eventual
    setTimeout(() => {
      setLidos(novo);
      setProjetando(false);
    }, 1100);
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Command side */}
        <div className="rounded-lg border-2 border-cat-comportamental/50 bg-cat-comportamental/8 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-cat-comportamental">
            <PenLine className="size-4" /> Command side (escrita)
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Database className="size-4" /> Write store: <b className="text-foreground">{escritos}</b> pedidos
          </div>
          <Button size="sm" className="mt-3 w-full" onClick={enviarComando}>
            Criar pedido (comando)
          </Button>
        </div>

        {/* Query side */}
        <div className="rounded-lg border-2 border-cat-estrutural/50 bg-cat-estrutural/8 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-cat-estrutural">
            <BookOpen className="size-4" /> Query side (leitura)
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Database className="size-4" /> Read model: <b className="text-foreground">{lidos}</b> pedidos
          </div>
          <div className="mt-3 h-9 text-xs">
            <AnimatePresence mode="wait">
              {projetando ? (
                <motion.p
                  key="proj"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-cat-principio"
                >
                  <Zap className="size-3.5" /> projeção em andamento… (consistência eventual)
                </motion.p>
              ) : escritos === lidos && escritos > 0 ? (
                <motion.p key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cat-criacional">
                  leitura sincronizada com a escrita
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        O comando muda o write store na hora; o read model é atualizado pela projeção —
        por isso a leitura pode ficar um instante atrás (consistência eventual).
      </p>
    </div>
  );
}
