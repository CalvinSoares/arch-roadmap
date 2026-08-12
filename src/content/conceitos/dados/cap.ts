import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `flowchart LR
    C[Cliente] --> N1[Nó A]
    C --> N2[Nó B]
    N1 -. rede partida .- N2
    N1 --- D1{Responder?}
    D1 -->|"sim: talvez velho"| A[Disponível / AP]
    D1 -->|"não até sincronizar"| Cc[Consistente / CP]`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// CAP so tem escolha DURANTE uma particao de rede.
// Fora dela, um bom sistema entrega consistencia E disponibilidade.
//
// A pergunta e: quando o no A nao consegue falar com o no B,
// e chega uma leitura, o que A faz?

// CP — recusa em vez de mentir:
async function lerCP(chave: string) {
  if (!temQuorum()) {
    throw new Error("sem quorum: nao posso garantir o valor atual");
  }
  return storage.get(chave); // so responde se tem certeza
}

// AP — responde com o que tem, e reconcilia depois:
async function lerAP(chave: string) {
  return storage.getLocal(chave); // pode estar velho; nunca recusa
}

// Nenhum dos dois e "melhor". Um extrato bancario prefere CP
// (errar o saldo e pior que esperar); um feed social prefere AP
// (mostrar um like velho e melhor que uma tela de erro).`,
  },
];

