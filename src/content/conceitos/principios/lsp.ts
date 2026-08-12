import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Conta {
        <<abstract>>
        +sacar(v)
    }
    class ContaCorrente {
        +sacar(v)
    }
    class ContaPoupanca {
        +sacar(v)
    }
    class ContaSalario {
        +sacar(v) LANCA?
    }
    Conta <|-- ContaCorrente
    Conta <|-- ContaPoupanca
    Conta <|-- ContaSalario`;

const CAMADAS = [
  {
    id: "contrato",
    titulo: "O contrato do supertipo",
    descricao: "A promessa que todo subtipo precisa cumprir — coração do princípio",
    destaque: true,
  },
  { id: "pre", titulo: "Pré-condições", descricao: "O subtipo não pode exigir mais do que o pai" },
  { id: "pos", titulo: "Pós-condições", descricao: "O subtipo não pode entregar menos do que o pai" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// VIOLACAO CLASSICA: o subtipo quebra a promessa do supertipo
class Retangulo {
  constructor(protected larg: number, protected alt: number) {}
  setLargura(l: number): void { this.larg = l; }
  setAltura(a: number): void { this.alt = a; }
  area(): number { return this.larg * this.alt; }
}

class Quadrado extends Retangulo {
  setLargura(l: number): void { this.larg = l; this.alt = l; } // muda a altura junto!
  setAltura(a: number): void { this.larg = a; this.alt = a; }
}

// Codigo escrito contra Retangulo, valido para qualquer Retangulo
function redimensionar(r: Retangulo): void {
  r.setLargura(5);
  r.setAltura(4);
  console.assert(r.area() === 20, "esperava 20, veio " + r.area());
}

redimensionar(new Retangulo(0, 0)); // ok: 20
redimensionar(new Quadrado(0, 0));  // FALHA: 16 — o quadrado nao e substituivel

// CORRECAO: nao ha relacao de subtipo; sao formas irmas e imutaveis
interface Forma { area(): number }
class Ret implements Forma {
  constructor(private l: number, private a: number) {}
  comLargura(l: number): Ret { return new Ret(l, this.a); }
  area(): number { return this.l * this.a; }
}
class Quad implements Forma {
  constructor(private lado: number) {}
  area(): number { return this.lado ** 2; }
}`,
  },
  {
    lang: "python" as const,
    code: `# VIOLACAO CLASSICA: o subtipo quebra a promessa do supertipo
class Retangulo:
    def __init__(self, larg, alt):
        self._larg, self._alt = larg, alt
    def set_largura(self, l): self._larg = l
    def set_altura(self, a): self._alt = a
    def area(self): return self._larg * self._alt

class Quadrado(Retangulo):
    def set_largura(self, l): self._larg = self._alt = l  # muda a altura junto!
    def set_altura(self, a): self._larg = self._alt = a

# Codigo escrito contra Retangulo, valido para qualquer Retangulo
def redimensionar(r):
    r.set_largura(5)
    r.set_altura(4)
    assert r.area() == 20, f"esperava 20, veio {r.area()}"

redimensionar(Retangulo(0, 0))  # ok
# redimensionar(Quadrado(0))    # AssertionError: 16

# CORRECAO: formas irmas e imutaveis, sem relacao de subtipo
class Ret:
    def __init__(self, l, a): self._l, self._a = l, a
    def com_largura(self, l): return Ret(l, self._a)
    def area(self): return self._l * self._a

class Quad:
    def __init__(self, lado): self._lado = lado
    def area(self): return self._lado ** 2`,
  },
];

