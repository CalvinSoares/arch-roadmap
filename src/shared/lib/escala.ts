/**
 * A matemática da escala de latência — pura, sem DOM.
 *
 * A transformação entra por parâmetro (`log` × `linear`) em vez de estar
 * embutida, porque a comparação entre as duas **é** a lição: em escala linear,
 * tudo abaixo de 1ms colapsa num pixel, e é exatamente isso que se quer mostrar.
 */

export type Transformacao = "log" | "linear";

export interface PontoEscala {
  id: string;
  ms: number;
  rotulo: string;
}

/**
 * Posição de 0 a 1 no eixo.
 *
 * Em `log`, usa log10 — que é o único jeito de um ciclo de CPU (0,3ns) e uma
 * travessia do Pacífico (250ms) caberem no mesmo desenho. Em `linear`, é a
 * proporção crua, e o amontoado à esquerda é o argumento.
 */
export function posicao(
  ms: number,
  min: number,
  max: number,
  transformacao: Transformacao
): number {
  if (ms <= 0 || min <= 0 || max <= 0) {
    throw new RangeError("latência precisa ser positiva para entrar na escala");
  }
  if (max === min) return 0;

  if (transformacao === "linear") {
    return clamp((ms - min) / (max - min));
  }
  return clamp((Math.log10(ms) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)));
}

function clamp(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Quantas vezes `lento` é mais lento que `rapido`.
 *
 * É o número que faz a página valer: RAM contra travessia de região não é
 * "bem mais lento" — é mais de um milhão de vezes.
 */
export function razao(rapido: number, lento: number): number {
  if (rapido <= 0) throw new RangeError("divisão por latência não positiva");
  return lento / rapido;
}

/** Formata a razão do jeito que se conta em conversa: `1,2 milhão ×`. */
export function formatarRazao(r: number): string {
  const abs = Math.abs(r);
  if (abs < 10) return `${r.toFixed(1).replace(".", ",").replace(",0", "")}×`;
  if (abs < 1_000) return `${Math.round(r)}×`;
  if (abs < 1_000_000) return `${(r / 1_000).toFixed(1).replace(".", ",").replace(",0", "")} mil ×`;
  if (abs < 1_000_000_000)
    return `${(r / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} milhões ×`;
  return `${(r / 1_000_000_000).toFixed(1).replace(".", ",").replace(",0", "")} bilhões ×`;
}

/**
 * As décadas (potências de 10) que o eixo atravessa, para as linhas de grade.
 *
 * Só faz sentido em escala logarítmica — em linear, as décadas ficariam todas
 * empilhadas na origem, e desenhá-las lá seria ruído.
 */
export function decadas(min: number, max: number): number[] {
  const de = Math.floor(Math.log10(min));
  const ate = Math.ceil(Math.log10(max));
  const saida: number[] = [];
  for (let e = de; e <= ate; e++) {
    const valor = 10 ** e;
    if (valor >= min && valor <= max) saida.push(valor);
  }
  return saida;
}

/**
 * Empurra rótulos que colidem para faixas diferentes.
 *
 * Sem isto, os cinco pontos entre 0,5ms e 15ms viram uma mancha ilegível. A
 * saída é o índice da faixa vertical de cada ponto — quem está perto do
 * anterior sobe uma faixa.
 */
export function faixas(
  pontos: PontoEscala[],
  min: number,
  max: number,
  transformacao: Transformacao,
  /** Distância mínima, em fração do eixo, para caber na mesma faixa. */
  folga = 0.08,
  /** Quantas faixas existem antes de reaproveitar a primeira. */
  total = 3
): number[] {
  const ordenados = [...pontos].sort((a, b) => a.ms - b.ms);
  const posicoes = new Map<string, number>();
  const ultimaPorFaixa: number[] = new Array(total).fill(-Infinity);

  for (const p of ordenados) {
    const x = posicao(p.ms, min, max, transformacao);
    // primeira faixa em que o vizinho anterior já está longe o bastante
    let escolhida = 0;
    for (let f = 0; f < total; f++) {
      if (x - ultimaPorFaixa[f] >= folga) {
        escolhida = f;
        break;
      }
      // nenhuma serve: fica na que tem o vizinho mais antigo
      if (f === total - 1) {
        escolhida = ultimaPorFaixa.indexOf(Math.min(...ultimaPorFaixa));
      }
    }
    ultimaPorFaixa[escolhida] = x;
    posicoes.set(p.id, escolhida);
  }

  return pontos.map((p) => posicoes.get(p.id) ?? 0);
}
