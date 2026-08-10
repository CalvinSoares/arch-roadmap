import { describe, it, expect } from "vitest";
import type { CamadaId, EstadoProjeto, ScoreProjeto } from "@/shared/types/construtor";
import { calcularScore, TEMPLATES } from "./regras";
import { ORDEM_CANONICA } from "./blocos";

const camada = (
  camadaId: CamadaId,
  padroes: string[] = [],
  tecnologias: string[] = []
) => ({ camadaId, padroes, tecnologias });

const METRICAS = [
  "desacoplamento",
  "testabilidade",
  "resiliencia",
  "complexidade",
  "custoOperacional",
] as const;

const estados: [string, EstadoProjeto][] = [
  ["vazio", { camadas: [] }],
  ["só domínio", { camadas: [camada("dominio")] }],
  ["pilha canônica vazia", { camadas: ORDEM_CANONICA.map((id) => camada(id)) }],
  ...TEMPLATES.map(
    (t) => [`template ${t.id}`, t.estado] as [string, EstadoProjeto]
  ),
];

describe("score didático", () => {
  it.each(estados)("%s: toda métrica fica entre 0 e 100", (_nome, estado) => {
    const s = calcularScore(estado);
    for (const m of METRICAS) {
      expect(s[m], m).toBeGreaterThanOrEqual(0);
      expect(s[m], m).toBeLessThanOrEqual(100);
      expect(Number.isFinite(s[m]), m).toBe(true);
    }
  });

  it("é determinístico — mesmo estado, mesmo score", () => {
    for (const [, estado] of estados) {
      expect(calcularScore(estado)).toEqual(calcularScore(estado));
    }
  });

  it("projeto vazio não inventa fatores", () => {
    expect(calcularScore({ camadas: [] }).fatores).toEqual([]);
  });

  it("todo fator é uma frase marcada com +, − ou •", () => {
    for (const [nome, estado] of estados) {
      for (const f of calcularScore(estado).fatores) {
        expect(f.length, `${nome}: "${f}"`).toBeGreaterThan(10);
        expect(/^[+−•-]\s/.test(f), `${nome}: "${f}"`).toBe(true);
      }
    }
  });

  /** Proteger o domínio com portas não pode piorar o desacoplamento. */
  it("aplicar Hexagonal no domínio aumenta desacoplamento e testabilidade", () => {
    const sem: EstadoProjeto = {
      camadas: [camada("aplicacao"), camada("dominio"), camada("infra", [], ["postgres"])],
    };
    const com: EstadoProjeto = {
      camadas: [
        camada("aplicacao"),
        camada("dominio", ["hexagonal"]),
        camada("infra", [], ["postgres"]),
      ],
    };
    const a = calcularScore(sem);
    const b = calcularScore(com);
    expect(b.desacoplamento).toBeGreaterThan(a.desacoplamento);
    expect(b.testabilidade).toBeGreaterThan(a.testabilidade);
  });

  /** Adapter no núcleo é o contrato externo vazando para dentro. */
  it("Adapter no domínio derruba o desacoplamento", () => {
    const limpo: EstadoProjeto = { camadas: [camada("dominio", ["hexagonal"])] };
    const sujo: EstadoProjeto = {
      camadas: [camada("dominio", ["hexagonal", "adapter"])],
    };
    expect(calcularScore(sujo).desacoplamento).toBeLessThan(
      calcularScore(limpo).desacoplamento
    );
  });

  it("mais tecnologias custam mais para operar", () => {
    const enxuto: EstadoProjeto = {
      camadas: [camada("dominio"), camada("infra", [], ["postgres"])],
    };
    const pesado: EstadoProjeto = {
      camadas: [
        camada("dominio"),
        camada("infra", [], ["postgres", "kafka", "elasticsearch", "redis"]),
      ],
    };
    expect(calcularScore(pesado).custoOperacional).toBeGreaterThan(
      calcularScore(enxuto).custoOperacional
    );
  });

  it("mais camadas e padrões aumentam a complexidade", () => {
    const simples: EstadoProjeto = { camadas: [camada("dominio")] };
    const complexo: EstadoProjeto = {
      camadas: ORDEM_CANONICA.map((id) =>
        camada(id, id === "dominio" ? ["hexagonal", "strategy"] : [])
      ),
    };
    expect(calcularScore(complexo).complexidade).toBeGreaterThan(
      calcularScore(simples).complexidade
    );
  });

  /** Cache na leitura e fila na escrita são as duas alavancas de resiliência. */
  it("cache na leitura aumenta a resiliência", () => {
    const sem: EstadoProjeto = {
      camadas: [camada("dominio"), camada("write-store", [], ["postgres"]), camada("read-store")],
    };
    const com: EstadoProjeto = {
      camadas: [
        camada("dominio"),
        camada("write-store", [], ["postgres"]),
        camada("read-store", [], ["redis"]),
      ],
    };
    expect(calcularScore(com).resiliencia).toBeGreaterThan(
      calcularScore(sem).resiliencia
    );
  });

  /**
   * Regressão: com os pesos antigos, 4 dos 6 templates marcavam exatamente
   * 100 de complexidade. Uma barra presa no teto não ensina nada — não mostra
   * o custo de cada peça nova nem deixa a marca de referência comparar
   * modelos. O teto existe para exagero, não para projeto real.
   */
  it("nenhum template curado satura complexidade ou custo", () => {
    for (const t of TEMPLATES) {
      const s: ScoreProjeto = calcularScore(t.estado);
      expect(s.complexidade, `${t.id} complexidade`).toBeLessThan(100);
      expect(s.custoOperacional, `${t.id} custo`).toBeLessThan(100);
    }
  });

  it("a complexidade distingue os templates entre si", () => {
    const valores = TEMPLATES.map((t) => calcularScore(t.estado).complexidade);
    // pelo menos 4 patamares distintos entre os 6 modelos
    expect(new Set(valores).size).toBeGreaterThanOrEqual(4);
    // e o CRUD simples continua muito abaixo do e-commerce com CQRS
    const crud = calcularScore(TEMPLATES.find((t) => t.id === "crud")!.estado);
    const ecom = calcularScore(
      TEMPLATES.find((t) => t.id === "ecommerce-cqrs")!.estado
    );
    expect(ecom.complexidade - crud.complexidade).toBeGreaterThan(30);
  });

  /** Cada peça adicionada tem de mover a barra — senão o custo fica invisível. */
  it("adicionar uma tecnologia a um projeto grande ainda move a complexidade", () => {
    const grande = TEMPLATES.find((t) => t.id === "ecommerce-cqrs")!.estado;
    const antes = calcularScore(grande).complexidade;
    const maior: EstadoProjeto = {
      camadas: grande.camadas.map((c, i) =>
        i === 0 ? { ...c, tecnologias: [...c.tecnologias, "grpc"] } : c
      ),
    };
    expect(calcularScore(maior).complexidade).toBeGreaterThan(antes);
  });
});
