import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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

/** Exige login; manda para a tela de entrada se não houver sessão. */
export async function requireUser() {
  const s = await getSessao();
  if (!s?.user) redirect("/entrar");
  return s.user;
}

/** Exige papel admin (RBAC); barra quem não for. */
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
