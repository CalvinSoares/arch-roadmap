import type { Entrevista } from "@/shared/types/entrevista";

/**
 * Enunciados de system design com rubrica.
 *
 * Cada `conceito` citado na rubrica precisa existir no catálogo — há spec
 * garantindo. É o que amarra a entrevista ao resto do site: cada ponto da
 * rubrica é um link para a página que o ensina.
 */
export const ENTREVISTAS: Entrevista[] = [
  {
    slug: "encurtador-de-url",
    titulo: "Encurtador de URL",
    resumo:
      "Encurte URLs longas e redirecione o clique — bilhões de links, leitura muito acima da escrita.",
    enunciado:
      "Desenhe um encurtador de URLs (como o bit.ly). Um usuário envia uma URL longa e recebe uma curta; quem acessa a curta é redirecionado para a longa. O serviço guarda bilhões de links e recebe muito mais cliques (leituras) do que criações (escritas).",
    restricoes: [
      "A leitura (redirecionar) é cerca de 100× mais frequente que a escrita (criar).",
      "O redirecionamento é o caminho crítico de cada clique — precisa ser rápido.",
      "A chave curta precisa ser única e curta (6 a 8 caracteres).",
      "Deseja-se, como bônus, contar cliques por link.",
    ],
    rubrica: [
      {
        ponto: "Gerar a chave curta sem colisão sob concorrência",
        porque:
          "Duas criações ao mesmo tempo podem gerar a mesma chave; sem unicidade garantida no banco, um link sobrescreve o outro em silêncio.",
        conceitos: ["race-condition", "indice"],
        nivel: "essencial",
      },
      {
        ponto: "Servir o redirecionamento por uma busca indexada pela chave",
        porque:
          "Sem índice na chave curta, cada clique varre a tabela inteira — o caminho mais quente do sistema vira o mais lento.",
        conceitos: ["indice"],
        nivel: "essencial",
      },
      {
        ponto: "Escalar a leitura com réplicas, tirando a carga do primário",
        porque:
          "A leitura domina o uso; servir os redirecionamentos de réplicas deixa o primário livre para as poucas escritas.",
        conceitos: ["replica-de-leitura", "consistencia-eventual"],
        nivel: "essencial",
      },
      {
        ponto: "Proteger a criação com rate limiting",
        porque:
          "Sem limite, um abusador enche a base de links e consome o espaço de chaves curtas.",
        conceitos: ["rate-limiting"],
        nivel: "importante",
      },
      {
        ponto: "Particionar os dados quando não couberem numa máquina",
        porque:
          "Bilhões de links passam do que um banco aguenta; a própria chave curta é uma boa chave de partição.",
        conceitos: ["sharding", "chave-de-particao"],
        nivel: "importante",
      },
      {
        ponto: "Contar cliques fora do caminho de redirecionamento",
        porque:
          "Incrementar um contador a cada clique serializa o caminho quente; melhor emitir um evento e agregar a contagem fora dele, aceitando atraso.",
        conceitos: ["fila-vs-pubsub", "consistencia-eventual"],
        nivel: "bonus",
      },
    ],
    pegadinha:
      "Gerar a chave com um contador auto-incremento sequencial 'porque é simples'. Além de vazar quantos links existem e de ser adivinhável, o contador global vira um ponto único de contenção sob escrita concorrente — exatamente o gargalo que o resto do desenho tentou evitar.",
  },
  {
    slug: "checkout-idempotente",
    titulo: "Checkout que não cobra duas vezes",
    resumo:
      "Cobre o cartão, baixe o estoque e crie o pedido sem cobrar em dobro nem vender o que não há.",
    enunciado:
      "Desenhe a finalização de compra de um e-commerce: cobrar o cartão num gateway externo, baixar o estoque e criar o pedido. A rede falha, o usuário clica duas vezes, e o gateway às vezes responde com timeout mesmo tendo cobrado.",
    restricoes: [
      "Nunca cobrar o cliente duas vezes pela mesma compra.",
      "Nunca vender mais estoque do que existe.",
      "O gateway de pagamento é externo, lento e pode dar timeout ambíguo.",
      "Cobrar, baixar estoque e criar o pedido precisam ser consistentes entre si.",
    ],
    rubrica: [
      {
        ponto: "Tornar a cobrança idempotente com uma chave",
        porque:
          "Um retry após timeout ambíguo cobraria de novo; uma chave de idempotência faz a segunda tentativa devolver o resultado da primeira, sem cobrar outra vez.",
        conceitos: ["idempotencia"],
        nivel: "essencial",
      },
      {
        ponto: "Matar a corrida do duplo clique e da baixa de estoque",
        porque:
          "Dois cliques ou duas requisições concorrentes cobram e baixam duas vezes; é preciso lock ou uma escrita condicional atômica que só aplique uma.",
        conceitos: ["race-condition", "lock-otimista-pessimista", "niveis-de-isolamento"],
        nivel: "essencial",
      },
      {
        ponto: "Coordenar os três passos com uma saga, não com transação distribuída",
        porque:
          "Cobrança, estoque e pedido vivem em sistemas diferentes e não cabem numa transação ACID; uma saga commita cada passo e compensa os anteriores se um falhar.",
        conceitos: ["saga", "two-phase-commit"],
        nivel: "essencial",
      },
      {
        ponto: "Publicar os eventos de forma confiável com Outbox",
        porque:
          "Gravar o pedido e publicar 'pedido pago' são duas operações; sem Outbox, o processo pode morrer entre elas e o evento se perde.",
        conceitos: ["outbox", "garantias-de-entrega"],
        nivel: "importante",
      },
      {
        ponto: "Tratar o webhook do gateway como 'ao menos uma vez'",
        porque:
          "O gateway reenvia notificações de pagamento; o consumidor precisa deduplicar por id para não baixar o mesmo pedido duas vezes.",
        conceitos: ["webhooks", "inbox-deduplicacao"],
        nivel: "importante",
      },
      {
        ponto: "Chamar o gateway com timeout, idempotência e retry — nessa ordem",
        porque:
          "Sem timeout não há evento de falha para o retry reagir; sem idempotência, o retry cobra de novo; o disjuntor evita insistir quando o gateway caiu.",
        conceitos: ["timeout", "retry", "circuit-breaker"],
        nivel: "importante",
      },
      {
        ponto: "Modelar o pedido como uma máquina de estados",
        porque:
          "Transições inválidas — enviar antes de pagar, pagar um pedido cancelado — viram impossíveis por construção.",
        conceitos: ["maquina-de-estados"],
        nivel: "bonus",
      },
      {
        ponto: "Registrar o dinheiro como um ledger append-only",
        porque:
          "Saldo derivado de lançamentos imutáveis dá auditoria e reconciliação; sobrescrever uma coluna de saldo perde o rastro do que aconteceu.",
        conceitos: ["ledger", "append-only"],
        nivel: "bonus",
      },
    ],
    pegadinha:
      "Alcançar o Two-Phase Commit para deixar as três ações 'atômicas'. Entre serviços independentes e um gateway externo, o 2PC trava recursos e derruba a disponibilidade — o gateway não vai ficar num prepare esperando o seu commit. A resposta é uma saga com compensação, não atomicidade travada.",
  },
  {
    slug: "entrega-de-notificacoes",
    titulo: "Entrega de notificações",
    resumo:
      "Entregue push, e-mail e SMS a milhões de usuários sem perder nem duplicar mensagem, com picos enormes.",
    enunciado:
      "Desenhe um serviço de notificações: outros sistemas pedem 'avise o usuário X sobre Y', e você entrega por push, e-mail ou SMS. Os provedores de entrega são externos, lentos e falham; o volume tem picos gigantes — uma promoção dispara milhões de avisos de uma vez.",
    restricoes: [
      "Uma notificação não pode se perder nem chegar duplicada ao usuário.",
      "O volume tem picos: milhões de mensagens de uma só vez.",
      "Os provedores externos (push, e-mail, SMS) falham e são lentos.",
      "Alguns eventos interessam a vários canais ao mesmo tempo.",
    ],
    rubrica: [
      {
        ponto: "Desacoplar produção e entrega com uma fila",
        porque:
          "Sem fila, o pico de produção derruba a entrega; a fila amortece o pico e deixa os workers consumirem no ritmo que aguentam.",
        conceitos: ["fila-vs-pubsub"],
        nivel: "essencial",
      },
      {
        ponto: "Assumir entrega 'ao menos uma vez' e deduplicar no consumidor",
        porque:
          "Exactly-once de ponta a ponta é mito; o honesto é assumir at-least-once e deduplicar por id, com uma inbox, para não notificar duas vezes.",
        conceitos: ["garantias-de-entrega", "inbox-deduplicacao"],
        nivel: "essencial",
      },
      {
        ponto: "Chamar os provedores com timeout, retry e circuit breaker",
        porque:
          "Um provedor lento não pode pendurar o worker nem afogar o sistema; o disjuntor para de insistir enquanto ele estiver fora.",
        conceitos: ["timeout", "retry", "circuit-breaker"],
        nivel: "essencial",
      },
      {
        ponto: "Desviar a mensagem envenenada para uma Dead Letter Queue",
        porque:
          "Uma notificação que sempre falha volta para a fila e bloqueia as de trás; a DLQ a tira do caminho e preserva a vazão.",
        conceitos: ["dead-letter-queue"],
        nivel: "importante",
      },
      {
        ponto: "Difundir para múltiplos canais com pub/sub",
        porque:
          "Um evento que interessa a push e e-mail vira um tópico com um consumidor por canal, não uma fila que um só consumidor esvazia.",
        conceitos: ["fila-vs-pubsub"],
        nivel: "importante",
      },
      {
        ponto: "Aplicar backpressure quando a entrega não acompanha",
        porque:
          "Se os provedores não vazam no ritmo da produção, o buffer cresce sem limite; o consumidor precisa ditar o ritmo, e não só acumular.",
        conceitos: ["backpressure", "rate-limiting"],
        nivel: "bonus",
      },
    ],
    pegadinha:
      "Processar a notificação dentro da requisição que a pediu, 'para ser rápido'. Isso amarra o tempo de resposta de quem pede ao provedor externo mais lento, e um pico de pedidos derruba tudo junto. Receber, enfileirar e responder rápido — a entrega é trabalho de fila, não de request.",
  },
];
