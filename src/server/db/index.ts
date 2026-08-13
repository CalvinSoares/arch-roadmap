import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Cliente do banco (Neon serverless via HTTP).
 *
 * O driver HTTP é *stateless* e ideal para funções serverless (uma query por
 * invocação, sem pool a esgotar). Use sempre o endpoint **pooled** no
 * `DATABASE_URL`.
 *
 * Limitação a lembrar na Fase 1: o driver HTTP não faz transação interativa. O
 * award de XP (inserir no ledger + atualizar a projeção) ou vira uma única
 * instrução, ou usa o driver de Pool (WebSocket) do mesmo pacote — mas como a
 * projeção é reconstruível do ledger, dá pra viver sem transação por enquanto.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida — configure o .env.local (Neon, endpoint pooled).");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export { schema };
export type DB = typeof db;
