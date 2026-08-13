"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { hashSenha } from "@/server/auth/senha";
import { limitadores, limitar, ipDoPedido } from "@/server/rate-limit";

export interface EstadoRegistro {
  erro?: string;
}

/**
 * Cria uma conta por email/senha (hash argon2id). O Auth.js/Credentials só
 * *verifica* a senha; criar o usuário é responsabilidade nossa (é o preço de
 * ter email/senha em vez de só OAuth). Em sucesso, manda pra tela de entrada.
 */
export async function registrar(
  _estado: EstadoRegistro,
  form: FormData
): Promise<EstadoRegistro> {
  const nome = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const senha = String(form.get("password") ?? "");

  // Rate limit: freia criação de contas em massa a partir de um mesmo IP.
  const lim = await limitar(limitadores.registro, `registro:${await ipDoPedido()}`);
  if (!lim.sucesso) {
    return { erro: "Muitas tentativas. Espere alguns minutos e tente de novo." };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { erro: "E-mail inválido." };
  }
  if (senha.length < 8) {
    return { erro: "A senha precisa de ao menos 8 caracteres." };
  }

  const [existente] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existente) {
    return { erro: "Já existe uma conta com esse e-mail." };
  }

  await db.insert(users).values({
    name: nome || null,
    email,
    hashedPassword: await hashSenha(senha),
  });

  redirect("/entrar?registrado=1");
}
