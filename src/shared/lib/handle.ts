/**
 * Regras de `@handle` — o identificador público opt-in. Função **pura**, para o
 * cliente e o servidor validarem com a mesma régua (e a spec fixar o contrato).
 *
 * Formato: 3–20 caracteres, `a–z`, `0–9` e `_`, começando por letra. Minúsculo
 * canônico (o handle é case-insensitive: "Calvin" e "calvin" são o mesmo).
 */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
const PADRAO = /^[a-z][a-z0-9_]{2,19}$/;

/** Normaliza para a forma canônica (minúsculo, sem espaços nas bordas). */
export function normalizarHandle(bruto: string): string {
  return bruto.trim().toLowerCase();
}

export function handleValido(bruto: string): boolean {
  return PADRAO.test(normalizarHandle(bruto));
}

/** Mensagem de erro amigável, ou `null` se o handle é válido. */
export function erroHandle(bruto: string): string | null {
  const h = normalizarHandle(bruto);
  if (h.length < HANDLE_MIN || h.length > HANDLE_MAX) {
    return `Use de ${HANDLE_MIN} a ${HANDLE_MAX} caracteres.`;
  }
  if (!/^[a-z]/.test(h)) return "Comece com uma letra.";
  if (!PADRAO.test(h)) return "Só letras minúsculas, números e _.";
  return null;
}
