"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { users, denuncias } from "@/server/db/schema";
import { virarTemporada } from "@/server/gamificacao/temporada";

/**
 * Ações administrativas. Toda ação chama `requireAdmin` (que redireciona quem
 * não for admin), então a autorização é verificada perto do dado, não no
 * middleware. Também impede o admin de rebaixar ou banir a própria conta.
 */

export type Papel = "user" | "moderator" | "admin";
const PAPEIS: readonly Papel[] = ["user", "moderator", "admin"];

export interface ResultadoAdmin {
  ok: boolean;
  erro?: string;
}

export async function definirPapel(
  userId: string,
  papel: Papel
): Promise<ResultadoAdmin> {
  const admin = await requireAdmin();
  if (!PAPEIS.includes(papel)) return { ok: false, erro: "Papel inválido." };
  if (userId === admin.id && papel !== "admin") {
    return { ok: false, erro: "Você não pode rebaixar a própria conta." };
  }
  await db.update(users).set({ role: papel }).where(eq(users.id, userId));
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function definirBanido(
  userId: string,
  banido: boolean
): Promise<ResultadoAdmin> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { ok: false, erro: "Você não pode banir a própria conta." };
  }
  await db.update(users).set({ banido }).where(eq(users.id, userId));
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function definirShadowBan(
  userId: string,
  shadowBan: boolean
): Promise<ResultadoAdmin> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { ok: false, erro: "Não faz sentido shadow-banir a si mesmo." };
  }
  await db.update(users).set({ shadowBan }).where(eq(users.id, userId));
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function resolverDenuncia(
  id: string,
  status: "resolvida" | "descartada"
): Promise<ResultadoAdmin> {
  await requireAdmin();
  if (status !== "resolvida" && status !== "descartada") {
    return { ok: false, erro: "Status inválido." };
  }
  await db.update(denuncias).set({ status }).where(eq(denuncias.id, id));
  revalidatePath("/admin/denuncias");
  return { ok: true };
}

/** Força a virada de temporada manualmente (fora do cron). */
export async function forcarViradaTemporada(): Promise<ResultadoAdmin> {
  await requireAdmin();
  await virarTemporada();
  revalidatePath("/admin");
  return { ok: true };
}
