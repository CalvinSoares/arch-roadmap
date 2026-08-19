import { NOVIDADES } from "@/content/novidades/registro";
import type { Novidade } from "@/shared/types/novidade";

/** Por quantos dias uma estreia continua sendo anunciada como "novo". */
export const JANELA_NOVO_DIAS = 21;

const MS_POR_DIA = 86_400_000;

/** Maior primeiro. Duas entregas podem sair no mesmo dia; a versão desempata. */
function compararVersao(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Entregas da mais recente para a mais antiga. */
export function listNovidades(): Novidade[] {
  return [...NOVIDADES].sort(
    (a, b) => b.data.localeCompare(a.data) || compararVersao(a.versao, b.versao)
  );
}

export function ultimaNovidade(): Novidade | undefined {
  return listNovidades()[0];
}

type TipoConteudo = "conceito" | "roadmap";

/**
 * slug → data de estreia. Entradas de lançamento inicial ficam de fora: no
 * marco de abertura tudo é novo, então nada merece destaque.
 */
const ESTREIAS: Map<string, string> = (() => {
  const mapa = new Map<string, string>();
  for (const n of NOVIDADES) {
    if (n.lancamentoInicial) continue;
    for (const slug of n.conceitos ?? []) {
      if (!mapa.has(`conceito:${slug}`)) mapa.set(`conceito:${slug}`, n.data);
    }
    for (const slug of n.roadmaps ?? []) {
      if (!mapa.has(`roadmap:${slug}`)) mapa.set(`roadmap:${slug}`, n.data);
    }
  }
  return mapa;
})();

/** Data de estreia de um conteúdo, se ele foi anunciado em alguma entrega. */
export function dataDeEstreia(
  tipo: TipoConteudo,
  slug: string
): string | undefined {
  return ESTREIAS.get(`${tipo}:${slug}`);
}

function dentroDaJanela(data: string | undefined, agora: Date): boolean {
  if (!data) return false;
  const publicado = Date.parse(`${data}T00:00:00Z`);
  if (Number.isNaN(publicado)) return false;
  const dias = (agora.getTime() - publicado) / MS_POR_DIA;
  return dias >= 0 && dias <= JANELA_NOVO_DIAS;
}

/**
 * O conteúdo estreou dentro da janela recente?
 *
 * Chamado em server component: em build estático a referência de tempo
 * congela no build, o que é o comportamento desejado (o badge acompanha a
 * publicação, não o relógio do visitante).
 */
export function ehNovo(
  tipo: TipoConteudo,
  slug: string,
  agora: Date = new Date()
): boolean {
  return dentroDaJanela(dataDeEstreia(tipo, slug), agora);
}

/** Slugs de um tipo que estão dentro da janela, prontos pro cliente. */
export function slugsNovos(
  tipo: TipoConteudo,
  agora: Date = new Date()
): string[] {
  const prefixo = `${tipo}:`;
  return [...ESTREIAS.entries()]
    .filter(([chave, data]) => chave.startsWith(prefixo) && dentroDaJanela(data, agora))
    .map(([chave]) => chave.slice(prefixo.length));
}

/** Houve alguma entrega dentro da janela? Alimenta o ponto no menu. */
export function temNovidadeRecente(agora: Date = new Date()): boolean {
  const ultima = ultimaNovidade();
  return dentroDaJanela(ultima?.data, agora);
}

/** "10 de agosto de 2026" */
export function formatarData(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
