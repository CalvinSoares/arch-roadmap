/**
 * Streak — dias consecutivos de atividade, o motor de retenção.
 *
 * Função **pura**: o "hoje" entra por parâmetro (ISO `YYYY-MM-DD`), nunca
 * `new Date()`, para a spec dar o mesmo resultado hoje e daqui a dez anos. Um
 * "dia" é uma data-calendário; qual é o "hoje" do usuário (fuso horário) é
 * responsabilidade de quem chama, não desta lógica.
 */

const MS_DIA = 86_400_000;

/** Dias-calendário de `de` até `ate` (positivo se `ate` vem depois). */
function diferencaDias(de: string, ate: string): number {
  return Math.round(
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / MS_DIA
  );
}

export interface EstadoStreak {
  /** Streak atual (dias consecutivos). */
  dias: number;
  /** ISO `YYYY-MM-DD` da última atividade, ou null se nunca houve. */
  ultimoDia: string | null;
  /** Congelamentos disponíveis — cada um cobre um único dia perdido. */
  freezes: number;
  /** Maior streak já alcançado. */
  maior: number;
}

export interface ResultadoStreak {
  estado: EstadoStreak;
  /** O streak subiu nesta atividade. */
  aumentou: boolean;
  /** Um congelamento foi consumido para não quebrar. */
  usouFreeze: boolean;
  /** O streak foi reiniciado (dia perdido sem freeze). */
  quebrou: boolean;
}

export const ESTADO_INICIAL: EstadoStreak = {
  dias: 0,
  ultimoDia: null,
  freezes: 0,
  maior: 0,
};

/** É a primeira atividade do dia? (define o bônus diário) */
export function ehPrimeiraDoDia(ultimoDia: string | null, hoje: string): boolean {
  return ultimoDia !== hoje;
}

/**
 * Registra uma atividade no dia `hoje` e devolve o novo estado do streak.
 *
 * - Mesmo dia: nada muda (já contou hoje).
 * - Dia seguinte: +1.
 * - Um dia perdido, com freeze: consome o freeze e continua.
 * - Buraco maior (ou sem freeze): reinicia em 1.
 */
export function registrarAtividade(
  estado: EstadoStreak,
  hoje: string
): ResultadoStreak {
  // primeira atividade da vida da conta
  if (estado.ultimoDia === null) {
    return {
      estado: { ...estado, dias: 1, ultimoDia: hoje, maior: Math.max(estado.maior, 1) },
      aumentou: true,
      usouFreeze: false,
      quebrou: false,
    };
  }

  const gap = diferencaDias(estado.ultimoDia, hoje);

  // já ativo hoje (ou data no passado, que ignoramos): sem mudança
  if (gap <= 0) {
    return { estado, aumentou: false, usouFreeze: false, quebrou: false };
  }

  // dia seguinte: o streak cresce
  if (gap === 1) {
    const dias = estado.dias + 1;
    return {
      estado: { ...estado, dias, ultimoDia: hoje, maior: Math.max(estado.maior, dias) },
      aumentou: true,
      usouFreeze: false,
      quebrou: false,
    };
  }

  // exatamente um dia perdido, e há freeze: cobre o buraco e continua
  if (gap === 2 && estado.freezes > 0) {
    const dias = estado.dias + 1;
    return {
      estado: {
        ...estado,
        dias,
        ultimoDia: hoje,
        freezes: estado.freezes - 1,
        maior: Math.max(estado.maior, dias),
      },
      aumentou: true,
      usouFreeze: true,
      quebrou: false,
    };
  }

  // buraco grande (ou sem freeze): reinicia
  return {
    estado: { ...estado, dias: 1, ultimoDia: hoje },
    aumentou: false,
    usouFreeze: false,
    quebrou: true,
  };
}
