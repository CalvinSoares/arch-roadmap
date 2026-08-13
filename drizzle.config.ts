import { defineConfig } from "drizzle-kit";

// drizzle-kit não carrega o .env.local sozinho. `process.loadEnvFile` existe no
// Node ≥ 20.12 (o Next 16 já exige um Node bem mais novo). O cast evita erro de
// tipo caso a versão do @types/node ainda não conheça o método.
const load = (process as unknown as { loadEnvFile?: (p?: string) => void })
  .loadEnvFile;
// precedência do Next: .env.local sobrescreve .env, então carrega o local antes.
for (const arquivo of [".env.local", ".env"]) {
  try {
    load?.(arquivo);
  } catch {
    // arquivo ausente — segue com o process.env que já existir.
  }
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
