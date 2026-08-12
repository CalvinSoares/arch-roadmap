import { describe, it, expect } from "vitest";
import { EXPLICAR_ERROS, alternativasDe } from "./explique-erro";
import { listConceitos } from "@/shared/lib/content";

const SLUGS = new Set(listConceitos().map((c) => c.slug));

describe("explique o erro — registro", () => {
  it("há perguntas suficientes para uma rodada", () => {
    expect(EXPLICAR_ERROS.length).toBeGreaterThanOrEqual(5);
  });

  it("ids únicos e bem formados", () => {
    const ids = EXPLICAR_ERROS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(EXPLICAR_ERROS.map((e) => [e.id, e] as const))(
    "%s: estrutura válida",
    (_id, e) => {
      expect(SLUGS.has(e.correta), `correta ${e.correta}`).toBe(true);
      expect(e.codigo.code.trim().length).toBeGreaterThan(40);
      expect(["typescript", "python", "java"]).toContain(e.codigo.lang);
      expect(e.explicacao.trim().length).toBeGreaterThan(40);

      const alts = alternativasDe(e);
      expect(alts).toContain(e.correta);
      expect(new Set(alts).size).toBe(alts.length);
      expect(alts.length).toBeGreaterThanOrEqual(2);
      expect(alts.length).toBeLessThanOrEqual(4);
      for (const a of alts) expect(SLUGS.has(a), a).toBe(true);
    }
  );

  it("enunciado e código não vazam o título da resposta", () => {
    const vazando: string[] = [];
    for (const e of EXPLICAR_ERROS) {
      const c = listConceitos().find((x) => x.slug === e.correta)!;
      const alvo = `${e.enunciado ?? ""} ${e.codigo.code}`.toLowerCase();
      const nome = c.titulo.toLowerCase();
      if (alvo.includes(nome)) vazando.push(`${e.id}: título`);
      // siglas SOLID no código também entregam
      if (/\b(srp|ocp|lsp|isp|dip)\b/i.test(e.codigo.code)) {
        vazando.push(`${e.id}: sigla no código`);
      }
    }
    expect(vazando).toEqual([]);
  });
});
