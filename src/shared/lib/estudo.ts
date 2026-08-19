import { listRoadmaps, getConceito } from "@/shared/lib/content";
import {
  INTERVALOS,
  NIVEL_MAXIMO,
  type AgendaEstudo,
  type ProximoDaTrilha,
  type RevisaoConceito,
} from "@/shared/types/estudo";
import type { ProgressoNo } from "@/shared/types/roadmap";

/** `2026-08-10` a partir de um Date, sempre em UTC. */
export function paraISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function somarDias(iso: string, dias: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return paraISO(new Date(t + dias * 86_400_000));
}

/**
 * Agenda um conceito depois de uma revisão.
 *
 * Acertar sobe um nível (satura em NIVEL_MAXIMO); errar volta pra zero. Sem
 * autoavaliação de 0 a 5: duas opções bastam e dão menos fricção.
 * Função pura: `hoje` entra por parâmetro.
 */
export function agendar(
  slug: string,
  atual: RevisaoConceito | undefined,
  acertou: boolean,
  hoje: string
): RevisaoConceito {
  const nivel = acertou ? Math.min((atual?.nivel ?? -1) + 1, NIVEL_MAXIMO) : 0;
  return {
    slug,
    nivel,
    revisadoEm: hoje,
    proximaEm: somarDias(hoje, INTERVALOS[nivel]),
  };
}

/** Aplica o resultado de uma revisão à agenda inteira. */
export function registrarRevisao(
  agenda: AgendaEstudo,
  slug: string,
  acertou: boolean,
  hoje: string
): AgendaEstudo {
  return { ...agenda, [slug]: agendar(slug, agenda[slug], acertou, hoje) };
}

/** Conceitos cuja revisão venceu (ou vence hoje), do mais atrasado primeiro. */
export function devidosHoje(agenda: AgendaEstudo, hoje: string): RevisaoConceito[] {
  return Object.values(agenda)
    .filter((r) => r.proximaEm <= hoje)
    .sort((a, b) => a.proximaEm.localeCompare(b.proximaEm));
}

/**
 * Entra na agenda ao ser concluído no roadmap; sai se for desmarcado.
 * O progresso do roadmap não guarda data, então a primeira revisão é agendada
 * no momento em que percebemos a conclusão.
 */
export function sincronizarComProgresso(
  agenda: AgendaEstudo,
  concluidos: string[],
  hoje: string
): AgendaEstudo {
  const proxima: AgendaEstudo = {};
  for (const slug of concluidos) {
    // preserva quem já tinha agenda; estreia quem acabou de ser concluído
    proxima[slug] = agenda[slug] ?? agendar(slug, undefined, true, hoje);
  }
  // quem saiu de `concluidos` não é copiado: desmarcar no roadmap tira da fila
  return proxima;
}

/**
 * Todos os itens de roadmap que apontam pra um conceito.
 * Cerca de metade dos itens não tem `conceito` (tópicos como "HTTP a sério",
 * sem página própria); esses ficam de fora, não haveria pra onde mandar.
 */
export function itensEstudaveis(): ProximoDaTrilha[] {
  const out: ProximoDaTrilha[] = [];
  for (const r of listRoadmaps()) {
    for (const s of r.sections) {
      for (const i of s.items) {
        if (!i.conceito) continue;
        const c = getConceito(i.conceito);
        if (!c) continue;
        out.push({
          conceitoSlug: c.slug,
          conceitoTitulo: c.titulo,
          roadmapSlug: r.slug,
          roadmapTitulo: r.titulo,
          secaoTitulo: s.titulo,
          noId: i.id,
        });
      }
    }
  }
  return out;
}

/** Status de um nó, lido dos mapas de progresso por roadmap. */
type ProgressoPorRoadmap = Record<string, Record<string, ProgressoNo>>;

/**
 * Os próximos itens a estudar, na ordem em que aparecem nas trilhas.
 * A ordem da trilha já codifica pré-requisito (fundamentos antes de
 * arquitetura), então basta respeitá-la; não há grafo de dependências.
 */
export function proximosDaTrilha(
  progresso: ProgressoPorRoadmap,
  quantos: number
): ProximoDaTrilha[] {
  const vistos = new Set<string>();
  const out: ProximoDaTrilha[] = [];

  for (const item of itensEstudaveis()) {
    if (out.length >= quantos) break;
    const status = progresso[item.roadmapSlug]?.[item.noId] ?? "pending";
    if (status === "done" || status === "skipped") continue;
    // o mesmo conceito aparece em várias trilhas; sugerir uma vez só
    if (vistos.has(item.conceitoSlug)) continue;
    vistos.add(item.conceitoSlug);
    out.push(item);
  }
  return out;
}

/** Slugs de conceito concluídos em qualquer trilha. */
export function conceitosConcluidos(progresso: ProgressoPorRoadmap): string[] {
  const out = new Set<string>();
  for (const item of itensEstudaveis()) {
    if (progresso[item.roadmapSlug]?.[item.noId] === "done") {
      out.add(item.conceitoSlug);
    }
  }
  return [...out];
}

/** Quanto de cada trilha já foi concluído; alimenta o resumo da página. */
export function progressoPorRoadmap(
  progresso: ProgressoPorRoadmap
): { slug: string; titulo: string; concluidos: number; total: number }[] {
  return listRoadmaps().map((r) => {
    const nos = r.sections.flatMap((s) => s.items.map((i) => i.id));
    const mapa = progresso[r.slug] ?? {};
    return {
      slug: r.slug,
      titulo: r.titulo,
      concluidos: nos.filter((id) => mapa[id] === "done").length,
      total: nos.length,
    };
  });
}
