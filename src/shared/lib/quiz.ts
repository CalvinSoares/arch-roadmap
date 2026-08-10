import {
  listConceitos,
  getConceito,
  listRoadmaps,
} from "@/shared/lib/content";
import { CATEGORIAS } from "@/shared/config/categorias";
import { COMPARACOES } from "@/content/comparacoes/registro";
import type { Bloco } from "@/shared/types/bloco";
import type { Conceito } from "@/shared/types/conceito";

export interface Pergunta {
  /** `${slug}:${indice}` — estável entre execuções com a mesma semente. */
  id: string;
  /** O texto da armadilha, com o nome do padrão mascarado. */
  enunciado: string;
  /** slug do conceito correto. */
  correta: string;
  /** 4 slugs embaralhados, incluindo o correto. */
  alternativas: string[];
  /** O título da armadilha — revelado depois da resposta. */
  explicacao: string;
}

const ALTERNATIVAS = 4;

/** Gerador com semente (mulberry32): mesma semente, mesma sequência. */
function prng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates com aleatoriedade injetada — nunca `Math.random()`. */
function embaralhar<T>(itens: T[], rnd: () => number): T[] {
  const out = [...itens];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Termos que denunciam a resposta: o título do conceito e as palavras
 * distintivas dele. "Template Method" precisa cobrir também "Template".
 */
function termosQueVazam(c: Conceito): string[] {
  const termos = new Set<string>([c.titulo]);
  // títulos compostos: cada palavra com 4+ letras também entrega a resposta
  for (const parte of c.titulo.split(/[\s—×/]+/)) {
    if (parte.length >= 4) termos.add(parte);
  }
  // "SRP — Responsabilidade Única" → a sigla sozinha basta
  const sigla = c.titulo.match(/^([A-Z]{2,})\b/)?.[1];
  if (sigla) termos.add(sigla);
  return [...termos].sort((a, b) => b.length - a.length);
}

/**
 * Troca o nome do padrão por "este padrão".
 *
 * Muitas armadilhas citam o próprio conceito ("Proxy remoto sem timeout…"),
 * o que entregaria a resposta. A substituição é automática; quando produz uma
 * frase ruim, o conteúdo define `enunciadoQuiz` e este caminho nem roda.
 */
export function mascarar(texto: string, c: Conceito): string {
  let out = texto;
  for (const termo of termosQueVazam(c)) {
    const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // `s?` cobre o plural: "decorators", "flyweights", "singletons" passavam
    // por `\b…\b` sem serem mascarados e entregavam a resposta.
    out = out.replace(
      new RegExp(`\\b${escapado}s?\\b`, "gi"),
      "este padrão"
    );
  }
  // "este padrão este padrão" vira um só
  return out.replace(/(este padrão)(\s+\1)+/gi, "$1");
}

/** Uma armadilha com o conceito a que pertence. */
interface ArmadilhaComDono {
  conceito: Conceito;
  indice: number;
  titulo: string;
  enunciado: string;
}

function armadilhasDe(c: Conceito): ArmadilhaComDono[] {
  const blocos = (c.blocos ?? []).filter(
    (b): b is Extract<Bloco, { tipo: "armadilhas" }> => b.tipo === "armadilhas"
  );
  return blocos.flatMap((b) =>
    b.itens.map((item, i) => ({
      conceito: c,
      indice: i,
      titulo: item.titulo,
      // o escape manual tem precedência sobre a substituição automática
      enunciado: item.enunciadoQuiz ?? mascarar(item.texto, c),
    }))
  );
}

/**
 * Armadilhas do catálogo, já mascaradas.
 *
 * `escopo` limita o sorteio a um conjunto de conceitos — é o que permite um
 * quiz de uma categoria, de uma trilha ou de um conceito só. Sem escopo, vale
 * o catálogo inteiro.
 */
export function todasAsArmadilhas(
  escopo?: readonly string[]
): ArmadilhaComDono[] {
  const alvo = escopo ? new Set(escopo) : null;
  return listConceitos()
    .filter((c) => !alvo || alvo.has(c.slug))
    .flatMap(armadilhasDe);
}

/**
 * Distratores: conceitos com que este é genuinamente confundido.
 *
 * Usa `relacionados` **nos dois sentidos** mais os pares do comparador —
 * quase metade das ligações de `relacionados` é de mão única, e sem a união
 * alguns conceitos ficariam sem distratores plausíveis.
 */
export function distratoresDe(slug: string): string[] {
  const c = getConceito(slug);
  if (!c) return [];

  const vizinhos = new Set<string>(c.relacionados);
  for (const outro of listConceitos()) {
    if (outro.relacionados.includes(slug)) vizinhos.add(outro.slug);
  }
  for (const cmp of COMPARACOES) {
    if (cmp.a === slug) vizinhos.add(cmp.b);
    if (cmp.b === slug) vizinhos.add(cmp.a);
  }
  vizinhos.delete(slug);
  return [...vizinhos];
}

/**
 * Monta um conjunto de perguntas determinístico.
 *
 * A mesma semente sempre produz as mesmas perguntas na mesma ordem — é o que
 * permite um "quiz do dia" estável e testes reprodutíveis.
 */
export function gerarPerguntas(
  semente: number,
  quantas: number,
  escopo?: readonly string[]
): Pergunta[] {
  const rnd = prng(semente);
  const pool = embaralhar(todasAsArmadilhas(escopo), rnd);
  /*
   * Distratores saem do catálogo inteiro, mesmo com escopo: num quiz só de
   * criacionais, oferecer apenas criacionais como alternativa entregaria
   * metade da resposta de graça.
   */
  const todosOsSlugs = listConceitos().map((c) => c.slug);
  const out: Pergunta[] = [];

  for (const a of pool) {
    if (out.length >= quantas) break;

    const preferidos = embaralhar(distratoresDe(a.conceito.slug), rnd);
    // completa com conceitos quaisquer se os vizinhos não bastarem
    const reserva = embaralhar(
      todosOsSlugs.filter(
        (s) => s !== a.conceito.slug && !preferidos.includes(s)
      ),
      rnd
    );
    const distratores = [...preferidos, ...reserva].slice(0, ALTERNATIVAS - 1);
    if (distratores.length < ALTERNATIVAS - 1) continue;

    out.push({
      id: `${a.conceito.slug}:${a.indice}`,
      enunciado: a.enunciado,
      correta: a.conceito.slug,
      alternativas: embaralhar([a.conceito.slug, ...distratores], rnd),
      explicacao: a.titulo,
    });
  }
  return out;
}

/** Um tópico jogável: um recorte do catálogo com armadilhas suficientes. */
export interface TopicoQuiz {
  id: string;
  titulo: string;
  /** "categoria" | "trilha" — agrupa os botões na tela. */
  familia: "categoria" | "trilha";
  slugs: string[];
  /** Quantas perguntas o tópico consegue oferecer. */
  perguntas: number;
}

/** Mínimo de armadilhas para um tópico valer como quiz próprio. */
const MINIMO_POR_TOPICO = 6;

/**
 * Tópicos disponíveis, **derivados** do catálogo e dos roadmaps — nada é
 * declarado à mão, então categorias e trilhas novas aparecem sozinhas.
 *
 * Recortes com menos de {@link MINIMO_POR_TOPICO} armadilhas ficam de fora:
 * um quiz de 3 perguntas que sempre repete as mesmas não ensina nada.
 */
export function topicosDisponiveis(): TopicoQuiz[] {
  const conceitos = listConceitos();
  const out: TopicoQuiz[] = [];

  const porCategoria = new Map<string, string[]>();
  for (const c of conceitos) {
    porCategoria.set(c.categoria, [
      ...(porCategoria.get(c.categoria) ?? []),
      c.slug,
    ]);
  }
  for (const [categoria, slugs] of porCategoria) {
    const perguntas = todasAsArmadilhas(slugs).length;
    if (perguntas < MINIMO_POR_TOPICO) continue;
    out.push({
      id: `categoria:${categoria}`,
      titulo: CATEGORIAS[categoria as keyof typeof CATEGORIAS]?.label ?? categoria,
      familia: "categoria",
      slugs,
      perguntas,
    });
  }

  for (const r of listRoadmaps()) {
    const slugs = [
      ...new Set(
        r.sections.flatMap((s) =>
          s.items.map((i) => i.conceito).filter((x): x is string => !!x)
        )
      ),
    ];
    const perguntas = todasAsArmadilhas(slugs).length;
    if (perguntas < MINIMO_POR_TOPICO) continue;
    out.push({
      id: `trilha:${r.slug}`,
      titulo: r.titulo,
      familia: "trilha",
      slugs,
      perguntas,
    });
  }

  return out;
}

export function getTopico(id: string): TopicoQuiz | undefined {
  return topicosDisponiveis().find((t) => t.id === id);
}

/** Semente estável por dia — o "quiz do dia" é o mesmo para todos. */
export function sementeDoDia(iso: string): number {
  let h = 0;
  for (const ch of iso) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}
