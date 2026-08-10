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
    conceitos: ["cqrs"],
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
    conceitos: ["cqrs"],
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
];

export function tecnologiaDef(id: string): TecnologiaDef | undefined {
  return TECNOLOGIAS_DEF.find((t) => t.id === id);
}
