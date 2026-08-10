import { describe, it, expect } from "vitest";
import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";
import { REGRAS, TEMPLATES, avaliarRegras, paresForaDeOrdem, ordemCanonica } from "./regras";
import { CAMADAS_DEF, PADROES_DEF, ORDEM_CANONICA } from "./blocos";
import { TECNOLOGIAS_DEF } from "./tecnologias";
import { listConceitos } from "@/shared/lib/content";

const VAZIO: EstadoProjeto = { camadas: [] };

const camada = (
  camadaId: CamadaId,
  padroes: string[] = [],
  tecnologias: string[] = []
) => ({ camadaId, padroes, tecnologias });

/**
 * Corpus de estados usado para exercitar as regras: os 6 templates curados,
 * mais um estado por padrão e por tecnologia colocados em cada camada onde
 * podem viver (e uma vez fora do lugar). Cobre o espaço de forma barata sem
 * escrever 71 fixtures à mão.
 */
function corpus(): EstadoProjeto[] {
  const estados: EstadoProjeto[] = [VAZIO, ...TEMPLATES.map((t) => t.estado)];

  // pilha completa, canônica, vazia de padrões/techs
  const pilhaCheia = ORDEM_CANONICA.map((id) => camada(id));
  estados.push({ camadas: pilhaCheia });
  // e a mesma pilha invertida (dispara as regras de ordem)
  estados.push({ camadas: [...pilhaCheia].reverse() });

  for (const p of PADROES_DEF) {
    for (const alvo of p.aplicaEm) estados.push({ camadas: [camada(alvo, [p.id])] });
    // fora do lugar: primeira camada que não é recomendada
    const fora = CAMADAS_DEF.find((c) => !p.aplicaEm.includes(c.id));
    if (fora) estados.push({ camadas: [camada(fora.id, [p.id])] });
  }

  for (const t of TECNOLOGIAS_DEF) {
    for (const alvo of t.viveEm) estados.push({ camadas: [camada(alvo, [], [t.id])] });
    const fora = CAMADAS_DEF.find((c) => !t.viveEm.includes(c.id));
    if (fora) estados.push({ camadas: [camada(fora.id, [], [t.id])] });
  }

  // Combos dirigidos: regras que só disparam com duas peças juntas nunca
  // seriam alcançadas pelos estados de uma peça só acima.
  const combos: EstadoProjeto[] = [
    // cqrs com os dois stores e SEM fila
    {
      camadas: [
        camada("aplicacao", ["cqrs"]),
        camada("dominio", ["hexagonal"]),
        camada("write-store", [], ["postgres"]),
        camada("read-store", [], ["redis"]),
      ],
    },
    // cqrs com fila (o caminho feliz)
    {
      camadas: [
        camada("aplicacao", ["cqrs"]),
        camada("dominio", ["hexagonal", "strategy"]),
        camada("write-store", [], ["postgres"]),
        camada("read-store", [], ["redis"]),
        camada("fila", ["saga"], ["kafka"]),
        camada("infra", [], ["prometheus", "vault"]),
      ],
    },
    // observer em 3 camadas → cascata
    {
      camadas: [
        camada("ui", ["observer"]),
        camada("aplicacao", ["observer"]),
        camada("fila", ["observer"], ["kafka"]),
      ],
    },
    // domínio sobrecarregado (4+ padrões)
    {
      camadas: [
        camada("dominio", ["hexagonal", "strategy", "state", "event-sourcing"]),
      ],
    },
    // state + strategy · builder + abstract factory
    {
      camadas: [
        camada("dominio", ["state", "strategy"]),
        camada("aplicacao", ["builder", "abstract-factory"]),
      ],
    },
    // dois caches · réplica com cache
    {
      camadas: [
        camada("read-store", [], ["redis", "memcached"]),
        camada("infra", [], ["replica-leitura"]),
      ],
    },
    // duas filas · rabbitmq com saga
    {
      camadas: [
        camada("dominio", ["hexagonal"]),
        camada("fila", ["saga"], ["kafka", "rabbitmq"]),
        camada("infra", [], ["postgres"]),
      ],
    },
    // gateway com decorator e com nginx
    {
      camadas: [
        camada("api", ["decorator", "facade", "adapter"], ["api-gateway", "nginx"]),
        camada("dominio", ["hexagonal"]),
      ],
    },
    // posicionais: UI colada na infra · fila no topo · adapter no núcleo
    { camadas: [camada("ui"), camada("infra", [], ["postgres"])] },
    { camadas: [camada("fila", [], ["kafka"]), camada("ui"), camada("dominio")] },
    {
      camadas: [
        camada("aplicacao", ["adapter"]),
        camada("dominio", ["adapter", "hexagonal"]),
      ],
    },
    // "pia de cozinha": muitas peças legítimas convivendo
    {
      camadas: [
        camada("ui", ["observer"], ["cdn"]),
        camada("api", ["facade"], ["nginx"]),
        camada("aplicacao", ["cqrs"], ["worker"]),
        camada("dominio", ["event-sourcing"]),
        camada("write-store", [], ["mongodb"]),
        camada("read-store", [], ["elasticsearch"]),
        camada("fila", ["observer"], ["rabbitmq"]),
        camada("infra", ["singleton"], ["s3", "grpc", "prometheus", "vault"]),
      ],
    },
  ];

  return [...estados, ...combos];
}

