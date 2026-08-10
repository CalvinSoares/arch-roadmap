import { describe, it, expect } from "vitest";
import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";
import { TEMPLATES } from "@/content/construtor/regras";
import {
  montarSimulacao,
  SEM_FALHAS,
  LABEL_TIPO,
  type Falhas,
  type TipoRequisicao,
} from "./simulador";

const camada = (
  camadaId: CamadaId,
  padroes: string[] = [],
  tecnologias: string[] = []
) => ({ camadaId, padroes, tecnologias });

/** Pilha de referência: CQRS com cache na leitura, Postgres na escrita, Kafka no meio. */
const CQRS: EstadoProjeto = {
  camadas: [
    camada("ui", [], ["cdn"]),
    camada("api", [], ["nginx"]),
    camada("aplicacao", ["cqrs"]),
    camada("dominio", ["hexagonal"]),
    camada("write-store", [], ["postgres"]),
    camada("read-store", [], ["redis", "elasticsearch"]),
    camada("fila", [], ["kafka"]),
    camada("infra", [], ["s3", "prometheus"]),
  ],
};

const TIPOS: TipoRequisicao[] = ["leitura", "escrita", "busca", "upload"];
const falhas = (f: Partial<Falhas>): Falhas => ({ ...SEM_FALHAS, ...f });

describe("simulador — invariantes", () => {
  it.each(TIPOS)("%s: total é a soma só dos passos síncronos", (tipo) => {
    const sim = montarSimulacao(CQRS, tipo, false);
    const sincronos = sim.passos.filter((p) => !p.assincrono);
    const soma = sincronos.reduce((a, p) => a + p.ms, 0);
    expect(sim.totalMs).toBe(soma);
    expect(sim.passos.some((p) => p.assincrono)).toBeDefined();
  });

  it.each(TIPOS)("%s: começa no usuário e nenhum par sai do nada", (tipo) => {
    const sim = montarSimulacao(CQRS, tipo, false);
    expect(sim.passos.length).toBeGreaterThan(0);
    const nos = new Set<string>(["usuario", ...sim.passos.map((p) => p.no)]);
    for (const par of sim.pares) {
      expect(nos.has(par.de), `par de ${par.de}`).toBe(true);
      expect(nos.has(par.para), `par para ${par.para}`).toBe(true);
      expect(par.de).not.toBe(par.para);
    }
  });

  it("projeto vazio não explode em nenhum tipo", () => {
    for (const tipo of TIPOS) {
      expect(() => montarSimulacao({ camadas: [] }, tipo, false)).not.toThrow();
    }
  });

  it("é determinístico", () => {
    for (const tipo of TIPOS) {
      expect(montarSimulacao(CQRS, tipo, true)).toEqual(
        montarSimulacao(CQRS, tipo, true)
      );
    }
  });

  it("todo tipo de requisição tem rótulo", () => {
    for (const tipo of TIPOS) expect(LABEL_TIPO[tipo]).toBeTruthy();
  });

  it.each(TEMPLATES.map((t) => [t.id, t.estado] as const))(
    "%s: os 4 tipos rodam sem erro com a stack do template",
    (_id, estado) => {
      for (const tipo of TIPOS) {
        const sim = montarSimulacao(estado, tipo, true);
        expect(sim.passos.length, tipo).toBeGreaterThan(0);
        expect(["ok", "degradado", "erro"]).toContain(sim.resultado);
      }
    }
  );
});

describe("simulador — cache quente x frio", () => {
  it("HIT responde mais rápido que MISS e não toca o banco", () => {
    const frio = montarSimulacao(CQRS, "leitura", false);
    const quente = montarSimulacao(CQRS, "leitura", true);

    expect(quente.totalMs).toBeLessThan(frio.totalMs);
    // no HIT o caminho não desce até a fonte da verdade
    expect(quente.passos.some((p) => p.no === "write-store")).toBe(false);
    expect(frio.passos.some((p) => p.no === "write-store")).toBe(true);
  });

  it("o MISS popula o cache — a narração ensina que a próxima vira HIT", () => {
    const frio = montarSimulacao(CQRS, "leitura", false);
    const texto = frio.passos.map((p) => `${p.rotulo} ${p.detalhe}`).join(" ").toLowerCase();
    expect(texto).toContain("cache");
  });

  it("CQRS pula o domínio na leitura, mas não na escrita", () => {
    const leitura = montarSimulacao(CQRS, "leitura", false);
    const escrita = montarSimulacao(CQRS, "escrita", false);
    expect(leitura.passos.some((p) => p.no === "dominio")).toBe(false);
    expect(escrita.passos.some((p) => p.no === "dominio")).toBe(true);
  });
});

/**
 * Os cenários de falha que o simulador precisa ensinar. Já foram verificados
 * só no browser uma vez; aqui viram asserção para não regredirem em silêncio.
 */
