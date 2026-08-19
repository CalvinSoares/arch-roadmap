import { listConceitos, listComparacoes, getConceito } from "@/shared/lib/content";
import { POSTMORTEMS } from "@/content/postmortems/registro";
import {
  EXPLICAR_ERROS,
  alternativasDe,
} from "@/content/quiz/explique-erro";
import {
  mascarar,
  distratoresDe,
  gerarPerguntas,
  type Pergunta,
} from "@/shared/lib/quiz";
import type { Bloco } from "@/shared/types/bloco";
import type { Conceito } from "@/shared/types/conceito";

/**
 * Formatos de pergunta além da armadilha.
 *
 * Quatro são derivados de conteúdo que já existe; `explique-erro` é registro
 * à mão, porque código quebrado plausível não dá pra gerar do catálogo.
 */

export type FormatoQuiz =
  | "armadilha"
  | "onde-aparece"
  | "duelo"
  | "anti-exemplo"
  | "postmortem"
  | "explique-erro";

export const ROTULO_FORMATO: Record<FormatoQuiz, string> = {
  armadilha: "Armadilhas",
  "onde-aparece": "Onde aparece",
  duelo: "Duelos",
  "anti-exemplo": "Jeito errado",
  postmortem: "Incidentes",
  "explique-erro": "Explique o erro",
};

export const DESCRICAO_FORMATO: Record<FormatoQuiz, string> = {
  armadilha: "Um erro clássico, com o nome do padrão escondido. De quem é?",
  "onde-aparece": "Uma biblioteca que você já usa. Que padrão está por trás?",
  duelo: "Dois padrões que se confundem, e um critério que os separa.",
  "anti-exemplo": "Código mal implementado. Qual padrão está sendo maltratado?",
  postmortem: "Um incidente real. Qual conceito teria evitado o estrago?",
  "explique-erro": "Código quebrado. Qual princípio foi violado?",
};

const ALTERNATIVAS = 4;

