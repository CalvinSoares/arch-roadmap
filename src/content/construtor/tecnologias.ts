import type { TecnologiaDef } from "@/shared/types/construtor";

/**
 * Catálogo de tecnologias concretas do construtor. Cada ficha diz onde a
 * peça vive, para que serve e — principalmente — a diferença que faz.
 */
export const TECNOLOGIAS_DEF: TecnologiaDef[] = [
  {
    id: "redis",
    nome: "Redis",
    categoria: "cache",
    descricao: "Estruturas de dados em memória — cache, sessão, fila leve.",
    viveEm: ["read-store", "fila", "aplicacao"],
    usos: [
      "Cache-aside de consultas quentes",
      "Sessões e carrinho (TTL nativo)",
      "Rate limiting por chave",
      "Pub/sub leve e locks distribuídos",
    ],
    especificacoes: {
      modelo: "chave-valor em memória (strings, hashes, sets, streams)",
      persistencia: "opcional — AOF/RDB (não é a fonte da verdade)",
      consistencia: "forte no nó; eventual nas réplicas",
      latencia: "sub-milissegundo (µs)",
    },
    diferencaQueFaz:
      "Leituras que iam ao banco em ~10ms voltam em µs e o banco respira. Em troca: +1 peça para operar, dados voláteis por padrão e a pergunta 'e quando o cache cair?' passa a existir.",
    alternativas: ["Memcached", "Valkey", "CDN (para estáticos)"],
    conceitos: ["cache", "cqrs"],
  },
  {
    id: "memcached",
    nome: "Memcached",
    categoria: "cache",
    descricao: "Cache em memória minimalista — só chave-valor, muito rápido.",
    viveEm: ["read-store", "aplicacao"],
    usos: ["Cache-aside simples", "Fragmentos de página/HTML", "Resultados de queries"],
    especificacoes: {
      modelo: "chave-valor plano (sem estruturas)",
      persistencia: "nenhuma — 100% volátil",
      consistencia: "por nó; sem replicação nativa",
      latencia: "sub-milissegundo (µs)",
    },
    conceitos: ["cache"],
    diferencaQueFaz:
      "O cache mais simples possível: multithreaded e previsível. Se você só precisa de GET/SET com TTL, é mais enxuto que Redis — mas sem estruturas, persistência ou pub/sub.",
    alternativas: ["Redis", "Valkey"],
  },
  {
    id: "postgres",
    nome: "PostgreSQL",
    categoria: "banco",
    descricao: "Banco relacional ACID — a fonte da verdade de propósito geral.",
    viveEm: ["write-store", "read-store", "infra"],
    usos: [
      "Fonte da verdade transacional (ACID)",
      "Modelo normalizado com integridade referencial",
      "JSONB para semi-estruturado",
      "Event store append-only (com CQRS/ES)",
    ],
    especificacoes: {
      modelo: "relacional (SQL) + JSONB",
      persistencia: "durável (WAL)",
      consistencia: "forte (transações ACID)",
      latencia: "milissegundos",
    },
    diferencaQueFaz:
      "Invariantes garantidas por transação e um modelo que aguenta 90% dos domínios. O custo aparece em escala de leitura massiva (réplicas/cache viram necessidade) e em esquemas que mudam toda hora.",
    alternativas: ["MySQL/MariaDB", "MongoDB (documentos)", "CockroachDB (distribuído)"],
    conceitos: ["event-sourcing"],
  },
  {
    id: "mongodb",
    nome: "MongoDB",
    categoria: "banco",
    descricao: "Banco de documentos — esquema flexível, escala horizontal.",
    viveEm: ["write-store", "read-store"],
    usos: [
      "Documentos com esquema flexível/evolutivo",
      "Read models desnormalizados (CQRS)",
      "Catálogos e perfis com atributos variáveis",
    ],
    especificacoes: {
      modelo: "documentos BSON (JSON)",
      persistencia: "durável (journal)",
      consistencia: "ajustável (write/read concern)",
      latencia: "milissegundos",
    },
    diferencaQueFaz:
      "O documento espelha o objeto do domínio — sem joins, evolução de esquema barata e sharding nativo. Em troca você abre mão de transações multi-documento simples e da integridade referencial do SQL.",
    alternativas: ["PostgreSQL (JSONB)", "DynamoDB", "CouchDB"],
    conceitos: ["cqrs"],
  },
  {
    id: "kafka",
    nome: "Apache Kafka",
    categoria: "fila",
    descricao: "Log de eventos distribuído — streaming e integração assíncrona.",
    viveEm: ["fila"],
    usos: [
      "Barramento de eventos entre serviços",
      "Projeções de read model (CQRS)",
      "Event sourcing (log durável e reproduzível)",
      "Pipelines de dados em streaming",
    ],
    especificacoes: {
      modelo: "log particionado e imutável (tópicos)",
      persistencia: "durável, com retenção configurável",
      consistencia: "ordem garantida por partição",
      latencia: "milissegundos (lotes)",
    },
    diferencaQueFaz:
      "Eventos viram um log durável que consumidores releem do zero — desacopla produtores de consumidores de verdade. O preço: operar um cluster (ou pagar managed) e pensar em particionamento e idempotência.",
    alternativas: ["RabbitMQ (filas de tarefa)", "NATS", "SQS/SNS"],
    conceitos: ["event-sourcing", "saga", "observer"],
  },
  {
    id: "rabbitmq",
    nome: "RabbitMQ",
    categoria: "fila",
    descricao: "Broker de mensagens — filas de tarefas com roteamento rico.",
    viveEm: ["fila"],
    usos: [
      "Filas de trabalho (jobs assíncronos)",
      "Roteamento por exchange (fanout/topic)",
      "Retry e dead-letter queues",
    ],
    especificacoes: {
      modelo: "filas + exchanges (AMQP)",
      persistencia: "opcional por fila/mensagem",
      consistencia: "ack por mensagem, redelivery",
      latencia: "milissegundos",
    },
    diferencaQueFaz:
      "Tarefas saem da requisição e viram jobs com retry e DLQ — o usuário não espera o PDF ser gerado. Diferente do Kafka, a mensagem consumida some: é fila de trabalho, não log de eventos.",
    alternativas: ["Kafka (streaming)", "SQS", "BullMQ (Redis)"],
    conceitos: ["saga"],
  },
  {
    id: "elasticsearch",
    nome: "Elasticsearch",
    categoria: "busca",
    descricao: "Índice de busca — texto completo, facetas e relevância.",
    viveEm: ["read-store"],
    usos: [
      "Busca textual com typo-tolerance e relevância",
      "Facetas/agregações para filtros",
      "Read model de busca projetado por eventos",
    ],
    especificacoes: {
      modelo: "índice invertido (documentos JSON)",
      persistencia: "durável, mas derivada (reindexável)",
      consistencia: "near-real-time (refresh ~1s)",
      latencia: "milissegundos",
    },
    diferencaQueFaz:
      "Busca que o SQL não entrega: relevância, sinônimos, facetas em milissegundos. Trate como projeção derivada — a verdade continua no banco, e o replay/reindex é seu plano de recuperação.",
    alternativas: ["Meilisearch", "Typesense", "OpenSearch"],
    conceitos: ["cqrs", "indice"],
  },
  {
    id: "nginx",
    nome: "Nginx",
    categoria: "borda",
    descricao: "Reverse proxy e load balancer na porta de entrada.",
    viveEm: ["api", "infra"],
    usos: [
      "Load balancing entre instâncias",
      "TLS termination",
      "Rate limiting e compressão na borda",
      "Servir estáticos",
    ],
    especificacoes: {
      modelo: "proxy reverso orientado a eventos",
      persistencia: "n/a (stateless)",
      consistencia: "n/a",
      latencia: "sub-milissegundo de overhead",
    },
    diferencaQueFaz:
      "Uma porta de entrada única: balanceia, termina TLS e segura picos antes de chegarem na aplicação. Mais um salto na requisição — irrelevante em latência, valioso em controle.",
    alternativas: ["Traefik", "HAProxy", "Envoy", "ALB (cloud)"],
    conceitos: ["facade"],
  },
  {
    id: "cdn",
    nome: "CDN",
    categoria: "borda",
    descricao: "Cache geográfico na borda — estáticos perto do usuário.",
    viveEm: ["ui", "infra"],
    usos: [
      "Servir JS/CSS/imagens da borda",
      "Cache de páginas estáticas (SSG)",
      "Proteção DDoS e TLS na borda",
    ],
    especificacoes: {
      modelo: "cache HTTP distribuído geograficamente",
      persistencia: "cache com TTL/invalidação",
      consistencia: "eventual (propagação de purge)",
      latencia: "~10-50ms do usuário (vs. cruzar o oceano)",
    },
    diferencaQueFaz:
      "O asset sai de um servidor a 20ms do usuário em vez do seu datacenter a 200ms — e sua origem quase não vê tráfego de estático. Exige disciplina de versionamento/invalidação de cache.",
    alternativas: ["Cloudflare", "CloudFront", "Fastly"],
    conceitos: ["cache"],
  },
  {
    id: "s3",
    nome: "Object Storage (S3)",
    categoria: "storage",
    descricao: "Armazenamento de objetos — arquivos, mídia e backups.",
    viveEm: ["infra"],
    usos: [
      "Uploads de usuários (imagens, PDFs)",
      "Backups e exports",
      "Data lake para analytics",
    ],
    especificacoes: {
      modelo: "objetos imutáveis por chave (buckets)",
      persistencia: "altíssima durabilidade (11 noves)",
      consistencia: "forte (read-after-write)",
      latencia: "dezenas de ms (não é filesystem)",
    },
    diferencaQueFaz:
      "Arquivos saem do banco e do disco do servidor — escala infinita e barata, com URL assinada para o cliente baixar direto. Não serve para dados quentes de baixa latência.",
    alternativas: ["MinIO (self-hosted)", "GCS", "Azure Blob"],
  },
  {
    id: "prometheus",
    nome: "Prometheus + Grafana",
    categoria: "observabilidade",
    descricao: "Métricas e dashboards — enxergar o sistema em produção.",
    viveEm: ["infra"],
    usos: [
      "Métricas de latência/erro/saturação (RED/USE)",
      "Alertas por threshold",
      "Dashboards por serviço",
    ],
    especificacoes: {
      modelo: "séries temporais (pull/scrape)",
      persistencia: "local com retenção; remoto p/ longo prazo",
      consistencia: "n/a (amostragem)",
      latencia: "scrape a cada 15-60s",
    },
    diferencaQueFaz:
      "Sem métricas você descobre incidentes pelo usuário reclamando. Com elas, o 'cache hit caiu para 40%' vira alerta antes de virar lentidão — observabilidade é o que torna as outras escolhas auditáveis.",
    alternativas: ["Datadog", "New Relic", "OpenTelemetry + backend"],
  },
  {
    id: "replica-leitura",
    nome: "Réplica de leitura",
    categoria: "banco",
    descricao: "Cópia do banco que só atende consultas — alivia o primário.",
    viveEm: ["read-store"],
    usos: [
      "Consultas e relatórios fora do primário",
      "Read model do CQRS sem trocar de tecnologia",
      "Failover: promover a réplica se o primário cair",
    ],
    especificacoes: {
      modelo: "cópia streaming do primário (mesmo esquema)",
      persistencia: "durável (segue o primário)",
      consistencia: "eventual — há lag de replicação (ms a s)",
      latencia: "igual ao primário (~10ms)",
    },
    diferencaQueFaz:
      "Escala leitura sem reescrever nada: o mesmo SQL roda na réplica. O preço é o lag — ler imediatamente após escrever pode devolver dado velho, então a app precisa saber quando exigir o primário.",
    alternativas: ["Cache (Redis)", "Read model dedicado", "Sharding"],
    conceitos: ["cqrs"],
  },
  {
    id: "worker",
    nome: "Worker de jobs",
    categoria: "compute",
    descricao: "Processo separado que consome a fila e executa tarefas longas.",
    viveEm: ["aplicacao", "infra"],
    usos: [
      "Gerar PDF/relatório, processar imagem, enviar e-mail",
      "Retentativas com backoff e dead-letter",
      "Projeções do CQRS e handlers de Saga",
    ],
    especificacoes: {
      modelo: "consumidor de fila (pool de processos)",
      persistencia: "estado vive na fila/banco, não no worker",
      consistencia: "at-least-once — exige idempotência",
      latencia: "assíncrona (segundos a minutos)",
    },
    diferencaQueFaz:
      "Tira o trabalho pesado da requisição: o usuário recebe 202 na hora e o worker processa depois. Em troca, você opera outro processo e precisa lidar com reprocessamento (idempotência) e visibilidade do que falhou.",
    alternativas: ["Serverless (Lambda)", "Cron job", "Processar inline (não recomendado)"],
    conceitos: ["saga", "observer"],
  },
  {
    id: "api-gateway",
    nome: "API Gateway",
    categoria: "borda",
    descricao: "Porta única com autenticação, rate limit e roteamento.",
    viveEm: ["api"],
    usos: [
      "Autenticação/autorização centralizada (JWT, API key)",
      "Rate limiting e quotas por cliente",
      "Roteamento e versionamento de APIs",
      "Agregação de múltiplos serviços numa fachada",
    ],
    especificacoes: {
      modelo: "proxy de aplicação com plugins",
      persistencia: "config declarativa (sem dados de negócio)",
      consistencia: "n/a",
      latencia: "1-5ms de overhead",
    },
    diferencaQueFaz:
      "Preocupações transversais saem de cada serviço e viram configuração num ponto só. O risco é o gateway virar um monolito de regras — mantenha lógica de negócio fora dele.",
    alternativas: ["Nginx + Lua", "Envoy", "BFF próprio"],
    conceitos: ["facade", "decorator"],
  },
  {
    id: "grpc",
    nome: "gRPC",
    categoria: "compute",
    descricao: "RPC binário com contrato forte para comunicação interna.",
    viveEm: ["aplicacao", "api"],
    usos: [
      "Chamadas entre serviços internos (baixa latência)",
      "Contrato versionado via protobuf",
      "Streaming bidirecional",
    ],
    especificacoes: {
      modelo: "RPC sobre HTTP/2 com protobuf",
      persistencia: "n/a (transporte)",
      consistencia: "síncrono request/response",
      latencia: "~1-3ms (menor que JSON/REST)",
    },
    diferencaQueFaz:
      "Payload binário e contrato gerado por código: mais rápido e sem 'campo que mudou de nome sem avisar'. Custo: menos legível para depurar, suporte fraco em browser (precisa de proxy) e disciplina de versionamento do .proto.",
    alternativas: ["REST + OpenAPI", "GraphQL", "Mensageria assíncrona"],
    conceitos: ["adapter"],
  },
  {
    id: "vault",
    nome: "Gerenciador de segredos",
    categoria: "seguranca",
    descricao: "Guarda credenciais e chaves fora do código e do ambiente.",
    viveEm: ["infra"],
    usos: [
      "Credenciais de banco e chaves de API",
      "Rotação automática de segredos",
      "Certificados e criptografia como serviço",
      "Auditoria de quem acessou o quê",
    ],
    especificacoes: {
      modelo: "cofre com política de acesso por identidade",
      persistencia: "durável e criptografado em repouso",
      consistencia: "forte",
      latencia: "poucos ms (com cache local do cliente)",
    },
    diferencaQueFaz:
      "Segredo sai do .env e do repositório: acesso auditável, rotação sem redeploy e vazamento com raio limitado. Adiciona uma dependência crítica no boot da aplicação — precisa de cache e plano para quando o cofre estiver fora.",
    alternativas: ["Secrets do orquestrador (K8s)", "AWS Secrets Manager", "SOPS + git"],
    conceitos: ["gestao-de-segredos"],
  },
  {
    id: "idp",
    nome: "Identity Provider (OAuth/OIDC)",
    categoria: "seguranca",
    descricao: "IdP que autentica usuários e emite tokens (Keycloak, Cognito, Auth0).",
    viveEm: ["api", "infra"],
    usos: [
      "SSO e Login with X",
      "Authorization Code + PKCE",
      "MFA centralizado no IdP",
      "Emissão de access/id tokens",
    ],
    especificacoes: {
      modelo: "OAuth 2.0 / OIDC como serviço",
      persistencia: "usuários e clientes no IdP",
      consistencia: "forte no IdP",
      latencia: "redirect + token exchange (centenas de ms)",
    },
    diferencaQueFaz:
      "Tira login, MFA e emissão de token do seu monolito — ao preço de depender do IdP no caminho crítico do login e de operar clients/redirects com disciplina.",
    alternativas: ["Sessão própria + MFA", "LDAP corporativo", "Social login direto"],
    conceitos: ["oauth2", "autenticacao", "jwt", "mfa"],
  },
  {
    id: "waf",
    nome: "WAF / borda de proteção",
    categoria: "seguranca",
    descricao: "Filtro na borda: allowlist, bot, OWASP rules antes da API.",
    viveEm: ["api"],
    usos: [
      "Allowlist / block de IP e país",
      "Rate limit na borda",
      "Regras OWASP (SQLi, XSS de request)",
      "Shield na frente do gateway",
    ],
    especificacoes: {
      modelo: "proxy de inspeção na borda",
      persistencia: "regras e contadores",
      consistencia: "eventual entre PoPs",
      latencia: "poucos ms na borda",
    },
    diferencaQueFaz:
      "Corta abuso e assinaturas conhecidas antes de tocar na app. Não substitui auth nem corrige IDOR — é camada, não produto inteiro de segurança.",
    alternativas: ["Nginx + limit_req", "API Gateway policies", "Cloudflare / AWS WAF"],
    conceitos: ["allowlist", "rate-limiting", "api-gateway"],
  },
];

export function tecnologiaDef(id: string): TecnologiaDef | undefined {
  return TECNOLOGIAS_DEF.find((t) => t.id === id);
}
