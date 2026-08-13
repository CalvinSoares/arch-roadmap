import type { Roadmap } from "@/shared/types/roadmap";

/**
 * Trilha de resiliência: o que separa um sistema que funciona de um sistema
 * que continua funcionando quando a dependência falha.
 *
 * A ordem é a das dependências conceituais, não a da importância. Timeout vem
 * primeiro porque sem prazo não existe evento de falha — e sem evento de falha,
 * nem retry nem disjuntor têm o que observar.
 *
 * `prerequisitos` torna essa ordem navegável no grafo; `essencial` alimenta o
 * toggle "só o essencial" na UI.
 */
export const roadmapResiliencia: Roadmap = {
  slug: "resiliencia",
  titulo: "Sistemas que aguentam produção",
  descricao:
    "Construir é uma coisa; continuar de pé quando a dependência cai é outra. Dos prazos que impedem a espera infinita até a entrega que não perde mensagem — com o custo de cada escolha explícito.",
  sections: [
    {
      id: "fronteira",
      titulo: "A fronteira do pedido",
      descricao:
        "Antes de tratar falha, é preciso que ela aconteça. Espera infinita não é falha — é um recurso preso para sempre.",
      conceito: "timeout",
      items: [
        {
          id: "res-timeout",
          titulo: "Timeout: todo pedido tem prazo",
          conceito: "timeout",
          descricao:
            "Sem prazo, a falha vira espera infinita — e o recurso fica preso para sempre.",
          essencial: true,
        },
        {
          id: "res-orcamento",
          titulo: "Orçamento de tempo por pedido, não por chamada",
          descricao:
            "O prazo é do pedido inteiro; cada chamada abaixo herda o tempo que sobra, não um timeout fixo somado ao dos outros.",
          prerequisitos: ["res-timeout"],
          recursos: [
            { titulo: "gRPC and Deadlines", href: "https://grpc.io/blog/deadlines/", tipo: "artigo", fonte: "gRPC" },
            { titulo: "SRE Book — Handling Overload", href: "https://sre.google/sre-book/handling-overload/", tipo: "doc", fonte: "Google SRE" },
          ],
        },
        {
          id: "res-bulkhead",
          titulo: "Bulkhead: compartimentar o recurso",
          conceito: "bulkhead",
          descricao:
            "Compartimenta o recurso: a dependência lenta não consome o pool inteiro.",
          essencial: true,
          prerequisitos: ["res-timeout"],
        },
        {
          id: "res-degradar",
          titulo: "Degradação graciosa: o que é essencial mesmo",
          descricao:
            "Sob falha, servir o essencial e cortar o supérfluo — meia página é melhor que um erro 500.",
          opcional: true,
          prerequisitos: ["res-bulkhead"],
          recursos: [
            { titulo: "SRE Book — Addressing Cascading Failures", href: "https://sre.google/sre-book/addressing-cascading-failures/", tipo: "doc", fonte: "Google SRE" },
            { titulo: "CircuitBreaker (Fowler)", href: "https://martinfowler.com/bliki/CircuitBreaker.html", tipo: "artigo", fonte: "Fowler" },
          ],
        },
      ],
    },
    {
      id: "reagir",
      titulo: "Reagir à falha",
      descricao:
        "Insistir quando vale a pena, parar quando não vale — e saber distinguir os dois casos.",
      conceito: "retry",
      items: [
        {
          id: "res-retry",
          titulo: "Retry com backoff e jitter",
          conceito: "retry",
          descricao:
            "Repetir falha passageira com espera crescente e ruído — sem martelar quem já está mal.",
          essencial: true,
          prerequisitos: ["res-timeout"],
        },
        {
          id: "res-idempotencia",
          titulo: "Idempotência: a condição para repetir",
          conceito: "idempotencia",
          descricao:
            "Mesmo efeito se repetir: a condição que torna o retry seguro em rede.",
          essencial: true,
          prerequisitos: ["res-retry"],
        },
        {
          id: "res-circuito",
          titulo: "Circuit Breaker: parar de insistir",
          conceito: "circuit-breaker",
          descricao:
            "Quando a dependência já caiu, falhar rápido — até valer a pena tentar de novo.",
          essencial: true,
          prerequisitos: ["res-retry", "res-idempotencia"],
        },
        {
          id: "res-race",
          titulo: "Condição de corrida na retentativa",
          conceito: "race-condition",
          descricao:
            "Duas leituras, duas decisões, duas escritas: o resultado depende de quem chega primeiro.",
          opcional: true,
          prerequisitos: ["res-idempotencia"],
        },
      ],
    },
    {
      id: "concorrencia",
      titulo: "Dois ao mesmo tempo",
      descricao:
        "Onde a retentativa encontra a concorrência: duas escritas na mesma linha, e nenhuma delas recebe erro.",
      conceito: "niveis-de-isolamento",
      items: [
        {
          id: "res-isolamento",
          titulo: "Níveis de isolamento e as anomalias",
          conceito: "niveis-de-isolamento",
          descricao:
            "Quais anomalias o banco impede — e o que cada degrau custa em concorrência.",
          essencial: true,
        },
        {
          id: "res-lock",
          titulo: "Lock otimista × pessimista",
          conceito: "lock-otimista-pessimista",
          descricao:
            "Pessimista trava antes; otimista detecta o conflito na hora de gravar.",
          essencial: true,
          prerequisitos: ["res-isolamento"],
        },
        {
          id: "res-atomico",
          titulo: "A escrita condicional que dispensa os dois",
          descricao:
            "UPDATE ... WHERE condição: o banco resolve leitura e escrita numa operação só, sem lock nem nível de isolamento.",
          prerequisitos: ["res-lock"],
          recursos: [
            { titulo: "Optimistic Offline Lock (Fowler)", href: "https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html", tipo: "artigo", fonte: "Fowler" },
            { titulo: "PostgreSQL — UPDATE", href: "https://www.postgresql.org/docs/current/sql-update.html", tipo: "doc", fonte: "PostgreSQL" },
          ],
        },
      ],
    },
    {
      id: "carga",
      titulo: "Carga e capacidade",
      descricao:
        "Quando a demanda passa do que se aguenta, alguém é recusado. A escolha é fazer isso de propósito.",
      conceito: "rate-limiting",
      items: [
        {
          id: "res-rate",
          titulo: "Rate limiting: escolher quem recusar",
          conceito: "rate-limiting",
          descricao:
            "Escolher conscientemente quem é recusado quando a demanda passa da capacidade.",
          essencial: true,
        },
        {
          id: "res-fila",
          titulo: "Fila como amortecedor de pico",
          descricao:
            "Enfileirar absorve o pico: o produtor despeja rápido, o worker consome no ritmo que aguenta.",
          essencial: true,
          prerequisitos: ["res-rate"],
          recursos: [
            { titulo: "Message Queue (EIP)", href: "https://www.enterpriseintegrationpatterns.com/patterns/messaging/MessageQueue.html", tipo: "artigo", fonte: "EIP" },
            { titulo: "Competing Consumers (Fowler)", href: "https://martinfowler.com/articles/patterns-of-distributed-systems/competing-consumers.html", tipo: "artigo", fonte: "Fowler" },
          ],
        },
        {
          id: "res-backpressure",
          titulo: "Backpressure: avisar quem produz rápido demais",
          conceito: "backpressure",
          descricao:
            "Sinal de 'vá mais devagar' do consumidor para o produtor — sem buffer infinito.",
          opcional: true,
          prerequisitos: ["res-fila"],
        },
      ],
    },
    {
      id: "entrega",
      titulo: "Entrega que não perde",
      descricao:
        "Processamento assíncrono falha de um jeito próprio: a mensagem que nunca dá certo precisa de um destino.",
      conceito: "dead-letter-queue",
      items: [
        {
          id: "res-garantias",
          titulo: "Garantias de entrega: exactly-once é mentira",
          conceito: "garantias-de-entrega",
          descricao:
            "At-most perde, at-least duplica; exactly-once entre sistemas distintos é miragem.",
          essencial: true,
        },
        {
          id: "res-fila-pubsub",
          titulo: "Fila × Pub/Sub: dividir trabalho ou difundir fato",
          conceito: "fila-vs-pubsub",
          descricao:
            "Fila divide trabalho; pub/sub difunde fato — problemas opostos, aparência parecida.",
          essencial: true,
          prerequisitos: ["res-garantias"],
        },
        {
          id: "res-particao",
          titulo: "Ordenação e chave de partição",
          conceito: "chave-de-particao",
          descricao:
            "Ordem só dentro da partição: a chave agrupa o que precisa e espalha o resto.",
          opcional: true,
          prerequisitos: ["res-fila-pubsub"],
        },
        {
          id: "res-inbox",
          titulo: "Inbox: não processar a mesma mensagem duas vezes",
          conceito: "inbox-deduplicacao",
          descricao:
            "Registra o id já processado e ignora a duplicata — efeito uma vez no consumidor.",
          essencial: true,
          prerequisitos: ["res-garantias", "res-idempotencia"],
        },
        {
          id: "res-outbox",
          titulo: "Transactional Outbox: o evento que não se perde",
          conceito: "outbox",
          descricao:
            "Evento na mesma transação do dado; a publicação fica para depois.",
          essencial: true,
          prerequisitos: ["res-garantias"],
        },
        {
          id: "res-dlq",
          titulo: "Dead Letter Queue: o desvio do envenenado",
          conceito: "dead-letter-queue",
          descricao:
            "Desvio do que falhou demais — para diagnosticar sem envenenar a fila.",
          essencial: true,
          prerequisitos: ["res-garantias"],
        },
        {
          id: "res-webhooks",
          titulo: "Webhooks: entrega para fora do seu domínio",
          conceito: "webhooks",
          descricao:
            "Entrega para fora: assinatura, retry e duplicata fazem parte do contrato.",
          prerequisitos: ["res-idempotencia", "res-garantias"],
        },
        {
          id: "res-saga",
          titulo: "Saga: compensar o que não dá para desfazer",
          conceito: "saga",
          descricao:
            "Passos locais com compensação quando não dá para desfazer de verdade.",
          essencial: true,
          prerequisitos: ["res-outbox", "res-idempotencia"],
        },
        {
          id: "res-eventos",
          titulo: "Event Sourcing: reconstruir a partir do que aconteceu",
          conceito: "event-sourcing",
          descricao:
            "Estado reconstruído a partir do que aconteceu — o histórico é a verdade.",
          opcional: true,
          prerequisitos: ["res-garantias"],
        },
      ],
    },
  ],
};
