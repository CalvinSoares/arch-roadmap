import { camadaDef, padraoDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import type {
  EstadoProjeto,
  Insight,
  ScoreProjeto,
} from "@/shared/types/construtor";
import type { RevisaoProjeto } from "@/content/construtor/sugestoes";

export interface DadosADR {
  /** ISO `YYYY-MM-DD`. Entra por parâmetro: função pura não lê o relógio. */
  data: string;
  estado: EstadoProjeto;
  score: ScoreProjeto;
  revisao: RevisaoProjeto;
  insights: Insight[];
  /** URL que reabre este projeto no construtor. Vazio omite a seção. */
  link?: string;
}

const nomeCamada = (id: string) => camadaDef(id)?.nome ?? id;
const nomePadrao = (id: string) => padraoDef(id)?.nome ?? id;
const nomeTech = (id: string) => tecnologiaDef(id)?.nome ?? id;

/**
 * Leitura da métrica em texto. No painel o rótulo é "Alto/Médio/Baixo" e a
 * cor diz se isso é bom; em Markdown não há cor, então "complexidade: alto"
 * ficaria ambíguo — aqui o julgamento entra na própria frase.
 */
function leitura(valor: number, invertida: boolean): string {
  const nivel = valor >= 66 ? "alto" : valor >= 33 ? "médio" : "baixo";
  const bom = invertida ? valor <= 55 : valor >= 55;
  return `${nivel} — ${bom ? "confortável" : "merece atenção"}`;
}

const METRICAS: {
  chave: keyof Omit<ScoreProjeto, "fatores">;
  nome: string;
  /** menor é melhor */
  invertida: boolean;
}[] = [
  { chave: "desacoplamento", nome: "Desacoplamento", invertida: false },
  { chave: "testabilidade", nome: "Testabilidade", invertida: false },
  { chave: "resiliencia", nome: "Resiliência", invertida: false },
  { chave: "complexidade", nome: "Complexidade", invertida: true },
  { chave: "custoOperacional", nome: "Custo operacional", invertida: true },
];

/**
 * Serializa o projeto montado como um Architecture Decision Record.
 *
 * O formato segue a estrutura clássica (contexto → decisão → consequências),
 * que é o que times esperam encontrar num ADR — a diferença é que aqui as
 * consequências não são adivinhadas: saem das mesmas regras que o painel usa.
 *
 * Função pura: sem `new Date()`, sem acesso a `window`. Data e link entram
 * por parâmetro justamente para o teste ser determinístico.
 */
export function gerarADR({
  data,
  estado,
  score,
  revisao,
  insights,
  link,
}: DadosADR): string {
  const l: string[] = [];
  const alertas = insights.filter((i) => i.nivel === "alerta");
  const sinergias = insights.filter((i) => i.nivel === "sinergia");

  l.push("# ADR — Arquitetura do projeto");
  l.push("");
  l.push(`- **Data:** ${data}`);
  l.push(`- **Status:** proposto`);
  l.push(
    `- **Camadas:** ${estado.camadas.length} · **Padrões:** ${estado.camadas.reduce((a, c) => a + c.padroes.length, 0)} · **Tecnologias:** ${estado.camadas.reduce((a, c) => a + c.tecnologias.length, 0)}`
  );
  l.push("");

  // ——— Contexto ———
  l.push("## Contexto");
  l.push("");
  l.push(
    "A pilha abaixo descreve o desenho proposto, do mais próximo do usuário ao mais próximo da infraestrutura."
  );
  l.push("");
  for (const [i, c] of estado.camadas.entries()) {
    const def = camadaDef(c.camadaId);
    l.push(`${i + 1}. **${nomeCamada(c.camadaId)}**`);
    if (def?.descricao) l.push(`   - Papel: ${def.descricao}`);
    if (c.padroes.length > 0) {
      l.push(`   - Padrões: ${c.padroes.map(nomePadrao).join(", ")}`);
    }
    if (c.tecnologias.length > 0) {
      l.push(`   - Tecnologias: ${c.tecnologias.map(nomeTech).join(", ")}`);
    }
  }
  l.push("");

  // ——— Decisão ———
  l.push("## Decisão");
  l.push("");
  l.push(revisao.veredito);
  if (sinergias.length > 0) {
    l.push("");
    l.push("O desenho se sustenta nestes encaixes:");
    l.push("");
    for (const s of sinergias) l.push(`- **${s.titulo}** — ${s.explicacao}`);
  }
  l.push("");

  // ——— Consequências ———
  l.push("## Consequências");
  l.push("");
  l.push("| Métrica | Valor | Leitura |");
  l.push("| --- | ---: | --- |");
  for (const m of METRICAS) {
    l.push(
      `| ${m.nome} | ${score[m.chave]} | ${leitura(score[m.chave], m.invertida)} |`
    );
  }
  l.push("");
  l.push(
    "_Complexidade e custo operacional são invertidos: quanto menor, melhor._"
  );

  if (score.fatores.length > 0) {
    l.push("");
    l.push("<details><summary>Como esses números foram montados</summary>");
    l.push("");
    for (const f of score.fatores) l.push(`- ${f}`);
    l.push("");
    l.push("</details>");
  }

  if (alertas.length > 0) {
    l.push("");
    l.push("### Riscos assumidos");
    l.push("");
    for (const a of alertas) l.push(`- **${a.titulo}** — ${a.explicacao}`);
  }
  l.push("");

  // ——— Próximos passos ———
  if (revisao.proximos.length > 0) {
    l.push("## Próximos passos");
    l.push("");
    for (const [i, p] of revisao.proximos.entries()) l.push(`${i + 1}. ${p}`);
    l.push("");
  }

  if (link) {
    l.push("---");
    l.push("");
    l.push(`[Abrir este projeto no DevMappa](${link})`);
    l.push("");
  }

  return l.join("\n");
}

/** Nome sugerido do arquivo: `adr-arquitetura-2026-08-10.md`. */
export function nomeArquivoADR(data: string): string {
  return `adr-arquitetura-${data}.md`;
}
