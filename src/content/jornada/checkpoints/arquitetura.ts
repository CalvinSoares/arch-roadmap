import type { Desafio } from "@/shared/types/desafio";
import { mcq, vf } from "./_helpers";

export const CHECKPOINTS_ARQUITETURA: Record<string, Desafio[]> = {
  "arquitetura:ar-linguagem": [
    vf(
      "arquitetura:ar-linguagem:vf1",
      "Linguagem ubíqua significa o time de produto e o código usarem as mesmas palavras para os mesmos conceitos — menos tradução mental.",
      true,
      "Se o negócio diz 'apolice' e o código diz 'PolicyEntityDTO2', o bug mora na tradução."
    ),
    mcq(
      "arquitetura:ar-linguagem:mcq1",
      "Contexto delimitado (bounded context) serve para:",
      "limite",
      [
        {
          id: "limite",
          label: "Limitar onde um termo tem um significado — fora dali pode significar outra coisa",
        },
        {
          id: "db",
          label: "Obrigatoriedade de um único banco global",
        },
        {
          id: "css",
          label: "Definir o tema visual do app",
        },
        {
          id: "unico",
          label: "Ter um único modelo de dados para a empresa inteira para sempre",
        },
      ],
      "DDD: o mesmo 'cliente' no CRM e no faturamento pode não ser o mesmo conceito."
    ),
  ],

  "arquitetura:ar-resiliencia": [
    vf(
      "arquitetura:ar-resiliencia:vf1",
      "A ordem saudável costuma ser: timeout (prazo) → retry (insistir com cuidado) → circuit breaker (parar de insistir).",
      true,
      "Sem prazo não há falha observável; sem limite de retry você vira o ataque. A trilha de Resiliência aprofunda cada um."
    ),
    mcq(
      "arquitetura:ar-resiliencia:mcq1",
      "Retry sem timeout na dependência tende a:",
      "prender",
      [
        {
          id: "prender",
          label: "Prender threads/workers esperando para sempre",
        },
        {
          id: "acelerar",
          label: "Acelerar a dependência magicamente",
        },
        {
          id: "cache",
          label: "Virar cache HTTP automaticamente",
        },
        {
          id: "ok",
          label: "Ser a configuração recomendada em produção",
        },
      ],
      "Retry precisa de falha detectável — timeout é o que cria o evento de falha."
    ),
  ],

  "arquitetura:ar-tradeoffs": [
    vf(
      "arquitetura:ar-tradeoffs:vf1",
      "Cada caixa nova no diagrama (fila, cache, serviço) chega com custo: deploy, alerta, backup, plantão.",
      true,
      "Arquitetura é escolher qual dor você aceita — não colecionar padrões."
    ),
    mcq(
      "arquitetura:ar-tradeoffs:mcq1",
      "Antes de adicionar mais um microsserviço, a pergunta útil é:",
      "custo",
      [
        {
          id: "custo",
          label: "Qual problema operacional isso resolve — e qual dor nova cria?",
        },
        {
          id: "slides",
          label: "Isso fica bonito no slide?",
        },
        {
          id: "cv",
          label: "Cabe no LinkedIn do time?",
        },
        {
          id: "sempre",
          label: "Sempre vale — mais serviços = mais escala automática",
        },
      ],
      "Trade-off explícito. Moda não paga on-call."
    ),
  ],

  "arquitetura:ar-adr": [
    vf(
      "arquitetura:ar-adr:vf1",
      "ADR (Architecture Decision Record) registra o porquê de uma decisão — não só o estado final do código.",
      true,
      "Daqui a um ano alguém pergunta 'por que Kafka?'. O ADR responde sem arqueologia de Slack."
    ),
    mcq(
      "arquitetura:ar-adr:mcq1",
      "Um ADR bom costuma incluir:",
      "contexto",
      [
        {
          id: "contexto",
          label: "Contexto, decisão e consequências (o que se ganha e se perde)",
        },
        {
          id: "so-sim",
          label: "Só a palavra 'aprovado'",
        },
        {
          id: "diff",
          label: "Apenas o diff do PR, sem prosa",
        },
        {
          id: "secreto",
          label: "Nada escrito — decisão oral na sala",
        },
      ],
      "Contexto + decision + consequences é o template clássico."
    ),
  ],

  "arquitetura:ar-evolucao": [
    vf(
      "arquitetura:ar-evolucao:vf1",
      "Fitness function em arquitetura evolutiva é um teste automatizado de propriedade (ex.: latência, dependências proibidas) — não academia de ginástica.",
      true,
      "Você codifica a restrição que quer preservar enquanto o sistema muda."
    ),
    mcq(
      "arquitetura:ar-evolucao:mcq1",
      "Exemplo de fitness function útil:",
      "dep",
      [
        {
          id: "dep",
          label: "CI falha se o módulo de domínio importar o framework web",
        },
        {
          id: "lorem",
          label: "Lorem ipsum no README",
        },
        {
          id: "cor",
          label: "A cor do logo ser hexadecimal",
        },
        {
          id: "mute",
          label: "Proibir qualquer teste automatizado",
        },
      ],
      "A regra arquitetural vira assert no pipeline."
    ),
  ],

  "arquitetura:ar-observabilidade": [
    vf(
      "arquitetura:ar-observabilidade:vf1",
      "Logs, métricas e traces respondem perguntas diferentes — um não substitui os outros três.",
      true,
      "Métrica alerta; trace explica o caminho; log dá o detalhe. Observabilidade é o conjunto."
    ),
    mcq(
      "arquitetura:ar-observabilidade:mcq1",
      "Latência p95 subiu. O instrumento que melhor mostra *onde* o tempo foi gasto entre serviços é:",
      "trace",
      [
        { id: "trace", label: "Tracing distribuído" },
        { id: "favicon", label: "Olhar o favicon" },
        { id: "readme", label: "Ler o README" },
        { id: "css", label: "Aumentar o z-index" },
      ],
      "Trace quebra o pedido em spans — o mapa do tempo."
    ),
  ],

  "arquitetura:ar-slo": [
    vf(
      "arquitetura:ar-slo:vf1",
      "SLO define o alvo de confiabilidade; orçamento de erro é quanto de falha você ainda 'pode gastar' antes de frear mudança.",
      true,
      "Sem orçamento, todo deploy é guerra. Com orçamento, risco fica explícito."
    ),
    mcq(
      "arquitetura:ar-slo:mcq1",
      "Na linguagem de SRE, SLI é o quê — em relação ao SLO?",
      "indicador",
      [
        {
          id: "indicador",
          label: "O indicador medido (ex.: % de requests < 300ms)",
        },
        {
          id: "objetivo",
          label: "Só o número alvo, sem medição",
        },
        {
          id: "culpa",
          label: "A pessoa culpada pelo incidente",
        },
        {
          id: "slide",
          label: "O slide de arquitetura",
        },
      ],
      "SLI = medida; SLO = meta sobre essa medida."
    ),
  ],

  "arquitetura:ar-postmortem": [
    vf(
      "arquitetura:ar-postmortem:vf1",
      "Post-mortem sem culpa foca em causas sistêmicas e ações — não em humilhar quem estava de plantão.",
      true,
      "Cultura de aprendizado. Culpa individual esconde o buraco do processo."
    ),
    mcq(
      "arquitetura:ar-postmortem:mcq1",
      "Um post-mortem útil termina com:",
      "acoes",
      [
        {
          id: "acoes",
          label: "Ações concretas com dono e prazo",
        },
        {
          id: "meme",
          label: "Só memes no Slack",
        },
        {
          id: "demissao",
          label: "Lista de demissões",
        },
        {
          id: "nada",
          label: "Nada — o importante é o ritual",
        },
      ],
      "Sem action items, foi terapia em grupo — não engenharia."
    ),
  ],
};
