"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { migrarProgressoLocal } from "@/server/progresso/migrar";

/**
 * Ponte silenciosa da migração local→conta. Não renderiza nada: ao autenticar,
 * varre o `localStorage` de progresso do dispositivo e o envia à conta uma vez.
 *
 * "Login é acréscimo, não portão": o anônimo segue com o `localStorage`; ao
 * logar, o que ele já fez entra na conta sem sobrescrever o que houver lá (o
 * merge é servidor-autoritativo). Uma flag por usuário evita reenviar a cada
 * navegação.
 */

/** Chave dos mapas de progresso do roadmap: `DevMappa:progress:<slug>`. */
const PREFIXO_PROGRESSO = "DevMappa:progress:";
const flagMigrado = (userId: string) => `DevMappa:migrado:v1:${userId}`;

function coletarProgressoLocal(): { noId: string; status: string }[] {
  const entradas: { noId: string; status: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (!chave?.startsWith(PREFIXO_PROGRESSO)) continue;
    try {
      const mapa = JSON.parse(localStorage.getItem(chave) ?? "{}") as Record<
        string,
        string
      >;
      for (const [noId, status] of Object.entries(mapa)) {
        entradas.push({ noId, status });
      }
    } catch {
      // mapa corrompido: ignora essa chave, não derruba a migração
    }
  }
  return entradas;
}

export function MigrarProgresso() {
  const { data, status } = useSession();
  const emVoo = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || emVoo.current) return;
    const userId = data?.user?.id;
    if (!userId) return;

    const flag = flagMigrado(userId);
    if (localStorage.getItem(flag)) return; // já migrado nesta conta

    const entradas = coletarProgressoLocal();
    if (entradas.length === 0) {
      localStorage.setItem(flag, "1"); // nada a migrar; não tenta de novo
      return;
    }

    emVoo.current = true;
    migrarProgressoLocal(entradas)
      .then(() => localStorage.setItem(flag, "1"))
      .catch(() => {
        // rede/servidor falhou — deixa reabrir a tentativa numa próxima visita
      })
      .finally(() => {
        emVoo.current = false;
      });
  }, [status, data?.user?.id]);

  return null;
}
