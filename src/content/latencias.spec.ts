import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LATENCIA,
  REFERENCIAS,
  formatarLatencia,
  escalaCompleta,
} from "@/content/latencias";

const SIMULADOR = join(
  process.cwd(),
  "src/app/(app)/construtor/utils/simulador.ts"
);
const fonte = readFileSync(SIMULADOR, "utf8");

describe("latências — a fonte única", () => {
  /**
   * O teste que existe por causa de um defeito real: o simulador passava o
   * número como argumento **e** repetia na prosa (`passo(..., "…(~15ms)", 15)`),
   * com nada garantindo que os dois continuassem iguais — e a interface já
   * mostrava o `ms` na mesma tela.
   *
   * É um `grep` virado em asserção. Se alguém voltar a escrever o número na
   * narração, isto falha aqui em vez de divergir em silêncio.
   */
  it("a prosa do simulador não contém número de milissegundo", () => {
    const vazamentos = fonte
      .split(/\r?\n/)
      .map((linha, i) => ({ linha, n: i + 1 }))
      .filter(({ linha }) => /~\s*[\d.]+\s*(ms|s)\b/.test(linha))
      .map(({ linha, n }) => `${n}: ${linha.trim()}`);
    expect(vazamentos).toEqual([]);
  });

  it("o simulador consome a tabela", () => {
    expect(fonte).toContain('from "@/content/latencias"');
    expect(fonte.match(/LATENCIA\./g)?.length ?? 0).toBeGreaterThan(8);
  });

  /** Chave que ninguém usa apodrece — e engorda a escala com ponto morto. */
  it("toda chave de LATENCIA é usada pelo simulador", () => {
    const semUso = Object.keys(LATENCIA).filter(
      (k) => !fonte.includes(`LATENCIA.${k}.`)
    );
    expect(semUso).toEqual([]);
  });

  it("os valores são positivos e ordenáveis", () => {
    for (const [chave, l] of Object.entries(LATENCIA)) {
      expect(l.ms, chave).toBeGreaterThan(0);
      expect(l.rotulo.trim().length, chave).toBeGreaterThan(10);
    }
    for (const r of REFERENCIAS) {
      expect(r.ms, r.id).toBeGreaterThan(0);
      expect(r.rotulo.trim().length, r.id).toBeGreaterThan(10);
    }
  });

  it("ids de referência são únicos e não colidem com as chaves da tabela", () => {
    const ids = REFERENCIAS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const chaves = new Set(Object.keys(LATENCIA));
    expect(ids.filter((i) => chaves.has(i))).toEqual([]);
  });
});

describe("formatarLatencia", () => {
  it("usa vírgula decimal, como o resto do site", () => {
    expect(formatarLatencia(0.5)).toBe("0,5ms");
    expect(formatarLatencia(1.5)).toBe("1,5ms");
    expect(formatarLatencia(12.5)).toBe("12,5ms");
  });

  it("sobe para segundos acima de 1000ms", () => {
    expect(formatarLatencia(1000)).toBe("1s");
    expect(formatarLatencia(2500)).toBe("2,5s");
  });

  it("desce para micro e nano — senão o ciclo de CPU vira 0ms", () => {
    expect(formatarLatencia(0.016)).toBe("16µs");
    expect(formatarLatencia(0.0000003)).toBe("0,3ns");
  });

  /**
   * O teste que faltava. O anterior conferia `0.0001` — que por sorte dava
   * "0,1µs" — e deixava passar `0.000001`, que renderizava **"0µs"** na tela:
   * um rótulo que não diz nada, em dois dos vinte pontos da escala.
   *
   * A lição: testar um valor da faixa não cobre a faixa. Aqui vão as bordas.
   */
  it("nenhum valor da escala vira zero", () => {
    for (const p of escalaCompleta()) {
      const saida = formatarLatencia(p.ms);
      expect(saida, `${p.id} (${p.ms}ms) → ${saida}`).not.toMatch(/^0(,0)?\s*(ns|µs|ms|s)$/);
    }
  });

  it("as bordas entre as faixas não arredondam para zero", () => {
    expect(formatarLatencia(0.000001)).toBe("1ns");
    expect(formatarLatencia(0.000004)).toBe("4ns");
    expect(formatarLatencia(0.0001)).toBe("100ns");
    expect(formatarLatencia(0.001)).toBe("1µs");
    expect(formatarLatencia(0.099)).toBe("99µs");
    // acima de 0,1ms volta a ser ms, porque é assim que se fala de cache
    expect(formatarLatencia(0.1)).toBe("0,1ms");
    expect(formatarLatencia(0.5)).toBe("0,5ms");
  });

  it("inteiros ficam inteiros", () => {
    expect(formatarLatencia(180)).toBe("180ms");
    expect(formatarLatencia(10)).toBe("10ms");
  });
});

describe("escalaCompleta", () => {
  const escala = escalaCompleta();

  it("está ordenada do mais rápido ao mais lento", () => {
    const ms = escala.map((e) => e.ms);
    expect([...ms].sort((a, b) => a - b)).toEqual(ms);
  });

  it("inclui referências e operações do simulador, marcadas", () => {
    expect(escala.some((e) => e.doSimulador)).toBe(true);
    expect(escala.some((e) => !e.doSimulador)).toBe(true);
    expect(escala.length).toBe(
      Object.keys(LATENCIA).length + REFERENCIAS.length
    );
  });

  it("abrange pelo menos oito ordens de grandeza", () => {
    // é isso que faz a escala logarítmica ensinar: sem o alcance,
    // "10ms" não quer dizer nada
    const menor = escala[0].ms;
    const maior = escala[escala.length - 1].ms;
    expect(Math.log10(maior / menor)).toBeGreaterThanOrEqual(8);
  });
});
