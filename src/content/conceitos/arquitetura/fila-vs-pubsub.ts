import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// FILA (work queue): uma mensagem, UM consumidor a processa.
// Serve para DIVIDIR trabalho entre workers concorrentes.
await fila.enviar({ tipo: "gerar-nota", pedidoId: 42 });
// N workers competem; só um pega a mensagem. Somar workers = mais vazão.

// PUB/SUB (topico): um evento, TODOS os inscritos recebem uma cópia.
// Serve para NOTIFICAR várias partes independentes do mesmo fato.
await topico.publicar({ tipo: "pedido-pago", pedidoId: 42 });
// -> faturamento recebe, -> estoque recebe, -> e-mail recebe.
// Cada inscrito tem sua própria cópia e seu próprio ritmo.

// A pergunta que decide: o trabalho deve ser feito UMA vez
// (fila) ou o fato deve ser CONHECIDO por vários (pub/sub)?
// Errar isso ou duplica trabalho, ou perde quem precisava saber.`,
  },
];

export const filaVsPubsub: Conceito = {
  slug: "fila-vs-pubsub",
  titulo: "Fila × Pub/Sub",
  categoria: "arquitetura",
  resumo:
    "Dois modelos de mensageria que parecem iguais e resolvem problemas opostos. A fila divide trabalho: uma mensagem é processada por um único consumidor entre vários. O pub/sub difunde um fato: um evento chega a todos os inscritos, cada um com sua cópia. Escolher errado ou duplica trabalho que devia ser único, ou deixa de avisar quem precisava saber.",
  tags: ["mensageria", "fila", "pub-sub", "eventos", "assincrono"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 1990", ano: 1993, precisao: "aproximada" },
    fonte:
      "Filas de mensagens se consolidaram com o middleware dos anos 1990 (IBM MQSeries, TIBCO); o publish-subscribe foi formalizado antes, no sistema ISIS de Ken Birman (1987)",
    precursor:
      "A distinção ecoa a diferença entre uma carta endereçada a um destinatário (fila) e um jornal que todos os assinantes recebem no mesmo dia (pub/sub).",
  },
  ondeAparece: [
    {
      onde: "SQS × SNS na AWS",
      explicacao:
        "SQS é fila (uma mensagem, um consumidor a processa); SNS é pub/sub (um evento, todos os inscritos recebem) — a distinção virada produto.",
    },
    {
      onde: "RabbitMQ: queue × exchange fanout",
      explicacao:
        "A fila entrega a um worker do grupo; a exchange fanout replica para todas as filas inscritas — os dois modelos no mesmo broker.",
    },
    {
      onde: "consumer groups do Kafka",
      explicacao:
        "Dentro de um grupo, cada mensagem vai a um consumidor (fila); grupos diferentes recebem tudo (pub/sub) — os dois ao mesmo tempo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Fila: um consumidor. Pub/Sub: todos os inscritos.
await fila.send(job);      // trabalho
bus.publish("PedidoCriado", e); // fato`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Escolher errado acopla demais (pub/sub onde queria dividir trabalho) ou perde entregas (fila onde queria broadcast)",
      "Ambos exigem um broker a operar, monitorar e dimensionar, com sua própria falha e latência",
    ],
    naoValeSe:
      "produtor e consumidor vivem no mesmo processo e a chamada pode ser síncrona — aí um broker entre eles é infraestrutura sem propósito.",
  },
  relacionados: ["observer", "webhooks", "backpressure"],
  problema: [
    "Assim que o trabalho vira assíncrono, aparece a escolha do modelo de mensageria — e fila e tópico se parecem o bastante para serem confundidos. Os dois recebem mensagens e as entregam a consumidores; a diferença está em quantos consumidores tocam cada mensagem.",
    "Confundi-los tem custo real: usar pub/sub onde se queria dividir trabalho faz N consumidores processarem a mesma tarefa; usar fila onde se queria avisar vários faz só um deles ser notificado, e os outros nunca ficam sabendo.",
  ],
  solucao: [
    "Perguntar o que a mensagem representa: se é uma tarefa que deve ser feita uma vez, é fila (competição entre consumidores). Se é um fato que várias partes precisam conhecer, é pub/sub (cópia para cada inscrito).",
    "Combinar os dois quando fizer sentido: um evento publicado num tópico pode ter, entre os inscritos, uma fila de workers — o fato é difundido, e o trabalho que ele gera é dividido.",
  ],
  quandoUsar: [
    "Fila: distribuir tarefas entre workers para escalar a vazão de processamento.",
    "Pub/Sub: notificar várias partes independentes do mesmo acontecimento.",
    "Os dois juntos: difundir um evento e, em cada consumidor, dividir o trabalho resultante.",
  ],
  quandoEvitar: [
    "Pub/Sub quando a tarefa deve ser feita exatamente uma vez — ele entrega a todos.",
    "Fila quando várias partes precisam do mesmo fato — só uma vai recebê-lo.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Fila e pub/sub são o mesmo cano com regras opostas de entrega. Fila é trabalho dividido: uma mensagem, um consumidor entre vários — some workers e a vazão sobe. Pub/sub é fato difundido: um evento, uma cópia para cada inscrito — some inscritos e mais gente fica sabendo. A pergunta que decide é uma só: isto deve ser feito uma vez (fila) ou conhecido por vários (pub/sub)?",
    },
    {
      tipo: "analogia",
      emoji: "📬",
      titulo: "A senha do açougue × o alto-falante do mercado",
      texto:
        "No açougue, você tira uma senha e um único atendente — o que ficar livre — chama o seu número. É a fila: a tarefa vai para um atendente só, e contratar mais atendentes faz a fila andar mais rápido. Já o anúncio no alto-falante ('promoção no corredor 3') chega a todos os clientes de uma vez — é o pub/sub: um mesmo aviso, ouvido por todo mundo que estiver escutando. Trocar um pelo outro é ou mandar o alto-falante atender um cliente, ou tirar senha para uma promoção.",
    },
    {
      tipo: "secao",
      id: "o-que-decide",
      titulo: "O que a mensagem representa",
      resumo: [
        "A escolha não é sobre a tecnologia, é sobre o significado da mensagem. Uma **tarefa** ('gere esta nota fiscal') deve ser feita uma vez: é fila, e vários workers competem por ela. Um **fato** ('o pedido foi pago') pode interessar a muitos: é pub/sub, e cada inscrito recebe a própria cópia.",
        "O sintoma de ter escolhido errado é claro. Pub/sub onde devia ser fila: a mesma nota é gerada três vezes, uma por consumidor. Fila onde devia ser pub/sub: o faturamento é avisado do pagamento, mas o estoque e o e-mail nunca ficam sabendo.",
      ],
      extensao: [
        "Os dois modelos se combinam, e é aí que a mensageria fica poderosa. Um evento `pedido-pago` é **publicado** num tópico; entre os inscritos estão o serviço de faturamento, o de estoque e o de e-mail. Cada um recebe sua cópia (pub/sub) e, internamente, cada serviço pode ter uma **fila de workers** processando esses eventos em paralelo (fila). O fato é difundido uma vez; o trabalho que ele gera em cada consumidor é dividido entre muitos.",
        "Vale ligar isso ao **Observer**: pub/sub é o Observer levado para além do processo. No Observer, o sujeito mantém a lista de ouvintes e os notifica por chamada de método, no mesmo processo e de forma síncrona. No pub/sub, o broker é o intermediário: o publicador não conhece os inscritos, a entrega é assíncrona e durável, e produtor e consumidor podem estar em máquinas, linguagens e tempos diferentes. É o mesmo desacoplamento 'quem avisa não conhece quem escuta', agora atravessando a rede.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O e-mail enviado três vezes",
          cenario:
            "Um time ligou três serviços a um tópico pub/sub de 'novo usuário', achando que balanceava carga. Cada novo cadastro disparava o e-mail de boas-vindas três vezes, uma por serviço inscrito.",
          aplicacao:
            "O envio de e-mail virou uma fila de trabalho com vários workers competindo pela mesma mensagem, enquanto o tópico pub/sub ficou só para os fatos que realmente interessavam a várias partes.",
          tradeoff:
            "Passou a existir uma fila a mais para operar. Em troca, cada e-mail voltou a ser enviado exatamente uma vez, com a vazão escalando pelo número de workers.",
        },
        {
          titulo: "O estoque que nunca soube do pagamento",
          cenario:
            "O pagamento era colocado numa fila lida pelo faturamento. Quando o estoque também precisou reagir ao pagamento, ele foi ligado à mesma fila — e passou a roubar metade das mensagens do faturamento.",
          aplicacao:
            "O pagamento virou um evento publicado num tópico; faturamento e estoque viraram inscritos independentes, cada um com sua própria cópia de cada evento.",
          tradeoff:
            "Cada inscrito precisou ser idempotente, já que agora todos recebem tudo. Em troca, adicionar um quarto interessado ao fato passou a ser só mais uma inscrição, sem tocar em quem já existia.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Pub/Sub para dividir trabalho",
          texto:
            "Ligar vários consumidores a um tópico não balanceia carga — replica. Cada inscrito recebe a mensagem inteira, então a tarefa é executada uma vez por consumidor. Para dividir trabalho, o modelo é fila com workers competindo.",
        },
        {
          titulo: "Fila para difundir um fato",
          texto:
            "Colocar vários interessados na mesma fila faz eles competirem: cada mensagem vai para um só. Quem precisa que todos saibam do mesmo evento usa pub/sub, não uma fila compartilhada.",
        },
        {
          titulo: "Esquecer que pub/sub exige idempotência",
          texto:
            "Como todo inscrito recebe cada evento, e a entrega costuma ser ao menos uma vez, cada consumidor precisa tolerar receber a mesma mensagem de novo sem duplicar o efeito.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Enviar para um × publicar para todos",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Fila para distribuir tarefas entre workers e escalar vazão.",
        "Pub/Sub para notificar várias partes do mesmo fato.",
        "Os dois juntos: difundir o evento, dividir o trabalho em cada consumidor.",
      ],
      evitar: [
        "Pub/Sub quando a tarefa deve ser feita exatamente uma vez.",
        "Fila quando várias partes precisam do mesmo fato.",
      ],
    },
  ],
};
