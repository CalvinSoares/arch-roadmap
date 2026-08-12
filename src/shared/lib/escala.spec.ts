import { describe, it, expect } from "vitest";
import {
  posicao,
  razao,
  formatarRazao,
  decadas,
  faixas,
  type PontoEscala,
} from "@/shared/lib/escala";
import { escalaCompleta } from "@/content/latencias";

const PONTOS = escalaCompleta();
const MIN = PONTOS[0].ms;
const MAX = PONTOS[PONTOS.length - 1].ms;

describe("posição no eixo", () => {
  it("as pontas caem em 0 e 1, nas duas transformações", () => {
    for (const t of ["log", "linear"] as const) {
      expect(posicao(MIN, MIN, MAX, t)).toBeCloseTo(0, 10);
      expect(posicao(MAX, MIN, MAX, t)).toBeCloseTo(1, 10);
    }
  });

  it("é monotônica: mais lento nunca fica mais à esquerda", () => {
    for (const t of ["log", "linear"] as const) {
      let anterior = -1;
      for (const p of PONTOS) {
        const x = posicao(p.ms, MIN, MAX, t);
        expect(x, `${p.id} em ${t}`).toBeGreaterThanOrEqual(anterior);
        anterior = x;
      }
    }
  });

  /**
   * O teste que justifica a escala existir. Em linear, tudo abaixo de 1ms
   * colapsa perto da origem — e é esse colapso que a página usa como argumento.
   */
  it("em linear, o que é sub-milissegundo colapsa; em log, não", () => {
    const submili = PONTOS.filter((p) => p.ms < 1);
    expect(submili.length).toBeGreaterThan(4);

    const linear = submili.map((p) => posicao(p.ms, MIN, MAX, "linear"));
    const log = submili.map((p) => posicao(p.ms, MIN, MAX, "log"));

    // em linear, todos dentro de 1% do eixo — indistinguíveis na tela
    expect(Math.max(...linear) - Math.min(...linear)).toBeLessThan
      (0.01);
    // em log, espalhados por mais de metade do eixo
    expect(Math.max(...log) - Math.min(...log)).toBeGreaterThan(0.5);
  });

  it("recusa latência não positiva em vez de devolver NaN", () => {
    expect(() => posicao(0, MIN, MAX, "log")).toThrow(RangeError);
    expect(() => posicao(-1, MIN, MAX, "log")).toThrow(RangeError);
  });

  it("min igual a max não estoura", () => {
    expect(posicao(5, 5, 5, "log")).toBe(0);
  });

  it("valor fora do intervalo fica preso nas bordas", () => {
    expect(posicao(MAX * 10, MIN, MAX, "log")).toBe(1);
    expect(posicao(MIN / 10, MIN, MAX, "log")).toBe(0);
  });
});

describe("razão", () => {
  it("conta quantas vezes um é mais lento que o outro", () => {
    expect(razao(1, 10)).toBe(10);
    expect(razao(0.5, 180)).toBe(360);
  });

  it("o salto real da escala é de milhões", () => {
    const ram = PONTOS.find((p) => p.id === "ram")!;
    const regiao = PONTOS.find((p) => p.id === "rtt-regiao")!;
    expect(razao(ram.ms, regiao.ms)).toBeGreaterThan(1_000_000);
  });

  it("recusa divisor não positivo", () => {
    expect(() => razao(0, 10)).toThrow(RangeError);
  });
});

describe("formatarRazao", () => {
  it("escala o sufixo conforme a ordem de grandeza", () => {
    expect(formatarRazao(2.5)).toBe("2,5×");
    expect(formatarRazao(360)).toBe("360×");
    expect(formatarRazao(1_200)).toBe("1,2 mil ×");
    expect(formatarRazao(1_200_000)).toBe("1,2 milhões ×");
    expect(formatarRazao(3_000_000_000)).toBe("3 bilhões ×");
  });

  it("usa vírgula decimal", () => {
    expect(formatarRazao(1_500_000)).toContain(",");
    expect(formatarRazao(1_500_000)).not.toContain(".");
  });
});

describe("décadas", () => {
  it("todas são potências de 10 dentro do intervalo", () => {
    for (const d of decadas(MIN, MAX)) {
      expect(Math.log10(d) % 1).toBeCloseTo(0, 10);
      expect(d).toBeGreaterThanOrEqual(MIN);
      expect(d).toBeLessThanOrEqual(MAX);
    }
  });

  it("cobre o alcance da escala real", () => {
    // nove ordens de grandeza precisam produzir várias linhas de grade
    expect(decadas(MIN, MAX).length).toBeGreaterThanOrEqual(6);
  });
});

describe("faixas de rótulo", () => {
  const pontos: PontoEscala[] = PONTOS.map((p) => ({
    id: p.id,
    ms: p.ms,
    rotulo: p.rotulo,
  }));

  it("devolve uma faixa por ponto, na ordem de entrada", () => {
    const f = faixas(pontos, MIN, MAX, "log");
    expect(f.length).toBe(pontos.length);
    for (const n of f) expect(n).toBeGreaterThanOrEqual(0);
  });

  it("vizinhos colados não caem na mesma faixa", () => {
    const colados: PontoEscala[] = [
      { id: "a", ms: 10, rotulo: "a" },
      { id: "b", ms: 10.5, rotulo: "b" },
      { id: "c", ms: 11, rotulo: "c" },
    ];
    const f = faixas(colados, 1, 100, "log");
    expect(new Set(f).size).toBeGreaterThan(1);
  });

  it("pontos distantes cabem todos na primeira faixa", () => {
    const distantes: PontoEscala[] = [
      { id: "a", ms: 1, rotulo: "a" },
      { id: "b", ms: 100, rotulo: "b" },
    ];
    expect(faixas(distantes, 1, 100, "log")).toEqual([0, 0]);
  });

  it("é determinístico", () => {
    expect(faixas(pontos, MIN, MAX, "log")).toEqual(
      faixas(pontos, MIN, MAX, "log")
    );
  });
});
