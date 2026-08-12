import { describe, it, expect } from "vitest";
import {
  listCasosClinica,
  casosDoDia,
  alternativasDoCaso,
} from "@/shared/lib/clinica";
import { getConceito } from "@/shared/lib/content";
import { distratoresDePostmortem } from "@/shared/lib/cheiros";
import { POSTMORTEMS } from "@/content/postmortems/registro";

describe("clínica", () => {
  it("há casos com código para diagnosticar", () => {
    expect(listCasosClinica().length).toBeGreaterThan(10);
  });

  it("todo caso aponta para conceito existente e tem problema enunciado", () => {
    for (const c of listCasosClinica()) {
      expect(getConceito(c.slug), c.id).toBeTruthy();
      expect(c.problema.length).toBeGreaterThan(20);
      expect(c.codigo.code.trim().length).toBeGreaterThan(20);
      expect(c.correcao.trim().length).toBeGreaterThan(20);
    }
  });

  it("casosDoDia é determinístico", () => {
    expect(casosDoDia(99).map((c) => c.id)).toEqual(
      casosDoDia(99).map((c) => c.id)
    );
  });

  it("alternativas incluem a correta e têm 4 opções", () => {
    const caso = listCasosClinica()[0];
    const alts = alternativasDoCaso(caso, 1);
    expect(alts).toHaveLength(4);
    expect(alts).toContain(caso.slug);
    expect(new Set(alts).size).toBe(4);
  });
});

describe("distratores de postmortem", () => {
  it("não incluem os corretos", () => {
    const pm = POSTMORTEMS[0];
    const corretos = pm.conceitos.map((c) => c.slug);
    const dist = distratoresDePostmortem(pm.slug, corretos);
    expect(dist.length).toBeGreaterThan(0);
    for (const d of dist) {
      expect(corretos).not.toContain(d);
      expect(getConceito(d)).toBeTruthy();
    }
  });
});
