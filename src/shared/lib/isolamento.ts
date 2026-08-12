/**
 * Laboratório de concorrência — o motor, em funções puras.
 *
 * Simula duas transações intercaladas sobre uma linha e diz **qual anomalia
 * aconteceu**, dado o nível de isolamento escolhido. Determinístico: nenhuma
 * aleatoriedade, nenhum relógio, nenhum DOM — o mesmo roteiro dá sempre o mesmo
 * resultado, e é isso que permite testar.
 *
 * O modelo é deliberadamente pequeno. Ele não é um banco: é o suficiente para
 * a anomalia acontecer na frente de quem lê, que é o que texto não consegue
 * fazer.
 */

export type Nivel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE";

export const NIVEIS: Nivel[] = [
  "READ UNCOMMITTED",
  "READ COMMITTED",
  "REPEATABLE READ",
  "SERIALIZABLE",
];

export type Anomalia =
  | "dirty-read"
  | "non-repeatable-read"
  | "lost-update"
  | "nenhuma";

export const NOME_ANOMALIA: Record<Anomalia, string> = {
  "dirty-read": "Dirty read",
  "non-repeatable-read": "Non-repeatable read",
  "lost-update": "Lost update",
  nenhuma: "Nenhuma anomalia",
};

/** Uma operação de uma das duas transações. */
export interface Passo {
  tx: "T1" | "T2";
  op: "ler" | "escrever" | "commit" | "rollback";
  /** Só em `escrever`: o valor calculado a partir do que a transação leu. */
  delta?: number;
}

export interface EstadoLinha {
  /** O valor visível a quem já commitou. */
  commitado: number;
  /** Escritas ainda não commitadas, por transação. */
  pendente: Partial<Record<"T1" | "T2", number>>;
}

export interface Evento {
  indice: number;
  passo: Passo;
  /** O que a transação enxergou, quando o passo é uma leitura. */
  leu?: number;
  /** Valor commitado depois deste passo. */
  commitado: number;
  /** Explicação do que aconteceu — é o que ensina. */
  narracao: string;
  /** Anomalia que este passo revelou, se alguma. */
  anomalia?: Anomalia;
  /** A transação foi abortada aqui (SERIALIZABLE). */
  abortou?: boolean;
}

export interface Resultado {
  eventos: Evento[];
  /** Valor final da linha. */
  final: number;
  /** O que o valor deveria ser se as transações tivessem rodado em série. */
  esperadoEmSerie: number;
  anomalias: Anomalia[];
}

/**
 * O que uma transação enxerga ao ler, dado o nível.
 *
 * É aqui que os níveis se diferenciam de verdade: não no que escrevem, e sim
 * no que deixam ver.
 */
function ler(
  tx: "T1" | "T2",
  estado: EstadoLinha,
  nivel: Nivel,
  /**
   * Valor commitado no instante da **primeira** leitura de cada transação.
   *
   * Um mapa só serve aos dois usos, e é por isso que antes havia um bug aqui:
   * em REPEATABLE READ ele é o valor que as leituras seguintes devolvem
   * (snapshot congelado); em READ COMMITTED ele é a referência que revela o
   * *non-repeatable read* quando o commitado se move.
   */
  primeiraLeitura: Partial<Record<"T1" | "T2", number>>
): { valor: number; nota: string; anomalia?: Anomalia } {
  const propria = estado.pendente[tx];
  if (propria !== undefined) {
    return { valor: propria, nota: "vê a própria escrita, ainda não commitada" };
  }

  const outra = tx === "T1" ? "T2" : "T1";
  const pendenteDaOutra = estado.pendente[outra];

  if (nivel === "READ UNCOMMITTED" && pendenteDaOutra !== undefined) {
    return {
      valor: pendenteDaOutra,
      nota: `lê ${pendenteDaOutra}, que ${outra} escreveu e ainda não commitou`,
      anomalia: "dirty-read",
    };
  }

  // REPEATABLE READ e acima: a transação fica presa ao snapshot da 1ª leitura
  if (
    (nivel === "REPEATABLE READ" || nivel === "SERIALIZABLE") &&
    primeiraLeitura[tx] !== undefined
  ) {
    const antes = primeiraLeitura[tx]!;
    const nota =
      antes === estado.commitado
        ? "lê do snapshot da primeira leitura"
        : `lê ${antes} do snapshot — o valor commitado já é ${estado.commitado}`;
    return { valor: antes, nota };
  }

  const mudou =
    primeiraLeitura[tx] !== undefined && primeiraLeitura[tx] !== estado.commitado;
  return {
    valor: estado.commitado,
    nota: mudou
      ? `lê ${estado.commitado} — mudou desde a leitura anterior`
      : `lê o valor commitado`,
    anomalia: mudou ? "non-repeatable-read" : undefined,
  };
}

/**
 * Roda o roteiro e narra.
 *
 * `inicial` é o valor da linha antes de tudo; cada `escrever` grava
 * `valorLido + delta`, que é o formato que produz *lost update*.
 */
