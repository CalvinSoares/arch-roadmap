import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Dois ambientes:
 * - `node` para specs de conteúdo/motor (*.spec.ts) — sem React
 * - `happy-dom` para componentes (*.spec.tsx)
 */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.spec.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "ui",
          environment: "happy-dom",
          include: ["src/**/*.spec.tsx"],
          setupFiles: ["src/test/setup.ts"],
        },
      },
    ],
  },
});
