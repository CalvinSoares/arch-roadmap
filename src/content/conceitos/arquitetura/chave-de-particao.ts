import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Um topico e dividido em PARTICOES para escalar. A ordem das
// mensagens so e garantida DENTRO de uma particao — nunca entre elas.
// A chave de particao decide em qual particao cada mensagem cai.

await topico.publicar({
  chave: pedido.id,          // <- todas as mensagens deste pedido
  valor: { tipo: "pago" },   //    caem na MESMA particao, em ordem
});

// Mesma chave  -> mesma particao -> ordem preservada entre elas.
// Chaves diferentes -> particoes diferentes -> podem correr em paralelo.

// A escolha da chave e um trade-off:
//   chave = pedido.id   -> ordem por pedido, bom paralelismo
//   chave = "global"    -> ordem TOTAL, mas 1 particao = zero paralelismo
//   chave = usuario.id  -> ordem por usuario; cuidado com o usuario gigante
//                          que vira uma particao quente (hot partition).`,
  },
];

export const chaveDeParticao: Conceito = {
  slug: "chave-de-particao",
  titulo: "Ordenação e chave de partição",
  categoria: "arquitetura",
  resumo:
    "Para escalar, um fluxo de mensagens é dividido em partições — e aí a ordem deixa de ser global. A chave de partição decide em qual partição cada mensagem cai, e a ordem só é garantida dentro de uma partição. Escolhê-la é um equilíbrio delicado: agrupar o que precisa de ordem, espalhar o resto para o paralelismo, e evitar que uma chave concentrada vire uma partição quente.",
  tags: ["mensageria", "ordenacao", "particao", "kafka", "escalabilidade"],
  dificuldade: "avancado",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2011", ano: 2011, precisao: "aproximada" },
    fonte:
      "A chave de partição como mecanismo de ordenação parcial ganhou centralidade com o Apache Kafka (LinkedIn, 2011)",
    precursor:
      "Ordenar mensagens por chave é o mesmo princípio do sharding aplicado a um log: a chave decide a partição, e a ordem só vale dentro dela.",
  },
  ondeAparece: [
    {
      onde: "partition key do Kafka",
      explicacao:
        "A chave decide a partição da mensagem, e a ordem só é garantida dentro de uma partição — mesma chave, mesma ordem.",
    },
    {
      onde: "MessageGroupId do SQS FIFO",
      explicacao:
        "Agrupa mensagens que precisam ser processadas em ordem, deixando grupos diferentes correrem em paralelo.",
    },
    {
      onde: "sessions do Azure Service Bus",
      explicacao:
        "As sessões garantem ordem por chave de sessão, permitindo que chaves diferentes sejam consumidas em paralelo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Mesma chave → mesma partição → ordem local.
await producer.send({ key: pedidoId, value: evento });`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "A ordem só vale dentro de uma partição, então a escolha da chave decide o que pode e o que não pode ser ordenado",
      "Uma chave concentrada cria uma partição quente que vira gargalo, exatamente como uma shard key ruim",
    ],
    naoValeSe:
      "a ordem entre as mensagens é irrelevante para o processamento — sem exigência de sequência, particionar por chave só adiciona uma decisão a errar.",
  },
  relacionados: ["sharding", "fila-vs-pubsub", "garantias-de-entrega"],
  problema: [
    "Um único fluxo de mensagens processado em ordem estrita não escala: um consumidor só, uma fila só. Para paralelizar, o fluxo é dividido em partições consumidas independentemente — e o preço é que a ordem global desaparece.",
    "Mas muitas mensagens só fazem sentido em ordem: 'conta criada' antes de 'conta atualizada', 'pedido pago' antes de 'pedido enviado'. Processá-las fora de sequência corrompe o estado. É preciso um jeito de manter ordem onde ela importa sem perder o paralelismo no resto.",
  ],
  solucao: [
    "Usar uma chave de partição: mensagens com a mesma chave caem sempre na mesma partição e são processadas em ordem entre si; chaves diferentes vão para partições diferentes e correm em paralelo.",
    "Escolher a chave pela unidade que precisa de ordem — o id do pedido, da conta, do agregado — de modo que a ordem seja garantida dentro dessa unidade, e o sistema ainda escale entre unidades distintas.",
  ],
  quandoUsar: [
    "Quando algumas mensagens têm ordem obrigatória entre si, mas não com todas as outras.",
    "Ao escalar o consumo de um tópico para além de um consumidor, sem perder a ordem por entidade.",
    "Quando existe uma unidade natural de ordenação (pedido, conta, usuário) que também distribui bem a carga.",
  ],
  quandoEvitar: [
    "Quando a ordem entre mensagens é irrelevante — aí qualquer distribuição serve e a chave só complica.",
    "Quando a única chave possível concentra a carga numa partição só (ordem total = zero paralelismo).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Para escalar, um tópico vira várias partições, e a ordem só é garantida dentro de cada uma — nunca entre elas. A chave de partição decide onde cada mensagem cai: mesma chave, mesma partição, ordem preservada; chaves diferentes correm em paralelo. Escolher a chave é o mesmo problema da shard key: agrupe o que precisa de ordem (por id de pedido, de conta), espalhe o resto, e cuidado com a chave que concentra tudo numa partição quente.",
    },
    {
      tipo: "analogia",
      emoji: "🎢",
      titulo: "As filas paralelas do parque",
      texto:
        "O brinquedo tem cinco filas paralelas para dar conta da multidão. Dentro de cada fila, a ordem é sagrada: quem chegou antes entra antes. Mas entre filas não há ordem nenhuma — a fila 3 pode andar mais rápido que a 1. Se um grupo de amigos precisa entrar junto e na ordem certa, todos têm que escolher a mesma fila. A chave de partição é essa escolha de fila: ela agrupa quem precisa de ordem, e deixa o resto se espalhar para o parque inteiro andar mais rápido.",
    },
    {
      tipo: "secao",
      id: "escolher-a-chave",
      titulo: "A chave decide ordem e paralelismo ao mesmo tempo",
      resumo: [
        "A chave resolve dois problemas de uma vez, e por isso é difícil: ela define **o que fica em ordem** (mensagens da mesma chave) e **quanto o sistema paraleliza** (quantas chaves distintas espalham a carga). Uma chave boa acerta os dois; uma ruim sacrifica um pelo outro.",
        "Os extremos mostram o trade-off. Uma chave única para tudo dá ordem total — e concentra o fluxo inteiro numa partição, matando o paralelismo. Uma chave aleatória dá paralelismo máximo — e ordem nenhuma. A chave certa é a unidade de negócio que precisa de ordem: o id do pedido, da conta, do agregado.",
      ],
      extensao: [
        "É literalmente o problema da **shard key** aplicado a um log de mensagens, e herda as mesmas armadilhas. A pior é a **partição quente** (hot partition): uma chave que concentra tráfego — particionar por `pais` num app dominado por um país, ou por `tipo` quando um tipo é 99% do volume — joga a carga numa partição só, e o consumidor dela vira o gargalo enquanto os outros ficam ociosos. A chave precisa ao mesmo tempo garantir a ordem certa **e** distribuir de forma uniforme.",
        "Há um efeito colateral operacional pouco lembrado: mudar o **número de partições** de um tópico costuma mudar o mapeamento chave→partição (quando é por hash do total de partições). Mensagens de uma mesma chave que antes iam para a partição 2 passam a ir para a 5, e a ordem entre as 'antigas' e as 'novas' se perde na transição. Por isso o número de partições é uma decisão de capacidade que se planeja com folga desde o começo — reparticionar um tópico vivo é tão delicado quanto rebalancear shards.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O 'pedido enviado' processado antes do 'pedido pago'",
          cenario:
            "Eventos de pedido eram distribuídos sem chave, espalhados por partições para paralelizar. Ocasionalmente, o evento 'enviado' era processado antes do 'pago', deixando pedidos como enviados sem pagamento confirmado.",
          aplicacao:
            "As mensagens passaram a ser particionadas pela chave `pedido.id`: todos os eventos de um mesmo pedido caem na mesma partição e são processados na ordem em que ocorreram.",
          tradeoff:
            "O paralelismo passou a ser limitado pelo número de pedidos ativos por partição, não por mensagem. Na prática, sobra paralelismo de sobra — há muito mais pedidos que partições —, e a ordem por pedido ficou garantida.",
        },
        {
          titulo: "A partição quente do cliente gigante",
          cenario:
            "Um sistema multi-inquilino particionava eventos por `tenant_id`. Um cliente enorme gerava mais eventos que todos os outros somados, e a partição dele vivia atrasada enquanto as demais estavam ociosas.",
          aplicacao:
            "A chave desse tenant passou a incorporar um sufixo (tenant + faixa de entidade), espalhando o gigante por várias partições, com a ordem mantida no nível de entidade em vez de tenant.",
          tradeoff:
            "A ordem deixou de ser garantida no nível do tenant inteiro, passando a valer por entidade. Foi um ajuste aceitável, porque a ordem que o negócio exigia era por entidade, não pelo tenant como um todo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Esperar ordem global entre partições",
          texto:
            "A ordem só existe dentro de uma partição. Contar com a sequência entre mensagens de partições diferentes é contar com algo que o sistema nunca prometeu — e que quebra assim que o consumo paraleliza.",
        },
        {
          titulo: "Chave que concentra em partição quente",
          texto:
            "Particionar por um campo de baixa cardinalidade ou dominado por um valor joga a carga numa partição só. Como no sharding, a chave precisa distribuir uniformemente, não só agrupar o que precisa de ordem.",
        },
        {
          titulo: "Reparticionar um tópico vivo sem pensar na ordem",
          texto:
            "Mudar o número de partições remapeia chaves para partições novas e rompe a ordem entre mensagens antigas e novas de uma mesma chave. É uma migração delicada, não um ajuste de configuração qualquer.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "A chave que agrupa e ordena",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando algumas mensagens têm ordem obrigatória entre si, mas não com todas.",
        "Ao escalar o consumo de um tópico sem perder a ordem por entidade.",
        "Quando há uma unidade natural de ordenação que também distribui bem.",
      ],
      evitar: [
        "Quando a ordem entre mensagens é irrelevante.",
        "Quando a única chave possível concentra tudo numa partição.",
      ],
    },
  ],
};
