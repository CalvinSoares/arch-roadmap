import { describe, it, expect } from "vitest";
import { POSTMORTEMS } from "@/content/postmortems/registro";
import { listConceitos } from "@/shared/lib/content";

const SLUGS = new Set(listConceitos().map((c) => c.slug));
const ANO_REFERENCIA = 2026;

describe("postmortems", () => {
  it("slugs únicos e kebab-case", () => {
    const slugs = POSTMORTEMS.map((p) => p.slug);
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  /**
   * A regra que separa isto de curiosidade: se o incidente não prova nenhum
   * conceito do catálogo, ele é história de terror de plantão, não material
   * de estudo.
   */
  it.each(POSTMORTEMS.map((p) => [p.slug, p] as const))(
    "%s cita conceitos que existem, com justificativa",
    (_slug, p) => {
      expect(p.conceitos.length).toBeGreaterThanOrEqual(2);
      for (const c of p.conceitos) {
        expect(SLUGS.has(c.slug), `conceito inexistente: ${c.slug}`).toBe(true);
        // "é relacionado" não explica nada — a justificativa precisa ensinar
        expect(c.porque.trim().length, `${p.slug} → ${c.slug}`).toBeGreaterThan(60);
      }
    }
  );

  it("não repete o mesmo conceito dentro de um postmortem", () => {
    const erros: string[] = [];
    for (const p of POSTMORTEMS) {
      const s = p.conceitos.map((c) => c.slug);
      if (new Set(s).size !== s.length) erros.push(p.slug);
    }
    expect(erros).toEqual([]);
  });

  it.each(POSTMORTEMS.map((p) => [p.slug, p] as const))(
    "%s tem fonte, impacto e causa raiz substantivos",
    (_slug, p) => {
      // data sem fonte é boato — mesma regra do campo `nasceu`
      expect(p.fonte.trim().length).toBeGreaterThan(20);
      expect(p.organizacao.trim().length).toBeGreaterThan(2);
      expect(p.impacto.trim().length).toBeGreaterThan(40);
      expect(p.causaRaiz.trim().length).toBeGreaterThan(120);
      expect(p.oQueAconteceu.length).toBeGreaterThanOrEqual(2);
      expect(p.oQueMudou.length).toBeGreaterThanOrEqual(2);
    }
  );

  it("a linha do tempo tem ao menos três momentos e uma virada", () => {
    for (const p of POSTMORTEMS) {
      expect(p.linhaDoTempo.length, p.slug).toBeGreaterThanOrEqual(3);
      const viradas = p.linhaDoTempo.filter((m) => m.virada);
      // exatamente uma: o instante em que a causa vira efeito visível
      expect(viradas.length, `${p.slug}: ${viradas.length} virada(s)`).toBe(1);
    }
  });

  it("datas são plausíveis e não usam o ano 0", () => {
    for (const p of POSTMORTEMS) {
      expect(p.quando.ano, p.slug).toBeGreaterThan(1970);
      expect(p.quando.ano, p.slug).toBeLessThanOrEqual(ANO_REFERENCIA);
      expect(p.quando.rotulo.trim().length).toBeGreaterThan(3);
    }
  });

  /**
   * A causa raiz de um incidente sério quase nunca é a ação que o disparou.
   * Este teste não consegue julgar o conteúdo, mas pega o atalho mais comum:
   * culpar uma pessoa em vez de descrever o sistema que permitiu o erro.
   */
  it("a causa raiz não culpa uma pessoa", () => {
    const suspeitas = /\b(culpa d[oae]|o engenheiro errou|o dev errou|negligência)\b/i;
    const erros = POSTMORTEMS.filter((p) => suspeitas.test(p.causaRaiz)).map((p) => p.slug);
    expect(erros).toEqual([]);
  });
});
