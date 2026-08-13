import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// HERANCA: o comportamento vem de subir na arvore de classes.
// Some um requisito e a arvore incha numa direcao so.
class Pato extends Ave {}          // e se o pinguim nao voa?
class Pinguim extends Ave {}       // Ave tem voar()... problema.

// COMPOSICAO: o comportamento vem de PECAS que voce encaixa.
interface Locomocao { mover(): string }
const voar: Locomocao = { mover: () => "voando" };
const nadar: Locomocao = { mover: () => "nadando" };

class Passaro {
  constructor(private loco: Locomocao) {}   // recebe a peca
  mover() { return this.loco.mover(); }      // delega
}

const pato = new Passaro(voar);
const pinguim = new Passaro(nadar);   // sem reescrever hierarquia nenhuma
// Trocar comportamento agora e trocar a peca, nao mudar a classe.`,
  },
  {
    lang: "typescript" as const,
    code: `// A mesma ideia no dia a dia do front:
// em vez de estender uma classe base de componente, encaixa-se
// comportamento por composicao (children) e por hooks.

function Card({ children }: { children: React.ReactNode }) {
  return <section className="card">{children}</section>;
}

// compor: o Card nao SABE o que tem dentro; recebe pronto.
<Card><Grafico /></Card>;

// reutilizar logica sem heranca: um hook, nao uma superclasse.
function usePaginacao(total: number) { /* ... */ }`,
  },
];

const ANTI_EXEMPLO = `// Parece composicao: tem um Logger. Mas ainda ESTENDE ServicoBase
// so para herdar salvar() e validar().
class PedidoService extends ServicoBase {
  constructor(private log: Logger) {
    super();
  }
  criar(dados: Pedido) {
    this.validar(dados); // herdado
    this.salvar(dados);  // herdado
    this.log.info("ok");
  }
}

// Mudar ServicoBase quebra PedidoService. A peca Logger nao
// salvou o acoplamento — so mascarou a heranca de reuso.`;