const CORPUS = corpus();

describe("catálogo de regras", () => {
  it("todas as regras têm id único", () => {
    const ids = REGRAS.map((r) => r.id);
    const duplicados = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicados).toEqual([]);
  });

  it("todas as regras têm nível válido, título e explicação úteis", () => {
    for (const r of REGRAS) {
      expect(["sinergia", "alerta", "info"], r.id).toContain(r.nivel);
      expect(r.titulo.trim().length, r.id).toBeGreaterThan(3);
      expect(r.explicacao.trim().length, r.id).toBeGreaterThan(40);
    }
  });

  /** Regra que nunca dispara é regra morta — o usuário nunca a veria. */
  it("toda regra dispara em pelo menos um estado do corpus", () => {
    const mortas = REGRAS.filter((r) => !CORPUS.some((e) => r.quando(e))).map(
      (r) => r.id
    );
    expect(mortas).toEqual([]);
  });

  /** Regra sempre ligada vira ruído e não ensina nada. */
  it("nenhuma regra dispara em todos os estados do corpus", () => {
    const sempre = REGRAS.filter((r) => CORPUS.every((e) => r.quando(e))).map(
      (r) => r.id
    );
    expect(sempre).toEqual([]);
  });

  /**
   * Projeto vazio é silencioso de propósito: a UI mostra o estado vazio
   * convidando a montar, não uma lista de defeitos. `sem-dominio` exige
   * `camadas.length > 0` justamente para isso.
   */
  it("projeto vazio não gera nenhum insight", () => {
    expect(avaliarRegras(VAZIO)).toEqual([]);
  });

  it("qualquer camada sem domínio acusa a ausência dele", () => {
    const ids = avaliarRegras({ camadas: [camada("api")] }).map((i) => i.id);
    expect(ids).toContain("sem-dominio");
  });

  /** Links quebrados para /conceitos/[slug] são 404 silenciosos. */
  it("todo slug de conceito citado por uma regra existe", () => {
    const validos = new Set(listConceitos().map((c) => c.slug));
    const quebrados: string[] = [];
    for (const r of REGRAS) {
      for (const slug of r.conceitos ?? []) {
        if (!validos.has(slug)) quebrados.push(`${r.id} → ${slug}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("nenhuma regra explode em nenhum estado do corpus", () => {
    for (const e of CORPUS) {
      expect(() => avaliarRegras(e)).not.toThrow();
    }
  });

  it("insights gerados têm id único dentro de cada estado", () => {
    for (const e of CORPUS) {
      const ids = avaliarRegras(e).map((i) => i.id);
      expect(new Set(ids).size, JSON.stringify(e.camadas.map((c) => c.camadaId))).toBe(
        ids.length
      );
    }
  });
});

describe("ordem canônica", () => {
  it("pilha na ordem canônica não tem par fora de ordem", () => {
    const camadas = ORDEM_CANONICA.map((id) => camada(id));
    expect(paresForaDeOrdem({ camadas })).toEqual([]);
    expect(ordemCanonica({ camadas })).toBe(true);
  });

  it("pilha invertida acusa pares fora de ordem", () => {
    const camadas = [...ORDEM_CANONICA].reverse().map((id) => camada(id));
    expect(paresForaDeOrdem({ camadas }).length).toBeGreaterThan(0);
    expect(ordemCanonica({ camadas })).toBe(false);
  });

  it("projeto vazio e de uma camada estão trivialmente em ordem", () => {
    expect(ordemCanonica(VAZIO)).toBe(true);
    expect(ordemCanonica({ camadas: [camada("dominio")] })).toBe(true);
  });

  it("domínio abaixo da infra é detectado", () => {
    const camadas = [camada("infra"), camada("dominio")];
    expect(paresForaDeOrdem({ camadas }).length).toBeGreaterThan(0);
  });
});
