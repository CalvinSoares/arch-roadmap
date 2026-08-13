import type { DefaultSession } from "next-auth";

type Papel = "user" | "moderator" | "admin";

/** Expõe `id` e `role` na sessão e no token — usados pelos guards de RBAC. */
declare module "next-auth" {
  interface User {
    role?: Papel;
  }
  interface Session {
    user: {
      id: string;
      role: Papel;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Papel;
  }
}
