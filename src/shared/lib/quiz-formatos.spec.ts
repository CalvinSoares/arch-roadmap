import { describe, it, expect } from "vitest";
import {
  perguntasDeOndeAparece,
  perguntasDeDuelo,
  perguntasDeAntiExemplo,
  perguntasDePostmortem,
  perguntasDeExpliqueErro,
  gerarRodada,
  disponibilidadePorFormato,
  TODOS_OS_FORMATOS,
  ROTULO_FORMATO,
  DESCRICAO_FORMATO,
  type FormatoQuiz,
} from "@/shared/lib/quiz-formatos";
import { listConceitos, getConceito } from "@/shared/lib/content";
import type { Pergunta } from "@/shared/lib/quiz";

const SLUGS = new Set(listConceitos().map((c) => c.slug));
/** rnd fixo: os geradores são puros, e o que se testa aqui não é a ordem. */
const rnd = () => 0.5;

const GERADORES: { formato: FormatoQuiz; gerar: () => Pergunta[] }[] = [
  { formato: "onde-aparece", gerar: () => perguntasDeOndeAparece(rnd) },
  { formato: "duelo", gerar: () => perguntasDeDuelo(rnd) },
  { formato: "anti-exemplo", gerar: () => perguntasDeAntiExemplo(rnd) },
  { formato: "postmortem", gerar: () => perguntasDePostmortem(rnd) },
  { formato: "explique-erro", gerar: () => perguntasDeExpliqueErro(rnd) },
];