export function simular(
  passos: Passo[],
  nivel: Nivel,
  inicial = 100
): Resultado {
  const estado: EstadoLinha = { commitado: inicial, pendente: {} };
  /** Commitado no instante da 1ª leitura de cada transação — ver `ler()`. */
  const primeiraLeitura: Partial<Record<"T1" | "T2", number>> = {};
  const ultimaLeitura: Partial<Record<"T1" | "T2", number>> = {};
  const abortada = new Set<"T1" | "T2">();

  const eventos: Evento[] = [];
  const anomalias: Anomalia[] = [];
  let deltaTotal = 0;

  passos.forEach((passo, indice) => {
    const { tx, op } = passo;

    if (abortada.has(tx)) {
      eventos.push({
        indice,
        passo,
        commitado: estado.commitado,
        narracao: `${tx} já foi abortada — o passo é ignorado.`,
      });
      return;
    }

    if (op === "ler") {
      const r = ler(tx, estado, nivel, primeiraLeitura);
      if (primeiraLeitura[tx] === undefined) primeiraLeitura[tx] = estado.commitado;
      ultimaLeitura[tx] = r.valor;

      if (r.anomalia) anomalias.push(r.anomalia);
      eventos.push({
        indice,
        passo,
        leu: r.valor,
        commitado: estado.commitado,
        narracao: `${tx} ${r.nota}.`,
        anomalia: r.anomalia,
      });
      return;
    }

    if (op === "escrever") {
      const base = ultimaLeitura[tx] ?? estado.commitado;
      const novo = base + (passo.delta ?? 0);
      estado.pendente[tx] = novo;
      deltaTotal += passo.delta ?? 0;
      eventos.push({
        indice,
        passo,
        commitado: estado.commitado,
        narracao: `${tx} calcula ${base} ${(passo.delta ?? 0) < 0 ? "−" : "+"} ${Math.abs(passo.delta ?? 0)} = ${novo} e escreve (ainda não commitado).`,
      });
      return;
    }

    if (op === "rollback") {
      delete estado.pendente[tx];
      eventos.push({
        indice,
        passo,
        commitado: estado.commitado,
        narracao: `${tx} desfaz tudo. Quem leu esse valor leu algo que nunca existiu.`,
      });
      return;
    }

    // commit
    const escrita = estado.pendente[tx];
    const outra = tx === "T1" ? "T2" : "T1";

    // SERIALIZABLE: se a outra já commitou por cima da base que esta leu,
    // o banco aborta esta em vez de deixar a escrita se perder.
    const baseDesatualizada =
      primeiraLeitura[tx] !== undefined && primeiraLeitura[tx] !== estado.commitado;

    if (nivel === "SERIALIZABLE" && escrita !== undefined && baseDesatualizada) {
      abortada.add(tx);
      delete estado.pendente[tx];
      eventos.push({
        indice,
        passo,
        commitado: estado.commitado,
        narracao: `${tx} é abortada com erro de serialização (40001): ${outra} commitou sobre a mesma base. Repetir é o comportamento correto.`,
        abortou: true,
      });
      return;
    }

    let anomalia: Anomalia | undefined;
    if (escrita !== undefined) {
      // lost update: escrevi por cima de um commit que não vi
      if (baseDesatualizada) {
        anomalia = "lost-update";
        anomalias.push(anomalia);
      }
      estado.commitado = escrita;
      delete estado.pendente[tx];
    }

    eventos.push({
      indice,
      passo,
      commitado: estado.commitado,
      narracao:
        escrita === undefined
          ? `${tx} commita sem ter escrito nada.`
          : anomalia
            ? `${tx} commita ${escrita}, apagando o que ${outra} já tinha commitado.`
            : `${tx} commita ${escrita}.`,
      anomalia,
    });
  });

  return {
    eventos,
    final: estado.commitado,
    esperadoEmSerie: inicial + deltaTotal,
    anomalias: [...new Set(anomalias)],
  };
}

/** Roteiros prontos — cada um exibe uma anomalia específica. */
export interface Roteiro {
  id: string;
  nome: string;
  /** O que observar. */
  descricao: string;
  passos: Passo[];
  /** Nível a partir do qual a anomalia deixa de acontecer. */
  resolvidoEm: Nivel;
}

export const ROTEIROS: Roteiro[] = [
  {
    id: "lost-update",
    nome: "Lost update",
    descricao:
      "As duas leem 100, cada uma debita, e a segunda escrita apaga a primeira. Nenhuma recebe erro.",
    resolvidoEm: "SERIALIZABLE",
    passos: [
      { tx: "T1", op: "ler" },
      { tx: "T2", op: "ler" },
      { tx: "T1", op: "escrever", delta: -30 },
      { tx: "T1", op: "commit" },
      { tx: "T2", op: "escrever", delta: -50 },
      { tx: "T2", op: "commit" },
    ],
  },
  {
    id: "dirty-read",
    nome: "Dirty read",
    descricao:
      "T2 lê um valor que T1 ainda vai desfazer — e decide com base em algo que nunca existiu.",
    resolvidoEm: "READ COMMITTED",
    passos: [
      { tx: "T1", op: "ler" },
      { tx: "T1", op: "escrever", delta: -80 },
      { tx: "T2", op: "ler" },
      { tx: "T1", op: "rollback" },
      { tx: "T2", op: "commit" },
    ],
  },
  {
    id: "non-repeatable",
    nome: "Non-repeatable read",
    descricao:
      "T1 lê duas vezes a mesma linha e recebe valores diferentes, porque T2 commitou no meio.",
    resolvidoEm: "REPEATABLE READ",
    passos: [
      { tx: "T1", op: "ler" },
      { tx: "T2", op: "ler" },
      { tx: "T2", op: "escrever", delta: -40 },
      { tx: "T2", op: "commit" },
      { tx: "T1", op: "ler" },
      { tx: "T1", op: "commit" },
    ],
  },
];
