import { defineConfig } from "vitest/config";

/**
 * O motor do construtor (regras, score, sugestões, simulador) é todo função
 * pura e não importa React — por isso o ambiente é `node`, sem jsdom.
 * Os aliases `@/*` vêm do tsconfig via resolução nativa do Vite.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
