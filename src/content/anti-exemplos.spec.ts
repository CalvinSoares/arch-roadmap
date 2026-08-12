import { describe, it, expect } from "vitest";
import { listConceitos } from "@/shared/lib/content";
import type { Bloco } from "@/shared/types/bloco";
import type { Conceito } from "@/shared/types/conceito";

const CONCEITOS = listConceitos();

const antiExemplos = (c: Conceito) =>
  (c.blocos ?? []).filter(
    (b): b is Extract<Bloco, { tipo: "anti-exemplo" }> => b.tipo === "anti-exemplo"
  );

const COM = CONCEITOS.filter((c) => antiExemplos(c).length > 0);

describe("anti-exemplos", () => {
  it("há conceitos com anti-exemplo", () => {
    expect(COM.length).toBeGreaterThan(0);
  });

  it("no máximo um anti-exemplo por conceito", () => {
    // Dois blocos vermelhos na mesma página competem entre si e diluem o aviso.
    const demais = COM.filter((c) => antiExemplos(c).length > 1).map((c) => c.slug);
    expect(demais).toEqual([]);
  });

  it.each(COM.map((c) => [c.slug, c] as const))(
    "%s tem anti-exemplo bem formado",
    (_slug, c) => {
      const b = antiExemplos(c)[0];

      expect(b.comoSeParece.trim().length).toBeGreaterThan(60);
      expect(b.correcao.trim().length).toBeGreaterThan(60);
      expect(b.codigo.code.trim().length).toBeGreaterThan(80);
      expect(["typescript", "python", "java"]).toContain(b.codigo.lang);

      // Sem sintomas é só código feio: o que ensina é o que quebra, e quando.
      expect(b.sintomas.length).toBeGreaterThanOrEqual(2);
      for (const s of b.sintomas) {
        expect(s.quando.trim().length, `${c.slug}: "quando" vazio`).toBeGreaterThan(2);
        // "quando" é um rótulo curto, alinhado numa coluna estreita
        expect(s.quando.length, `${c.slug}: "${s.quando}" longo demais`).toBeLessThanOrEqual(30);
        expect(
          s.efeito.trim().length,
          `${c.slug} / ${s.quando}: efeito curto demais`
        ).toBeGreaterThan(40);
      }
    }
  );

  it("o código errado é comentado — senão não se distingue do certo", () => {
    const semComentario: string[] = [];
    for (const c of COM) {
      const { code, lang } = antiExemplos(c)[0].codigo;
      const marca = lang === "python" ? "#" : "//";
      if (!code.includes(marca)) semComentario.push(c.slug);
    }
    expect(semComentario).toEqual([]);
  });

  it("os `quando` de um mesmo anti-exemplo não se repetem", () => {
    const erros: string[] = [];
    for (const c of COM) {
      const q = antiExemplos(c)[0].sintomas.map((s) => s.quando.toLowerCase());
      if (new Set(q).size !== q.length) erros.push(c.slug);
    }
    expect(erros).toEqual([]);
  });

  it("o anti-exemplo vem depois do conteúdo que ensina o certo", () => {
    // Mostrar o erro antes da solução ensina o erro. A ordem é conteúdo.
    const erros: string[] = [];
    for (const c of COM) {
      const blocos = c.blocos ?? [];
      const iAnti = blocos.findIndex((b) => b.tipo === "anti-exemplo");
      const iPrimeiraSecao = blocos.findIndex((b) => b.tipo === "secao");
      if (iPrimeiraSecao >= 0 && iAnti < iPrimeiraSecao) {
        erros.push(`${c.slug}: anti-exemplo antes da primeira seção`);
      }
    }
    expect(erros).toEqual([]);
  });

  /** Fila de trabalho, sem falhar — mesmo espírito das outras specs. */
  it("relata conceitos que ainda não têm anti-exemplo", () => {
    const sem = CONCEITOS.filter((c) => antiExemplos(c).length === 0).map((c) => c.slug);
    if (sem.length > 0) {
      console.info(`\n  ${sem.length} sem anti-exemplo:\n  ${sem.join(", ")}\n`);
    }
    expect(Array.isArray(sem)).toBe(true);
  });
});
