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
          essencial: true,
        },
        {
          id: "res-orcamento",
          titulo: "Orçamento de tempo por pedido, não por chamada",
          descricao:
            "O prazo é do pedido inteiro; cada chamada abaixo herda o tempo que sobra, não um timeout fixo somado ao dos outros.",
          prerequisitos: ["res-timeout"],
        },
        {
          id: "res-bulkhead",
          titulo: "Bulkhead: compartimentar o recurso",
          conceito: "bulkhead",
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
          essencial: true,
          prerequisitos: ["res-timeout"],
        },
        {
          id: "res-idempotencia",
          titulo: "Idempotência: a condição para repetir",
          conceito: "idempotencia",
          essencial: true,
          prerequisitos: ["res-retry"],
        },
        {
          id: "res-circuito",
          titulo: "Circuit Breaker: parar de insistir",
          conceito: "circuit-breaker",
          essencial: true,
          prerequisitos: ["res-retry", "res-idempotencia"],
        },
        {
          id: "res-race",
          titulo: "Condição de corrida na retentativa",
          conceito: "race-condition",
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
          essencial: true,
        },
        {
          id: "res-lock",
          titulo: "Lock otimista × pessimista",
          conceito: "lock-otimista-pessimista",
          essencial: true,
          prerequisitos: ["res-isolamento"],
        },
        {
          id: "res-atomico",
          titulo: "A escrita condicional que dispensa os dois",
          descricao:
            "UPDATE ... WHERE condição: o banco resolve leitura e escrita numa operação só, sem lock nem nível de isolamento.",
          prerequisitos: ["res-lock"],
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
          essencial: true,
        },
        {
          id: "res-fila",
          titulo: "Fila como amortecedor de pico",
          descricao:
            "Enfileirar absorve o pico: o produtor despeja rápido, o worker consome no ritmo que aguenta.",
          essencial: true,
          prerequisitos: ["res-rate"],
        },
        {
          id: "res-backpressure",
          titulo: "Backpressure: avisar quem produz rápido demais",
          conceito: "backpressure",
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
          essencial: true,
        },
        {
          id: "res-fila-pubsub",
          titulo: "Fila × Pub/Sub: dividir trabalho ou difundir fato",
          conceito: "fila-vs-pubsub",
          essencial: true,
          prerequisitos: ["res-garantias"],
        },
        {
          id: "res-particao",
          titulo: "Ordenação e chave de partição",
          conceito: "chave-de-particao",
          opcional: true,
          prerequisitos: ["res-fila-pubsub"],
        },
        {
          id: "res-inbox",
          titulo: "Inbox: não processar a mesma mensagem duas vezes",
          conceito: "inbox-deduplicacao",
          essencial: true,
          prerequisitos: ["res-garantias", "res-idempotencia"],
        },
        {
          id: "res-outbox",
          titulo: "Transactional Outbox: o evento que não se perde",
          conceito: "outbox",
          essencial: true,
          prerequisitos: ["res-garantias"],
        },
        {
          id: "res-dlq",
          titulo: "Dead Letter Queue: o desvio do envenenado",
          conceito: "dead-letter-queue",
          essencial: true,
          prerequisitos: ["res-garantias"],
        },
        {
          id: "res-webhooks",
          titulo: "Webhooks: entrega para fora do seu domínio",
          conceito: "webhooks",
          prerequisitos: ["res-idempotencia", "res-garantias"],
        },
        {
          id: "res-saga",
          titulo: "Saga: compensar o que não dá para desfazer",
          conceito: "saga",
          essencial: true,
          prerequisitos: ["res-outbox", "res-idempotencia"],
        },
        {
          id: "res-eventos",
          titulo: "Event Sourcing: reconstruir a partir do que aconteceu",
          conceito: "event-sourcing",
          opcional: true,
          prerequisitos: ["res-garantias"],
        },
      ],
    },
  ],
};
