/**
 * Latências de referência — a fonte única.
 *
 * Existia uma duplicação silenciosa aqui: o simulador passava o número como
 * argumento **e** repetia na prosa (`passo(..., "…(~15ms)", 15)`), com nada
 * garantindo que os dois continuassem iguais. Pior: a interface já renderiza o
 * `ms` de cada passo (`fluxo-projeto.tsx`), então a prosa duplicava algo que
 * estava na mesma tela.
 *
 * Agora o número vive num lugar só. A prosa explica **o que** acontece; o
 * número aparece onde sempre apareceu.
 *
 * Os valores são ordens de grandeza, não medições — servem para ensinar a
 * proporção entre as etapas, e é assim que devem ser lidos.
 */

export interface Latencia {
  ms: number;
  /** O que esse tempo representa. Usado na escala e na legenda. */
  rotulo: string;
}

/**
 * As operações do simulador cujo número **ensina** algo — a proporção entre
 * elas é o conteúdo.
 *
 * Ficaram de fora, de propósito, os tempos de encanamento (TLS, validação de
 * formato, orquestração: 1–2ms). Eles existem no simulador como literais porque
 * são ruído de fundo, não lição — e forçá-los aqui só encheria a escala de
 * pontos indistinguíveis.
 */
export const LATENCIA = {
  memoria: { ms: 0.5, rotulo: "cache em memória, mesma rede" },
  readModel: { ms: 8, rotulo: "leitura de projeção desnormalizada" },
  metadados: { ms: 8, rotulo: "gravação de metadados" },
  bancoIndex: { ms: 10, rotulo: "consulta com índice" },
  escritaAcid: { ms: 12, rotulo: "escrita transacional" },
  indiceBusca: { ms: 15, rotulo: "índice invertido de busca" },
  cdnBorda: { ms: 15, rotulo: "asset servido da borda" },
  redeCliente: { ms: 30, rotulo: "ida e volta do browser" },
  handshakeUpload: { ms: 40, rotulo: "handshake de upload direto ao bucket" },
  bancoScan: { ms: 180, rotulo: "full table scan" },
  blobNoBanco: { ms: 250, rotulo: "arquivo gravado como BLOB no banco" },

  /* ——— o custo de uma falha, conforme o que protege a borda ———
   * Estes quatro existem para o simulador mostrar a coisa mais difícil de
   * ensinar em texto: a mesma dependência quebrada custa quatro tempos
   * diferentes. A distância entre `esperaSemPrazo` e `falhaRapida` é de cinco
   * ordens de grandeza — é o argumento inteiro da família de resiliência.
   */
  falhaRapida: { ms: 0.1, rotulo: "recusa do disjuntor aberto" },
  prazoConfigurado: { ms: 2_000, rotulo: "prazo de timeout estourado" },
  prazoComRetry: { ms: 6_000, rotulo: "três tentativas, cada uma até o prazo" },
  esperaSemPrazo: { ms: 30_000, rotulo: "espera sem prazo até o cliente desistir" },
} as const satisfies Record<string, Latencia>;

export type ChaveLatencia = keyof typeof LATENCIA;

/**
 * Pontos de referência que o simulador não usa, mas que dão à escala o alcance
 * que a torna educativa: sem o ciclo de CPU numa ponta e a travessia do
 * Atlântico na outra, "10ms" não quer dizer nada.
 *
 * Números da ordem de grandeza consagrada em *latency numbers every programmer
 * should know* — referência, não benchmark.
 */
export const REFERENCIAS: (Latencia & { id: string })[] = [
  { id: "ciclo-cpu", ms: 0.0000003, rotulo: "um ciclo de CPU a 3 GHz" },
  { id: "l1", ms: 0.000001, rotulo: "leitura do cache L1" },
  { id: "l2", ms: 0.000004, rotulo: "leitura do cache L2" },
  { id: "ram", ms: 0.0001, rotulo: "leitura da memória principal" },
  { id: "ssd", ms: 0.016, rotulo: "leitura aleatória em SSD" },
  { id: "rtt-datacenter", ms: 0.5, rotulo: "ida e volta dentro do datacenter" },
  { id: "hdd-seek", ms: 2, rotulo: "busca de cabeça em disco rígido" },
  { id: "rtt-regiao", ms: 120, rotulo: "São Paulo ↔ Virgínia, ida e volta" },
  { id: "rtt-antipoda", ms: 250, rotulo: "São Paulo ↔ Singapura, ida e volta" },
];

/**
 * Formata em pt-BR: `0,5ms`, `180ms`, `1,2s`.
 *
 * Para valores abaixo de 1µs desce para nanossegundos — sem isso, o ciclo de
 * CPU apareceria como `0ms` na escala.
 */
export function formatarLatencia(ms: number): string {
  // As faixas são por potência de mil, sem sobreposição. A versão anterior
  // misturava dois critérios (`us < 1000 && ms < 0.1`) e, para 0,000001ms,
  // arredondava 0,001µs para "0µs" — um rótulo que não diz nada. Era o defeito
  // que o comentário do teste dizia evitar, e o teste passava porque eu tinha
  // escolhido um valor que dava certo.
  const br = (n: number, casas: number) =>
    n.toFixed(casas).replace(/\.0+$/, "").replace(".", ",");

  if (ms >= 1000) return `${br(ms / 1000, 1)}s`;
  if (ms >= 1) return `${br(ms, 1)}ms`;
  // A fronteira do µs fica em 0,1ms e não em 1ms de propósito: "0,5ms" é como
  // se fala de um HIT de cache, e "500µs" — tecnicamente igual — soa estranho
  // no meio da narração do simulador.
  if (ms >= 0.1) return `${String(ms).replace(".", ",")}ms`;
  if (ms >= 0.001) return `${br(ms * 1_000, 1)}µs`;
  return `${br(ms * 1_000_000, 1)}ns`;
}

/** Todas as latências conhecidas, ordenadas — a escala consome isto. */
export function escalaCompleta(): (Latencia & { id: string; doSimulador: boolean })[] {
  const doSimulador = Object.entries(LATENCIA).map(([id, l]) => ({
    id,
    ...l,
    doSimulador: true,
  }));
  const referencias = REFERENCIAS.map((r) => ({ ...r, doSimulador: false }));
  return [...referencias, ...doSimulador].sort((a, b) => a.ms - b.ms);
}
