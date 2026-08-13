import NextAuth, { type NextAuthConfig } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users, accounts, sessions, verificationTokens } from "@/server/db/schema";
import { verificarSenha } from "@/server/auth/senha";
import { limitadores, limitar, ipDoPedido } from "@/server/rate-limit";

/**
 * Configuração central do Auth.js (NextAuth v5).
 *
 * Estratégia **jwt** de propósito: o provider Credentials (email/senha) não
 * convive com sessão de banco, então a sessão é um JWT em cookie httpOnly. O
 * adapter Drizzle ainda cuida de user/account/verificationToken (OAuth e magic
 * link). Roda só no Node (adapter + argon2), nunca no edge — por isso não há
 * middleware/proxy; a proteção de rota fica no DAL (server/auth/dal.ts).
 */
const providers: NextAuthConfig["providers"] = [
  GitHub,
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (creds) => {
      const email =
        typeof creds?.email === "string" ? creds.email.toLowerCase().trim() : "";
      const senha = typeof creds?.password === "string" ? creds.password : "";
      if (!email || !senha) return null;

      // Rate limit anti-brute-force: por IP e por e-mail alvo. Excedido → falha
      // como um login inválido (não vaza se a conta existe).
      const ip = await ipDoPedido();
      const [porIp, porEmail] = await Promise.all([
        limitar(limitadores.login, `login:ip:${ip}`, "auth"),
        limitar(limitadores.login, `login:email:${email}`, "auth"),
      ]);
      if (!porIp.sucesso || !porEmail.sucesso) return null;

      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!u?.hashedPassword) return null; // conta OAuth ou inexistente
      if (u.banido) return null; // conta banida não entra

      const ok = await verificarSenha(u.hashedPassword, senha);
      if (!ok) return null;

      return { id: u.id, email: u.email, name: u.name, image: u.image, role: u.role };
    },
  }),
];

// Magic link só entra quando o Resend está configurado.
if (process.env.RESEND_API_KEY) {
  providers.push(Resend({ from: process.env.EMAIL_FROM ?? "onboarding@resend.dev" }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  trustHost: true,
  // Tela de login própria (no padrão do app), no lugar da página crua do Auth.js.
  pages: { signIn: "/entrar" },
  providers,
  callbacks: {
    // Barra qualquer provedor (OAuth/magic link) para conta banida. No primeiro
    // login OAuth ainda não há id de conta — deixa passar (nada a banir ainda).
    async signIn({ user }) {
      if (!user?.id) return true;
      const [u] = await db
        .select({ banido: users.banido })
        .from(users)
        .where(eq(users.id, user.id));
      return !u?.banido;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id =
          (token.id as string | undefined) ?? session.user.id;
        session.user.role =
          (token.role as "user" | "moderator" | "admin" | undefined) ?? "user";
      }
      return session;
    },
  },
});
