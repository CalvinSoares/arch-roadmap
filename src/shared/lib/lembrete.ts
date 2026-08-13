/**
 * Quem merece um lembrete de streak — a decisão em função **pura**.
 *
 * O lembrete é a alavanca de retorno, mas "reter com respeito": só quem **optou**
 * por receber (opt-out sempre disponível), só quem tem um streak em risco de
 * verdade, e uma vez por dia. Nada de culpa manipuladora ou spam — engajamento
 * saudável dura mais que o predatório.
 *
 * `hoje` entra por parâmetro (ISO YYYY-MM-DD), nunca `new Date()`, pra spec ser
 * estável no tempo.
 */

const MS_DIA = 86_400_000;

function diferencaDias(de: string, ate: string): number {
  return Math.round(
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / MS_DIA
  );
}

export interface EntradaLembrete {
  ultimoDiaAtivo: string | null;
  hoje: string;
  streakDias: number;
  lembretesEmail: boolean;
}

/**
 * Lembra quando: opt-in ligado, existe um streak (≥1) e a pessoa esteve ativa
 * **ontem** mas ainda não hoje (gap de exatamente 1). Antes disso não há o que
 * lembrar; depois disso o streak já quebrou (ou vai quebrar) e o lembrete vira
 * cobrança — não mandamos.
 */
export function deveLembrar(e: EntradaLembrete): boolean {
  if (!e.lembretesEmail) return false;
  if (e.streakDias < 1) return false;
  if (!e.ultimoDiaAtivo) return false;
  return diferencaDias(e.ultimoDiaAtivo, e.hoje) === 1;
}
