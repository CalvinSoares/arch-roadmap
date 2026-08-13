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
        { id: "ar-dip", titulo: "DIP — Inversão de Dependência", conceito: "dip", descricao: "Alto nível não depende de detalhe — ambos dependem da abstração que o alto nível declara." },
        { id: "ar-srp", titulo: "SRP em escala de módulo", conceito: "srp", descricao: "Um módulo, uma razão para mudar — um interessado do negócio, não três." },
        { id: "ar-hexagonal", titulo: "Arquitetura Hexagonal", conceito: "hexagonal", descricao: "Domínio no centro; o mundo externo entra só por portas e adaptadores." },
        { id: "ar-camadas", titulo: "Camadas e a regra da dependência", conceito: "clean-architecture", descricao: "Dependências só apontam para dentro: o domínio não conhece banco nem framework." },
        { id: "ar-adapter", titulo: "Adapter nas bordas", conceito: "adapter", descricao: "Traduz a interface alheia para a que o seu código espera.", opcional: true },
        { id: "ar-acl", titulo: "Camada anticorrupção contra o legado", conceito: "anti-corruption-layer", descricao: "Traduz o modelo do legado para o seu — e impede o vocabulário torto de entrar.", opcional: true },
      ],
    },
    {
      id: "dominio",
      titulo: "Modelagem de domínio",
      descricao: "Onde mora o valor do sistema — e o que o protege.",
      items: [
        { id: "ar-linguagem", titulo: "Linguagem ubíqua e contextos delimitados", descricao: "O domínio fala uma língua; cada contexto delimitado tem a sua — misturar as duas vira bagunça.", recursos: [
          { titulo: "Ubiquitous Language (Fowler)", href: "https://martinfowler.com/bliki/UbiquitousLanguage.html", tipo: "artigo", fonte: "Fowler" },
          { titulo: "Bounded Context (Fowler)", href: "https://martinfowler.com/bliki/BoundedContext.html", tipo: "artigo", fonte: "Fowler" },
        ] },
        { id: "ar-agregados", titulo: "Agregados e invariantes", conceito: "agregado", descricao: "Grupo que muda e precisa ser consistente junto, por trás de uma raiz." },
        { id: "ar-value-object", titulo: "Value Object: valor sem identidade", conceito: "value-object", descricao: "Igualdade pelo conteúdo, imutável — regras no tipo, não num number cru." },
        { id: "ar-uow", titulo: "Unit of Work: uma transação por operação", conceito: "unit-of-work", descricao: "Acumula as mudanças da operação e confirma tudo de uma vez — ou nada.", opcional: true },
        { id: "ar-repository", titulo: "Repository: a fronteira da persistência", conceito: "repository", descricao: "Coleção de domínio que esconde o banco atrás de perguntas do negócio." },
        { id: "ar-state", titulo: "Máquinas de estado explícitas", conceito: "maquina-de-estados", descricao: "Estados e transições numa tabela: o que não está nela é impossível." },
        { id: "ar-lsp", titulo: "LSP e contratos honestos", conceito: "lsp", descricao: "Subtipo substitui o supertipo sem surpresa — contrato de comportamento, não só de assinatura.", opcional: true },
        { id: "ar-interpreter", titulo: "Regras configuráveis com Interpreter", conceito: "interpreter", descricao: "Regras como árvore avaliável: uma mini-linguagem que o negócio pode configurar.", opcional: true },
      ],
    },
    {
      id: "dados",
      titulo: "Dados em escala",
      descricao: "Quando um banco deixa de dar conta e o modelo precisa mudar.",
      items: [
        { id: "ar-cqs", titulo: "CQS", conceito: "cqs", descricao: "Comando muda e não devolve; query devolve e não muda — nunca os dois." },
        { id: "ar-cqrs", titulo: "CQRS", conceito: "cqrs", descricao: "Modelo de escrita separado do de leitura — cada lado otimizado para o seu trabalho." },
        { id: "ar-event-sourcing", titulo: "Event Sourcing", conceito: "event-sourcing", descricao: "Guarda a sequência de eventos; o estado atual é derivado, não a fonte.", opcional: true },
        { id: "ar-append-only", titulo: "Logs append-only", conceito: "append-only", descricao: "Só se acrescenta: corrigir é gravar um registro novo que supera o anterior." },
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
        { id: "ar-saga", titulo: "Saga e compensações", conceito: "saga", descricao: "Transação longa como passos locais com compensação — sem 2PC." },
        { id: "ar-2pc", titulo: "Two-Phase Commit: atomicidade travada", conceito: "two-phase-commit", descricao: "Commitar em vários bancos juntos — e por que sagas existem.", opcional: true },
        { id: "ar-idempotencia", titulo: "Idempotência e entrega ao menos uma vez", conceito: "idempotencia", descricao: "Fazer duas vezes tem o mesmo efeito de uma — o que torna o retry seguro." },
        { id: "ar-webhooks", titulo: "Webhooks entre sistemas", conceito: "webhooks", descricao: "O outro sistema te chama quando acontece — Observer atravessando a rede.", opcional: true },
        { id: "ar-resiliencia", titulo: "Timeout, retry, circuit breaker", descricao: "A tríade da resiliência: prazo para falhar, repetição para insistir, disjuntor para parar de insistir — nessa ordem. A trilha de Resiliência abre cada uma.", recursos: [
        { titulo: "Release It! — padrões de estabilidade", href: "https://pragprog.com/titles/mnee2/release-it-second-edition/", tipo: "artigo", fonte: "Nygard" },
      ] },
        { id: "ar-gateway", titulo: "API Gateway: a entrada única", conceito: "api-gateway", descricao: "Entrada única que roteia e concentra o transversal — e pode virar gargalo.", opcional: true },
        { id: "ar-bff", titulo: "Backend for Frontend", conceito: "bff", descricao: "Um backend por tipo de cliente, moldado à interface — não uma API genérica para todos.", opcional: true },
        { id: "ar-proxy", titulo: "Chamada remota é um Proxy", conceito: "proxy", descricao: "Mesma interface na frente: controla acesso, cache, lazy ou a chamada remota.", opcional: true },
        { id: "ar-cap", titulo: "CAP e seus mal-entendidos", conceito: "cap", descricao: "Na partição, escolha: consistência ou disponibilidade — não as duas.", opcional: true },
      ],
    },
    {
      id: "decisao",
      titulo: "Decisão e custo",
      descricao: "A parte que separa arquitetura de coleção de padrões.",
      items: [
        { id: "ar-tradeoffs", titulo: "Toda escolha tem um custo operacional", descricao: "Cada peça nova pede deploy, backup, alerta e plantão.", recursos: [
          { titulo: "Software Architecture Guide (Fowler)", href: "https://martinfowler.com/architecture/", tipo: "artigo", fonte: "Fowler" },
          { titulo: "SRE Book — Simplicity", href: "https://sre.google/sre-book/simplicity/", tipo: "doc", fonte: "Google SRE" },
        ] },
        { id: "ar-adr", titulo: "Registrar decisões (ADR)", descricao: "Decisão sem registro vira lenda: o ADR captura o porquê, as alternativas e o custo aceito.", recursos: [
          { titulo: "Architecture Decision Records", href: "https://adr.github.io/", tipo: "doc", fonte: "adr.github.io" },
          { titulo: "ADR — exemplos e templates", href: "https://github.com/joelparkerhenderson/architecture-decision-record", tipo: "artigo", fonte: "GitHub" },
        ] },
        { id: "ar-monolito", titulo: "Monólito modular antes de dividir", conceito: "monolito-modular", descricao: "Um deploy, módulos com fronteiras reais — modularidade sem pagar a rede." },
        { id: "ar-microsservicos", titulo: "Microsserviços: autonomia e o seu preço", conceito: "microsservicos", descricao: "Autonomia de deploy e escala — cobrada em rede, sagas e operação.", opcional: true },
        { id: "ar-conway", titulo: "Lei de Conway", conceito: "lei-de-conway", descricao: "A arquitetura tende a espelhar a organização.", opcional: true },
        { id: "ar-evolucao", titulo: "Arquitetura evolutiva e fitness functions", descricao: "Projetar para mudar: 'fitness functions' que testam propriedades arquiteturais como se fossem testes automatizados.", opcional: true, recursos: [
          { titulo: "Fitness function-driven development", href: "https://www.thoughtworks.com/insights/articles/fitness-function-driven-development", tipo: "artigo", fonte: "ThoughtWorks" },
          { titulo: "Architectural fitness function (Radar)", href: "https://www.thoughtworks.com/radar/techniques/architectural-fitness-function", tipo: "artigo", fonte: "ThoughtWorks" },
        ] },
      ],
    },
    {
      id: "operacao",
      titulo: "Operação e evolução",
      descricao: "O sistema em produção é o único que conta.",
      items: [
        { id: "ar-observabilidade", titulo: "Observabilidade: logs, métricas, tracing", descricao: "Três sinais para perguntar ao sistema o que está acontecendo — sem adivinhar.", recursos: [
          { titulo: "SRE Book — Monitoring", href: "https://sre.google/sre-book/monitoring-distributed-systems/", tipo: "doc", fonte: "Google SRE" },
          { titulo: "What is OpenTelemetry?", href: "https://opentelemetry.io/docs/what-is-opentelemetry/", tipo: "doc", fonte: "OpenTelemetry" },
        ] },
        { id: "ar-slo", titulo: "SLO, SLI e orçamento de erro", descricao: "O SLI mede, o SLO define o alvo, o orçamento de erro diz quanto pode falhar.", recursos: [
          { titulo: "SRE Book — Service Level Objectives", href: "https://sre.google/sre-book/service-level-objectives/", tipo: "doc", fonte: "Google SRE" },
        ] },
        { id: "ar-migracao", titulo: "Migrações em produção", conceito: "strangler-fig", descricao: "Strangler fig, dupla escrita, backfill." },
        { id: "ar-postmortem", titulo: "Post-mortem sem culpados", descricao: "Aprender com o incidente sem caça às bruxas — causa, impacto e o que muda.", opcional: true, recursos: [
          { titulo: "SRE Book — Postmortem Culture", href: "https://sre.google/sre-book/postmortem-culture/", tipo: "doc", fonte: "Google SRE" },
        ] },
      ],
    },
  ],
};
