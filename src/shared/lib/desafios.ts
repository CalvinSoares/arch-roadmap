import { REGRAS, avaliarRegras } from "@/content/construtor/regras";
import type { Desafio } from "@/content/construtor/desafios";
import type { Insight } from "@/shared/types/construtor";

/**
 * Motor do modo "quebre isto" (funções puras, sem DOM e sem relógio).
 *
 * Não há gabarito transcrito: as respostas certas saem de `avaliarRegras` e
 * os distratores saem das regras que não dispararam pra aquele estado, mesmo
 * esquema do quiz.
 */

export interface Alternativa {
  id: string;
  titulo: string;
  correta: boolean;
}

export interface Correcao {
  acertos: string[];
  /** Marcou algo que não é problema deste desenho. */
  falsosPositivos: string[];
  /** Deixou passar um defeito real. */
  perdidos: string[];
  /** 0..1: acertos sobre o total esperado, penalizado por falso positivo. */
  nota: number;
}

/** Os alertas que este desenho realmente produz. */
export function alertasDe(desafio: Desafio): Insight[] {
  return avaliarRegras(desafio.estado).filter((i) => i.nivel === "alerta");
}

/**
 * Embaralhamento determinístico por semente (nada de `Math.random()`), pro
 * mesmo desafio ser idêntico pra todo mundo e pro teste.
 */
function embaralhar<T>(itens: T[], semente: number): T[] {
  const saida = [...itens];
  let s = semente || 1;
  for (let i = saida.length - 1; i > 0; i--) {
    // gerador congruencial simples: suficiente para ordenar alternativas
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = Math.abs(s) % (i + 1);
    [saida[i], saida[j]] = [saida[j], saida[i]];
  }
  return saida;
}

/**
 * As alternativas de um desafio: os alertas reais mais distratores tirados de
 * regras que não dispararam.
 *
 * Distratores vêm só de regras de nível `alerta`, senão a resposta ficaria
 * óbvia pelo tom (um "info" no meio de alertas se denuncia sozinho).
 */
export function alternativasDoDesafio(
  desafio: Desafio,
  semente: number,
  quantosDistratores = 4
): Alternativa[] {
  const corretas = alertasDe(desafio);
  const idsCorretos = new Set(corretas.map((i) => i.id));

  const candidatos = REGRAS.filter(
    (r) => r.nivel === "alerta" && !idsCorretos.has(r.id)
  ).map((r) => ({ id: r.id, titulo: r.titulo, correta: false }));

  const distratores = embaralhar(candidatos, semente).slice(0, quantosDistratores);

  return embaralhar(
    [
      ...corretas.map((i) => ({ id: i.id, titulo: i.titulo, correta: true })),
      ...distratores,
    ],
    semente + 1
  );
}

/** Compara as escolhas com o que o motor de regras diz. */
export function corrigir(desafio: Desafio, escolhas: string[]): Correcao {
  const corretos = new Set(alertasDe(desafio).map((i) => i.id));
  const marcados = new Set(escolhas);

  const acertos = [...marcados].filter((id) => corretos.has(id));
  const falsosPositivos = [...marcados].filter((id) => !corretos.has(id));
  const perdidos = [...corretos].filter((id) => !marcados.has(id));

  const total = corretos.size || 1;
  // falso positivo pesa metade de um acerto: apontar defeito onde não há
  // custa menos que deixar passar, mas não pode sair de graça
  const bruto = (acertos.length - falsosPositivos.length * 0.5) / total;

  return {
    acertos,
    falsosPositivos,
    perdidos,
    nota: Math.max(0, Math.min(1, bruto)),
  };
}
