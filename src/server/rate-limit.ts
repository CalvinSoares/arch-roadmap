/**
 * Rate limiting (Upstash Redis) — barra farm de XP e abuso de login/registro.
 *
 * Sem Upstash:
 * - **escrita** (XP/progresso) em produção → fail-closed
 * - **auth** (login/registro) → fail-open com aviso (não trava o site inteiro)
 * - dev/CI → fail-open
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const configurado = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = configurado ? Redis.fromEnv() : null;
const emProducao = process.env.NODE_ENV === "production";

let avisou = false;
function avisarUmaVez() {
  if (avisou) return;
  avisou = true;
  console.warn(
    "[rate-limit] Upstash não configurado. " +
      (emProducao
        ? "Em produção, escritas de gamificação ficam bloqueadas até definir UPSTASH_*."
        : "dev/CI: limitadores em no-op.")
  );
}

function criar(
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
  prefixo: string
) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter, analytics: false, prefix: prefixo });
}

export const limitadores = {
  login: criar(Ratelimit.slidingWindow(5, "10 m"), "rl:login"),
  registro: criar(Ratelimit.slidingWindow(3, "1 h"), "rl:registro"),
  escrita: criar(Ratelimit.slidingWindow(30, "10 s"), "rl:escrita"),
} as const;

export type Limitador = (typeof limitadores)[keyof typeof limitadores];

export interface ResultadoLimite {
  sucesso: boolean;
  restante: number;
  reset: number;
}

/**
 * @param classe `auth` = login/registro (fail-open sem Redis);
 *               `escrita` = XP/progresso (fail-closed em produção sem Redis).
 */
export async function limitar(
  limitador: Limitador,
  id: string,
  classe: "auth" | "escrita" = "escrita"
): Promise<ResultadoLimite> {
  if (!limitador) {
    avisarUmaVez();
    if (emProducao && classe === "escrita") {
      return { sucesso: false, restante: 0, reset: Date.now() + 60_000 };
    }
    return { sucesso: true, restante: Infinity, reset: 0 };
  }
  const r = await limitador.limit(id);
  return { sucesso: r.success, restante: r.remaining, reset: r.reset };
}

export async function ipDoPedido(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "anon";
}