export const cap: Conceito = {
  slug: "cap",
  titulo: "Teorema CAP",
  categoria: "dados",
  resumo:
    "Quando a rede parte um sistema distribuído em dois, você só pode manter uma entre consistência e disponibilidade — não as duas. O CAP não é um menu de três opções: é uma escolha forçada que só aparece durante a partição, e que a maioria dos sistemas afina por operação, não de uma vez.",
  tags: ["distribuido", "consistencia", "disponibilidade", "particao", "tradeoff"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  nasceu: {
    quando: { rotulo: "2000", ano: 2000, precisao: "convencao" },
    fonte:
      "Eric Brewer, keynote 'Towards Robust Distributed Systems', PODC 2000; formalizado por Seth Gilbert & Nancy Lynch, ACM SIGACT News, 2002",
    precursor:
      "A tensão já era prática nos bancos distribuídos e no debate BASE × ACID dos anos 1990 — Brewer deu nome ao que a Inktomi e outros já viviam em escala.",
  },
  ondeAparece: [
    {
      onde: "Cassandra e DynamoDB (AP)",
      explicacao:
        "Bancos que preferem responder com um dado possivelmente velho a recusar a escrita durante uma partição de rede.",
    },
    {
      onde: "etcd e ZooKeeper (CP)",
      explicacao:
        "Sistemas de coordenação que preferem recusar a operação a devolver um valor que pode estar desatualizado.",
    },
    {
      onde: "quórum R + W > N",
      explicacao:
        "O botão que move um mesmo banco pelo espectro: quóruns altos compram consistência pagando disponibilidade e latência.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Sob partição, escolha: consistência ou disponibilidade.
// Na prática: timeout curto + degradar leitura.`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Obriga a decidir, por operação, o que fazer durante uma partição — e a maioria dos times nunca decide isso conscientemente",
      "O lado AP empurra a reconciliação de conflitos para a aplicação, que agora precisa saber mesclar versões divergentes",
      "O lado CP transforma partição de rede em indisponibilidade visível, que precisa de timeout e retry para não travar o cliente",
    ],
    naoValeSe:
      "o sistema roda numa máquina só. Sem rede entre réplicas não há partição, e o CAP simplesmente não se aplica ao seu problema.",
  },
  relacionados: ["consistencia-eventual", "replica-de-leitura", "two-phase-commit"],
  problema: [
    "Um sistema distribuído mantém cópias do dado em nós diferentes para aguentar carga e sobreviver a falhas. Enquanto a rede funciona, é fácil manter as cópias iguais e sempre disponíveis.",
    "Mas a rede vai partir — cabo cortado, switch reiniciando, região da nuvem isolada. Quando o nó A não consegue mais falar com o nó B e chega uma requisição, alguém tem que decidir: responder com o que tem (arriscando dado velho) ou recusar até sincronizar (ficando indisponível).",
  ],
  solucao: [
    "Aceitar que a tolerância a partição (o P) não é opcional em sistema distribuído — a rede parte, ponto. A escolha real é entre C e A, e só durante a partição.",
    "Decidir a escolha por invariante de negócio, não por gosto: o que é pior neste caso, um valor errado ou uma indisponibilidade? A resposta muda de um extrato bancário para um feed social — e às vezes de um endpoint para outro no mesmo sistema.",
  ],
  quandoUsar: [
    "Ao escolher um banco distribuído: entender se ele é CP ou AP evita descobrir isso durante o primeiro incidente de rede.",
    "Ao afinar quóruns de leitura e escrita, que movem o mesmo sistema pelo espectro consistência × disponibilidade.",
    "Ao desenhar o comportamento de cada operação sob falha de rede, em vez de deixá-lo emergir por acaso.",
  ],
  quandoEvitar: [
    "Como regra para sistema de um nó só: sem rede entre réplicas, não há partição a tolerar.",
    "Como rótulo fixo 'este banco é CP' — quóruns e configuração movem o mesmo banco pelo espectro.",
  ],
  mermaid: MERMAID,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Numa partição de rede, um sistema distribuído só pode manter consistência OU disponibilidade, nunca as duas. O P (tolerância a partição) não é escolha — a rede parte de qualquer jeito —, então a decisão real é entre C e A, e só existe durante a partição. Fora dela, você tem as duas. A pergunta prática é: quando os nós não se falam, sua operação prefere recusar ou prefere responder com dado possivelmente velho?",
    },
    {
      tipo: "analogia",
      emoji: "☎️",
      titulo: "Duas bilheterias e o telefone que caiu",
      texto:
        "Duas bilheterias vendem os mesmos ingressos e se ligam a cada venda para não vender a mesma poltrona duas vezes. O telefone entre elas cai. Agora cada bilheteria decide: para de vender até o telefone voltar (consistente, mas fecha a fila na porta) ou continua vendendo por conta própria (aberta, mas pode vender a poltrona 14 duas vezes). Não existe terceira opção enquanto o telefone estiver mudo — e é exatamente essa a escolha do CAP.",
    },
    {
      tipo: "secao",
      id: "o-mal-entendido",
      titulo: "O mal-entendido de sempre",
      resumo: [
        "O CAP é quase sempre lido errado, como se você pudesse escolher duas letras de três — 'somos CA'. Não dá. Num sistema distribuído a partição acontece, então P está sempre em jogo; a escolha é só entre C e A **durante** a partição.",
        "'Somos CA' na prática quer dizer 'não pensamos no que acontece quando a rede parte' — e a rede vai partir. O sistema então escolhe sozinho, no pior momento, e normalmente pela pior opção para aquele caso.",
      ],
      extensao: [
        "A segunda leitura errada é achar que a escolha é do sistema inteiro, para sempre. Não é. O mesmo banco pode servir uma operação de forma CP (a transferência que não pode duplicar) e outra de forma AP (o contador de visualizações que pode atrasar). Quóruns configuráveis — o clássico R + W > N do Dynamo — são exatamente o botão que move cada operação pelo espectro.",
        "Vale separar CAP de um primo mais útil no dia a dia: o **PACELC**. Ele estende a ideia dizendo que, mesmo **sem** partição (o 'Else'), ainda há um trade-off entre **latência** e **consistência** — manter as réplicas perfeitamente sincronizadas custa tempo em toda escrita. Na prática, a maioria das decisões de arquitetura é sobre esse lado latência × consistência, que acontece o tempo todo, e não sobre a partição, que é rara.",
        "Por fim, 'consistência' no CAP é a linearizabilidade — toda leitura enxerga a escrita mais recente, como se houvesse um nó só. É uma garantia muito mais forte (e cara) do que o 'C' do ACID, que fala de invariantes dentro de uma transação. Misturar os dois 'C' é a origem de metade da confusão.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como a escolha aparece na prática",
      casos: [
        {
          titulo: "O saldo que preferiu recusar",
          cenario:
            "Um sistema de pagamentos replica o saldo em três zonas de disponibilidade. Uma zona fica isolada por uma falha de rede, e chegam débitos que só ela consegue atender localmente.",
          aplicacao:
            "A operação de débito foi desenhada como CP: exige quórum para confirmar. Durante a partição, os débitos na zona isolada falham com erro claro e o cliente é orientado a tentar de novo — nenhum saldo fica errado.",
          tradeoff:
            "Parte dos clientes vê indisponibilidade temporária justamente durante o incidente. É o preço aceito conscientemente: para dinheiro, recusar é melhor que divergir.",
        },
        {
          titulo: "O carrinho que preferiu responder",
          cenario:
            "Um e-commerce guarda o carrinho de compras replicado. Durante uma partição, o mesmo usuário adiciona itens a partir de nós que não conseguem se sincronizar.",
          aplicacao:
            "O carrinho foi desenhado como AP, seguindo o Dynamo: aceita toda escrita e, quando a rede volta, mescla as versões (a união dos itens). O usuário nunca vê o carrinho quebrado.",
          tradeoff:
            "A reconciliação pode ressuscitar um item que o usuário tinha removido nos dois lados — o famoso 'item zumbi' do Dynamo. A aplicação precisa de lógica de merge, e ela nem sempre acerta.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Dizer 'somos CA'",
          texto:
            "Num sistema distribuído não existe abrir mão de P: a rede parte independentemente da sua vontade. 'CA' quase sempre significa 'não decidimos o que fazer na partição', e aí o sistema decide sozinho — mal — na hora do incidente.",
        },
        {
          titulo: "Tratar a escolha como global e permanente",
          texto:
            "O trade-off é por operação e por configuração, não um carimbo no banco inteiro. Quóruns de leitura e escrita movem o mesmo sistema entre CP e AP; fixar 'este banco é AP' esconde os botões que realmente controlam o comportamento.",
        },
        {
          titulo: "Confundir o C do CAP com o C do ACID",
          texto:
            "No CAP, consistência é linearizabilidade (toda leitura vê a última escrita); no ACID, é preservar invariantes dentro da transação. São garantias diferentes e um sistema pode ter uma sem a outra — misturá-las leva a promessas que ninguém cumpre.",
        },
        {
          titulo: "Otimizar para a partição e esquecer a latência",
          texto:
            "Partição é rara; o trade-off latência × consistência (o lado 'Else' do PACELC) é diário. Manter réplicas sincronizadas em toda escrita custa tempo sempre, e é essa conta, não a da partição, que domina a experiência do usuário.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "A escolha na partição",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "CP recusa; AP responde",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ao escolher um banco distribuído e precisar saber como ele se comporta na partição.",
        "Ao afinar quóruns de leitura e escrita por operação.",
        "Ao definir, de propósito, o que cada endpoint faz quando a rede parte.",
      ],
      evitar: [
        "Aplicar a um sistema de um nó só, onde não há partição.",
        "Rotular o banco inteiro de CP ou AP e ignorar a configuração.",
      ],
    },
  ],
};
