import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Trilha de arquitetura: das fronteiras dentro de um processo às decisões
 * distribuídas — sempre com o custo operacional explícito.
 */
export const roadmapArquitetura: Roadmap = {
  slug: "arquitetura",
  titulo: "Arquitetura de Software",
  descricao:
    "Das fronteiras dentro de um único processo às decisões distribuídas: o que cada escolha compra, o que ela cobra, e como saber se você precisa dela.",
  sections: [
    {
      id: "fronteiras",
      titulo: "Fronteiras",
      descricao: "Arquitetura é, antes de tudo, decidir o que não conhece o quê.",
      items: [
        { id: "ar-dip", titulo: "DIP — Inversão de Dependência", conceito: "dip" },
        { id: "ar-srp", titulo: "SRP em escala de módulo", conceito: "srp" },
        { id: "ar-hexagonal", titulo: "Arquitetura Hexagonal", conceito: "hexagonal" },
        { id: "ar-camadas", titulo: "Camadas e a regra da dependência", conceito: "clean-architecture" },
        { id: "ar-adapter", titulo: "Adapter nas bordas", conceito: "adapter", opcional: true },
        { id: "ar-acl", titulo: "Camada anticorrupção contra o legado", conceito: "anti-corruption-layer", opcional: true },
      ],
    },
    {
      id: "dominio",
      titulo: "Modelagem de domínio",
      descricao: "Onde mora o valor do sistema — e o que o protege.",
      items: [
        { id: "ar-linguagem", titulo: "Linguagem ubíqua e contextos delimitados", recursos: [
          { titulo: "Ubiquitous Language (Fowler)", href: "https://martinfowler.com/bliki/UbiquitousLanguage.html", tipo: "artigo", fonte: "Fowler" },
          { titulo: "Bounded Context (Fowler)", href: "https://martinfowler.com/bliki/BoundedContext.html", tipo: "artigo", fonte: "Fowler" },
        ] },
        { id: "ar-agregados", titulo: "Agregados e invariantes", conceito: "agregado" },
        { id: "ar-value-object", titulo: "Value Object: valor sem identidade", conceito: "value-object" },
        { id: "ar-uow", titulo: "Unit of Work: uma transação por operação", conceito: "unit-of-work", opcional: true },
        { id: "ar-repository", titulo: "Repository: a fronteira da persistência", conceito: "repository" },
        { id: "ar-state", titulo: "Máquinas de estado explícitas", conceito: "maquina-de-estados" },
        { id: "ar-lsp", titulo: "LSP e contratos honestos", conceito: "lsp", opcional: true },
        { id: "ar-interpreter", titulo: "Regras configuráveis com Interpreter", conceito: "interpreter", opcional: true },
      ],
    },
    {
      id: "dados",
      titulo: "Dados em escala",
      descricao: "Quando um banco deixa de dar conta e o modelo precisa mudar.",
      items: [
        { id: "ar-cqs", titulo: "CQS", conceito: "cqs" },
        { id: "ar-cqrs", titulo: "CQRS", conceito: "cqrs" },
        { id: "ar-event-sourcing", titulo: "Event Sourcing", conceito: "event-sourcing", opcional: true },
        { id: "ar-append-only", titulo: "Logs append-only", conceito: "append-only" },
        { id: "ar-ledger", titulo: "Ledger e partidas dobradas", conceito: "ledger", descricao: "Saldo é soma de lançamentos — não uma coluna." },
        { id: "ar-consistencia", titulo: "Consistência eventual", conceito: "consistencia-eventual", descricao: "O que muda para o usuário quando a leitura atrasa." },
        { id: "ar-replica", titulo: "Réplica de leitura", conceito: "replica-de-leitura", descricao: "Escalar leitura copiando — e o atraso que vem junto." },
        { id: "ar-indice", titulo: "Índice: a estrutura que a query usa", conceito: "indice", descricao: "A diferença entre achar uma linha e varrer todas." },
        { id: "ar-sharding", titulo: "Sharding: partir os dados", conceito: "sharding", descricao: "Quando nem o volume nem a escrita cabem numa máquina.", opcional: true },
      ],
    },
    {
      id: "distribuido",
      titulo: "Sistemas distribuídos",
      descricao: "A partir daqui, a rede faz parte do seu modelo mental.",
      items: [
        { id: "ar-falacias", titulo: "As falácias da computação distribuída", conceito: "falacias-sistemas-distribuidos", descricao: "A rede não é confiável, a latência não é zero." },
        { id: "ar-saga", titulo: "Saga e compensações", conceito: "saga" },
      { id: "ar-2pc", titulo: "Two-Phase Commit: atomicidade travada", conceito: "two-phase-commit", descricao: "Commitar em vários bancos juntos — e por que sagas existem.", opcional: true },
        { id: "ar-idempotencia", titulo: "Idempotência e entrega ao menos uma vez", conceito: "idempotencia" },
        { id: "ar-webhooks", titulo: "Webhooks entre sistemas", conceito: "webhooks", opcional: true },
        { id: "ar-resiliencia", titulo: "Timeout, retry, circuit breaker", descricao: "A tríade da resiliência: prazo para falhar, repetição para insistir, disjuntor para parar de insistir — nessa ordem. A trilha de Resiliência abre cada uma.", recursos: [
        { titulo: "Release It! — padrões de estabilidade", href: "https://pragprog.com/titles/mnee2/release-it-second-edition/", tipo: "artigo", fonte: "Nygard" },
      ] },
      { id: "ar-gateway", titulo: "API Gateway: a entrada única", conceito: "api-gateway", opcional: true },
      { id: "ar-bff", titulo: "Backend for Frontend", conceito: "bff", opcional: true },
        { id: "ar-proxy", titulo: "Chamada remota é um Proxy", conceito: "proxy", opcional: true },
        { id: "ar-cap", titulo: "CAP e seus mal-entendidos", conceito: "cap", opcional: true },
      ],
    },
    {
      id: "decisao",
      titulo: "Decisão e custo",
      descricao: "A parte que separa arquitetura de coleção de padrões.",
      items: [
        { id: "ar-tradeoffs", titulo: "Toda escolha tem um custo operacional", descricao: "Cada peça nova pede deploy, backup, alerta e plantão." },
        { id: "ar-adr", titulo: "Registrar decisões (ADR)", recursos: [
          { titulo: "Architecture Decision Records", href: "https://adr.github.io/", tipo: "doc", fonte: "adr.github.io" },
          { titulo: "ADR — exemplos e templates", href: "https://github.com/joelparkerhenderson/architecture-decision-record", tipo: "artigo", fonte: "GitHub" },
        ] },
        { id: "ar-monolito", titulo: "Monólito modular antes de dividir", conceito: "monolito-modular" },
      { id: "ar-microsservicos", titulo: "Microsserviços: autonomia e o seu preço", conceito: "microsservicos", opcional: true },
        { id: "ar-conway", titulo: "Lei de Conway", conceito: "lei-de-conway", descricao: "A arquitetura tende a espelhar a organização.", opcional: true },
        { id: "ar-evolucao", titulo: "Arquitetura evolutiva e fitness functions", descricao: "Projetar para mudar: 'fitness functions' que testam propriedades arquiteturais como se fossem testes automatizados.", opcional: true },
      ],
    },
    {
      id: "operacao",
      titulo: "Operação e evolução",
      descricao: "O sistema em produção é o único que conta.",
      items: [
        { id: "ar-observabilidade", titulo: "Observabilidade: logs, métricas, tracing", recursos: [
          { titulo: "SRE Book — Monitoring", href: "https://sre.google/sre-book/monitoring-distributed-systems/", tipo: "doc", fonte: "Google SRE" },
          { titulo: "What is OpenTelemetry?", href: "https://opentelemetry.io/docs/what-is-opentelemetry/", tipo: "doc", fonte: "OpenTelemetry" },
        ] },
        { id: "ar-slo", titulo: "SLO, SLI e orçamento de erro", recursos: [
          { titulo: "SRE Book — Service Level Objectives", href: "https://sre.google/sre-book/service-level-objectives/", tipo: "doc", fonte: "Google SRE" },
        ] },
        { id: "ar-migracao", titulo: "Migrações em produção", conceito: "strangler-fig", descricao: "Strangler fig, dupla escrita, backfill." },
        { id: "ar-postmortem", titulo: "Post-mortem sem culpados", opcional: true, recursos: [
          { titulo: "SRE Book — Postmortem Culture", href: "https://sre.google/sre-book/postmortem-culture/", tipo: "doc", fonte: "Google SRE" },
        ] },
      ],
    },
  ],
};
