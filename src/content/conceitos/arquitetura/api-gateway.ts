import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Sem gateway: cada cliente conhece a topologia de servicos, e CADA
// servico reimplementa auth, rate limit, CORS, log... o mesmo, N vezes.

// COM API Gateway: um ponto unico de entrada. O cliente conhece so ele.
// Ele faz o transversal UMA vez e roteia para o servico interno certo.
gateway
  .use(autenticar)          // valida o token AQUI, uma vez para todos
  .use(rateLimit({ rpm: 600 }))
  .use(cors());

gateway.route("/pedidos/*",  "http://servico-pedidos");
gateway.route("/estoque/*",  "http://servico-estoque");
gateway.route("/pagamentos/*", "http://servico-pagamentos");
// O cliente chama sempre "gateway/pedidos/..." e nao sabe (nem precisa
// saber) que atras existem 3, 10 ou 50 servicos, nem onde eles estao.

// A tentacao a vigiar: encher o gateway de regra de negocio ate ele
// virar um monolito de fronteira que todo deploy precisa tocar.`,
  },
];

export const apiGateway: Conceito = {
  slug: "api-gateway",
  titulo: "API Gateway",
  categoria: "arquitetura",
  resumo:
    "Num sistema de muitos serviços, um ponto único de entrada por onde tudo passa: o API Gateway roteia cada requisição ao serviço certo e concentra o que é transversal — autenticação, rate limiting, CORS, log — para os serviços não repetirem isso cada um. O cliente conhece só o gateway, e a topologia interna pode mudar por trás. O risco é o gateway virar gargalo, ponto único de falha, ou um monólito de fronteira inchado de regra.",
  tags: ["arquitetura", "api", "roteamento", "gateway", "microsservicos"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2015, precisao: "aproximada" },
    fonte:
      "O API Gateway foi catalogado como padrão de microsserviços por Chris Richardson (microservices.io) na segunda metade dos anos 2010; o Zuul da Netflix (2012) é um marco",
    precursor:
      "A ideia de um ponto único de entrada que roteia e faz tarefas transversais é o velho proxy reverso e o Facade, agora na fronteira de um sistema distribuído.",
  },
  ondeAparece: [
    {
      onde: "Kong, AWS API Gateway, Zuul",
      explicacao:
        "Os produtos e serviços que implementam o ponto único de entrada de um sistema de microsserviços.",
    },
    {
      onde: "auth e rate limit num lugar só",
      explicacao:
        "Concentrar autenticação, limite de taxa e roteamento na entrada, para que os serviços não repitam isso cada um.",
    },
    {
      onde: "o /api que roteia para tudo",
      explicacao:
        "O endereço único que o cliente conhece, escondendo atrás de si a topologia de serviços que muda por dentro.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Uma porta: auth, rate limit e roteamento antes dos serviços.
app.use(gateway.auth);
app.use("/pedidos", pedidosRouter);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Um ponto único que, se cair, derruba a entrada de tudo — precisa de alta disponibilidade e vira candidato a gargalo",
      "Concentrar responsabilidades transversais tenta inflá-lo até virar um monólito de fronteira",
    ],
    naoValeSe:
      "há um serviço só atrás dele — sem uma topologia de vários serviços para esconder e unificar, o gateway é um salto de rede sem função.",
  },
  relacionados: ["bff", "microsservicos", "rate-limiting", "autenticacao"],
  problema: [
    "Quando um sistema vira muitos serviços, dois problemas aparecem de uma vez. Do lado do cliente: ele passa a precisar conhecer o endereço de cada serviço, e a topologia interna vaza para fora. Do lado dos serviços: cada um reimplementa autenticação, rate limit, CORS e log — o mesmo código transversal, repetido N vezes.",
    "Deixar cada cliente falar com cada serviço acopla o mundo externo à estrutura interna: mover ou dividir um serviço quebra clientes, e uma mudança na política de auth precisa ser replicada em todo serviço.",
  ],
  solucao: [
    "Colocar um ponto único de entrada — o gateway — por onde toda requisição passa. Ele roteia para o serviço interno certo e concentra as tarefas transversais, executadas uma vez na borda em vez de repetidas em cada serviço.",
    "Esconder a topologia atrás dele: o cliente conhece só o gateway, e serviços podem ser movidos, divididos ou renomeados por trás sem que o mundo externo perceba.",
  ],
  quandoUsar: [
    "Num sistema de vários serviços que precisa de um ponto único de entrada para os clientes.",
    "Para concentrar autenticação, rate limiting e roteamento num lugar só, fora dos serviços.",
    "Para esconder a topologia interna e poder reorganizar serviços sem quebrar clientes.",
  ],
  quandoEvitar: [
    "Quando há um serviço só — o gateway seria um salto de rede sem função.",
    "Quando a tentação de colocar regra de negócio nele o transformaria num monólito de fronteira.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O API Gateway é o ponto único de entrada de um sistema de muitos serviços: roteia cada requisição ao serviço certo e faz o transversal (auth, rate limit, CORS, log) uma vez, em vez de cada serviço repetir. O cliente conhece só o gateway, e a topologia interna pode mudar atrás dele. Os riscos: ele é ponto único de falha (precisa de alta disponibilidade) e atrai regra de negócio até virar um monólito de fronteira — que é o que ele deveria evitar.",
    },
    {
      tipo: "analogia",
      emoji: "🏨",
      titulo: "A recepção do hotel",
      texto:
        "Você não bate na porta de cada funcionário do hotel — governança, cozinha, manutenção. Você fala com a recepção, que confere sua identidade uma vez, sabe a quem encaminhar cada pedido e esconde de você a estrutura interna do hotel. Se a cozinha muda de andar, você nem fica sabendo: continua ligando para a recepção. O API Gateway é essa recepção: um ponto de entrada que autentica, encaminha e blinda o hóspede da bagunça de dentro. E, como toda recepção, se ela para, ninguém entra — por isso ela não pode ser uma pessoa só, num balcão só.",
    },
    {
      tipo: "secao",
      id: "transversal-e-topologia",
      titulo: "Duas funções: o transversal e a fachada",
      resumo: [
        "O gateway resolve dois problemas que andam juntos. Primeiro, o **transversal**: auth, rate limit, CORS, log são iguais para todos os serviços; concentrá-los na borda evita reimplementar (e divergir) em cada um. Segundo, a **fachada**: o cliente conhece um endereço só, e a topologia de serviços fica escondida e livre para mudar.",
        "Os dois ganhos têm o mesmo preço: tudo passa por um ponto. Isso o torna candidato a gargalo e ponto único de falha — um gateway fora do ar tranca a entrada do sistema inteiro, então ele precisa de alta disponibilidade de verdade.",
      ],
      extensao: [
        "A confusão mais comum é com o **BFF**, e a distinção é limpa: o gateway é **um portão para todos**, focado no transversal e no roteamento; o BFF é **um portão por cliente**, focado em moldar a resposta àquela interface (agregar, enxugar). Não competem — muitos sistemas têm o gateway na frente cuidando de auth e limite, e atrás dele um BFF por tipo de cliente cuidando da forma. Misturá-los produz um gateway que também formata respostas, acumulando responsabilidades que deveriam estar separadas.",
        "O maior perigo do gateway é a **gravitação de responsabilidades**. Como tudo passa por ele, é tentador colocar 'só mais uma coisinha' — uma transformação de payload aqui, uma regra de negócio ali — até ele virar um **monólito de fronteira** que todo time precisa tocar e todo deploy precisa coordenar. Aí o gateway reintroduz exatamente o acoplamento que os microsserviços atrás dele tentavam evitar. A disciplina é mantê-lo fino: roteamento e transversal genérico, sem regra de domínio. O que é lógica de negócio vive nos serviços; o que é forma por cliente vive no BFF.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A autenticação copiada em doze serviços",
          cenario:
            "Cada um dos doze serviços validava o token JWT por conta própria. Uma mudança na política de expiração exigia alterar e reimplantar os doze, e um deles ficou para trás, aceitando tokens que os outros já rejeitavam.",
          aplicacao:
            "A validação de token subiu para o API Gateway, executada uma vez na entrada. Os serviços passaram a confiar num cabeçalho de identidade já validado pelo gateway.",
          tradeoff:
            "A autenticação virou responsabilidade de um ponto central, que precisa de alta disponibilidade. Em troca, a política passou a mudar num lugar só, e a divergência entre serviços acabou.",
        },
        {
          titulo: "O gateway que virou monólito de fronteira",
          cenario:
            "Ao longo do tempo, o gateway foi acumulando transformações de payload e regras de negócio 'porque era conveniente'. Virou um componente que todos os times precisavam alterar, e cada mudança nele arriscava derrubar a entrada inteira.",
          aplicacao:
            "As regras de negócio foram devolvidas aos serviços, e a formatação por cliente foi movida para BFFs. O gateway voltou a fazer só roteamento e o transversal genérico.",
          tradeoff:
            "Surgiram BFFs e mais responsabilidade nos serviços. É o desenho correto: o gateway magro deixou de ser o gargalo de deploy que ele mesmo havia virado.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Encher o gateway de regra de negócio",
          texto:
            "Como tudo passa por ele, o gateway atrai 'só mais uma coisinha' até virar um monólito de fronteira que todo deploy precisa tocar. Ele reintroduz o acoplamento que os microsserviços evitavam. Mantenha-o fino: roteamento e transversal, sem domínio.",
        },
        {
          titulo: "Tratá-lo como se não fosse ponto único de falha",
          texto:
            "Se o gateway cai, a entrada do sistema inteiro cai com ele. Sem alta disponibilidade real — réplicas, health check, failover —, concentrar tudo num ponto troca N problemas isolados por um problema total.",
        },
        {
          titulo: "Confundir gateway com BFF",
          texto:
            "O gateway é um portão para todos, focado no transversal; o BFF é por cliente, focado em moldar a resposta. Fundir os dois incha o gateway com formatação por cliente — responsabilidades que rendem mais separadas.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Entrada única, transversal na borda",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Num sistema de vários serviços que precisa de entrada única.",
        "Para concentrar auth, rate limit e roteamento fora dos serviços.",
        "Para esconder a topologia e reorganizar serviços sem quebrar clientes.",
      ],
      evitar: [
        "Quando há um serviço só.",
        "Quando ele acumularia regra de negócio até virar monólito de fronteira.",
      ],
    },
  ],
};
