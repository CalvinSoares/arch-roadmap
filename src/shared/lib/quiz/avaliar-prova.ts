import { getRoadmap } from "@/shared/lib/content";
import { sementeDoDia } from "@/shared/lib/quiz";
import {
  gerarRodada,
  gerarRodadaEntrevista,
  TODOS_OS_FORMATOS,
  type FormatoQuiz,
} from "@/shared/lib/quiz-formatos";
import {
  avaliarDesafio,
  gerarDesafiosCheckpoint,
  gerarDesafiosLicao,
  gerarDesafiosRevisao,
} from "@/shared/lib/jornada/desafios";
import type { RespostaDesafio } from "@/shared/types/desafio";

const FORMATOS_OK = new Set<string>(TODOS_OS_FORMATOS);
const MAX_QUANTAS = 30;
const MAX_ESCOPO = 200;
const MAX_INDICE = 40;

/** Prova enviada pelo cliente; o servidor regenera o gabarito e decide. */
export type ProvaRespostaQuiz =
  | {
      kind: "mcq-rodada";
      hoje: string;
      rodada: number;
      indice: number;
      quantidade: number;
      escopo?: string[];
      formatos?: FormatoQuiz[];
      entrevista?: boolean;
      /** Slug da alternativa escolhida. */
      escolha: string;
    }
  | {
      kind: "desafio-jornada";
      modo: "conceito" | "checkpoint" | "revisao";
      /** Já inclui o offset da rodada (`semente + rodada` no cliente). */
      semente: number;
      desafioId: string;
      quantas?: number;
      slug?: string;
      roadmapSlug?: string;
      itemId?: string;
      slugs?: string[];
      resposta: RespostaDesafio;
    };

export type ResultadoAvaliacaoQuiz = {
  /** Contexto inválido / não regenerável. */
  valido: boolean;
  acertou: boolean;
  /** Conceito (ou chave) para ledger/desempenho. */
  conceitoSlug: string;
  formato?: string;
};

function limparEscopo(escopo: unknown): string[] | undefined {
  if (!Array.isArray(escopo)) return undefined;
  const limpos = escopo
    .map((s) => String(s ?? "").trim())
    .filter((s) => s.length > 0 && s.length < 120 && !s.includes(":"))
    .slice(0, MAX_ESCOPO);
  return limpos.length > 0 ? limpos : undefined;
}

function limparFormatos(formatos: unknown): FormatoQuiz[] | undefined {
  if (!Array.isArray(formatos) || formatos.length === 0) return undefined;
  const ok = formatos
    .map((f) => String(f))
    .filter((f): f is FormatoQuiz => FORMATOS_OK.has(f))
    .slice(0, TODOS_OS_FORMATOS.length);
  return ok.length > 0 ? ok : undefined;
}

function inteiroNoIntervalo(
  n: unknown,
  min: number,
  max: number
): number | null {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const i = Math.trunc(v);
  if (i < min || i > max) return null;
  return i;
}

function avaliarMcqRodada(
  p: Extract<ProvaRespostaQuiz, { kind: "mcq-rodada" }>
): ResultadoAvaliacaoQuiz {
  const invalido: ResultadoAvaliacaoQuiz = {
    valido: false,
    acertou: false,
    conceitoSlug: "",
  };

  const hoje = String(p.hoje ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hoje)) return invalido;

  const rodada = inteiroNoIntervalo(p.rodada, 0, 10_000);
  const indice = inteiroNoIntervalo(p.indice, 0, MAX_INDICE);
  const quantidade = inteiroNoIntervalo(p.quantidade, 1, MAX_QUANTAS);
  const escolha = String(p.escolha ?? "").trim();
  if (rodada === null || indice === null || quantidade === null || !escolha) {
    return invalido;
  }
  if (indice >= quantidade && !p.entrevista) return invalido;

  const escopo = limparEscopo(p.escopo);
  const formatos = limparFormatos(p.formatos);
  const semente = sementeDoDia(hoje) + rodada;

  const perguntas = p.entrevista
    ? gerarRodadaEntrevista(semente, escopo)
    : gerarRodada({
        semente,
        quantas: quantidade,
        escopo,
        formatos,
      });

  const pergunta = perguntas[indice];
  if (!pergunta) return invalido;

  return {
    valido: true,
    acertou: escolha === pergunta.correta,
    conceitoSlug: pergunta.correta,
    formato: pergunta.formato,
  };
}

function avaliarDesafioJornada(
  p: Extract<ProvaRespostaQuiz, { kind: "desafio-jornada" }>
): ResultadoAvaliacaoQuiz {
  const invalido: ResultadoAvaliacaoQuiz = {
    valido: false,
    acertou: false,
    conceitoSlug: "",
  };

  const semente = inteiroNoIntervalo(p.semente, 0, 2_000_000_000);
  const desafioId = String(p.desafioId ?? "").trim();
  const resposta = p.resposta;
  if (semente === null || !desafioId || !resposta || typeof resposta !== "object") {
    return invalido;
  }

  const quantas =
    inteiroNoIntervalo(p.quantas, 1, MAX_QUANTAS) ??
    (p.modo === "checkpoint" ? 3 : 5);

  let desafios;
  let conceitoSlug = "";

  if (p.modo === "conceito") {
    const slug = String(p.slug ?? "").trim();
    if (!slug || slug.includes(":")) return invalido;
    desafios = gerarDesafiosLicao({ slug, semente, quantas });
    conceitoSlug = slug;
  } else if (p.modo === "checkpoint") {
    const roadmapSlug = String(p.roadmapSlug ?? "").trim();
    const itemId = String(p.itemId ?? "").trim();
    const roadmap = getRoadmap(roadmapSlug);
    const item = roadmap?.sections
      .flatMap((s) => s.items)
      .find((i) => i.id === itemId);
    if (!roadmap || !item) return invalido;
    desafios = gerarDesafiosCheckpoint({
      roadmapSlug,
      item,
      semente,
      quantas,
    });
    conceitoSlug = `checkpoint:${roadmapSlug}:${itemId}`;
  } else if (p.modo === "revisao") {
    const slugs = limparEscopo(p.slugs);
    if (!slugs || slugs.length === 0) return invalido;
    desafios = gerarDesafiosRevisao({ slugs, semente, quantas });
    conceitoSlug = "revisao:pontos-fracos";
  } else {
    return invalido;
  }

  const desafio = desafios.find((d) => d.id === desafioId);
  if (!desafio) return invalido;

  const { ok } = avaliarDesafio(desafio, resposta);
  return {
    valido: true,
    acertou: ok,
    conceitoSlug,
    formato: desafio.tipo,
  };
}

/**
 * Regenera a pergunta/desafio a partir do contexto e compara com a resposta.
 * Não confia no boolean `acertou` do cliente.
 */
export function avaliarProvaRespostaQuiz(
  prova: ProvaRespostaQuiz
): ResultadoAvaliacaoQuiz {
  if (!prova || typeof prova !== "object") {
    return { valido: false, acertou: false, conceitoSlug: "" };
  }
  if (prova.kind === "mcq-rodada") return avaliarMcqRodada(prova);
  if (prova.kind === "desafio-jornada") return avaliarDesafioJornada(prova);
  return { valido: false, acertou: false, conceitoSlug: "" };
}
