import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Trilha de backend: da linguagem à operação, passando por dados, APIs e
 * mensageria. Os itens com conceito abrem a página correspondente.
 */
export const roadmapBackend: Roadmap = {
  slug: "backend",
  titulo: "Backend",
  descricao:
    "O caminho de quem constrói o lado do servidor: linguagem, dados, APIs, mensageria e o que é preciso para manter tudo isso no ar.",
  sections: [
    {
      id: "fundamentos",
      titulo: "Fundamentos",
      descricao: "A base que independe de linguagem e framework.",
      items: [
        { id: "be-linguagem", titulo: "Uma linguagem com profundidade", descricao: "Escolha uma e vá fundo antes de colecionar outras." },
        { id: "be-git", titulo: "Git e fluxo de trabalho" },
        { id: "be-terminal", titulo: "Terminal e Linux básico" },
        { id: "be-estruturas", titulo: "Estruturas de dados e complexidade" },
        { id: "be-testes", titulo: "Testes automatizados", descricao: "Unidade, integração e a diferença prática entre elas." },
      ],
    },
    {
      id: "design",
      titulo: "Design de código",
      descricao: "Como escrever algo que ainda faça sentido daqui a um ano.",
      items: [
        { id: "be-srp", titulo: "SRP — Responsabilidade Única", conceito: "srp" },
        { id: "be-dip", titulo: "DIP — Inversão de Dependência", conceito: "dip" },
        { id: "be-ocp", titulo: "OCP — Aberto/Fechado", conceito: "ocp", opcional: true },
        { id: "be-strategy", titulo: "Strategy", conceito: "strategy", opcional: true },
        { id: "be-factory", titulo: "Factory Method", conceito: "factory-method", opcional: true },
      ],
    },
    {
      id: "apis",
      titulo: "APIs",
      descricao: "Como o mundo conversa com o seu sistema.",
      items: [
        { id: "be-http", titulo: "HTTP a sério", descricao: "Métodos, status, cache, cabeçalhos — não só GET e POST." },
        { id: "be-rest", titulo: "REST e modelagem de recursos" },
        { id: "be-auth", titulo: "Autenticação e autorização", descricao: "Sessão, JWT, OAuth2 — e onde cada um falha." },
        { id: "be-versionamento", titulo: "Versionamento e compatibilidade" },
        { id: "be-graphql", titulo: "GraphQL", opcional: true },
        { id: "be-grpc", titulo: "gRPC para comunicação interna", opcional: true },
        { id: "be-facade", titulo: "Facade na borda", conceito: "facade", opcional: true },
        { id: "be-chain", titulo: "Middleware como corrente", conceito: "chain-of-responsibility", opcional: true },
      ],
    },
    {
      id: "dados",
      titulo: "Dados e persistência",
      descricao: "Onde a verdade do sistema realmente mora.",
      items: [
        { id: "be-sql", titulo: "SQL e modelagem relacional" },
        { id: "be-indices", titulo: "Índices e planos de execução", descricao: "Entender por que uma query ficou lenta." },
        { id: "be-transacoes", titulo: "Transações e níveis de isolamento" },
        { id: "be-migracoes", titulo: "Migrações sem downtime" },
        { id: "be-cache", titulo: "Cache e invalidação" },
        { id: "be-nosql", titulo: "NoSQL: quando faz sentido", opcional: true },
        { id: "be-repositorio", titulo: "Repositório atrás de uma porta", conceito: "dip", opcional: true },
      ],
    },
    {
      id: "assincrono",
      titulo: "Assíncrono e mensageria",
      descricao: "O que não cabe no tempo de uma requisição.",
      items: [
        { id: "be-filas", titulo: "Filas e workers" },
        { id: "be-idempotencia", titulo: "Idempotência e retry", descricao: "Reprocessar sem cobrar duas vezes." },
        { id: "be-observer", titulo: "Eventos e Observer", conceito: "observer" },
        { id: "be-command", titulo: "Comandos serializáveis", conceito: "command", opcional: true },
        { id: "be-saga", titulo: "Saga para transações distribuídas", conceito: "saga", opcional: true },
      ],
    },
    {
      id: "arquitetura",
      titulo: "Arquitetura",
      descricao: "Organizar o sistema quando ele deixa de caber na cabeça.",
      items: [
        { id: "be-hexagonal", titulo: "Arquitetura Hexagonal", conceito: "hexagonal" },
        { id: "be-camadas", titulo: "Camadas e fronteiras" },
        { id: "be-cqrs", titulo: "CQRS", conceito: "cqrs", opcional: true },
        { id: "be-event-sourcing", titulo: "Event Sourcing", conceito: "event-sourcing", opcional: true },
        { id: "be-microsservicos", titulo: "Monólito × microsserviços", descricao: "Quando dividir custa mais do que resolve.", opcional: true },
      ],
    },
    {
      id: "operacao",
      titulo: "Operação",
      descricao: "Software que ninguém consegue operar não está pronto.",
      items: [
        { id: "be-logs", titulo: "Logs estruturados" },
        { id: "be-metricas", titulo: "Métricas e alertas" },
        { id: "be-tracing", titulo: "Tracing distribuído", opcional: true },
        { id: "be-docker", titulo: "Containers e imagens" },
        { id: "be-ci", titulo: "CI/CD e deploy seguro", descricao: "Blue-green, canário, rollback." },
        { id: "be-seguranca", titulo: "Segurança: segredos, OWASP, dependências" },
      ],
    },
  ],
};
