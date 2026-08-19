"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { migrarProgressoLocal } from "@/server/progresso/migrar";
import { listRoadmaps } from "@/shared/lib/content";
import { estadoPorRoadmap } from "@/shared/lib/progresso";
import { escreverArmazenamento } from "@/shared/hook/use-armazenamento-local";
import type { ProgressoNo } from "@/shared/types/roadmap";

/**
 * Ponte silenciosa da sincronização local↔conta. Não renderiza nada.
 *
 * "Login é acréscimo, não portão": o anônimo segue com o `localStorage`. Ao
 * logar, num movimento só, (push) o que ele já fez sobe para a conta sem
 * sobrescrever o que houver lá e (pull) o estado consolidado da conta **desce**
 * para o `localStorage`. É isso que faz o progresso aparecer num dispositivo
 * novo, onde o local começa vazio. Uma flag por usuário evita repetir a cada
 * navegação; o write-through do hook mantém tudo em dia depois.
 */

/** Chave dos mapas de progresso do roadmap: `DevMappa:progress:<slug>`. */
const PREFIXO_PROGRESSO = "DevMappa:progress:";
// v2: a v1 só empurrava (push); a v2 também puxa (pull). Bumpar reidrata quem
// já tinha logado antes desta mudança, uma vez por dispositivo.
const flagSincronizado = (userId: string) => `DevMappa:migrado:v2:${userId}`;

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
      // mapa corrompido: ignora essa chave, não derruba a sincronização
    }
  }
  return entradas;
}

/**
 * Semeia o `localStorage` com o estado da conta (pull). Reagrupa o mapa plano
 * (`noId → status`) por trilha e grava cada chave notificando os assinantes
 * desta aba; quem estiver na página de um roadmap re-renderiza na hora.
 */
function semear(estado: Record<string, ProgressoNo>): void {
  const roadmaps = listRoadmaps().map((r) => ({
    slug: r.slug,
    noIds: r.sections.flatMap((s) => s.items.map((i) => i.id)),
  }));
  const porSlug = estadoPorRoadmap(estado, roadmaps);
  for (const [slug, mapa] of Object.entries(porSlug)) {
    if (Object.keys(mapa).length === 0) continue; // não cria chave vazia
    escreverArmazenamento(`${PREFIXO_PROGRESSO}${slug}`, mapa);
  }
}

export function MigrarProgresso() {
  const { data, status } = useSession();
  const emVoo = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || emVoo.current) return;
    const userId = data?.user?.id;
    if (!userId) return;

    const flag = flagSincronizado(userId);
    if (localStorage.getItem(flag)) return; // já sincronizado neste dispositivo

    emVoo.current = true;
    // Chamada mesmo com local vazio: aí ela só puxa o estado da conta.
    migrarProgressoLocal(coletarProgressoLocal())
      .then((r) => {
        if (r.erro) return; // não marca a flag: reabre a tentativa depois
        semear(r.estado);
        localStorage.setItem(flag, "1");
      })
      .catch(() => {
        // rede/servidor falhou; deixa reabrir a tentativa numa próxima visita
      })
      .finally(() => {
        emVoo.current = false;
      });
  }, [status, data?.user?.id]);

  return null;
}
