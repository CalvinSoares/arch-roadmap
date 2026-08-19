import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  users,
  userStats,
  xpEvents,
  missaoProgresso,
  userConquistas,
} from "@/server/db/schema";
import { progressoNivel, type ProgressoNivel } from "@/shared/lib/gamificacao/xp";
import { missoesDoDia } from "@/shared/lib/gamificacao/missoes";
import { acharConquista } from "@/shared/lib/gamificacao/conquistas";
import { hojeDoUsuario } from "@/server/gamificacao/conceder-xp";

/**
 * Leitura da projeção pra página de perfil (read model). Só consulta, nunca
 * escreve; a fonte da verdade continua no ledger.
 */

export interface EventoHistorico {
  tipo: string;
  quantia: number;
  origemRef: string;
  criadoEm: Date;
}

export interface MissaoDoDia {
  id: string;
  titulo: string;
  descricao: string;
  meta: number;
  xpRecompensa: number;
  progresso: number;
  concluida: boolean;
}

export interface ResumoUsuario {
  xpTotal: number;
  nivel: number;
  streakDias: number;
  maiorStreak: number;
  freezes: number;
  progresso: ProgressoNivel;
  historico: EventoHistorico[];
  missoes: MissaoDoDia[];
  conquistas: ConquistaGanha[];
  /** `@handle` público, ou null se ainda não definido. */
  handle: string | null;
  /** Perfil visível publicamente (opt-in). */
  perfilPublico: boolean;
  /** Recebe e-mails de lembrete (opt-out). */
  lembretesEmail: boolean;
}

export async function resumoDoUsuario(userId: string): Promise<ResumoUsuario> {
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId));

  const [u] = await db
    .select({
      tz: users.timezone,
      handle: users.handle,
      perfilPublico: users.perfilPublico,
      lembretesEmail: users.lembretesEmail,
    })
    .from(users)
    .where(eq(users.id, userId));

  const historico = await db
    .select({
      tipo: xpEvents.tipo,
      quantia: xpEvents.quantia,
      origemRef: xpEvents.origemRef,
      criadoEm: xpEvents.criadoEm,
    })
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
    .orderBy(desc(xpEvents.criadoEm))
    .limit(20);

  const hoje = hojeDoUsuario(u?.tz ?? null);
  const progMiss = await db
    .select({
      missaoId: missaoProgresso.missaoId,
      progresso: missaoProgresso.progresso,
      concluida: missaoProgresso.concluida,
    })
    .from(missaoProgresso)
    .where(
      and(eq(missaoProgresso.userId, userId), eq(missaoProgresso.dia, hoje))
    );
  const porMissao = new Map(progMiss.map((r) => [r.missaoId, r]));

  const ganhas = await db
    .select({
      chave: userConquistas.conquistaChave,
      ganhoEm: userConquistas.ganhoEm,
    })
    .from(userConquistas)
    .where(eq(userConquistas.userId, userId))
    .orderBy(desc(userConquistas.ganhoEm));
  const conquistas: ConquistaGanha[] = ganhas.flatMap((g) => {
    const def = acharConquista(g.chave);
    return def
      ? [{ chave: g.chave, titulo: def.titulo, descricao: def.descricao, ganhoEm: g.ganhoEm }]
      : [];
  });

  const missoes: MissaoDoDia[] = missoesDoDia(hoje).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descricao: m.descricao,
    meta: m.meta,
    xpRecompensa: m.xpRecompensa,
    progresso: porMissao.get(m.id)?.progresso ?? 0,
    concluida: porMissao.get(m.id)?.concluida ?? false,
  }));

  const xpTotal = stats?.xpTotal ?? 0;
  return {
    xpTotal,
    nivel: stats?.nivel ?? 1,
    streakDias: stats?.streakDias ?? 0,
    maiorStreak: stats?.maiorStreak ?? 0,
    freezes: stats?.freezes ?? 0,
    progresso: progressoNivel(xpTotal),
    historico,
    missoes,
    conquistas,
    handle: u?.handle ?? null,
    perfilPublico: u?.perfilPublico ?? false,
    lembretesEmail: u?.lembretesEmail ?? true,
  };
}

export interface ConquistaGanha {
  chave: string;
  titulo: string;
  descricao: string;
  ganhoEm: Date;
}

export interface PerfilPublico {
  handle: string;
  nome: string | null;
  imagem: string | null;
  nivel: number;
  xpTotal: number;
  streakDias: number;
  maiorStreak: number;
  conquistas: ConquistaGanha[];
}

/**
 * Perfil público por handle. Só devolve algo se o usuário optou por ser
 * público (LGPD: perfil é opt-in); caso contrário `null` e a página responde
 * 404 sem revelar que a conta existe.
 */
export async function perfilPublicoPorHandle(
  handle: string
): Promise<PerfilPublico | null> {
  const [u] = await db
    .select({
      id: users.id,
      handle: users.handle,
      nome: users.name,
      imagem: users.image,
      perfilPublico: users.perfilPublico,
      banido: users.banido,
      shadowBan: users.shadowBan,
    })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);

  // Banido ou shadow-banido não aparece para os outros (404, sem revelar nada).
  if (!u || !u.perfilPublico || !u.handle || u.banido || u.shadowBan) {
    return null;
  }

  const [stats] = await db
    .select({
      nivel: userStats.nivel,
      xpTotal: userStats.xpTotal,
      streakDias: userStats.streakDias,
      maiorStreak: userStats.maiorStreak,
    })
    .from(userStats)
    .where(eq(userStats.userId, u.id));

  const ganhas = await db
    .select({
      chave: userConquistas.conquistaChave,
      ganhoEm: userConquistas.ganhoEm,
    })
    .from(userConquistas)
    .where(eq(userConquistas.userId, u.id))
    .orderBy(desc(userConquistas.ganhoEm));

  const conquistas: ConquistaGanha[] = ganhas.flatMap((g) => {
    const def = acharConquista(g.chave);
    return def
      ? [
          {
            chave: g.chave,
            titulo: def.titulo,
            descricao: def.descricao,
            ganhoEm: g.ganhoEm,
          },
        ]
      : [];
  });

  return {
    handle: u.handle,
    nome: u.nome,
    imagem: u.imagem,
    nivel: stats?.nivel ?? 1,
    xpTotal: stats?.xpTotal ?? 0,
    streakDias: stats?.streakDias ?? 0,
    maiorStreak: stats?.maiorStreak ?? 0,
    conquistas,
  };
}
