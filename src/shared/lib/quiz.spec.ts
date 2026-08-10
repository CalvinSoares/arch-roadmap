import { describe, it, expect } from "vitest";
import {
  distratoresDe,
  gerarPerguntas,
  mascarar,
  sementeDoDia,
  todasAsArmadilhas,
  topicosDisponiveis,
  getTopico,
} from "./quiz";
import { listConceitos, getConceito } from "./content";

const SLUGS = new Set(listConceitos().map((c) => c.slug));

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

describe("mascaramento", () => {
  it("troca o nome do padrão por 'este padrão'", () => {
    const proxy = getConceito("proxy")!;
    expect(mascarar("O Proxy remoto sem timeout falha.", proxy)).toBe(
      "O este padrão remoto sem timeout falha."
    );
  });

  it("pega o nome mesmo em outra caixa", () => {
    const proxy = getConceito("proxy")!;
    expect(mascarar("um PROXY mal usado", proxy)).toContain("este padrão");
  });

  it("cobre partes de títulos compostos", () => {
    const tm = getConceito("template-method")!;
    const saida = mascarar("O Template Method fecha a ordem.", tm);
    expect(semAcento(saida)).not.toContain("template");
  });

  it("não colapsa palavras que apenas contêm o nome", () => {
    const state = getConceito("state")!;
    // "statement" não deve ser mascarado — a regex usa limite de palavra
    expect(mascarar("um statement qualquer", state)).toBe(
      "um statement qualquer"
    );
  });

  it("não repete 'este padrão' em sequência", () => {
    const srp = getConceito("srp")!;
    const saida = mascarar("SRP — Responsabilidade Única exige foco", srp);
    expect(saida).not.toMatch(/este padrão\s+este padrão/i);
  });
});

/**
 * O teste que **produz a fila de trabalho**: em vez de exigir revisão manual
 * das 99 armadilhas, ele nomeia exatamente quais ainda entregam a resposta e
 * precisam de `enunciadoQuiz`.
 */
