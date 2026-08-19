import { avaliarRegras, calcularScore } from "@/content/construtor/regras";
import { camadaDef, padraoDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import type { EstadoProjeto, ScoreProjeto } from "@/shared/types/construtor";

/**
 * Diff entre dois projetos montados (funções puras).
 *
 * Serve pra responder "e se eu tirasse a fila?" no Construtor: as cinco
 * métricas se movem juntas, e comparar duas versões de cabeça esconde o
 * trade-off.
 */

export type Metrica = keyof Omit<ScoreProjeto, "fatores">;

export const METRICAS: { chave: Metrica; label: string; menorEMelhor: boolean }[] = [
  { chave: "desacoplamento", label: "Desacoplamento", menorEMelhor: false },
  { chave: "testabilidade", label: "Testabilidade", menorEMelhor: false },
  { chave: "resiliencia", label: "Resiliência", menorEMelhor: false },
  { chave: "complexidade", label: "Complexidade", menorEMelhor: true },
  { chave: "custoOperacional", label: "Custo operacional", menorEMelhor: true },
];

export interface DiffMetrica {
  chave: Metrica;
  label: string;
  a: number;
  b: number;
  delta: number;
  /** `melhor` leva em conta que complexidade e custo são invertidos. */
  veredito: "melhor" | "pior" | "igual";
}

export interface DiffPeca {
  /** Rótulo legível: nome da camada, do padrão ou da tecnologia. */
  label: string;
  /** Onde a peça vive, para dar contexto ao padrão/tecnologia. */
  onde?: string;
}

export interface DiffProjetos {
  metricas: DiffMetrica[];
  /** Presente em B e não em A. */
  soEmB: DiffPeca[];
  /** Presente em A e não em B. */
  soEmA: DiffPeca[];
  /** Alertas que B resolveu em relação a A. */
  alertasResolvidos: { id: string; titulo: string }[];
  /** Alertas que B introduziu. */
  alertasNovos: { id: string; titulo: string }[];
  /** Sinergias ganhas em B. */
  sinergiasGanhas: { id: string; titulo: string }[];
}

/** Todas as peças de um projeto, como chaves comparáveis. */
function pecas(p: EstadoProjeto): Map<string, DiffPeca> {
  const mapa = new Map<string, DiffPeca>();
  for (const c of p.camadas) {
    const nomeCamada = camadaDef(c.camadaId)?.nome ?? c.camadaId;
    mapa.set(`camada:${c.camadaId}`, { label: nomeCamada });
    for (const padrao of c.padroes) {
      mapa.set(`padrao:${padrao}:${c.camadaId}`, {
        label: padraoDef(padrao)?.nome ?? padrao,
        onde: nomeCamada,
      });
    }
    for (const tech of c.tecnologias) {
      mapa.set(`tech:${tech}:${c.camadaId}`, {
        label: tecnologiaDef(tech)?.nome ?? tech,
        onde: nomeCamada,
      });
    }
  }
  return mapa;
}

function insights(p: EstadoProjeto, nivel: "alerta" | "sinergia") {
  return avaliarRegras(p)
    .filter((i) => i.nivel === nivel)
    .map((i) => ({ id: i.id, titulo: i.titulo }));
}

/**
 * Compara A (referência) com B (variante).
 *
 * O `veredito` de cada métrica já resolve a inversão: em complexidade e custo
 * operacional, menor é melhor. Sem isso, um diff de `-8` em complexidade
 * apareceria como piora quando é justamente o ganho.
 */
export function compararProjetos(
  a: EstadoProjeto,
  b: EstadoProjeto
): DiffProjetos {
  const scoreA = calcularScore(a);
  const scoreB = calcularScore(b);

  const metricas: DiffMetrica[] = METRICAS.map(({ chave, label, menorEMelhor }) => {
    const va = scoreA[chave];
    const vb = scoreB[chave];
    const delta = vb - va;
    const melhorou = menorEMelhor ? delta < 0 : delta > 0;
    return {
      chave,
      label,
      a: va,
      b: vb,
      delta,
      veredito: delta === 0 ? "igual" : melhorou ? "melhor" : "pior",
    };
  });

  const pa = pecas(a);
  const pb = pecas(b);
  const soEmB = [...pb].filter(([k]) => !pa.has(k)).map(([, v]) => v);
  const soEmA = [...pa].filter(([k]) => !pb.has(k)).map(([, v]) => v);

  const alertasA = insights(a, "alerta");
  const alertasB = insights(b, "alerta");
  const idsA = new Set(alertasA.map((i) => i.id));
  const idsB = new Set(alertasB.map((i) => i.id));

  const sinergiasA = new Set(insights(a, "sinergia").map((i) => i.id));

  return {
    metricas,
    soEmB,
    soEmA,
    alertasResolvidos: alertasA.filter((i) => !idsB.has(i.id)),
    alertasNovos: alertasB.filter((i) => !idsA.has(i.id)),
    sinergiasGanhas: insights(b, "sinergia").filter((i) => !sinergiasA.has(i.id)),
  };
}

/** Uma frase que resume o diff, pra quem não quer tirar conclusão de cinco
 * números soltos. */
export function resumoDoDiff(diff: DiffProjetos): string {
  const melhores = diff.metricas.filter((m) => m.veredito === "melhor");
  const piores = diff.metricas.filter((m) => m.veredito === "pior");

  if (melhores.length === 0 && piores.length === 0) {
    return "As cinco métricas ficaram iguais — a mudança não move nenhum dos eixos que o motor mede.";
  }
  if (piores.length === 0) {
    return `A variante melhora ${melhores.map((m) => m.label.toLowerCase()).join(", ")} sem piorar nada. É raro, e vale desconfiar: confira se as peças novas não trouxeram custo que o motor não mede (gente para operar, por exemplo).`;
  }
  if (melhores.length === 0) {
    return `A variante piora ${piores.map((m) => m.label.toLowerCase()).join(", ")} e não melhora nada. A menos que exista um motivo fora dessas cinco métricas, a referência é melhor.`;
  }
  return `Troca: melhora ${melhores.map((m) => m.label.toLowerCase()).join(", ")} e piora ${piores.map((m) => m.label.toLowerCase()).join(", ")}. Não existe resposta certa aqui — existe qual dos lados importa no seu caso.`;
}
