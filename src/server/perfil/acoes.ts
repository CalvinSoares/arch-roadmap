"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUsuario } from "@/server/auth/dal";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { limitadores, limitar } from "@/server/rate-limit";
import { normalizarHandle, erroHandle } from "@/shared/lib/handle";

export interface ResultadoPerfil {
  ok: boolean;
  erro?: string;
}

/**
 * Define (ou troca) o `@handle` público do usuário. O handle é o endereço do
 * perfil público (`/u/<handle>`); único e case-insensitive. A unicidade tem
 * índice no banco — checamos antes para uma mensagem amigável, e o índice é a
 * garantia final contra a corrida de dois cadastros simultâneos.
 */
export async function definirHandle(bruto: string): Promise<ResultadoPerfil> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };

  const lim = await limitar(limitadores.escrita, `handle:${u.id}`);
  if (!lim.sucesso) return { ok: false, erro: "Muitas tentativas." };

  const handle = normalizarHandle(bruto);
  const problema = erroHandle(handle);
  if (problema) return { ok: false, erro: problema };

  const [ocupado] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.handle, handle), ne(users.id, u.id)))
    .limit(1);
  if (ocupado) return { ok: false, erro: "Esse handle já está em uso." };

  try {
    await db.update(users).set({ handle }).where(eq(users.id, u.id));
  } catch {
    // corrida perdida no índice único — outro pegou o handle no mesmo instante
    return { ok: false, erro: "Esse handle já está em uso." };
  }

  revalidatePath("/perfil");
  return { ok: true };
}

/**
 * Liga/desliga o perfil público (opt-in — LGPD). Sem handle não há endereço
 * público, então tornar público exige ter um handle antes.
 */
export async function alternarPerfilPublico(
  publico: boolean
): Promise<ResultadoPerfil> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };

  if (publico) {
    const [linha] = await db
      .select({ handle: users.handle })
      .from(users)
      .where(eq(users.id, u.id));
    if (!linha?.handle) {
      return { ok: false, erro: "Defina um @handle antes de ficar público." };
    }
  }

  await db
    .update(users)
    .set({ perfilPublico: publico })
    .where(eq(users.id, u.id));

  revalidatePath("/perfil");
  return { ok: true };
}

/** Liga/desliga os e-mails de lembrete de streak (opt-out — ética/LGPD). */
export async function alternarLembretes(
  ligado: boolean
): Promise<ResultadoPerfil> {
  const u = await getUsuario();
  if (!u) return { ok: false, erro: "Sem sessão." };

  await db
    .update(users)
    .set({ lembretesEmail: ligado })
    .where(eq(users.id, u.id));

  revalidatePath("/perfil");
  return { ok: true };
}
