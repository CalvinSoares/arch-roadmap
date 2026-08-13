import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * Data Access Layer da autenticação — o padrão que o próprio guia do Next 16
 * recomenda no lugar de checar auth no middleware/proxy: verificar perto do
 * dado. `cache` memoiza a sessão por render, evitando reler o cookie N vezes.
 */
export const getSessao = cache(async () => auth());

/** A sessão do usuário logado, ou null. Não redireciona. */
export async function getUsuario() {
  const s = await getSessao();
  return s?.user ?? null;
}

export type UsuarioAtivo = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: "user" | "moderator" | "admin";
};

/**
 * Sessão + revalidação no banco de `banido` e `role`.
 * Impede admin demovido / banido de continuar escrevendo com JWT velho.
 */
export async function requireUsuarioAtivo(): Promise<UsuarioAtivo | null> {
  const u = await getUsuario();
  if (!u?.id) return null;

  const [row] = await db
    .select({ banido: users.banido, role: users.role })
    .from(users)
    .where(eq(users.id, u.id))
    .limit(1);

  if (!row || row.banido) return null;

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    image: u.image,
    role: row.role,
  };
}

/** Exige login; manda para a tela de entrada se não houver sessão. */
export async function requireUser() {
  const s = await getSessao();
  if (!s?.user) redirect("/entrar");
  const ativo = await requireUsuarioAtivo();
  if (!ativo) redirect("/entrar");
  return ativo;
}

/** Exige papel admin (RBAC) **lido do banco**, não só do JWT. */
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
