import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  users,
  userStats,
  xpEvents,
  denuncias,
  temporadas,
} from "@/server/db/schema";

/**
 * Consultas do painel admin (read-only). Números para o dashboard, lista de
 * usuários, fila de moderação e o relatório de anomalia de XP (anti-cheat).
 */

export interface MetricasAdmin {
  totalUsuarios: number;
  banidos: number;
  ativosHoje: number;
  eventosXp: number;
  denunciasAbertas: number;
  temporadaAtiva: boolean;
}

/** ISO YYYY-MM-DD de hoje em UTC (métrica agregada, não por usuário). */
function hojeUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function metricasAdmin(): Promise<MetricasAdmin> {
  const [tot] = await db.select({ n: count() }).from(users);
  const [ban] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.banido, true));
  const [ativos] = await db
    .select({ n: count() })
    .from(userStats)
    .where(eq(userStats.ultimoDiaAtivo, hojeUTC()));
  const [ev] = await db.select({ n: count() }).from(xpEvents);
  const [den] = await db
    .select({ n: count() })
    .from(denuncias)
    .where(eq(denuncias.status, "aberta"));
  const [temp] = await db
    .select({ id: temporadas.id })
    .from(temporadas)
    .where(eq(temporadas.ativa, true))
    .limit(1);

  return {
    totalUsuarios: Number(tot?.n ?? 0),
    banidos: Number(ban?.n ?? 0),
    ativosHoje: Number(ativos?.n ?? 0),
    eventosXp: Number(ev?.n ?? 0),
    denunciasAbertas: Number(den?.n ?? 0),
    temporadaAtiva: Boolean(temp),
  };
}

export interface UsuarioAdmin {
  id: string;
  nome: string | null;
  email: string;
  handle: string | null;
  role: "user" | "moderator" | "admin";
  banido: boolean;
  shadowBan: boolean;
  xpTotal: number;
}

export async function listarUsuarios(limite = 100): Promise<UsuarioAdmin[]> {
  const linhas = await db
    .select({
      id: users.id,
      nome: users.name,
      email: users.email,
      handle: users.handle,
      role: users.role,
      banido: users.banido,
      shadowBan: users.shadowBan,
      xpTotal: userStats.xpTotal,
    })
    .from(users)
    .leftJoin(userStats, eq(userStats.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(limite);

  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    email: l.email,
    handle: l.handle,
    role: l.role,
    banido: l.banido,
    shadowBan: l.shadowBan,
    xpTotal: l.xpTotal ?? 0,
  }));
}

export interface DenunciaAdmin {
  id: string;
  motivo: string;
  criadoEm: Date;
  alvoId: string;
  alvoHandle: string | null;
  autorId: string;
  autorHandle: string | null;
}

export async function denunciasAbertas(): Promise<DenunciaAdmin[]> {
  const alvo = db.select().from(users).as("alvo");
  const autor = db.select().from(users).as("autor");
  const linhas = await db
    .select({
      id: denuncias.id,
      motivo: denuncias.motivo,
      criadoEm: denuncias.criadoEm,
      alvoId: denuncias.alvoUserId,
      alvoHandle: alvo.handle,
      autorId: denuncias.autorId,
      autorHandle: autor.handle,
    })
    .from(denuncias)
    .leftJoin(alvo, eq(alvo.id, denuncias.alvoUserId))
    .leftJoin(autor, eq(autor.id, denuncias.autorId))
    .where(eq(denuncias.status, "aberta"))
    .orderBy(desc(denuncias.criadoEm));

  return linhas.map((l) => ({
    id: l.id,
    motivo: l.motivo,
    criadoEm: l.criadoEm,
    alvoId: l.alvoId,
    alvoHandle: l.alvoHandle,
    autorId: l.autorId,
    autorHandle: l.autorHandle,
  }));
}

export interface AnomaliaXp {
  userId: string;
  handle: string | null;
  email: string;
  eventosUltimaHora: number;
}

/**
 * Anti-cheat: usuários com muitos eventos de XP na última hora, sinal de
 * farm/automação pro admin investigar. `LIMIAR` é conservador; o ledger
 * idempotente já barra duplicatas, então volume alto legítimo é raro.
 */
const LIMIAR_EVENTOS_HORA = 60;

export async function anomaliaXp(): Promise<AnomaliaXp[]> {
  const linhas = await db
    .select({
      userId: xpEvents.userId,
      handle: users.handle,
      email: users.email,
      n: count(),
    })
    .from(xpEvents)
    .innerJoin(users, eq(users.id, xpEvents.userId))
    .where(sql`${xpEvents.criadoEm} > now() - interval '1 hour'`)
    .groupBy(xpEvents.userId, users.handle, users.email)
    .having(sql`count(*) > ${LIMIAR_EVENTOS_HORA}`)
    .orderBy(desc(count()))
    .limit(20);

  return linhas.map((l) => ({
    userId: l.userId,
    handle: l.handle,
    email: l.email,
    eventosUltimaHora: Number(l.n),
  }));
}
