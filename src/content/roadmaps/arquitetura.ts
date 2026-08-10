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
        { id: "ar-camadas", titulo: "Camadas e a regra da dependência" },
        { id: "ar-adapter", titulo: "Adapter nas bordas", conceito: "adapter", opcional: true },
      ],
    },
    {
      id: "dominio",
      titulo: "Modelagem de domínio",
      descricao: "Onde mora o valor do sistema — e o que o protege.",
      items: [
        { id: "ar-linguagem", titulo: "Linguagem ubíqua e contextos delimitados" },
        { id: "ar-agregados", titulo: "Agregados e invariantes" },
        { id: "ar-state", titulo: "Máquinas de estado explícitas", conceito: "state", opcional: true },
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
        { id: "ar-consistencia", titulo: "Consistência eventual", descricao: "O que muda para o usuário quando a leitura atrasa." },
        { id: "ar-particionamento", titulo: "Réplicas, particionamento e sharding", opcional: true },
      ],
    },
    {
      id: "distribuido",
      titulo: "Sistemas distribuídos",
      descricao: "A partir daqui, a rede faz parte do seu modelo mental.",
      items: [
        { id: "ar-falacias", titulo: "As falácias da computação distribuída", descricao: "A rede não é confiável, a latência não é zero." },
        { id: "ar-saga", titulo: "Saga e compensações", conceito: "saga" },
        { id: "ar-idempotencia", titulo: "Idempotência e entrega ao menos uma vez" },
        { id: "ar-resiliencia", titulo: "Timeout, retry, circuit breaker" },
        { id: "ar-proxy", titulo: "Chamada remota é um Proxy", conceito: "proxy", opcional: true },
        { id: "ar-cap", titulo: "CAP e seus mal-entendidos", opcional: true },
      ],
    },
    {
      id: "decisao",
      titulo: "Decisão e custo",
      descricao: "A parte que separa arquitetura de coleção de padrões.",
      items: [
        { id: "ar-tradeoffs", titulo: "Toda escolha tem um custo operacional", descricao: "Cada peça nova pede deploy, backup, alerta e plantão." },
        { id: "ar-adr", titulo: "Registrar decisões (ADR)" },
        { id: "ar-monolito", titulo: "Monólito modular antes de dividir" },
        { id: "ar-conway", titulo: "Lei de Conway", descricao: "A arquitetura tende a espelhar a organização.", opcional: true },
        { id: "ar-evolucao", titulo: "Arquitetura evolutiva e fitness functions", opcional: true },
      ],
    },
    {
      id: "operacao",
      titulo: "Operação e evolução",
      descricao: "O sistema em produção é o único que conta.",
      items: [
        { id: "ar-observabilidade", titulo: "Observabilidade: logs, métricas, tracing" },
        { id: "ar-slo", titulo: "SLO, SLI e orçamento de erro" },
        { id: "ar-migracao", titulo: "Migrações em produção", descricao: "Strangler fig, dupla escrita, backfill." },
        { id: "ar-postmortem", titulo: "Post-mortem sem culpados", opcional: true },
      ],
    },
  ],
};