describe("simulador — chaos (Fase C)", () => {
  it("banco fora + cache frio → erro (não há de onde servir)", () => {
    const sim = montarSimulacao(CQRS, "leitura", false, falhas({ banco: true }));
    expect(sim.resultado).toBe("erro");
    expect(sim.passos.some((p) => p.falha)).toBe(true);
    expect(sim.avisos.length).toBeGreaterThan(0);
  });

  it("banco fora + cache QUENTE → sobrevive servindo da memória", () => {
    const sim = montarSimulacao(CQRS, "leitura", true, falhas({ banco: true }));
    expect(sim.resultado).not.toBe("erro");
    expect(sim.totalMs).toBeGreaterThan(0);
  });

  it("banco fora na escrita COM fila → aceita em vez de falhar", () => {
    const sim = montarSimulacao(CQRS, "escrita", false, falhas({ banco: true }));
    expect(sim.resultado).not.toBe("erro");
    const texto = sim.passos.map((p) => p.detalhe).join(" ") + sim.avisos.join(" ");
    expect(texto.length).toBeGreaterThan(0);
  });

  it("banco fora na escrita SEM fila → não tem como aceitar", () => {
    const semFila: EstadoProjeto = {
      camadas: CQRS.camadas.filter((c) => c.camadaId !== "fila"),
    };
    const sim = montarSimulacao(semFila, "escrita", false, falhas({ banco: true }));
    expect(sim.resultado).toBe("erro");
  });

  it("fila fora na escrita → grava, mas a projeção congela", () => {
    const sim = montarSimulacao(CQRS, "escrita", false, falhas({ fila: true }));
    expect(sim.resultado).not.toBe("erro");
    expect(sim.avisos.join(" ").length).toBeGreaterThan(0);
    expect(sim.passos.some((p) => p.falha)).toBe(true);
  });

  it("cache fora → tudo vira MISS e a leitura fica mais lenta", () => {
    const normal = montarSimulacao(CQRS, "leitura", true);
    const semCache = montarSimulacao(CQRS, "leitura", true, falhas({ cache: true }));
    expect(semCache.totalMs).toBeGreaterThan(normal.totalMs);
    expect(semCache.resultado).not.toBe("erro");
  });

  it("busca sobrevive ao banco fora (Elastic é projeção independente)", () => {
    const sim = montarSimulacao(CQRS, "busca", false, falhas({ banco: true }));
    expect(sim.resultado).not.toBe("erro");
  });

  it("derrubar tudo nunca quebra a função — só muda o resultado", () => {
    for (const tipo of TIPOS) {
      const sim = montarSimulacao(
        CQRS,
        tipo,
        false,
        falhas({ cache: true, banco: true, fila: true })
      );
      expect(sim.passos.length, tipo).toBeGreaterThan(0);
      expect(["ok", "degradado", "erro"]).toContain(sim.resultado);
    }
  });
});

describe("simulador — ausência de tecnologia vira lição", () => {
  it("busca sem Elasticsearch é mais lenta que com", () => {
    const semElastic: EstadoProjeto = {
      camadas: CQRS.camadas.map((c) =>
        c.camadaId === "read-store"
          ? { ...c, tecnologias: c.tecnologias.filter((t) => t !== "elasticsearch") }
          : c
      ),
    };
    const com = montarSimulacao(CQRS, "busca", false);
    const sem = montarSimulacao(semElastic, "busca", false);
    expect(sem.totalMs).toBeGreaterThan(com.totalMs);
    expect(sem.avisos.length).toBeGreaterThan(0);
  });

  it("upload sem S3 é mais lento e avisa sobre BLOB no banco", () => {
    const semS3: EstadoProjeto = {
      camadas: CQRS.camadas.map((c) =>
        c.camadaId === "infra"
          ? { ...c, tecnologias: c.tecnologias.filter((t) => t !== "s3") }
          : c
      ),
    };
    const com = montarSimulacao(CQRS, "upload", false);
    const sem = montarSimulacao(semS3, "upload", false);
    expect(sem.totalMs).toBeGreaterThan(com.totalMs);
    expect(sem.avisos.length).toBeGreaterThan(0);
  });

  it("`disponivel` reflete as peças realmente presentes", () => {
    const sim = montarSimulacao(CQRS, "leitura", false);
    expect(sim.disponivel).toEqual({
      cache: true,
      banco: true,
      fila: true,
      busca: true,
      storage: true,
    });

    const magro: EstadoProjeto = {
      camadas: [camada("dominio"), camada("infra", [], ["postgres"])],
    };
    const s2 = montarSimulacao(magro, "leitura", false);
    expect(s2.disponivel.cache).toBe(false);
    expect(s2.disponivel.fila).toBe(false);
    expect(s2.disponivel.banco).toBe(true);
  });
});
