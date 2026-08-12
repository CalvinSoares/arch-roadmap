import { describe, it, expect } from "vitest";
import { ENTREVISTAS } from "./registro";
import { listConceitos } from "@/shared/lib/content";
import type { NivelRubrica } from "@/shared/types/entrevista";

const SLUGS = new Set(listConceitos().map((c) => c.slug));
const NIVEIS: NivelRubrica[] = ["essencial", "importante", "bonus"];

describe("registro de entrevistas", () => {
  it("há entrevistas e os slugs são únicos e kebab-case", () => {
    expect(ENTREVISTAS.length).toBeGreaterThan(0);
    const slugs = ENTREVISTAS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(ENTREVISTAS.map((e) => [e.slug, e] as const))(
    "%s tem enunciado e conteúdo substantivo",
    (_slug, e) => {
      expect(e.titulo.trim().length).toBeGreaterThan(3);
      expect(e.resumo.trim().length).toBeGreaterThan(30);
      expect(e.enunciado.trim().length).toBeGreaterThan(80);
      expect(e.restricoes.length).toBeGreaterThanOrEqual(2);
      for (const r of e.restricoes) expect(r.trim().length).toBeGreaterThan(15);
      expect(e.pegadinha.trim().length).toBeGreaterThan(80);
    }
  );

  it.each(ENTREVISTAS.map((e) => [e.slug, e] as const))(
    "%s tem rubrica bem formada, com ao menos um item essencial",
    (_slug, e) => {
      expect(e.rubrica.length).toBeGreaterThanOrEqual(4);
      expect(e.rubrica.some((r) => r.nivel === "essencial")).toBe(true);
      for (const item of e.rubrica) {
        expect(NIVEIS).toContain(item.nivel);
        expect(item.ponto.trim().length, item.ponto).toBeGreaterThan(10);
        expect(item.porque.trim().length, item.ponto).toBeGreaterThan(40);
        expect(item.conceitos.length, item.ponto).toBeGreaterThanOrEqual(1);
      }
    }
  );

  it("todo conceito citado por uma rubrica existe no catálogo", () => {
    const quebrados: string[] = [];
    for (const e of ENTREVISTAS) {
      for (const item of e.rubrica) {
        for (const slug of item.conceitos) {
          if (!SLUGS.has(slug)) quebrados.push(`${e.slug} / "${item.ponto}" → ${slug}`);
        }
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("nenhum item da rubrica repete o mesmo conceito", () => {
    const erros: string[] = [];
    for (const e of ENTREVISTAS) {
      for (const item of e.rubrica) {
        if (new Set(item.conceitos).size !== item.conceitos.length) {
          erros.push(`${e.slug} / "${item.ponto}"`);
        }
      }
    }
    expect(erros).toEqual([]);
  });
});
