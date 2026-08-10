"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  useArmazenamentoLocal,
  inscreverArmazenamento,
  snapshotComposto,
} from "@/shared/hook/use-armazenamento-local";
import { useMontado } from "@/shared/hook/use-montado";
import { listRoadmaps } from "@/shared/lib/content";
import {
  conceitosConcluidos,
  devidosHoje,
  paraISO,
  progressoPorRoadmap,
  proximosDaTrilha,
  registrarRevisao,
  sincronizarComProgresso,
} from "@/shared/lib/estudo";
import type { AgendaEstudo } from "@/shared/types/estudo";
import type { ProgressoNo } from "@/shared/types/roadmap";

const CHAVE_AGENDA = "devatlas:estudo:v1";
const AGENDA_VAZIA: AgendaEstudo = {};
const PROGRESSO_VAZIO: Record<string, ProgressoNo> = {};

/** Quantas sugestões de próximo passo a página mostra. */
const SUGESTOES = 3;

/** As chaves de progresso de todas as trilhas — estáveis, vêm do build. */
const CHAVES_PROGRESSO = listRoadmaps().map((r) => `devatlas:progress:${r.slug}`);

/**
 * Lê o progresso de **todas** as trilhas de uma vez.
 *
 * `useRoadmapProgress` é por slug e não serve aqui: o modo estudo precisa
 * enxergar as quatro trilhas juntas. Um `useSyncExternalStore` composto evita
 * chamar um hook por roadmap dentro de um laço.
 */
function useProgressoDeTodos(): Record<string, Record<string, ProgressoNo>> {
  const porChave = useSyncExternalStore(
    useCallback(
      (aoMudar: () => void) =>
        inscreverArmazenamento(CHAVES_PROGRESSO, aoMudar),
      []
    ),
    useCallback(
      () => snapshotComposto(CHAVES_PROGRESSO, PROGRESSO_VAZIO),
      []
    ),
    useCallback(
      () => snapshotComposto([], PROGRESSO_VAZIO) as Record<string, typeof PROGRESSO_VAZIO>,
      []
    )
  );

  // reindexa de `devatlas:progress:backend` para `backend`
  return useMemo(
    () =>
      Object.fromEntries(
        listRoadmaps().map((r) => [
          r.slug,
          porChave[`devatlas:progress:${r.slug}`] ?? PROGRESSO_VAZIO,
        ])
      ),
    [porChave]
  );
}

export function useEstudo(hoje: string = paraISO(new Date())) {
  const progresso = useProgressoDeTodos();
  const [agendaBruta, gravarAgenda] = useArmazenamentoLocal(
    CHAVE_AGENDA,
    AGENDA_VAZIA
  );
  const hidratado = useMontado();

  const concluidos = useMemo(
    () => conceitosConcluidos(progresso),
    [progresso]
  );

  /**
   * A agenda efetiva é derivada: o roadmap manda. Um conceito concluído entra
   * na fila mesmo que a agenda gravada ainda não o conheça — assim quem já
   * marcou trilha inteira antes desta feature não fica de fora.
   */
  const agenda = useMemo(
    () => sincronizarComProgresso(agendaBruta, concluidos, hoje),
    [agendaBruta, concluidos, hoje]
  );

  const paraRevisar = useMemo(() => devidosHoje(agenda, hoje), [agenda, hoje]);
  const proximos = useMemo(
    () => proximosDaTrilha(progresso, SUGESTOES),
    [progresso]
  );
  const trilhas = useMemo(() => progressoPorRoadmap(progresso), [progresso]);

  const revisar = useCallback(
    (slug: string, acertou: boolean) => {
      gravarAgenda(registrarRevisao(agenda, slug, acertou, hoje));
    },
    [agenda, gravarAgenda, hoje]
  );

  return { hidratado, agenda, paraRevisar, proximos, trilhas, revisar };
}