describe("formatos de quiz — invariantes comuns", () => {
  it.each(GERADORES.map((g) => [g.formato, g] as const))(
    "%s: gera perguntas bem formadas",
    (_f, g) => {
      const perguntas = g.gerar();
      expect(perguntas.length).toBeGreaterThan(0);

      for (const p of perguntas) {
        expect(p.enunciado.trim().length, p.id).toBeGreaterThan(20);
        expect(p.explicacao.trim().length, p.id).toBeGreaterThan(10);
        expect(SLUGS.has(p.correta), `${p.id}: correta inexistente`).toBe(true);
        // a correta está entre as alternativas
        expect(p.alternativas, p.id).toContain(p.correta);
        // sem alternativa repetida
        expect(new Set(p.alternativas).size, p.id).toBe(p.alternativas.length);
        // todas existem
        for (const a of p.alternativas) {
          expect(SLUGS.has(a), `${p.id}: alternativa ${a} inexistente`).toBe(true);
        }
      }
    }
  );

  it("ids são únicos dentro e entre formatos", () => {
    const todos = GERADORES.flatMap((g) => g.gerar().map((p) => p.id));
    expect(new Set(todos).size).toBe(todos.length);
  });

  /**
   * O teste mais importante do arquivo, e o motivo de os formatos passarem por
   * `mascarar()`: o `onde` de um `ondeAparece` é literalmente "O objeto Proxy
   * do JS". Sem mascarar, a pergunta entrega a resposta antes de ser lida.
   */
  it.each(GERADORES.map((g) => [g.formato, g] as const))(
    "%s: nenhum enunciado vaza o nome da resposta",
    (_f, g) => {
      const vazando: string[] = [];
      for (const p of g.gerar()) {
        const c = getConceito(p.correta)!;
        const alvo = p.enunciado.toLowerCase();
        // o título inteiro e a primeira palavra dele (Proxy, Saga, Ledger…)
        const nome = c.titulo.toLowerCase();
        const primeira = nome.split(/[\s—(]/)[0];
        if (alvo.includes(nome)) vazando.push(`${p.id}: "${c.titulo}"`);
        else if (primeira.length > 4 && new RegExp(`\\b${primeira}s?\\b`).test(alvo)) {
          vazando.push(`${p.id}: "${primeira}"`);
        }
      }
      expect(vazando).toEqual([]);
    }
  );

  it("duelo é binário — dois candidatos, não quatro", () => {
    for (const p of perguntasDeDuelo(rnd)) {
      // o que se testa é a distinção entre os dois, não o reconhecimento
      expect(p.alternativas.length, p.id).toBe(2);
    }
  });

  it("os outros formatos oferecem quatro alternativas", () => {
    for (const g of GERADORES.filter((x) => x.formato !== "duelo")) {
      for (const p of g.gerar()) {
        expect(p.alternativas.length, p.id).toBe(4);
      }
    }
  });
});

describe("rótulos", () => {
  it("todo formato tem rótulo e descrição", () => {
    for (const f of TODOS_OS_FORMATOS) {
      expect(ROTULO_FORMATO[f]?.length, f).toBeGreaterThan(2);
      expect(DESCRICAO_FORMATO[f]?.length, f).toBeGreaterThan(25);
    }
  });
});

describe("a rodada", () => {
  it("respeita o tamanho pedido", () => {
    for (const n of [1, 5, 10, 20]) {
      expect(gerarRodada({ semente: 7, quantas: n }).length).toBe(n);
    }
  });

  it("mesma semente, mesma rodada", () => {
    const a = gerarRodada({ semente: 42, quantas: 10 }).map((p) => p.id);
    const b = gerarRodada({ semente: 42, quantas: 10 }).map((p) => p.id);
    expect(a).toEqual(b);
  });

  it("sementes diferentes produzem rodadas diferentes", () => {
    const a = gerarRodada({ semente: 1, quantas: 10 }).map((p) => p.id);
    const b = gerarRodada({ semente: 999, quantas: 10 }).map((p) => p.id);
    expect(a).not.toEqual(b);
  });

  it("nunca repete pergunta dentro da rodada", () => {
    const ids = gerarRodada({ semente: 3, quantas: 30 }).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * Intercala em vez de concatenar. Com concatenação, uma rodada de 10 sairia
   * com as 8 primeiras do mesmo formato — e a variedade, que é o ponto de ter
   * vários, só apareceria no fim.
   */
  it("mistura os formatos desde as primeiras perguntas", () => {
    const primeiras = gerarRodada({ semente: 5, quantas: 5 }).map((p) => p.formato);
    expect(new Set(primeiras).size).toBeGreaterThanOrEqual(4);
  });

  it("um formato só devolve só aquele formato", () => {
    for (const f of TODOS_OS_FORMATOS) {
      const r = gerarRodada({ semente: 2, quantas: 5, formatos: [f] });
      expect(r.length, f).toBeGreaterThan(0);
      expect(new Set(r.map((p) => p.formato)), f).toEqual(new Set([f]));
    }
  });

  it("toda pergunta declara de qual formato veio", () => {
    for (const p of gerarRodada({ semente: 8, quantas: 25 })) {
      expect(TODOS_OS_FORMATOS, p.id).toContain(p.formato);
    }
  });

  it("escopo restringe as respostas ao recorte", () => {
    const escopo = ["proxy", "decorator", "facade", "adapter"];
    for (const p of gerarRodada({ semente: 4, quantas: 8, escopo })) {
      expect(escopo, `${p.id} (${p.formato})`).toContain(p.correta);
    }
  });

  it("pedir mais do que existe devolve o que existe, sem repetir", () => {
    const r = gerarRodada({ semente: 6, quantas: 5000 });
    expect(r.length).toBeGreaterThan(50);
    expect(r.length).toBeLessThan(5000);
    expect(new Set(r.map((p) => p.id)).size).toBe(r.length);
  });
});

describe("disponibilidade", () => {
  it("cada formato novo oferece perguntas suficientes para uma rodada", () => {
    const d = disponibilidadePorFormato();
    for (const [formato, quantas] of Object.entries(d)) {
      // menos de 5 não sustenta nem uma rodada curta
      expect(quantas, formato).toBeGreaterThanOrEqual(5);
    }
  });

  it("o escopo reduz a disponibilidade", () => {
    const tudo = disponibilidadePorFormato();
    const recorte = disponibilidadePorFormato(["proxy", "decorator"]);
    expect(recorte["onde-aparece"]).toBeLessThan(tudo["onde-aparece"]);
  });
});
