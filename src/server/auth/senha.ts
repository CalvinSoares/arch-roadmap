import { hash, verify } from "@node-rs/argon2";

/**
 * Hash de senha com argon2id — parâmetros recomendados pelo OWASP.
 *
 * Roda só no servidor (Node), nunca no edge/cliente. O `@node-rs/argon2` traz
 * binários prontos, sem node-gyp.
 */
const OPCOES = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export function hashSenha(senha: string): Promise<string> {
  return hash(senha, OPCOES);
}

export function verificarSenha(hashArmazenado: string, senha: string): Promise<boolean> {
  return verify(hashArmazenado, senha);
}
