import type {
  DesempenhoQuiz,
  PontoFraco,
  TotaisDesempenho,
} from "@/shared/types/desempenho";

/**
 * Aplica uma resposta ao histórico.
 *
 * Função pura — `hoje` entra por parâmetro, nunca `new Date()` aqui —, para a
 * spec dar o mesmo resultado hoje e daqui a dez anos.
 */
export function registrar(
  d: DesempenhoQuiz,
  slug: string,
  acertou: boolean,
  hoje: string
): DesempenhoQuiz {
  const atual = d[slug] ?? { acertos: 0, erros: 0, ultimoEm: hoje };
  return {
    ...d,
    [slug]: {
      acertos: atual.acertos + (acertou ? 1 : 0),
      erros: atual.erros + (acertou ? 0 : 1),
      ultimoEm: hoje,
    },
  };
}

/** Números do rodapé: total respondido e taxa de acerto geral. */
export function totais(d: DesempenhoQuiz): TotaisDesempenho {
  let acertos = 0;
  let erros = 0;
  let conceitos = 0;
  for (const [slug, v] of Object.entries(d)) {
    if (slug.startsWith("checkpoint:") || slug.startsWith("revisao:")) continue;
    acertos += v.acertos;
    erros += v.erros;
    if (v.acertos + v.erros > 0) conceitos++;
  }
  const respostas = acertos + erros;
  return {
    respostas,
    acertos,
    erros,
    conceitos,
    taxaAcerto: respostas ? acertos / respostas : 0,
  };
}

/**
 * Os conceitos onde você mais erra, do pior para o menos pior.
 *
 * Só entra quem errou ao menos uma vez. A ordem é por número de erros e, no
 * empate, por taxa de erro — errar 3 de 4 vem antes de errar 3 de 10. O slug
 * desempata por último, para a ordenação ser determinística (a spec depende).
 */
export function pontosFracos(
  d: DesempenhoQuiz,
  quantos = Infinity
): PontoFraco[] {
  const out: PontoFraco[] = [];
  for (const [slug, v] of Object.entries(d)) {
    // Checkpoints da jornada não são verbetes — fora de "pontos fracos".
    if (slug.startsWith("checkpoint:") || slug.startsWith("revisao:")) continue;
    if (v.erros <= 0) continue;
    const total = v.acertos + v.erros;
    out.push({
      slug,
      acertos: v.acertos,
      erros: v.erros,
      total,
      taxaErro: v.erros / total,
    });
  }
  out.sort(
    (a, b) =>
      b.erros - a.erros ||
      b.taxaErro - a.taxaErro ||
      a.slug.localeCompare(b.slug)
  );
  return quantos === Infinity ? out : out.slice(0, quantos);
}

/**
 * Slugs dos pontos fracos — o escopo do modo "praticar onde eu erro".
 *
 * É o que fecha o ciclo: o quiz alimenta o histórico, e o histórico devolve
 * ao quiz um sorteio concentrado no que dói.
 */
export function slugsFracos(d: DesempenhoQuiz): string[] {
  return pontosFracos(d).map((p) => p.slug);
}
