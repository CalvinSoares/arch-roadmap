import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// VIOLACAO: o "trem descarrilhado" — cada ponto e um acoplamento.
const cidade = pedido.getCliente().getEndereco().getCidade();
//              ^^^^ pedido conhece cliente, endereco E cidade.
// Mude a estrutura interna de qualquer um dos tres e esta linha quebra.

// Lei de Demeter: um metodo so pode falar com "amigos proximos":
//   - o proprio objeto (this)
//   - parametros que recebeu
//   - objetos que ele mesmo criou
//   - seus campos diretos
// ...nunca com o objeto que veio DE um retorno de outro.

// TELL, DON'T ASK: em vez de puxar os dados para decidir por fora,
// peca ao objeto que ele faça:
const frete = pedido.calcularFrete();   // pedido decide como, com seus internos
// Quem chama nao sabe (nem precisa saber) que existe cliente > endereco > cidade.`,
  },
];

export const leiDeDemeter: Conceito = {
  slug: "lei-de-demeter",
  titulo: "Lei de Deméter",
  categoria: "principio",
  resumo:
    "Fale apenas com os amigos próximos. Um método deve interagir só com o próprio objeto, seus campos, seus parâmetros e o que ele mesmo cria — nunca navegar por dentro do que um objeto devolveu. Cada ponto a mais numa cadeia (a.getB().getC().getD()) é um acoplamento à estrutura interna de outro, que quebra quando essa estrutura muda.",
  tags: ["principio", "acoplamento", "encapsulamento", "tell-dont-ask"],
  dificuldade: "iniciante",
  tempoLeitura: 5,
  nasceu: {
    quando: { rotulo: "1987", ano: 1987, precisao: "aproximada" },
    fonte:
      "A Lei de Deméter foi formulada por Karl Lieberherr e colegas na Northeastern University em 1987, durante o projeto de software Demeter",
    precursor:
      "O nome vem do projeto Demeter; a ideia de 'falar só com vizinhos próximos' generaliza o baixo acoplamento que o design estruturado já perseguia.",
  },
  ondeAparece: [
    {
      onde: "a.b.c.d encadeado",
      explicacao:
        "Cada ponto a mais numa cadeia de acessos revela que um objeto conhece os internos de outro — a violação clássica de Deméter.",
    },
    {
      onde: "o train wreck no código",
      explicacao:
        "pedido.getCliente().getEndereco().getCidade() é o 'trem descarrilhado' que Deméter proíbe: fale só com o vizinho direto.",
    },
    {
      onde: "tell, don't ask",
      explicacao:
        "Em vez de puxar dados de dentro de um objeto para decidir por ele, peça a ele que faça — o corolário prático de Deméter.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Fale só com amigos próximos — sem trem de getters.
pedido.cidadeEntrega(); // em vez de getCliente().getEndereco()...`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Cumprir Deméter multiplica métodos de fachada que só repassam a chamada adiante",
      "Excesso de wrappers para 'não falar com estranhos' engorda a interface intermediária",
    ],
    naoValeSe:
      "a cadeia é sobre uma estrutura de dados burra e estável (um DTO, um JSON de resposta) — aí navegar por ela não acopla comportamento nenhum.",
  },
  relacionados: ["dip", "isp", "facade"],
  problema: [
    "É tentador puxar o dado que você precisa navegando pelos objetos: `pedido.getCliente().getEndereco().getCidade()`. Funciona — até a estrutura interna de qualquer um dos três mudar, e a linha quebrar num lugar que não tinha nada a ver com a mudança.",
    "Cada ponto nessa cadeia é uma dependência escondida: quem escreveu a linha passou a conhecer a estrutura interna de cliente, de endereço e de cidade. O acoplamento se espalha sem ninguém declarar.",
  ],
  solucao: [
    "Restringir com quem cada método conversa: só o próprio objeto, seus campos, seus parâmetros e objetos que ele mesmo cria. Não navegar pelo que um método devolveu.",
    "Aplicar 'tell, don't ask': em vez de perguntar os dados internos para decidir por fora, dizer ao objeto o que fazer e deixá-lo usar os próprios internos. A cadeia some porque a decisão migra para onde o dado mora.",
  ],
  quandoUsar: [
    "Ao ver cadeias de chamadas com vários pontos atravessando objetos diferentes.",
    "Quando uma mudança de estrutura interna de uma classe quebra código distante.",
    "Ao decidir entre expor um getter ou oferecer um método que faz o trabalho.",
  ],
  quandoEvitar: [
    "Em estruturas de dados puras e estáveis (DTOs, respostas de API), onde navegar não acopla comportamento.",
    "Quando seguir a lei ao pé da letra só cria uma cascata de métodos-repasse sem valor.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "A Lei de Deméter diz: fale só com os amigos próximos — o próprio objeto, seus campos, parâmetros e o que ele criou —, nunca com o que veio do retorno de outro. Cada ponto a mais numa cadeia como a.getB().getC() acopla você à estrutura interna alheia. A saída é 'tell, don't ask': em vez de puxar os dados para decidir por fora, peça ao objeto que ele faça, e a cadeia desaparece.",
    },
    {
      tipo: "analogia",
      emoji: "🐕",
      titulo: "Pagar o passeador, não a mão dele",
      texto:
        "Para pagar quem passeou com seu cachorro, você não enfia a mão no bolso dele e tira o troco — você entrega o dinheiro e deixa que ele guarde. Meter a mão no bolso é `passeador.getBolso().getCarteira().inserir(nota)`: você passou a depender de ele ter bolso, de ter carteira, de a carteira abrir. Entregar e deixar guardar é `passeador.receber(valor)`. Deméter é exatamente isso: não mexa nos bolsos dos outros.",
    },
    {
      tipo: "secao",
      id: "amigos-proximos",
      titulo: "Quem são os amigos próximos",
      resumo: [
        "A regra lista com quem um método pode conversar: o próprio objeto (this), os objetos que ele recebeu como parâmetro, os que ele mesmo criou e seus campos diretos. Qualquer coisa além disso — navegar pelo que um método devolveu — é falar com um estranho.",
        "O sintoma visível é a cadeia de pontos. Não porque pontos sejam proibidos, mas porque cada salto entre objetos diferentes é uma dependência nova na estrutura interna alheia.",
      ],
      extensao: [
        "Há uma exceção importante que evita o zelo cego: a lei fala de **comportamento**, não de dados burros. Encadear operações sobre uma mesma coleção (`itens.filter(...).map(...)`) ou navegar por um DTO/JSON de resposta não viola Deméter, porque não há comportamento nem invariante sendo violado — são estruturas de dados, não colaboradores. A lei protege o encapsulamento de objetos com regras, não a leitura de um saco de campos.",
        "O corolário prático é **'tell, don't ask'**: pare de perguntar o estado de um objeto para decidir por ele e passe a mandar o objeto agir. `if (conta.getSaldo() >= valor) conta.setSaldo(conta.getSaldo() - valor)` vira `conta.debitar(valor)`. A decisão migra para onde o dado vive, a cadeia de getters some, e a invariante (não ficar negativo) passa a ser guardada pelo dono do dado — não espalhada por quem o consome.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A troca de endereço que quebrou o frete",
          cenario:
            "O cálculo de frete fazia `pedido.getCliente().getEndereco().getCep()`. O time de cadastro passou a permitir múltiplos endereços por cliente, mudando a estrutura — e o frete quebrou, longe de onde a mudança aconteceu.",
          aplicacao:
            "O pedido passou a expor `calcularFrete()`, guardando internamente qual endereço usar. Quem calcula frete deixou de conhecer a estrutura de cliente e endereço.",
          tradeoff:
            "O pedido ganhou mais responsabilidade e um método a mais. Em troca, mudanças na estrutura de cliente pararam de vazar para o cálculo de frete.",
        },
        {
          titulo: "O getter que virou método de negócio",
          cenario:
            "Vários lugares faziam `conta.getSaldo()` para checar e depois `conta.setSaldo(...)` para debitar. A regra 'saldo não fica negativo' estava espalhada e, num ponto, alguém esqueceu de checá-la.",
          aplicacao:
            "Os getters/setters de saldo foram substituídos por `conta.debitar(valor)`, que carrega a invariante. A regra passou a morar num lugar só, dentro do dono do dado.",
          tradeoff:
            "A conta ficou menos 'transparente' — não dá mais para mexer no saldo por fora. É exatamente o ponto: o encapsulamento voltou, e a invariante deixou de depender da disciplina de cada chamador.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Aplicar a lei a estruturas de dados puras",
          texto:
            "Navegar por um DTO ou um JSON de resposta não viola Deméter — não há comportamento a proteger. Criar métodos-repasse para cada campo de um saco de dados só engorda a interface sem ganho de encapsulamento.",
        },
        {
          titulo: "Trocar a cadeia por um mar de wrappers",
          texto:
            "Cumprir a lei criando um método de repasse para cada acesso (getCidadeDoCliente, getCepDoCliente...) esconde a cadeia sem remover o acoplamento: o objeto do meio ainda conhece toda a estrutura, agora com mais código.",
        },
        {
          titulo: "Confundir 'menos pontos' com 'melhor design'",
          texto:
            "O objetivo não é contar pontos, é reduzir o conhecimento que um objeto tem dos internos de outro. Uma linha com dois pontos que respeita 'tell, don't ask' é melhor que cinco métodos de repasse que fingem obedecer.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Do trem descarrilhado ao tell, don't ask",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ao ver cadeias de pontos atravessando objetos diferentes.",
        "Quando mudar a estrutura interna de uma classe quebra código distante.",
        "Ao escolher entre expor um getter ou oferecer um método que faz.",
      ],
      evitar: [
        "Em DTOs e respostas de API, onde navegar não acopla comportamento.",
        "Quando obedecer ao pé da letra só cria repasses sem valor.",
      ],
    },
  ],
};