/** Mesma assinatura de embaralhamento do motor principal, para consistência. */
function embaralhar<T>(itens: T[], rnd: () => number): T[] {
  const out = [...itens];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Completa as alternativas com vizinhos confundíveis, depois com o resto. */
function montarAlternativas(
  correta: string,
  rnd: () => number,
  quantas = ALTERNATIVAS
): string[] | null {
  const todos = listConceitos().map((c) => c.slug);
  const preferidos = embaralhar(distratoresDe(correta), rnd);
  const reserva = embaralhar(
    todos.filter((s) => s !== correta && !preferidos.includes(s)),
    rnd
  );
  const distratores = [...preferidos, ...reserva].slice(0, quantas - 1);
  if (distratores.length < quantas - 1) return null;
  return embaralhar([correta, ...distratores], rnd);
}

const noEscopo = (slug: string, escopo?: readonly string[]) =>
  !escopo || escopo.includes(slug);

/**
 * Detecta se o nome do conceito aparece embutido num identificador maior.
 *
 * `mascarar()` usa limite de palavra, então `Repository` dentro de
 * `JpaRepository` escapa (idem `XState`, `statement_timeout`), e alguns
 * enunciados de "onde aparece" entregavam a resposta assim. A solução é
 * descartar a pergunta, não reescrever o conteúdo: na página do conceito,
 * citar "JpaRepository" é desejável; o vazamento só existe no quiz.
 */
function vazaResposta(texto: string, c: Conceito): boolean {
  const alvo = texto.toLowerCase();
  const nome = c.titulo.toLowerCase();
  if (alvo.includes(nome)) return true;
  const primeira = nome.split(/[\s—(]/)[0];
  return primeira.length > 4 && alvo.includes(primeira);
}

/* Onde isto aparece: testa reconhecimento no código real, não memória de
 * definição. */
export function perguntasDeOndeAparece(
  rnd: () => number,
  escopo?: readonly string[]
): Pergunta[] {
  const out: Pergunta[] = [];
  for (const c of listConceitos()) {
    if (!c.ondeAparece?.length || !noEscopo(c.slug, escopo)) continue;
    c.ondeAparece.forEach((item, i) => {
      const alternativas = montarAlternativas(c.slug, rnd);
      if (!alternativas) return;
      // o `onde` cita o padrão em vários casos ("O objeto Proxy do JS")
      const enunciado = `${mascarar(item.onde, c)} — ${mascarar(item.explicacao, c)}`;
      if (vazaResposta(enunciado, c)) return;
      out.push({
        id: `onde:${c.slug}:${i}`,
        enunciado,
        correta: c.slug,
        alternativas,
        explicacao: `${item.onde}: ${item.explicacao}`,
      });
    });
  }
  return out;
}

/* Duelo: dois candidatos e um critério. Binário de propósito, o que se testa
 * é a distinção. */
export function perguntasDeDuelo(
  rnd: () => number,
  escopo?: readonly string[]
): Pergunta[] {
  const out: Pergunta[] = [];
  for (const comp of listComparacoes()) {
    const a = getConceito(comp.a);
    const b = getConceito(comp.b);
    if (!a || !b) continue;
    if (!noEscopo(a.slug, escopo) && !noEscopo(b.slug, escopo)) continue;

    comp.criterios.forEach((cr, i) => {
      // sorteia qual lado é a resposta, para não ser sempre o A
      const pelaEsquerda = rnd() < 0.5;
      const dono = pelaEsquerda ? a : b;
      const resposta = pelaEsquerda ? cr.ladoA : cr.ladoB;
      // mascara pelos dois lados: o critério do lado A pode citar o B
      const enunciado = `**${cr.pergunta}** ${mascarar(mascarar(resposta, a), b)}`;
      if (vazaResposta(enunciado, dono)) return;
      out.push({
        id: `duelo:${comp.slug}:${i}:${dono.slug}`,
        enunciado,
        correta: dono.slug,
        alternativas: embaralhar([a.slug, b.slug], rnd),
        explicacao: `${dono.titulo} — ${resposta}`,
      });
    });
  }
  return out;
}

/* Anti-exemplo: o padrão mal implementado. */
export function perguntasDeAntiExemplo(
  rnd: () => number,
  escopo?: readonly string[]
): Pergunta[] {
  const out: Pergunta[] = [];
  for (const c of listConceitos()) {
    if (!noEscopo(c.slug, escopo)) continue;
    const blocos = (c.blocos ?? []).filter(
      (b): b is Extract<Bloco, { tipo: "anti-exemplo" }> => b.tipo === "anti-exemplo"
    );
    for (const b of blocos) {
      const alternativas = montarAlternativas(c.slug, rnd);
      if (!alternativas) continue;
      const sintoma = b.sintomas[0];
      const enunciado = `${mascarar(b.comoSeParece, c)} ${sintoma ? `**${sintoma.quando}:** ${mascarar(sintoma.efeito, c)}` : ""}`.trim();
      if (vazaResposta(enunciado, c)) continue;
      out.push({
        id: `anti:${c.slug}`,
        enunciado,
        correta: c.slug,
        alternativas,
        explicacao: b.titulo ?? "O jeito errado",
      });
    }
  }
  return out;
}

/* Incidente: o conceito que o postmortem prova. */
export function perguntasDePostmortem(
  rnd: () => number,
  escopo?: readonly string[]
): Pergunta[] {
  const out: Pergunta[] = [];
  for (const pm of POSTMORTEMS) {
    pm.conceitos.forEach((citacao, i) => {
      const c = getConceito(citacao.slug);
      if (!c || !noEscopo(c.slug, escopo)) return;
      const alternativas = montarAlternativas(c.slug, rnd);
      if (!alternativas) return;
      const enunciado = `**${pm.organizacao}, ${pm.quando.rotulo}.** ${pm.impacto} ${mascarar(citacao.porque, c)}`;
      if (vazaResposta(enunciado, c)) return;
      out.push({
        id: `pm:${pm.slug}:${i}`,
        enunciado,
        correta: c.slug,
        alternativas,
        explicacao: `${pm.titulo} — ${citacao.porque}`,
      });
    });
  }
  return out;
}

/* Explique o erro: código quebrado → princípio. Registro à mão. */
export function perguntasDeExpliqueErro(
  rnd: () => number,
  escopo?: readonly string[]
): Pergunta[] {
  const out: Pergunta[] = [];
  for (const item of EXPLICAR_ERROS) {
    if (!noEscopo(item.correta, escopo)) continue;
    const c = getConceito(item.correta);
    if (!c) continue;
    const pool = alternativasDe(item).filter((s) => getConceito(s));
    if (pool.length < 2 || !pool.includes(item.correta)) continue;
    const alternativas = embaralhar(pool, rnd);
    const enunciado =
      item.enunciado?.trim() ||
      "Olhe o código. Qual princípio está sendo violado?";
    if (vazaResposta(enunciado, c)) continue;
    out.push({
      id: `explique:${item.id}`,
      enunciado,
      correta: item.correta,
      alternativas,
      explicacao: item.explicacao,
      codigo: item.codigo.code,
    });
  }
  return out;
}

/* A rodada */

export interface OpcoesRodada {
  semente: number;
  quantas: number;
  /** Conceitos elegíveis. Sem escopo, o catálogo inteiro. */
  escopo?: readonly string[];
  /** Formatos habilitados. Vazio ou ausente = todos. */
  formatos?: readonly FormatoQuiz[];
}

export const TODOS_OS_FORMATOS: FormatoQuiz[] = [
  "armadilha",
  "onde-aparece",
  "duelo",
  "anti-exemplo",
  "postmortem",
  "explique-erro",
];

/**
 * Monta a rodada misturando os formatos pedidos.
 *
 * Intercala em vez de concatenar: concatenando, uma rodada de 10 sairia com
 * as 8 primeiras do mesmo formato e a variedade só apareceria no fim.
 */
export function gerarRodada(o: OpcoesRodada): Pergunta[] {
  const habilitados =
    o.formatos && o.formatos.length > 0 ? o.formatos : TODOS_OS_FORMATOS;
  const rnd = prngLocal(o.semente);

  const porFormato: Pergunta[][] = [];
  for (const f of habilitados) {
    let cruas: Pergunta[];
    switch (f) {
      case "armadilha":
        // o motor original não tem "todas": pede-se um teto alto
        cruas = gerarPerguntas(o.semente, Number.MAX_SAFE_INTEGER, o.escopo);
        break;
      case "onde-aparece":
        cruas = perguntasDeOndeAparece(rnd, o.escopo);
        break;
      case "duelo":
        cruas = perguntasDeDuelo(rnd, o.escopo);
        break;
      case "anti-exemplo":
        cruas = perguntasDeAntiExemplo(rnd, o.escopo);
        break;
      case "postmortem":
        cruas = perguntasDePostmortem(rnd, o.escopo);
        break;
      case "explique-erro":
        cruas = perguntasDeExpliqueErro(rnd, o.escopo);
        break;
    }
    const geradas: Pergunta[] = cruas.map((p) => ({ ...p, formato: f }));
    if (geradas.length > 0) porFormato.push(embaralhar(geradas, rnd));
  }

  // intercalação circular: pega uma de cada formato por vez
  const out: Pergunta[] = [];
  const vistos = new Set<string>();
  let restam = true;
  for (let volta = 0; out.length < o.quantas && restam; volta++) {
    restam = false;
    for (const fila of porFormato) {
      if (volta >= fila.length) continue;
      restam = true;
      const p = fila[volta];
      if (vistos.has(p.id)) continue;
      vistos.add(p.id);
      out.push(p);
      if (out.length >= o.quantas) break;
    }
  }
  return out;
}

/**
 * Modo entrevista: 5 explique-erro + 2 duelos da trilha (ou catálogo).
 * Ordem fixa: primeiro o código quebrado, depois o julgamento A/B.
 */
export function gerarRodadaEntrevista(
  semente: number,
  escopo?: readonly string[]
): Pergunta[] {
  const rnd = prngLocal(semente);
  const explique = embaralhar(
    perguntasDeExpliqueErro(rnd, escopo).map((p) => ({
      ...p,
      formato: "explique-erro" as const,
    })),
    rnd
  ).slice(0, 5);
  const duelos = embaralhar(
    perguntasDeDuelo(rnd, escopo).map((p) => ({
      ...p,
      formato: "duelo" as const,
    })),
    rnd
  ).slice(0, 2);
  return [...explique, ...duelos];
}

/** PRNG local: o do motor principal é privado, e duplicar 6 linhas é melhor
 * que exportar estado interno só pra isto. */
function prngLocal(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quantas perguntas cada formato consegue oferecer, para o seletor. */
export function disponibilidadePorFormato(
  escopo?: readonly string[]
): Record<Exclude<FormatoQuiz, "armadilha">, number> {
  // rnd fixo: só o tamanho importa aqui, não a ordem
  const rnd = () => 0.5;
  return {
    "onde-aparece": perguntasDeOndeAparece(rnd, escopo).length,
    duelo: perguntasDeDuelo(rnd, escopo).length,
    "anti-exemplo": perguntasDeAntiExemplo(rnd, escopo).length,
    postmortem: perguntasDePostmortem(rnd, escopo).length,
    "explique-erro": perguntasDeExpliqueErro(rnd, escopo).length,
  };
}

/** Conceitos que um formato consegue cobrir (usado pelos testes). */
export function conceitosComFormato(formato: FormatoQuiz): Conceito[] {
  const rnd = () => 0.5;
  const gerar: Record<string, () => Pergunta[]> = {
    "onde-aparece": () => perguntasDeOndeAparece(rnd),
    duelo: () => perguntasDeDuelo(rnd),
    "anti-exemplo": () => perguntasDeAntiExemplo(rnd),
    postmortem: () => perguntasDePostmortem(rnd),
    "explique-erro": () => perguntasDeExpliqueErro(rnd),
  };
  const fn = gerar[formato];
  if (!fn) return [];
  const slugs = new Set(fn().map((p) => p.correta));
  return listConceitos().filter((c) => slugs.has(c.slug));
}
