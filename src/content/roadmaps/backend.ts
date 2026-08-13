import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Trilha de backend: da linguagem à operação, passando por dados, APIs e
 * mensageria. Os itens com `conceito` abrem a página do catálogo; os demais,
 * de gênero fora do catálogo (Git, HTTP, SQL), trazem recursos externos
 * curados, no espírito do roadmap.sh.
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
        {
          id: "be-linguagem",
          titulo: "Uma linguagem com profundidade",
          descricao: "Escolha uma e vá fundo antes de colecionar outras.",
          recursos: [
            { titulo: "Teach Yourself CS", href: "https://teachyourselfcs.com/", tipo: "curso", fonte: "TYCS" },
          ],
        },
        {
          id: "be-git",
          titulo: "Git e fluxo de trabalho",
          descricao: "Histórico, branches e o fluxo que evita caos no time.",
          recursos: [
            { titulo: "Pro Git (livro completo)", href: "https://git-scm.com/book/en/v2", tipo: "doc", fonte: "git-scm" },
            { titulo: "Learn Git Branching (interativo)", href: "https://learngitbranching.js.org/", tipo: "ferramenta", fonte: "LGB" },
          ],
        },
        {
          id: "be-terminal",
          titulo: "Terminal e Linux básico",
          descricao: "Navegar, editar e depurar sem sair da linha de comando.",
          recursos: [
            { titulo: "The Missing Semester (MIT)", href: "https://missing.csail.mit.edu/", tipo: "curso", fonte: "MIT" },
            { titulo: "Linux Journey", href: "https://linuxjourney.com/", tipo: "curso", fonte: "Linux Journey" },
          ],
        },
        {
          id: "be-estruturas",
          titulo: "Estruturas de dados e complexidade",
          descricao: "Escolher a estrutura certa muda o custo de cada operação.",
          recursos: [
            { titulo: "VisuAlgo — estruturas visualizadas", href: "https://visualgo.net/en", tipo: "ferramenta", fonte: "VisuAlgo" },
            { titulo: "Big-O Cheat Sheet", href: "https://www.bigocheatsheet.com/", tipo: "artigo", fonte: "Big-O" },
          ],
        },
        {
          id: "be-testes",
          titulo: "Testes automatizados",
          descricao: "Unidade, integração e a diferença prática entre elas.",
          recursos: [
            { titulo: "The Practical Test Pyramid", href: "https://martinfowler.com/articles/practical-test-pyramid.html", tipo: "artigo", fonte: "Fowler" },
            { titulo: "Test Double (dublês de teste)", href: "https://martinfowler.com/bliki/TestDouble.html", tipo: "artigo", fonte: "Fowler" },
          ],
        },
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
        {
          id: "be-http",
          titulo: "HTTP a sério",
          descricao: "Métodos, status, cache, cabeçalhos — não só GET e POST.",
          recursos: [
            { titulo: "HTTP — guia completo", href: "https://developer.mozilla.org/en-US/docs/Web/HTTP", tipo: "doc", fonte: "MDN" },
            { titulo: "RFC 9110 — HTTP Semantics", href: "https://www.rfc-editor.org/rfc/rfc9110.html", tipo: "spec", fonte: "RFC Editor" },
          ],
        },
        {
          id: "be-rest",
          titulo: "REST e modelagem de recursos",
          descricao: "Recursos, verbos e URLs que descrevem o domínio.",
          recursos: [
            { titulo: "Richardson Maturity Model", href: "https://martinfowler.com/articles/richardsonMaturityModel.html", tipo: "artigo", fonte: "Fowler" },
            { titulo: "REST API Tutorial", href: "https://restfulapi.net/", tipo: "artigo", fonte: "restfulapi.net" },
          ],
        },
        {
          id: "be-autenticacao",
          titulo: "Autenticação: sessão e cookie httpOnly",
          descricao: "Provar identidade — cookie Secure/SameSite, não localStorage.",
          conceito: "autenticacao",
          essencial: true,
          prerequisitos: ["be-http"],
        },
        {
          id: "be-jwt",
          titulo: "JWT: claims assinadas e vida curta",
          conceito: "jwt",
          essencial: true,
          prerequisitos: ["be-autenticacao"],
        },
        {
          id: "be-oauth2",
          titulo: "OAuth 2.0 e OIDC",
          descricao: "Delegar login e acesso — Code + PKCE.",
          conceito: "oauth2",
          prerequisitos: ["be-autenticacao"],
        },
        {
          id: "be-mfa",
          titulo: "MFA / 2FA",
          conceito: "mfa",
          prerequisitos: ["be-autenticacao"],
        },
        {
          id: "be-autorizacao",
          titulo: "Autorização: RBAC e guards",
          conceito: "autorizacao",
          essencial: true,
          prerequisitos: ["be-autenticacao"],
        },
        {
          id: "be-versionamento",
          titulo: "Versionamento e compatibilidade",
          descricao: "Quebrar clientes é caro — planeje a evolução da API.",
          recursos: [
            { titulo: "Semantic Versioning", href: "https://semver.org/", tipo: "spec", fonte: "SemVer" },
            { titulo: "API versioning (Stripe)", href: "https://stripe.com/blog/api-versioning", tipo: "artigo", fonte: "Stripe" },
          ],
        },
        { id: "be-webhooks", titulo: "Webhooks: receber eventos de terceiros", conceito: "webhooks" },
        {
          id: "be-graphql",
          titulo: "GraphQL",
          descricao: "O cliente pede o que precisa — com cuidado no N+1.",
          opcional: true,
          recursos: [
            { titulo: "Introduction to GraphQL", href: "https://graphql.org/learn/", tipo: "doc", fonte: "graphql.org" },
          ],
        },
        {
          id: "be-grpc",
          titulo: "gRPC para comunicação interna",
          descricao: "RPC tipado e eficiente entre serviços internos.",
          opcional: true,
          recursos: [
            { titulo: "What is gRPC?", href: "https://grpc.io/docs/what-is-grpc/introduction/", tipo: "doc", fonte: "grpc.io" },
          ],
        },
        { id: "be-facade", titulo: "Facade na borda", conceito: "facade", opcional: true },
        { id: "be-chain", titulo: "Middleware como corrente", conceito: "chain-of-responsibility", opcional: true },
      ],
    },
    {
      id: "dados",
      titulo: "Dados e persistência",
      descricao: "Onde a verdade do sistema realmente mora.",
      items: [
        {
          id: "be-sql",
          titulo: "SQL e modelagem relacional",
          descricao: "Tabelas, joins e a modelagem que carrega o sistema.",
          recursos: [
            { titulo: "SQLBolt — SQL interativo", href: "https://sqlbolt.com/", tipo: "curso", fonte: "SQLBolt" },
            { titulo: "PostgreSQL Tutorial", href: "https://www.postgresql.org/docs/current/tutorial.html", tipo: "doc", fonte: "PostgreSQL" },
          ],
        },
        { id: "be-indices", titulo: "Índices e planos de execução", descricao: "Entender por que uma query ficou lenta.", conceito: "indice" },
        { id: "be-transacoes", titulo: "Transações e níveis de isolamento", conceito: "niveis-de-isolamento" },
        { id: "be-race-condition", titulo: "Race conditions e escrita atômica", conceito: "race-condition" },
        { id: "be-migracoes", titulo: "Migrações sem downtime", descricao: "Strangler fig, dupla escrita, backfill.", conceito: "strangler-fig" },
        {
          id: "be-cache",
          titulo: "Cache e invalidação",
          conceito: "cache",
          recursos: [
            { titulo: "HTTP Caching", href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching", tipo: "doc", fonte: "MDN" },
            { titulo: "HTTP cache — o guia", href: "https://web.dev/articles/http-cache", tipo: "artigo", fonte: "web.dev" },
          ],
        },
        {
          id: "be-nosql",
          titulo: "NoSQL: quando faz sentido",
          descricao: "Documento, chave-valor ou grafo — só quando o modelo pede.",
          opcional: true,
          recursos: [
            { titulo: "NoSQL (Martin Fowler)", href: "https://martinfowler.com/nosql.html", tipo: "artigo", fonte: "Fowler" },
          ],
        },
        { id: "be-repositorio", titulo: "Repositório atrás de uma porta", conceito: "repository", opcional: true },
      ],
    },
    {
      id: "assincrono",
      titulo: "Assíncrono e mensageria",
      descricao: "O que não cabe no tempo de uma requisição.",
      items: [
        { id: "be-filas", titulo: "Filas e workers", descricao: "Dividir trabalho ou difundir fato.", conceito: "fila-vs-pubsub" },
        { id: "be-idempotencia", titulo: "Idempotência e retry", descricao: "Reprocessar sem cobrar duas vezes.", conceito: "idempotencia" },
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
        { id: "be-camadas", titulo: "Camadas e a regra da dependência", conceito: "clean-architecture" },
        { id: "be-cqrs", titulo: "CQRS", conceito: "cqrs", opcional: true },
        { id: "be-event-sourcing", titulo: "Event Sourcing", conceito: "event-sourcing", opcional: true },
        { id: "be-microsservicos", titulo: "Monólito × microsserviços", descricao: "Quando dividir custa mais do que resolve.", conceito: "microsservicos", opcional: true },
      ],
    },
    {
      id: "operacao",
      titulo: "Operação",
      descricao: "Software que ninguém consegue operar não está pronto.",
      items: [
        {
          id: "be-logs",
          titulo: "Logs estruturados",
          descricao: "Eventos consultáveis, não print espalhado.",
          recursos: [
            { titulo: "The Twelve-Factor App — Logs", href: "https://12factor.net/logs", tipo: "artigo", fonte: "12factor" },
          ],
        },
        {
          id: "be-metricas",
          titulo: "Métricas e alertas",
          descricao: "Números que disparam alerta antes do usuário reclamar.",
          recursos: [
            { titulo: "SRE Book — Monitoring", href: "https://sre.google/sre-book/monitoring-distributed-systems/", tipo: "doc", fonte: "Google SRE" },
            { titulo: "Prometheus — Overview", href: "https://prometheus.io/docs/introduction/overview/", tipo: "doc", fonte: "Prometheus" },
          ],
        },
        {
          id: "be-tracing",
          titulo: "Tracing distribuído",
          descricao: "Seguir uma requisição através de vários serviços.",
          opcional: true,
          recursos: [
            { titulo: "What is OpenTelemetry?", href: "https://opentelemetry.io/docs/what-is-opentelemetry/", tipo: "doc", fonte: "OpenTelemetry" },
          ],
        },
        { id: "be-vps", titulo: "Um servidor seu: VPS na unha", conceito: "vps" },
        { id: "be-docker", titulo: "Containers e imagens", conceito: "docker" },
        { id: "be-kubernetes", titulo: "Orquestração com Kubernetes", conceito: "kubernetes", opcional: true },
        {
          id: "be-ci",
          titulo: "CI/CD e deploy seguro",
          descricao: "Blue-green, canário, rollback.",
          recursos: [
            { titulo: "Continuous Integration (Fowler)", href: "https://martinfowler.com/articles/continuousIntegration.html", tipo: "artigo", fonte: "Fowler" },
            { titulo: "Blue-Green Deployment", href: "https://martinfowler.com/bliki/BlueGreenDeployment.html", tipo: "artigo", fonte: "Fowler" },
          ],
        },
        {
          id: "be-segredos",
          titulo: "Gestão de segredos",
          conceito: "gestao-de-segredos",
          essencial: true,
        },
        {
          id: "be-allowlist",
          titulo: "Allowlist na borda",
          conceito: "allowlist",
          prerequisitos: ["be-http"],
        },
        {
          id: "be-rate-limit",
          titulo: "Rate limiting contra abuso",
          conceito: "rate-limiting",
          essencial: true,
          prerequisitos: ["be-autenticacao"],
        },
        {
          id: "be-audit-log",
          titulo: "Auditoria append-only (WAL mental)",
          descricao: "Log que não se apaga — quem leu o segredo, quem virou admin.",
          conceito: "append-only",
          opcional: true,
          prerequisitos: ["be-segredos"],
        },
        {
          id: "be-seguranca-owasp",
          titulo: "OWASP Top Ten e dependências",
          descricao: "O mapa externo do que ainda não virou página no catálogo.",
          recursos: [
            { titulo: "OWASP Top Ten", href: "https://owasp.org/www-project-top-ten/", tipo: "doc", fonte: "OWASP" },
            { titulo: "OWASP Cheat Sheet Series", href: "https://cheatsheetseries.owasp.org/", tipo: "doc", fonte: "OWASP" },
            {
              titulo: "OWASP Authentication Cheat Sheet",
              href: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
              tipo: "doc",
              fonte: "OWASP",
            },
          ],
          prerequisitos: ["be-autenticacao", "be-autorizacao"],
        },
      ],
    },
  ],
};