export const lsp: Conceito = {
  slug: "lsp",
  titulo: "LSP — Substituição de Liskov",
  categoria: "principio",
  resumo:
    "Um subtipo deve poder substituir seu supertipo sem que o código que usa o supertipo perceba a diferença — o que é uma exigência sobre comportamento, não apenas sobre assinatura.",
  tags: ["solid", "heranca", "contrato", "polimorfismo"],
  dificuldade: "avancado",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "1987", ano: 1987, precisao: "aproximada" },
    fonte:
      "Barbara Liskov, keynote 'Data Abstraction and Hierarchy', OOPSLA 1987; formalizado com Jeannette Wing em 'A Behavioral Notion of Subtyping', 1994",
    precursor:
      "A noção de subtipo compatível já rondava a teoria de tipos, mas foi Liskov quem a amarrou ao comportamento observável, e não só à assinatura.",
  },
  ondeAparece: [
    {
      onde: "List: ArrayList × LinkedList",
      explicacao:
        "Qualquer implementação de List entra onde List é esperado; trocar ArrayList por LinkedList não quebra quem só depende do contrato.",
    },
    {
      onde: "Arrays.asList que quebra no add()",
      explicacao:
        "A List de tamanho fixo devolvida por Arrays.asList lança em .add(): o subtipo que promete menos que o supertipo, a violação clássica do JDK.",
    },
    {
      onde: "drivers atrás de uma interface",
      explicacao:
        "Postgres ou MySQL por trás da mesma interface de banco só são substituíveis se cada driver cumprir o contrato inteiro, sem surpresas.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Subtipo substitui o base sem surpresa.
function migrar(aves: Ave[]) { for (const a of aves) a.voar(); }`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Manter o contrato do supertipo honesto limita o que cada subtipo pode fazer diferente",
      "Verificar a substituibilidade de verdade exige testes sobre o contrato, não só sobre a classe",
    ],
    naoValeSe:
      "não há herança nem polimorfismo em jogo — sem subtipos substituindo um supertipo, a regra não tem sobre o que valer.",
  },
  relacionados: ["ocp", "isp", "dip"],
  problema: [
    "Herança que parece correta pela linguagem produz erros em tempo de execução: o subtipo compila, encaixa no tipo, e quebra a expectativa de quem programou contra o supertipo.",
    "O sintoma é um `if (x instanceof Y)` aparecendo no código que deveria ser polimórfico — sinal de que os subtipos não são realmente intercambiáveis.",
  ],
  solucao: [
    "Tratar a assinatura como o mínimo e o comportamento como o contrato de verdade: o subtipo não pode exigir mais para funcionar, nem entregar menos do que o supertipo prometeu.",
    "Quando o subtipo não consegue cumprir a promessa, a resposta não é adaptá-lo com exceções — é reconhecer que a relação de herança está errada e trocá-la por composição ou por tipos irmãos.",
  ],
  quandoUsar: [
    "Sempre que houver herança ou implementação de interface — o princípio é um teste de validade, não uma opção.",
    "Ao revisar hierarquias em que aparecem exceções de 'não suportado'.",
    "Ao desenhar contratos que serão implementados por terceiros.",
  ],
  quandoEvitar: [
    "Não é um princípio de 'evitar': é uma condição. O que se evita é a herança que o viola.",
    "Casos em que a intuição de mundo real ('quadrado é um retângulo') conflita com o contrato do código — a modelagem precisa seguir o comportamento, não a taxonomia.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Se o código funciona com o pai, tem de funcionar com o filho — sem checagens de tipo e sem surpresas. Compilar não basta: o subtipo precisa cumprir também as promessas de comportamento que o supertipo fez.",
    },
    {
      tipo: "analogia",
      emoji: "🔑",
      titulo: "A cópia da chave",
      texto:
        "Uma cópia da chave da sua casa é aceitável se abrir a mesma porta, do mesmo jeito. Se ela abre mas exige girar três vezes, ou só funciona antes das seis da tarde, ela tecnicamente 'é uma chave' e mesmo assim quebra o que você esperava. A forma encaixa na fechadura; o comportamento é que decide se a substituição é válida.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Linguagens verificam assinatura, não comportamento. Um subtipo pode ter todos os métodos certos, compilar sem aviso e ainda assim violar o que o código chamador assumia.",
        "O resultado é um polimorfismo que não se sustenta: quem usa a abstração precisa saber qual implementação recebeu, e o benefício de programar contra o tipo desaparece.",
      ],
      extensao: [
        "Barbara Liskov formulou isso em 1987 como uma condição sobre propriedades: se toda propriedade demonstrável sobre objetos do tipo T vale também para objetos do subtipo S, então S é subtipo de T. Traduzido para o dia a dia, são três regras práticas: **pré-condições não podem ser fortalecidas**, **pós-condições não podem ser enfraquecidas** e **invariantes do supertipo precisam ser preservadas**.",
        "Fortalecer pré-condição é exigir mais: o pai aceitava qualquer inteiro e o filho só aceita positivos. Enfraquecer pós-condição é entregar menos: o pai garantia lista ordenada e o filho devolve em qualquer ordem. Ambos quebram código que já funcionava, sem nenhum erro de compilação.",
        "O exemplo do quadrado e do retângulo é famoso porque expõe a raiz do problema: a taxonomia do mundo real não é a mesma coisa que a relação de subtipo em programação. Matematicamente um quadrado é um retângulo; em código, `Quadrado` só é subtipo de `Retangulo` se o retângulo for **imutável**. É a mutabilidade — poder mudar largura sem mudar altura — que cria a promessa impossível de cumprir.",
      ],
    },
    {
      tipo: "secao",
      id: "sintomas",
      titulo: "Como detectar a violação",
      resumo: [
        "As violações se anunciam de formas bem reconhecíveis, quase todas envolvendo o chamador precisando saber demais sobre a implementação.",
      ],
      extensao: [
        "O sinal mais direto é o **método que lança 'não suportado'**. Se `adicionar()` existe na interface e uma implementação apenas lança exceção, o contrato está sendo quebrado por construção — e todo chamador precisa saber com qual implementação está falando.",
        "O segundo é o **`instanceof` no código polimórfico**. Se quem recebe o supertipo precisa perguntar qual é o tipo real para decidir o que fazer, a substituição não é possível na prática.",
        "O terceiro é a **documentação com exceções**: 'este método funciona para todos os tipos, exceto para X'. Cada exceção assim é uma violação declarada.",
        "O teste que fecha a questão é escrever a suíte contra o supertipo e rodá-la contra todos os subtipos. Se algum precisa de um teste diferente ou de um caso especial, ele não é substituível — e a suíte compartilhada vira um detector permanente de regressão.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Herança pela taxonomia",
        itens: [
          "Quadrado herda de Retangulo porque 'é um retângulo'",
          "setLargura muda a altura junto para manter o quadrado",
          "código que redimensiona quebra sem erro de compilação",
          "o chamador precisa checar o tipo para não errar",
        ],
        nota: "A hierarquia parece certa no diagrama e mente no comportamento: o subtipo não consegue honrar a promessa de largura e altura independentes.",
      },
      depois: {
        titulo: "Modelagem pelo comportamento",
        itens: [
          "Ret e Quad implementam a mesma interface Forma",
          "não há relação de herança entre eles",
          "objetos imutáveis: redimensionar devolve um novo",
          "nenhum chamador precisa saber qual recebeu",
        ],
        nota: "O custo é abrir mão de uma hierarquia intuitiva e, muitas vezes, adotar imutabilidade — que resolve boa parte das violações de Liskov pela raiz.",
      },
      legenda:
        "A correção quase nunca é ajustar o subtipo: é reconhecer que a relação de herança estava errada. Quando o filho não consegue cumprir a promessa, ele não é um filho.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "contrato",
          label: "Contrato de Conta.sacar(v)",
          nota: "a promessa que vale para todo subtipo",
          destaque: true,
          filhos: [
            { id: "pre", label: "Pré-condição", nota: "aceita v > 0 — o filho não pode exigir mais" },
            { id: "pos", label: "Pós-condição", nota: "saldo diminui em v — o filho não pode entregar menos" },
            { id: "inv", label: "Invariante", nota: "saldo nunca fica indefinido" },
          ],
        },
      ],
      legenda:
        "Herdar é assinar as três cláusulas de uma vez. Uma ContaSalario que proíbe saque acima de um limite fortaleceu a pré-condição e deixou de ser substituível.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "pre",
          titulo: "Pré-condições",
          curto: "o subtipo não exige mais",
          detalhe:
            "O que o método precisa para funcionar. Um subtipo pode aceitar mais casos que o pai, nunca menos — quem chamava com um argumento válido antes continua chamando depois.",
          exemplo: "// pai aceita qualquer valor > 0; filho NÃO pode exigir valor > 100",
          seViolar:
            "código que funcionava com o supertipo passa a lançar exceção ao receber o subtipo, sem nenhum aviso em tempo de compilação.",
        },
        {
          id: "pos",
          titulo: "Pós-condições",
          curto: "o subtipo não entrega menos",
          detalhe:
            "O que o método garante ao terminar. Um subtipo pode garantir mais (uma lista ordenada onde só se prometia uma lista), nunca menos.",
          exemplo: "// pai garante lista ordenada; filho NÃO pode devolver em ordem arbitrária",
          seViolar:
            "o chamador confia na garantia do supertipo e produz resultado errado — silenciosamente, o que é pior que uma exceção.",
        },
        {
          id: "invariante",
          titulo: "Invariantes",
          curto: "o que sempre vale",
          detalhe:
            "Propriedades que se mantêm verdadeiras durante toda a vida do objeto. O subtipo pode acrescentar invariantes próprias, desde que não quebre nenhuma herdada.",
          exemplo: "// invariante do Retangulo: largura e altura são independentes",
          seViolar:
            "é exatamente o caso do quadrado: ao amarrar largura e altura, ele quebra uma invariante que o supertipo prometia.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Código",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Conta salário numa hierarquia de contas",
          cenario:
            "Um banco modela ContaCorrente, ContaPoupanca e ContaSalario herdando de Conta, que promete `sacar(valor)` para qualquer valor até o saldo.",
          aplicacao:
            "A conta salário não pode transferir para terceiros nem sacar acima de um limite. Em vez de lançar exceção em `sacar`, o modelo separa capacidades: interfaces distintas para o que cada conta realmente faz.",
          tradeoff:
            "O código do chamador fica mais explícito sobre capacidades e, ao mesmo tempo, mais verboso — não existe mais um tipo 'Conta' universal que sirva para todo caso de uso.",
        },
        {
          titulo: "Coleção somente-leitura",
          cenario:
            "Uma API devolve uma lista imutável tipada como a interface de lista da linguagem, cujos métodos de escrita lançam exceção.",
          aplicacao:
            "Separar em duas interfaces — uma de leitura e outra que adiciona escrita — faz o tipo dizer a verdade. Quem só lê recebe a interface de leitura e nunca tem acesso ao que não pode usar.",
          tradeoff:
            "É a origem de um dos exemplos mais debatidos do problema, presente em bibliotecas de várias linguagens; corrigir depois de publicada a API costuma ser inviável, e o remédio vira documentação.",
        },
        {
          titulo: "Implementação de repositório em memória para testes",
          cenario:
            "Um repositório falso é usado nos testes no lugar do real, implementando a mesma interface.",
          aplicacao:
            "Uma suíte de contrato roda contra as duas implementações e cobra as mesmas garantias: ordenação, unicidade, comportamento em caso de ausência. O falso só é aceito se passar.",
          tradeoff:
            "Manter o falso fiel exige disciplina contínua; sem a suíte compartilhada, ele diverge devagar e os testes passam a validar um comportamento que a produção não tem.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Modelar pela taxonomia do mundo real",
          texto:
            "'Um quadrado é um retângulo', 'um pinguim é uma ave', 'uma conta salário é uma conta'. Todas verdadeiras no mundo e potencialmente falsas em código, porque o que importa é se o subtipo cumpre as promessas comportamentais do supertipo. A pergunta certa não é 'é um?', é 'pode substituir?'.",
        },
        {
          titulo: "Resolver com exceção de 'não suportado'",
          texto:
            "Quando o subtipo não consegue cumprir um método, a saída fácil é lançar exceção. Isso transforma um erro de modelagem em bug de execução e obriga todo chamador a saber qual implementação recebeu. É sinal de que a interface precisa ser dividida — que é onde o ISP entra.",
        },
        {
          titulo: "Ignorar que mutabilidade cria promessas",
          texto:
            "Boa parte das violações clássicas desaparece com objetos imutáveis: sem setters, não há como o subtipo quebrar a independência entre campos. Antes de brigar com a hierarquia, vale perguntar se o tipo precisava mesmo ser mutável.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Sempre que existir herança ou implementação de interface.",
        "Ao revisar hierarquias com exceções de 'não suportado'.",
        "Ao publicar contratos que terceiros vão implementar.",
      ],
      evitar: [
        "Modelar por semelhança do mundo real em vez de por comportamento.",
        "Usar herança para reaproveitar código quando a substituição não se sustenta.",
        "Aceitar exceções como forma de 'adaptar' um subtipo que não cabe.",
      ],
    },
  ],
};
