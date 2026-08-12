import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Agregado: um grupo de objetos tratado como uma unidade, com uma
// RAIZ que e a unica porta de entrada e a guardia das invariantes.

class Pedido {                 // <- raiz do agregado
  private itens: Item[] = [];
  private constructor(readonly id: string) {}

  // Ninguem adiciona item por fora: passa pela raiz, que valida.
  adicionarItem(produto: string, preco: number, qtd: number) {
    if (this.total() + preco * qtd > 100_000) {
      throw new Error("pedido excede o limite"); // invariante do TODO
    }
    this.itens.push(new Item(produto, preco, qtd));
  }

  total() { return this.itens.reduce((s, i) => s + i.subtotal(), 0); }
}

// Regras que valem para agregados pequenos e desacoplados:
//   1. So a raiz e referenciada de fora (Item nunca vaza sozinho).
//   2. Outros agregados sao referenciados por ID, nao por objeto.
//   3. Um agregado = uma transacao = uma fronteira de consistencia.`,
  },
];

export const agregado: Conceito = {
  slug: "agregado",
  titulo: "Agregado",
  categoria: "arquitetura",
  resumo:
    "Um agregado é um grupo de objetos que muda junto e precisa ser consistente junto, tratado como uma única unidade por trás de uma raiz. Só a raiz é acessada de fora; ela guarda as invariantes que valem para o conjunto. É a fronteira que responde à pergunta mais difícil da modelagem: o que precisa estar consistente no mesmo instante, e o que pode esperar.",
  tags: ["ddd", "dominio", "consistencia", "invariante", "fronteira"],
  dificuldade: "avancado",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2003", ano: 2003, precisao: "aproximada" },
    fonte:
      "Eric Evans, 'Domain-Driven Design', 2003 — o Agregado como fronteira de consistência é um dos blocos táticos centrais do DDD",
    precursor:
      "A ideia de um objeto-raiz que guarda a consistência de um grupo de objetos ecoa o encapsulamento de sempre, agora no nível do modelo de domínio.",
  },
  ondeAparece: [
    {
      onde: "Pedido que controla seus Itens",
      explicacao:
        "O pedido é a raiz do agregado: você não altera um item por fora, mexe tudo pela raiz, que guarda a invariante do total.",
    },
    {
      onde: "a fronteira de uma transação",
      explicacao:
        "Um agregado costuma ser a unidade que se salva e se bloqueia junto — a fronteira natural de consistência de uma transação.",
    },
    {
      onde: "referência a outro agregado por id",
      explicacao:
        "Apontar para outro agregado por id, e não por objeto embutido, é a regra que mantém os agregados pequenos e desacoplados.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Fronteira de consistência: muda o agregado pela raiz.
pedido.adicionarItem(sku, 2);
await repo.salvar(pedido);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Definir a fronteira certa é difícil, e um agregado grande demais vira gargalo de contenção",
      "Referenciar outros agregados só por id espalha a lógica que antes seria uma navegação direta de objetos",
    ],
    naoValeSe:
      "o modelo é um CRUD sem invariantes entre entidades — sem regra que atravessa objetos, a fronteira de agregado não protege nada.",
  },
  relacionados: ["value-object", "repository", "niveis-de-isolamento"],
  problema: [
    "Num modelo de objetos interligados, qualquer parte pode alterar qualquer outra: alguém mexe direto num item de pedido, num endereço de cliente, numa linha de estoque. Quando duas partes mudam ao mesmo tempo, quem garante que a regra que liga as duas continua valendo?",
    "Sem uma fronteira clara, as invariantes ('o total do pedido não passa do limite', 'o estoque não fica negativo') ficam espalhadas e sem dono. Cada ponto de acesso precisa lembrar de todas as regras, e uma hora alguém esquece.",
  ],
  solucao: [
    "Agrupar os objetos que precisam ser consistentes juntos sob uma raiz. Só a raiz é acessível de fora; toda mudança passa por ela, que valida as invariantes do conjunto antes de aplicar.",
    "Manter os agregados pequenos e referenciar outros agregados por id, não por objeto embutido — assim cada agregado é a unidade de uma transação, e a consistência entre agregados diferentes fica para depois (eventual).",
  ],
  quandoUsar: [
    "Quando há invariantes que envolvem mais de um objeto e precisam valer sempre.",
    "Para definir a fronteira de uma transação: o que se salva e se bloqueia junto.",
    "Ao decidir o que precisa ser consistente agora e o que pode ser consistente depois.",
  ],
  quandoEvitar: [
    "Em modelos CRUD sem invariantes que cruzam entidades.",
    "Quando a fronteira ficaria tão grande que toda operação disputaria o mesmo agregado.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um agregado agrupa os objetos que precisam estar consistentes no mesmo instante, atrás de uma raiz que é a única porta de entrada e a dona das invariantes. Só a raiz é referenciada de fora; outros agregados entram por id, não embutidos. A regra prática: um agregado é a fronteira de uma transação. Definir essa fronteira — pequena o bastante para não travar, grande o bastante para proteger a regra — é a decisão central da modelagem.",
    },
    {
      tipo: "analogia",
      emoji: "📦",
      titulo: "A encomenda lacrada",
      texto:
        "Uma encomenda é lacrada e etiquetada como uma unidade: você não abre a caixa para trocar um item lá dentro no meio do transporte — você lida com a encomenda inteira, pela etiqueta. Se precisar mudar o conteúdo, a transportadora abre, ajusta e lacra de novo, garantindo que peso e conteúdo continuam batendo com a etiqueta. O agregado é essa encomenda lacrada: a raiz é a etiqueta, o lacre é a regra de que ninguém mexe nas partes por fora, e a consistência (peso × conteúdo) é verificada a cada vez que a caixa é fechada.",
    },
    {
      tipo: "secao",
      id: "a-fronteira",
      titulo: "A fronteira é a decisão",
      resumo: [
        "O difícil no agregado não é a raiz nem as regras de acesso — é onde traçar a fronteira. Ela responde a uma pergunta de negócio, não técnica: o que precisa estar consistente no mesmo instante (dentro do agregado) e o que pode ficar consistente daqui a pouco (entre agregados).",
        "Errar para grande é o mais comum: um agregado que engloba objetos demais vira um ponto único de contenção, porque toda operação que toca qualquer parte precisa bloquear o todo. Errar para pequeno deixa uma invariante real sem quem a guarde.",
      ],
      extensao: [
        "Duas regras mantêm o agregado saudável. A primeira: **referencie outros agregados por id**, nunca embutindo o objeto inteiro. Um Pedido não guarda o objeto Cliente, guarda o `clienteId`. Isso mantém o agregado pequeno, evita carregar meio banco para abrir um pedido, e deixa claro que Cliente é outra fronteira de consistência, com sua própria transação.",
        "A segunda: **um agregado, uma transação**. A consistência dentro de um agregado é imediata e forte (a raiz valida antes de salvar); a consistência entre agregados diferentes é **eventual**, coordenada por eventos ou por uma saga. Isso liga o agregado direto ao resto do catálogo: quando 'pagar o pedido' precisa também 'baixar o estoque' — dois agregados —, não se faz numa transação gigante que trava os dois; publica-se um evento e o estoque reage. A fronteira do agregado é, na prática, a fronteira entre o que é transação e o que é mensagem.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O item alterado por fora que furou o limite",
          cenario:
            "Um sistema permitia adicionar itens a um pedido acessando a lista de itens diretamente. A regra 'pedido não passa de um valor máximo' estava no serviço, e um caminho novo de código esqueceu de checá-la, criando pedidos acima do limite.",
          aplicacao:
            "A lista de itens foi encapsulada dentro da raiz Pedido, e a única forma de adicionar item passou a ser `pedido.adicionarItem(...)`, que valida a invariante do total antes de aceitar.",
          tradeoff:
            "O acesso ficou menos direto — não dá mais para mexer nos itens por fora. É exatamente o ponto: a invariante passou a ter um dono único, e nenhum caminho de código consegue mais furá-la.",
        },
        {
          titulo: "O agregado gigante que travava tudo",
          cenario:
            "Um agregado Cliente incluía pedidos, endereços e histórico inteiro. Qualquer mudança — até atualizar um telefone — bloqueava o cliente todo, e clientes ativos viviam em contenção sob concorrência.",
          aplicacao:
            "O agregado foi quebrado: Cliente, Pedido e Endereço viraram agregados separados, referenciando-se por id. Cada um passou a ser uma transação independente.",
          tradeoff:
            "Operações que antes eram uma navegação direta de objetos viraram buscas por id e, às vezes, consistência eventual entre agregados. Em troca, a contenção sumiu e cada agregado passou a escalar sozinho.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Deixar acessar as partes por fora da raiz",
          texto:
            "Se qualquer código pode mexer num item de pedido diretamente, a raiz deixa de ser a guardiã das invariantes e a regra volta a ficar espalhada. Toda mudança tem que passar pela raiz, ou o agregado não protege nada.",
        },
        {
          titulo: "Agregado grande demais",
          texto:
            "Englobar objetos que não precisam de consistência imediata entre si transforma o agregado num ponto único de contenção: toda operação bloqueia o todo. A fronteira deve conter só o que muda junto de verdade.",
        },
        {
          titulo: "Embutir outros agregados em vez de referenciar por id",
          texto:
            "Guardar o objeto Cliente inteiro dentro do Pedido acopla as duas fronteiras, infla a carga e sugere uma consistência imediata que não existe. Entre agregados, referencie por id e aceite consistência eventual.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "A raiz que guarda a invariante",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando há invariantes envolvendo mais de um objeto que precisam valer sempre.",
        "Para definir a fronteira de uma transação.",
        "Ao separar o que precisa ser consistente agora do que pode ser depois.",
      ],
      evitar: [
        "Em modelos CRUD sem invariantes entre entidades.",
        "Quando a fronteira ficaria grande a ponto de tudo disputar o mesmo agregado.",
      ],
    },
  ],
};
