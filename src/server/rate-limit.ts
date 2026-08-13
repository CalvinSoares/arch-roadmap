import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Rate limiting (Upstash Redis) — barra farm de XP e abuso de login/registro.
 *
 * É o **token bucket / sliding window** que o próprio catálogo ensina, agora em
 * produção. Roda só no servidor (importa `next/headers`); nunca use do cliente.
 *
 * **Degradação graciosa:** sem `UPSTASH_REDIS_REST_URL`/`_TOKEN` no ambiente, os
 * limitadores viram no-op (deixam passar) e avisamos uma vez no log. Assim o
 * código compila e roda em dev/CI sem o serviço — e passa a proteger de verdade
 * assim que o `.env` estiver preenchido (fail-open é aceitável na Fase 0; o
 * endurecimento para fail-closed em produção fica documentado abaixo).
 */

const configurado = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = configurado ? Redis.fromEnv() : null;

let avisou = false;
function avisarUmaVez() {
  if (avisou) return;
  avisou = true;
  console.warn(
    "[rate-limit] Upstash não configurado — limitadores em no-op. " +
      "Defina UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN para ativar."
  );
}

/** `analytics: false` para não gastar comandos extras do Redis no free tier. */
function criar(limiter: ReturnType<typeof Ratelimit.slidingWindow>, prefixo: string) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter, analytics: false, prefix: prefixo });
}

/**
 * Limitadores por caso de uso. Sliding window serverless:
 * - `login`   — 5 tentativas / 10 min por IP (freia brute force).
 * - `registro`— 3 contas / 1 h por IP (freia criação em massa).
 * - `escrita` — 30 escritas / 10 s por usuário (freia farm de XP e duplo clique).
 */
export const limitadores = {
  login: criar(Ratelimit.slidingWindow(5, "10 m"), "rl:login"),
  registro: criar(Ratelimit.slidingWindow(3, "1 h"), "rl:registro"),
  escrita: criar(Ratelimit.slidingWindow(30, "10 s"), "rl:escrita"),
} as const;

export type Limitador = (typeof limitadores)[keyof typeof limitadores];

export interface ResultadoLimite {
  /** Passou (ou não há limitador configurado). */
  sucesso: boolean;
  /** Requisições restantes na janela. `Infinity` quando em no-op. */
  restante: number;
  /** Epoch ms em que a janela zera. `0` quando em no-op. */
  reset: number;
}

/**
 * Aplica um limitador a um identificador. Deixa passar quando o Upstash não
 * está configurado (no-op), para o código rodar sem o serviço.
 */
export async function limitar(
  limitador: Limitador,
  id: string
): Promise<ResultadoLimite> {
  if (!limitador) {
    avisarUmaVez();
    return { sucesso: true, restante: Infinity, reset: 0 };
  }
  const r = await limitador.limit(id);
  return { sucesso: r.success, restante: r.remaining, reset: r.reset };
}

/**
 * IP de melhor esforço a partir dos cabeçalhos do pedido. Em plataformas de
 * borda (Vercel), `x-forwarded-for` traz a cadeia; o primeiro é o cliente.
 * Cai para `"anon"` quando não há como saber — um balde compartilhado, o que só
 * torna o limite *mais* restritivo, nunca menos.
 */
export async function ipDoPedido(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "anon";
}