describe("vazamento da resposta", () => {
  it("nenhum enunciado contém o nome do conceito correto", () => {
    const vazando: string[] = [];

    for (const a of todasAsArmadilhas()) {
      const alvo = semAcento(a.enunciado);
      const titulo = semAcento(a.conceito.titulo);
      /*
       * Limite de palavra, e não `includes`: "stateless" contém "state" como
       * substring, mas é vocabulário técnico corrente e não entrega resposta
       * nenhuma — mascará-lo produziria "este padrãoless". O que revela a
       * resposta é o nome usado COMO palavra, no singular ou no plural.
       */
      const nome = titulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${nome}s?\\b`).test(alvo)) {
        vazando.push(`${a.conceito.slug}[${a.indice}] → "${a.conceito.titulo}"`);
      }
    }

    expect(
      vazando,
      `Armadilhas que ainda entregam a resposta (defina 'enunciadoQuiz' nelas):\n${vazando.join("\n")}`
    ).toEqual([]);
  });

  it("todo enunciado sobrou com texto suficiente para ser pergunta", () => {
    for (const a of todasAsArmadilhas()) {
      expect(a.enunciado.trim().length, `${a.conceito.slug}[${a.indice}]`)
        .toBeGreaterThan(60);
    }
  });
});

describe("distratores", () => {
  it("usa relacionados nos dois sentidos", () => {
    // composite lista visitor em `relacionados`; a volta também deve valer
    expect(distratoresDe("visitor")).toContain("composite");
  });

  it("inclui os pares do comparador", () => {
    expect(distratoresDe("proxy")).toContain("decorator");
  });

  it("nunca inclui o próprio conceito", () => {
    for (const c of listConceitos()) {
      expect(distratoresDe(c.slug)).not.toContain(c.slug);
    }
  });
});

describe("gerarPerguntas", () => {
  it("é determinístico: mesma semente, mesmas perguntas", () => {
    expect(gerarPerguntas(42, 10)).toEqual(gerarPerguntas(42, 10));
  });

  it("sementes diferentes produzem conjuntos diferentes", () => {
    const a = gerarPerguntas(1, 10).map((p) => p.id);
    const b = gerarPerguntas(2, 10).map((p) => p.id);
    expect(a).not.toEqual(b);
  });

  it("toda pergunta tem 4 alternativas únicas, com a correta entre elas", () => {
    for (const p of gerarPerguntas(7, 30)) {
      expect(p.alternativas).toHaveLength(4);
      expect(new Set(p.alternativas).size).toBe(4);
      expect(p.alternativas).toContain(p.correta);
      for (const s of p.alternativas) expect(SLUGS.has(s), s).toBe(true);
    }
  });

  it("não repete a mesma armadilha no mesmo conjunto", () => {
    const ids = gerarPerguntas(3, 40).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("há armadilhas suficientes para um quiz longo", () => {
    expect(todasAsArmadilhas().length).toBeGreaterThanOrEqual(90);
    expect(gerarPerguntas(9, 40)).toHaveLength(40);
  });

  it("cada pergunta traz explicação", () => {
    for (const p of gerarPerguntas(5, 15)) {
      expect(p.explicacao.trim().length).toBeGreaterThan(5);
    }
  });
});

describe("quiz por tópico", () => {
  it("existem tópicos de categoria e de trilha", () => {
    const t = topicosDisponiveis();
    expect(t.some((x) => x.familia === "categoria")).toBe(true);
    expect(t.some((x) => x.familia === "trilha")).toBe(true);
  });

  it("todo tópico tem armadilhas suficientes e slugs válidos", () => {
    for (const t of topicosDisponiveis()) {
      expect(t.perguntas, t.id).toBeGreaterThanOrEqual(6);
      expect(t.slugs.length, t.id).toBeGreaterThan(0);
      for (const s of t.slugs) expect(SLUGS.has(s), `${t.id} → ${s}`).toBe(true);
      // slugs de trilha podem repetir entre seções; o tópico não deve repetir
      expect(new Set(t.slugs).size, t.id).toBe(t.slugs.length);
    }
  });

  it("getTopico encontra pelo id e ignora desconhecido", () => {
    const t = topicosDisponiveis()[0];
    expect(getTopico(t.id)?.id).toBe(t.id);
    expect(getTopico("categoria:inexistente")).toBeUndefined();
  });

  /** O escopo precisa realmente restringir — senão o seletor é decorativo. */
  it("o escopo restringe as perguntas àqueles conceitos", () => {
    const t = topicosDisponiveis().find((x) => x.familia === "categoria")!;
    for (const p of gerarPerguntas(11, 20, t.slugs)) {
      expect(t.slugs, `${p.id} fora do escopo`).toContain(p.correta);
    }
  });

  /**
   * Distratores vêm do catálogo inteiro de propósito: num quiz só de
   * criacionais, alternativas só de criacionais entregariam meia resposta.
   */
  it("as alternativas podem vir de fora do escopo", () => {
    const t = topicosDisponiveis().find(
      (x) => x.id === "categoria:criacional"
    )!;
    const perguntas = gerarPerguntas(4, 20, t.slugs);
    const foraDoEscopo = perguntas
      .flatMap((p) => p.alternativas)
      .filter((s) => !t.slugs.includes(s));
    expect(foraDoEscopo.length).toBeGreaterThan(0);
  });

  it("escopo de um conceito só devolve as armadilhas dele", () => {
    const perguntas = gerarPerguntas(2, 10, ["proxy"]);
    expect(perguntas.length).toBeGreaterThan(0);
    for (const p of perguntas) expect(p.correta).toBe("proxy");
  });

  it("escopo vazio não trava nem inventa perguntas", () => {
    expect(gerarPerguntas(1, 5, [])).toEqual([]);
  });

  it("continua determinístico com escopo", () => {
    expect(gerarPerguntas(8, 6, ["proxy", "decorator"])).toEqual(
      gerarPerguntas(8, 6, ["proxy", "decorator"])
    );
  });
});

describe("sementeDoDia", () => {
  it("é estável para a mesma data e diferente entre datas", () => {
    expect(sementeDoDia("2026-08-10")).toBe(sementeDoDia("2026-08-10"));
    expect(sementeDoDia("2026-08-10")).not.toBe(sementeDoDia("2026-08-11"));
  });
});
