import { describe, it, expect } from "vitest";
import { listConceitos } from "@/shared/lib/content";

const CONCEITOS = listConceitos();
const COM_LINHA = CONCEITOS.filter((c) => c.emUmaLinha);
const COM_CUSTO = CONCEITOS.filter((c) => c.custo);

describe("o padrão em uma linha", () => {
  it("há conceitos com o snippet mínimo", () => {
    expect(COM_LINHA.length).toBeGreaterThan(0);
  });

  it.each(COM_LINHA.map((c) => [c.slug, c] as const))(
    "%s: o snippet é mesmo mínimo",
    (_slug, c) => {
      const linhas = c.emUmaLinha!.code.trim().split("\n");
      // o valor está em ser curto: se precisa de 10 linhas, é o bloco `codigo`
      expect(linhas.length, `${linhas.length} linhas`).toBeLessThanOrEqual(6);
      expect(c.emUmaLinha!.code.trim().length).toBeGreaterThan(20);
      expect(["typescript", "python", "java"]).toContain(c.emUmaLinha!.lang);
    }
  );

  it("o snippet é mais curto que o exemplo completo", () => {
    // se não for, ele não está resumindo nada
    const erros: string[] = [];
    for (const c of COM_LINHA) {
      const menor = Math.min(...c.exemplos.map((e) => e.code.trim().length));
      if (c.emUmaLinha!.code.trim().length >= menor) erros.push(c.slug);
    }
    expect(erros).toEqual([]);
  });
});

describe("o custo declarado", () => {
  it("há conceitos com custo", () => {
    expect(COM_CUSTO.length).toBeGreaterThan(0);
  });

  it.each(COM_CUSTO.map((c) => [c.slug, c] as const))(
    "%s: custo bem formado",
    (_slug, c) => {
      const custo = c.custo!;
      expect(custo.indirecoes).toBeGreaterThanOrEqual(0);
      // mais de 4 saltos entre a chamada e o efeito é um número que precisa
      // de explicação, não de campo
      expect(custo.indirecoes).toBeLessThanOrEqual(4);
      expect(Number.isInteger(custo.indirecoes)).toBe(true);

      // um padrão que não cobra nada não precisava de página
      expect(custo.cobra.length).toBeGreaterThanOrEqual(1);
      for (const item of custo.cobra) {
        expect(item.trim().length, `${c.slug}: "${item}"`).toBeGreaterThan(25);
      }

      expect(custo.naoValeSe.trim().length).toBeGreaterThan(40);
    }
  );

  it("`naoValeSe` responde a uma condição, não a uma opinião", () => {
    // a frase completa a sentença "não vale se…", então não pode começar
    // com maiúscula nem repetir o "não vale"
    const erros: string[] = [];
    for (const c of COM_CUSTO) {
      const f = c.custo!.naoValeSe.trim();
      if (/^não vale/i.test(f)) erros.push(`${c.slug}: repete "não vale"`);
    }
    expect(erros).toEqual([]);
  });

  it("todo conceito tem emUmaLinha", () => {
    const sem = CONCEITOS.filter((c) => !c.emUmaLinha).map((c) => c.slug);
    expect(sem).toEqual([]);
  });

  it("todo conceito declara custo", () => {
    const sem = CONCEITOS.filter((c) => !c.custo).map((c) => c.slug);
    expect(sem).toEqual([]);
  });
});
