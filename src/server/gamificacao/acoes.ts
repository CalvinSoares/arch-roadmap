"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { requireUsuarioAtivo } from "@/server/auth/dal";
import { db } from "@/server/db";
import { users, quizTentativas, progresso, xpEvents } from "@/server/db/schema";
import { limitadores, limitar } from "@/server/rate-limit";
import { XP } from "@/shared/lib/gamificacao/xp";
import type { ProgressoNo } from "@/shared/types/roadmap";
import {
  concederXp,
  reprojetarXp,
  registrarDiaAtivo,
  hojeDoUsuario,
} from "@/server/gamificacao/conceder-xp";
import { avancarMissoesDoDia } from "@/server/gamificacao/missoes";
import { avaliarConquistas } from "@/server/gamificacao/conquistas";
import {
  conceitoValidoParaQuiz,
  ehUuid,
  noExisteNoRoadmap,
  statusProgressoValido,
  TETO_QUIZ_ACERTO_DIA,
} from "@/server/gamificacao/validacao";
import {
  avaliarProvaRespostaQuiz,
  type ProvaRespostaQuiz,
} from "@/shared/lib/quiz/avaliar-prova";

/**
 * Ações de gamificação. O servidor valida tudo aqui e decide quanto XP pagar;
 * o cliente só reporta a ação. Cada concessão é idempotente por
 * `(user_id, origem_ref)`.
 */

async function fusoDoUsuario(userId: string): Promise<string | null> {
  const [u] = await db
    .select({ tz: users.timezone })
    .from(users)
    .where(eq(users.id, userId));
  return u?.tz ?? null;
}

async function creditarAtividade(userId: string, hoje: string): Promise<void> {
  await concederXp({
    userId,
    tipo: "bonusPrimeiraDoDia",
    quantia: XP.bonusPrimeiraDoDia,
    origemRef: `bonus-dia:${userId}:${hoje}`,
  });
  await registrarDiaAtivo(userId, hoje);
}

async function quizAcertosHoje(userId: string, hoje: string): Promise<number> {
  const inicio = new Date(`${hoje}T00:00:00.000Z`);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.userId, userId),
        eq(xpEvents.tipo, "quizAcerto"),
        gte(xpEvents.criadoEm, inicio)
      )
    );
  return Number(row?.n ?? 0);
}

export interface ResultadoAcao {
  ok: boolean;
  xp?: number;
  nivel?: number;
  subiuNivel?: boolean;
  erro?: string;
}

/**
 * Registra uma resposta do quiz.
 *
 * O cliente manda contexto + resposta; o servidor regenera o gabarito, decide
 * `acertou` e só então paga XP (checando UUID, rate limit, teto diário e
 * conceito real no catálogo). O boolean do cliente não entra na conta.
 */
export async function registrarAcertoQuiz(entrada: {
  tentativaId: string;
  prova: ProvaRespostaQuiz;
}): Promise<ResultadoAcao> {
  const u = await requireUsuarioAtivo();
  if (!u) return { ok: false, erro: "sem sessão" };

  const tentativaId = String(entrada.tentativaId ?? "").trim();
  if (!ehUuid(tentativaId)) return { ok: false, erro: "dados inválidos" };

  const veredito = avaliarProvaRespostaQuiz(entrada.prova);
  if (!veredito.valido) return { ok: false, erro: "dados inválidos" };

  // XP de quiz só para verbetes reais (checkpoint/revisão: ledger sem XP).
  const pagaXp = conceitoValidoParaQuiz(veredito.conceitoSlug);

  const lim = await limitar(limitadores.escrita, `quiz:${u.id}`, "escrita");
  if (!lim.sucesso) return { ok: false, erro: "muitas tentativas" };

  const acertou = veredito.acertou;
  const conceitoSlug = veredito.conceitoSlug;

  const inseridos = await db
    .insert(quizTentativas)
    .values({
      id: tentativaId,
      userId: u.id,
      conceitoSlug,
      acertou,
      formato: veredito.formato ?? null,
    })
    .onConflictDoNothing({ target: quizTentativas.id })
    .returning({ id: quizTentativas.id });

  if (inseridos.length === 0) return { ok: true, xp: 0 };

  const hoje = hojeDoUsuario(await fusoDoUsuario(u.id));
  await creditarAtividade(u.id, hoje);

  let xp = 0;
  if (acertou && pagaXp) {
    const jaHoje = await quizAcertosHoje(u.id, hoje);
    if (jaHoje < TETO_QUIZ_ACERTO_DIA) {
      const r = await concederXp({
        userId: u.id,
        tipo: "quizAcerto",
        quantia: XP.quizAcerto,
        origemRef: `quiz:${tentativaId}`,
      });
      xp += r.xp;
      if (r.concedido) {
        await avancarMissoesDoDia(u.id, hoje, "quizAcerto", 1);
      }
    }
  }
  if (pagaXp) {
    await avancarMissoesDoDia(u.id, hoje, "quizResposta", 1);
  }

  const proj = await reprojetarXp(u.id);
  await avaliarConquistas(u.id);
  return {
    ok: true,
    xp,
    nivel: proj.nivel,
    subiuNivel: proj.nivel > proj.nivelAnterior,
  };
}

/**
 * Grava progresso e, se `done`, concede XP (só se o nó existir no roadmap).
 */
export async function definirProgresso(entrada: {
  roadmapSlug: string;
  noId: string;
  status: ProgressoNo;
}): Promise<ResultadoAcao> {
  const u = await requireUsuarioAtivo();
  if (!u) return { ok: false, erro: "sem sessão" };

  const roadmapSlug = String(entrada.roadmapSlug ?? "").trim();
  const noId = String(entrada.noId ?? "").trim();
  const status = entrada.status;
  if (
    !roadmapSlug ||
    !noId ||
    !statusProgressoValido(status) ||
    !noExisteNoRoadmap(roadmapSlug, noId)
  ) {
    return { ok: false, erro: "dados inválidos" };
  }

  const lim = await limitar(
    limitadores.escrita,
    `progresso:${u.id}`,
    "escrita"
  );
  if (!lim.sucesso) return { ok: false, erro: "muitas tentativas" };

  await db
    .insert(progresso)
    .values({ userId: u.id, noId, status })
    .onConflictDoUpdate({
      target: [progresso.userId, progresso.noId],
      set: { status, atualizadoEm: sql`now()` },
    });

  if (status !== "done") return { ok: true, xp: 0 };

  const r = await concederXp({
    userId: u.id,
    tipo: "noConcluido",
    quantia: XP.noConcluido,
    origemRef: `no:${roadmapSlug}:${noId}`,
  });

  if (r.concedido) {
    const hoje = hojeDoUsuario(await fusoDoUsuario(u.id));
    await creditarAtividade(u.id, hoje);
    await avancarMissoesDoDia(u.id, hoje, "noConcluido", 1);
    const proj = await reprojetarXp(u.id);
    await avaliarConquistas(u.id);
    return {
      ok: true,
      xp: r.xp,
      nivel: proj.nivel,
      subiuNivel: proj.nivel > proj.nivelAnterior,
    };
  }

  return { ok: true, xp: r.xp };
}
