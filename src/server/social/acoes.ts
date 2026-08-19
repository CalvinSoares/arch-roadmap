"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import { users, amizades, denuncias } from "@/server/db/schema";
import { limitadores, limitar } from "@/server/rate-limit";
import { normalizarHandle } from "@/shared/lib/handle";

/**
 * Ações sociais: seguir/aceitar/remover + moderação (bloquear/denunciar).
 * Amizade é modelada como duas linhas direcionadas em `accepted`; um bloqueio
 * mora do lado de quem bloqueou e derruba a amizade do outro lado.
 */

export interface ResultadoSocial {
  ok: boolean;
  erro?: string;
}

async function limitarUsuario(userId: string): Promise<boolean> {
  const lim = await limitar(limitadores.escrita, `social:${userId}`);
  return lim.sucesso;
}

/** Verdadeiro se qualquer um dos dois bloqueou o outro. */
async function haBloqueio(a: string, b: string): Promise<boolean> {
  const linhas = await db
    .select({ userId: amizades.userId })
    .from(amizades)
    .where(
      and(
        eq(amizades.status, "blocked"),
        or(
          and(eq(amizades.userId, a), eq(amizades.amigoId, b)),
          and(eq(amizades.userId, b), eq(amizades.amigoId, a))
        )
      )
    );
  return linhas.length > 0;
}

/** Envia um convite de amizade para um `@handle`. */
export async function enviarConvite(
  handleAlvo: string
): Promise<ResultadoSocial> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };
  if (!(await limitarUsuario(u.id))) return { ok: false, erro: "Muitas tentativas." };

  const handle = normalizarHandle(handleAlvo);
  const [alvo] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);
  if (!alvo) return { ok: false, erro: "Não achei ninguém com esse @handle." };
  if (alvo.id === u.id) return { ok: false, erro: "Você não pode se adicionar." };
  if (await haBloqueio(u.id, alvo.id)) {
    return { ok: false, erro: "Não é possível adicionar este usuário." };
  }

  await db
    .insert(amizades)
    .values({ userId: u.id, amigoId: alvo.id, status: "pending" })
    .onConflictDoNothing({
      target: [amizades.userId, amizades.amigoId],
    });

  revalidatePath("/amigos");
  return { ok: true };
}

/** Aceita um convite pendente vindo de `origemId`. */
export async function aceitarConvite(
  origemId: string
): Promise<ResultadoSocial> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };
  if (!(await limitarUsuario(u.id))) return { ok: false, erro: "Muitas tentativas." };

  const [conv] = await db
    .select({ userId: amizades.userId })
    .from(amizades)
    .where(
      and(
        eq(amizades.userId, origemId),
        eq(amizades.amigoId, u.id),
        eq(amizades.status, "pending")
      )
    )
    .limit(1);
  if (!conv) return { ok: false, erro: "Convite não encontrado." };

  await db
    .update(amizades)
    .set({ status: "accepted" })
    .where(and(eq(amizades.userId, origemId), eq(amizades.amigoId, u.id)));

  // lado recíproco
  await db
    .insert(amizades)
    .values({ userId: u.id, amigoId: origemId, status: "accepted" })
    .onConflictDoUpdate({
      target: [amizades.userId, amizades.amigoId],
      set: { status: "accepted" },
    });

  revalidatePath("/amigos");
  return { ok: true };
}

/** Desfaz a amizade (ou recusa um convite) nos dois sentidos. */
export async function removerAmizade(outroId: string): Promise<ResultadoSocial> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };

  await db
    .delete(amizades)
    .where(
      or(
        and(eq(amizades.userId, u.id), eq(amizades.amigoId, outroId)),
        and(eq(amizades.userId, outroId), eq(amizades.amigoId, u.id))
      )
    );

  revalidatePath("/amigos");
  return { ok: true };
}

/** Bloqueia um usuário: remove o lado dele e marca o meu como `blocked`. */
export async function bloquear(outroId: string): Promise<ResultadoSocial> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };
  if (outroId === u.id) return { ok: false, erro: "Não dá pra bloquear você mesmo." };

  await db
    .delete(amizades)
    .where(and(eq(amizades.userId, outroId), eq(amizades.amigoId, u.id)));

  await db
    .insert(amizades)
    .values({ userId: u.id, amigoId: outroId, status: "blocked" })
    .onConflictDoUpdate({
      target: [amizades.userId, amizades.amigoId],
      set: { status: "blocked" },
    });

  revalidatePath("/amigos");
  return { ok: true };
}

/** Registra uma denúncia para a moderação (Fase 3 resolve). */
export async function denunciar(
  alvoId: string,
  motivo: string
): Promise<ResultadoSocial> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };
  if (!(await limitarUsuario(u.id))) return { ok: false, erro: "Muitas tentativas." };

  const texto = motivo.trim().slice(0, 500);
  if (texto.length < 3) return { ok: false, erro: "Descreva o motivo." };

  await db.insert(denuncias).values({
    alvoUserId: alvoId,
    autorId: u.id,
    motivo: texto,
  });

  return { ok: true };
}