export const composicaoSobreHeranca: Conceito = {
  slug: "composicao-sobre-heranca",
  titulo: "Composição sobre herança",
  categoria: "principio",
  resumo:
    "Herança promete reúso e entrega acoplamento: a subclasse herda tudo do pai, inclusive o que não queria, e a árvore engessa numa dimensão só. Compor comportamento a partir de peças encaixáveis dá o mesmo reúso sem amarrar quem usa a quem fornece — por isso o conselho antigo de preferir composição, e só herdar quando a relação 'é um' é honesta.",
  tags: ["principio", "acoplamento", "reuso", "heranca", "composicao"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1994", ano: 1994, precisao: "aproximada" },
    fonte:
      "O conselho 'favoreça a composição de objetos sobre a herança de classes' está entre as máximas de projeto do GoF (Gamma, Helm, Johnson & Vlissides, 1994)",
    precursor:
      "A crítica à herança como acoplamento vinha das hierarquias profundas e frágeis dos primeiros sistemas orientados a objetos dos anos 1980.",
  },
  ondeAparece: [
    {
      onde: "componentes React que compõem",
      explicacao:
        "A interface se monta encaixando componentes uns dentro dos outros, não estendendo uma classe base — composição pura.",
    },
    {
      onde: "hooks no lugar de HOCs e mixins",
      explicacao:
        "Reutilizar lógica por hooks compõe comportamento sem a hierarquia de classes que mixins e HOCs traziam junto.",
    },
    {
      onde: "structs embutidas do Go",
      explicacao:
        "Go não tem herança de classe: você embute uma struct em outra e compõe comportamento, por decisão de projeto da linguagem.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Tem-um, não é-um: reuso sem hierarquia.
class PedidoService { constructor(private log: Logger) {} }`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Compor exige mais peças pequenas e a fiação explícita entre elas",
      "Sem herança, o comportamento comum é repetido ou delegado à mão em cada peça",
    ],
    naoValeSe:
      "há uma relação 'é um tipo de' genuína e estável, com contrato idêntico — aí a herança expressa isso melhor que a delegação.",
  },
  relacionados: ["strategy", "decorator", "ocp"],
  problema: [
    "Herança parece o caminho óbvio para reúso: coloque o comum no pai e as variações nos filhos. O problema aparece quando um filho precisa de quase tudo do pai, menos uma coisa — o pinguim que herda de Ave e não voa.",
    "A árvore só cresce numa dimensão. Quando o comportamento varia em dois eixos independentes (como se move × o que come), a herança obriga a multiplicar subclasses ou a duplicar código, e mudar o pai quebra todos os filhos de uma vez.",
  ],
  solucao: [
    "Montar o objeto a partir de peças encaixáveis: em vez de herdar 'voar', recebe-se um objeto de locomoção e delega-se a ele. Cada eixo de variação vira uma peça independente.",
    "Herdar apenas quando a relação é um verdadeiro 'é um' — o subtipo é substituível pelo supertipo em todo lugar (LSP) — e preferir composição no resto, que é a maioria dos casos.",
  ],
  quandoUsar: [
    "Quando o comportamento varia em mais de uma dimensão independente.",
    "Quando você quer trocar comportamento em tempo de execução, não só de compilação.",
    "Quando a hierarquia de herança já passou de dois ou três níveis e ficou frágil.",
  ],
  quandoEvitar: [
    "Quando existe uma relação 'é um' honesta, estável e com contrato idêntico.",
    "Quando a delegação manual criaria mais cerimônia do que a hierarquia simples resolveria.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Herança acopla o filho ao pai inteiro e só varia numa dimensão; quando o comportamento muda em eixos independentes, a árvore incha ou duplica. Composição monta o objeto a partir de peças que você encaixa e troca, dando o mesmo reúso sem a amarra. A regra prática: herde só quando a relação 'é um' for honesta e substituível; no resto, componha.",
    },
    {
      tipo: "analogia",
      emoji: "🧱",
      titulo: "Herdar um sobrenome × montar com LEGO",
      texto:
        "Herança é como herdar um sobrenome inteiro: vem tudo junto, o que você quer e o que não quer, e mudar exige mexer na família toda. Composição é montar com LEGO: você escolhe as peças que precisa, encaixa, e troca uma sem desmontar o resto. Um carrinho de LEGO vira caminhão trocando as rodas e a carroceria — não recriando a árvore genealógica do carrinho.",
    },
    {
      tipo: "secao",
      id: "por-que-doi",
      titulo: "Por que a herança engessa",
      resumo: [
        "O problema não é a herança em si, é o acoplamento que ela cria: a subclasse depende da implementação interna do pai, não só do contrato. Mudar o pai — reordenar chamadas, renomear um método protegido — quebra filhos que nem sabiam desse detalhe.",
        "E a árvore só varia numa direção. Se o comportamento muda em dois eixos, a herança obriga a uma classe por combinação (PatoQueVoaEComePeixe, PatoQueNadaEComeGraos) — a explosão combinatória que a composição resolve com uma peça por eixo.",
      ],
      extensao: [
        "É por isso que padrões como **Strategy**, **Decorator** e **State** existem: todos são composição disfarçada, trocando 'herdar comportamento' por 'receber um objeto que tem o comportamento'. O Strategy injeta o algoritmo; o Decorator embrulha para adicionar; o State delega para o objeto-estado atual. Nenhum deles precisa de uma subclasse por variação.",
        "A herança continua certa num caso: quando existe um 'é um' verdadeiro e o subtipo respeita o contrato do supertipo em todo lugar (a Lei de Liskov). `ArrayList é uma List` é honesto. `Pilha estende Vetor` não é — a pilha não quer os métodos de acesso aleatório do vetor, e herdá-los vaza operações que quebram a invariante da pilha. Quando você se pega sobrescrevendo métodos para lançar 'não suportado', a herança está mentindo, e o certo era compor.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Herança",
        itens: [
          "Comportamento vem de subir na árvore de classes",
          "A subclasse herda tudo, inclusive o que não usa",
          "Varia numa dimensão só; dois eixos explodem em subclasses",
          "Mudar o pai quebra todos os filhos de uma vez",
        ],
        nota: "Reúso barato de escrever — pago em acoplamento e em uma árvore que só engessa.",
      },
      depois: {
        titulo: "Composição",
        itens: [
          "Comportamento vem de peças que você encaixa",
          "O objeto recebe só as peças de que precisa",
          "Cada eixo de variação é uma peça independente",
          "Trocar comportamento é trocar a peça, em runtime",
        ],
        nota: "Mais fiação explícita — em troca de peças que se combinam e se trocam sem quebrar o resto.",
      },
      legenda:
        "A escolha é entre reúso por herança (acoplado, numa dimensão) e reúso por composição (desacoplado, combinável) — e o conselho pende para o segundo por padrão.",
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A hierarquia de usuários que virou nó",
          cenario:
            "Um sistema modelou UsuarioAdmin, UsuarioCliente e UsuarioParceiro por herança. Surgiu o parceiro que também é admin, e o cliente que vira parceiro — combinações que a árvore não previa.",
          aplicacao:
            "Papéis viraram peças compostas: um usuário passou a ter uma lista de papéis (permissões) em vez de ser de um tipo fixo, e cada papel é um objeto encaixável.",
          tradeoff:
            "O código de permissão ficou mais indireto — é preciso montar o conjunto de papéis em vez de checar o tipo. Em troca, qualquer combinação nova passou a ser dado, não uma classe nova.",
        },
        {
          titulo: "O componente base que todo mundo estendia",
          cenario:
            "Um front tinha um ComponenteBase que crescia a cada tela nova, porque toda tela o estendia para reaproveitar um punhado de utilidades. Mudar a base virou risco de quebrar tudo.",
          aplicacao:
            "As utilidades saíram da superclasse e viraram hooks e componentes compostos por children. As telas passaram a importar só o que usam, sem herdar de uma base comum.",
          tradeoff:
            "Cada tela ficou com alguns imports a mais em vez de herdar tudo de graça. Em troca, mexer numa utilidade deixou de ter potencial de quebrar telas que nem a usavam.",
        },
      ],
    },
    {
      tipo: "passos",
      titulo: "Como preferir composição",
      passos: [
        {
          titulo: "Mapear os eixos",
          texto:
            "Liste o que varia de forma independente (como se move, o que come, quem notifica). Cada eixo é candidato a uma peça.",
        },
        {
          titulo: "Extrair a peça",
          texto:
            "Uma interface pequena por eixo e implementações encaixáveis. O objeto recebe a peça — não herda o comportamento.",
        },
        {
          titulo: "Delegar, não sobrescrever",
          texto:
            "O dono chama a peça. Trocar comportamento em runtime é trocar a peça, sem reabrir a hierarquia.",
        },
        {
          titulo: "Herdar só com 'é um' honesto",
          texto:
            "Se o filho não substitui o pai em todo lugar (LSP), a herança está mentindo — composição é o caminho certo.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "A composição que ainda herda para reusar",
      comoSeParece:
        "Há uma peça injetada (Logger) e o diagrama fala em composição — mas a classe ainda estende uma base só para pegar `salvar` e `validar`. O acoplamento da herança continua; a peça só mascarou.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Ao mudar a base",
          efeito: "PedidoService quebra mesmo sem tocar no Logger — a herança de reuso ainda amarra.",
        },
        {
          quando: "No teste",
          efeito: "Testar criar exige montar ServicoBase inteiro; a peça injetada não isolou o que importa.",
        },
        {
          quando: "Na revisão",
          efeito: "Aparece `extends` 'só por conveniência' sem relação 'é um' — sinal clássico de herança errada.",
        },
      ],
      correcao:
        "Receba também persistência e validação por composição (ou módulos), não por `extends`. Herde só quando o subtipo for substituível de verdade.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Herdar para reaproveitar código, sem 'é um'",
          texto:
            "Estender uma classe só porque ela tem métodos úteis cria uma relação de tipo que não existe. Pilha que estende Vetor herda acesso aleatório que quebra a invariante da pilha — o reúso veio junto com operações erradas.",
        },
        {
          titulo: "Sobrescrever método para lançar 'não suportado'",
          texto:
            "Quando o filho precisa desativar algo que herdou, a herança está mentindo sobre o contrato. É o sinal clássico de violação de Liskov e o momento exato em que compor seria mais honesto.",
        },
        {
          titulo: "Trocar herança por composição e recriar o acoplamento",
          texto:
            "Compor não é mágica: se a peça injetada depende dos internos de quem a usa, o acoplamento voltou por outra porta. A peça precisa depender de um contrato, não da implementação de quem a recebe.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Da árvore rígida às peças encaixáveis",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Comportamento que varia em mais de uma dimensão.",
        "Trocar comportamento em tempo de execução.",
        "Quando a hierarquia já passou de dois ou três níveis.",
      ],
      evitar: [
        "Quando há um 'é um' honesto e estável.",
        "Quando a delegação manual criaria mais cerimônia do que ganho.",
      ],
    },
  ],
};
