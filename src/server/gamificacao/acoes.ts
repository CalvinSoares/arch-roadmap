"use server";

import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import { users, quizTentativas, progresso } from "@/server/db/schema";
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

/**
 * Ações de gamificação — a **fronteira confiável**. O cliente reporta a ação;
 * aqui o servidor valida, grava e **concede** o XP (nunca o cliente diz quanto
 * ganhou). Cada concessão é idempotente pela `origem_ref` no ledger.
 *
 * Como o driver HTTP da Neon não faz transação interativa, as escritas são
 * sequenciais; a projeção (`user_stats`) é reconstruível, então uma falha no
 * meio no máximo adia a atualização da projeção — o ledger, que é a verdade,
 * fica consistente.
 */

const STATUS_VALIDOS: readonly ProgressoNo[] = [
  "pending",
  "done",
  "in-progress",
  "skipped",
];

async function fusoDoUsuario(userId: string): Promise<string | null> {
  const [u] = await db
    .select({ tz: users.timezone })
    .from(users)
    .where(eq(users.id, userId));
  return u?.tz ?? null;
}

/**
 * Marca "esteve ativo hoje": concede o bônus da primeira atividade do dia (uma
 * vez por dia, idempotente) e atualiza o streak. Chamado quando uma ação nova
 * de verdade acontece (resposta inédita, nó recém-concluído).
 */
async function creditarAtividade(userId: string, hoje: string): Promise<void> {
  // Bônus só na primeira do dia — a chave por (usuário, dia) garante uma vez.
  await concederXp({
    userId,
    tipo: "bonusPrimeiraDoDia",
    quantia: XP.bonusPrimeiraDoDia,
    origemRef: `bonus-dia:${userId}:${hoje}`,
  });
  await registrarDiaAtivo(userId, hoje);
}

export interface ResultadoAcao {
  ok: boolean;
  /** XP concedido nesta chamada (0 em repetição idempotente). */
  xp?: number;
  /** Nível atual após a ação. */
  nivel?: number;
  /** A ação fez o usuário subir de nível (dispara a celebração no cliente). */
  subiuNivel?: boolean;
  erro?: string;
}

/**
 * Registra uma resposta do quiz. `tentativaId` é um uuid gerado no cliente por
 * resposta — chave de idempotência: o mesmo envio (retry de rede) não conta duas
 * vezes, mas respostas distintas contam cada uma.
 */
export async function registrarAcertoQuiz(entrada: {
  tentativaId: string;
  conceitoSlug: string;
  acertou: boolean;
  formato?: string;
}): Promise<ResultadoAcao> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "sem sessão" };

  const tentativaId = String(entrada.tentativaId ?? "").trim();
  const conceitoSlug = String(entrada.conceitoSlug ?? "").trim();
  if (!tentativaId || !conceitoSlug) return { ok: false, erro: "dados inválidos" };

  const lim = await limitar(limitadores.escrita, `quiz:${u.id}`);
  if (!lim.sucesso) return { ok: false, erro: "muitas tentativas" };

  const acertou = Boolean(entrada.acertou);

  // A tentativa é o registro-âncora. Se já existe (mesmo id), é repetição:
  // não recredita nada.
  const inseridos = await db
    .insert(quizTentativas)
    .values({
      id: tentativaId,
      userId: u.id,
      conceitoSlug,
      acertou,
      formato: entrada.formato ?? null,
    })
    .onConflictDoNothing({ target: quizTentativas.id })
    .returning({ id: quizTentativas.id });

  if (inseridos.length === 0) return { ok: true, xp: 0 }; // idempotente

  const hoje = hojeDoUsuario(await fusoDoUsuario(u.id));
  await creditarAtividade(u.id, hoje);

  let xp = 0;
  if (acertou) {
    const r = await concederXp({
      userId: u.id,
      tipo: "quizAcerto",
      quantia: XP.quizAcerto,
      origemRef: `quiz:${tentativaId}`,
    });
    xp += r.xp;
    await avancarMissoesDoDia(u.id, hoje, "quizAcerto", 1);
  }
  await avancarMissoesDoDia(u.id, hoje, "quizResposta", 1);

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
 * Grava o progresso de um nó de roadmap na conta (write-through) e, quando o nó
 * é **concluído**, concede o XP correspondente — uma única vez por nó (a
 * `origem_ref` "no:<slug>:<id>" não paga de novo ao alternar concluído/pendente,
 * o que também fecha a porta pro farm por duplo-clique).
 */
export async function definirProgresso(entrada: {
  roadmapSlug: string;
  noId: string;
  status: ProgressoNo;
}): Promise<ResultadoAcao> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "sem sessão" };

  const roadmapSlug = String(entrada.roadmapSlug ?? "").trim();
  const noId = String(entrada.noId ?? "").trim();
  const status = entrada.status;
  if (!roadmapSlug || !noId || !STATUS_VALIDOS.includes(status)) {
    return { ok: false, erro: "dados inválidos" };
  }

  const lim = await limitar(limitadores.escrita, `progresso:${u.id}`);
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

  // Só credita atividade/missão numa conclusão inédita (não em re-toggle).
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
