import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Pedido {
        +itens
        +total()
    }
    class CalculadoraImpostos {
        +calcular(pedido)
    }
    class RepositorioPedidos {
        +salvar(pedido)
    }
    class EmissorNota {
        +emitir(pedido)
    }
    CalculadoraImpostos ..> Pedido
    RepositorioPedidos ..> Pedido
    EmissorNota ..> Pedido`;

const CAMADAS = [
  {
    id: "razao",
    titulo: "Uma razão para mudar",
    descricao: "Cada módulo responde a um único interessado — coração do princípio",
    destaque: true,
  },
  { id: "coesao", titulo: "Coesão", descricao: "O que muda junto fica junto" },
  { id: "separacao", titulo: "Separação", descricao: "O que muda por motivos diferentes se separa" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ANTES: tres interessados diferentes na mesma classe
class PedidoRuim {
  itens: { preco: number; qtd: number }[] = [];

  total(): number {                    // regra de negocio
    return this.itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  }
  calcularImposto(): number {          // muda quando a legislacao muda
    return this.total() * 0.18;
  }
  salvar(): void {                     // muda quando o banco muda
    console.log("INSERT INTO pedidos ...");
  }
  gerarPdfNota(): string {             // muda quando o layout muda
    return "%PDF-1.4 ...";
  }
}

// DEPOIS: cada motivo de mudanca no seu lugar
class Pedido {
  constructor(readonly itens: { preco: number; qtd: number }[]) {}
  total(): number {
    return this.itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  }
}

// muda quando a LEGISLACAO muda
class CalculadoraImpostos {
  calcular(p: Pedido): number {
    return p.total() * 0.18;
  }
}

// muda quando a PERSISTENCIA muda
class RepositorioPedidos {
  salvar(p: Pedido): void {
    console.log("INSERT INTO pedidos ...", p.total());
  }
}

// muda quando o LAYOUT da nota muda
class EmissorNota {
  emitir(p: Pedido): string {
    return "%PDF-1.4 total=" + p.total();
  }
}`,
  },
  {
    lang: "python" as const,
    code: `# ANTES: tres interessados diferentes na mesma classe
class PedidoRuim:
    def __init__(self, itens):
        self.itens = itens

    def total(self):                 # regra de negocio
        return sum(i["preco"] * i["qtd"] for i in self.itens)

    def calcular_imposto(self):      # muda quando a legislacao muda
        return self.total() * 0.18

    def salvar(self):                # muda quando o banco muda
        print("INSERT INTO pedidos ...")

    def gerar_pdf_nota(self):        # muda quando o layout muda
        return "%PDF-1.4 ..."

# DEPOIS: cada motivo de mudanca no seu lugar
class Pedido:
    def __init__(self, itens):
        self.itens = itens

    def total(self):
        return sum(i["preco"] * i["qtd"] for i in self.itens)

class CalculadoraImpostos:      # muda com a LEGISLACAO
    def calcular(self, p):
        return p.total() * 0.18

class RepositorioPedidos:       # muda com a PERSISTENCIA
    def salvar(self, p):
        print("INSERT INTO pedidos ...", p.total())

class EmissorNota:              # muda com o LAYOUT
    def emitir(self, p):
        return f"%PDF-1.4 total={p.total()}"`,
  },
];

const ANTI_EXEMPLO = `// "Aplicamos SRP": imposto e PDF viraram metodos privados.
// Os tres atores continuam no mesmo arquivo — so mudaram de endereco.
class Pedido {
  itens: { preco: number; qtd: number }[] = [];

  total(): number {
    return this.itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  }

  salvar(): void {
    const imposto = this.calcularImposto(); // ator: fiscal
    db.insert({ total: this.total(), imposto }); // ator: dados
    this.gerarPdf();                            // ator: layout
  }

  private calcularImposto(): number { return this.total() * 0.18; }
  private gerarPdf(): string { return "%PDF-1.4 ..."; }
}

// Reforma tributaria, migracao de banco e novo layout da nota
// ainda abrem o MESMO arquivo. O principio nao e sobre private.`;

export const srp: Conceito = {
  slug: "srp",
  titulo: "SRP — Responsabilidade Única",
  categoria: "principio",
  resumo:
    "Um módulo deve ter apenas uma razão para mudar — ou seja, deve responder a um único interessado do negócio, e não acumular decisões que evoluem por motivos diferentes.",
  tags: ["solid", "coesao", "acoplamento", "design"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "2002", ano: 2002, precisao: "aproximada" },
    fonte:
      "Robert C. Martin, 'Agile Software Development, Principles, Patterns, and Practices', 2002; o acrônimo SOLID é de Michael Feathers, meados dos anos 2000",
    precursor:
      "A ideia de coesão — juntar o que muda pelo mesmo motivo — vem do 'structured design' de Constantine e Yourdon, nos anos 1970.",
  },
  ondeAparece: [
    {
      onde: "ferramentas Unix (grep, sort, wc)",
      explicacao:
        "A filosofia 'faça uma coisa bem feita': cada utilitário tem uma única razão para existir, e você os combina por pipe em vez de inchar um só.",
    },
    {
      onde: "controller × service × repository",
      explicacao:
        "A divisão clássica do backend separa quem fala HTTP, quem tem a regra de negócio e quem fala com o banco — cada camada muda por um motivo.",
    },
    {
      onde: "custom hooks no React",
      explicacao:
        "Extrair a lógica de estado para um hook próprio tira do componente a responsabilidade que não era de renderização — uma razão de cada vez.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Uma razão para mudar por módulo.
class CalculadoraTotal { total(itens) { /* ... */ } }`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Mais módulos e arquivos, cada um com uma responsabilidade, aumentam a navegação",
      "Dividir cedo demais, antes de saber o que muda junto, cria fronteiras no lugar errado",
    ],
    naoValeSe:
      "o módulo é pequeno e coeso e não há dois interessados distintos puxando-o — quebrar por quebrar só espalha o que estava junto.",
  },
  relacionados: ["ocp", "isp", "hexagonal"],
  problema: [
    "Classes crescem acumulando tudo que se refere a um conceito: a regra de negócio, a persistência, o cálculo fiscal e a formatação do relatório convivem no mesmo arquivo.",
    "Aí uma mudança de layout de nota fiscal exige tocar na classe que calcula o total, e o risco de quebrar a regra de negócio aparece numa alteração que era só visual.",
  ],
  solucao: [
    "Identificar quem pede cada mudança. Se a área fiscal pede uma coisa, a de tecnologia outra e a comercial uma terceira, são três razões para mudar — e devem morar em módulos distintos.",
    "O critério não é 'a classe faz uma coisa só', e sim 'a classe atende um interessado só'. É por isso que o princípio fala de razão para mudar, não de quantidade de métodos.",
  ],
  quandoUsar: [
    "Uma classe muda com frequência por motivos que nada têm a ver entre si.",
    "Times diferentes precisam alterar o mesmo arquivo e conflitam constantemente.",
    "O nome da classe só descreve o conteúdo com um 'e' no meio (PedidoEImpostoERelatório).",
  ],
  quandoEvitar: [
    "Aplicar por contagem de linhas: dividir uma classe coesa em cinco anêmicas piora a leitura.",
    "Separar antes de conhecer os eixos de mudança — sem essa informação a divisão é chute.",
    "Sistemas pequenos e estáveis, onde a fragmentação custa mais do que o acoplamento.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Uma razão para mudar, não uma tarefa só. Se a área fiscal, o time de banco e o pessoal de relatório pedem alterações no mesmo arquivo, ele tem três responsabilidades — mesmo que todos os métodos falem de 'pedido'.",
    },
    {
      tipo: "analogia",
      emoji: "🔧",
      titulo: "O canivete suíço na oficina",
      texto:
        "O canivete suíço é genial para viagem e péssimo para uma oficina. Quando a chave de fenda entorta, você troca a peça inteira — inclusive a tesoura, que estava ótima. Na oficina, cada ferramenta é separada porque cada uma se desgasta no seu ritmo e por motivos próprios. Nada impede que fiquem na mesma gaveta; o que não podem é ser o mesmo objeto.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "O acoplamento mais caro não é o técnico, é o organizacional: quando duas áreas do negócio precisam alterar o mesmo código, as mudanças de uma quebram as expectativas da outra.",
        "Uma classe que serve a vários interessados vira ponto de encontro de decisões não relacionadas — e cada release fica mais arriscado.",
      ],
      extensao: [
        "A formulação original de Robert Martin é frequentemente citada errado. 'Fazer uma coisa só' é uma simplificação que leva a classes anêmicas com um método cada. A definição que ele mesmo passou a usar é mais útil: **um módulo deve ser responsável perante um, e apenas um, ator**.",
        "Ator aqui é papel do negócio: o setor fiscal, o time de infraestrutura, o departamento comercial. Dois métodos que parecem irmãos podem pertencer a atores diferentes — e é essa diferença, não a semelhança técnica, que determina a separação.",
        "O princípio é, no fundo, sobre **coesão**: reunir o que muda junto e separar o que muda por motivos distintos. É o mesmo raciocínio que sustenta a arquitetura **hexagonal** (domínio separado de infraestrutura) e o **OCP** (isolar o que varia) — SRP é a versão em escala de classe.",
      ],
    },
    {
      tipo: "secao",
      id: "identificar",
      titulo: "Como identificar os atores",
      resumo: [
        "Na prática, o teste que funciona é histórico: olhe quem pediu as últimas mudanças naquele arquivo e por quê.",
      ],
      extensao: [
        "O histórico do controle de versão é a melhor fonte. Se os commits de um arquivo alternam entre 'ajuste na alíquota', 'migração para o novo banco' e 'novo layout da nota', os três atores estão declarados ali, com data e autor.",
        "Outro sinal é o conflito de merge recorrente entre pessoas de times diferentes no mesmo arquivo. Isso é o princípio sendo violado de forma visível — e custa tempo real, não apenas elegância.",
        "O sinal mais simples é linguístico: se descrever a classe exige um 'e' ('cuida do pedido **e** calcula imposto **e** gera PDF'), cada 'e' costuma ser um ator. Nomes honestos denunciam o problema antes de qualquer análise.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Uma classe, três interessados",
        itens: [
          "Pedido calcula total, imposto, salva e gera PDF",
          "mudança de alíquota mexe no arquivo do banco",
          "times diferentes conflitam no mesmo arquivo",
          "testar o cálculo exige contornar a persistência",
        ],
        nota: "Cada release toca uma classe que três áreas dependem, e o risco de uma mudança fiscal quebrar a persistência é real, não teórico.",
      },
      depois: {
        titulo: "Um módulo por razão de mudar",
        itens: [
          "Pedido guarda a regra de negócio",
          "CalculadoraImpostos muda com a legislação",
          "RepositorioPedidos muda com o banco",
          "EmissorNota muda com o layout",
        ],
        nota: "O custo é mais arquivos e a necessidade de compor as peças em algum lugar — normalmente um caso de uso, que passa a ser onde a coordenação vive.",
      },
      legenda:
        "A separação não reduz a quantidade de código: ela alinha as fronteiras do sistema com as fronteiras da organização, de forma que uma mudança de negócio toque um arquivo só.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        { id: "pedido", label: "Pedido", nota: "regra de negócio — muda com o produto", destaque: true },
        { id: "imposto", label: "CalculadoraImpostos", nota: "ator: área fiscal" },
        { id: "repo", label: "RepositorioPedidos", nota: "ator: time de dados" },
        { id: "nota", label: "EmissorNota", nota: "ator: área contábil" },
      ],
      legenda:
        "Quatro caixas lado a lado, não aninhadas: nenhuma contém a outra, e cada uma responde a um interessado diferente. O Pedido é usado pelas três, mas não sabe de nenhuma.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "ator",
          titulo: "O ator",
          curto: "quem pede a mudança",
          detalhe:
            "Papel do negócio que motiva alterações: área fiscal, jurídico, marketing, infraestrutura. É a unidade de análise do princípio — não a funcionalidade, não a camada técnica.",
          exemplo: "// 'a área fiscal mudou a alíquota' → CalculadoraImpostos",
          seViolar:
            "quando dois atores dependem do mesmo arquivo, uma mudança pedida por um pode quebrar o que o outro esperava — sem que ninguém tenha errado.",
        },
        {
          id: "modulo",
          titulo: "O módulo",
          curto: "responde a um ator só",
          detalhe:
            "Pode ter vários métodos, desde que todos sirvam ao mesmo interessado. Uma classe com dez métodos coesos respeita o princípio; uma com dois métodos de atores diferentes, não.",
          exemplo: "class CalculadoraImpostos { calcular(p) { ... } }",
          seViolar:
            "módulo que serve a dois atores vira ponto de conflito permanente e concentra o risco de cada release.",
        },
        {
          id: "composicao",
          titulo: "A composição",
          curto: "onde as peças se encontram",
          detalhe:
            "Separar cria a necessidade de reunir. Um caso de uso ou serviço de aplicação orquestra as peças — e passa a ser o lugar onde a sequência do processo fica explícita.",
          exemplo: "salvarEEmitir(p) { repo.salvar(p); return nota.emitir(p) }",
          seViolar:
            "sem um ponto de composição claro, a lógica de coordenação se espalha e cada chamador monta a sequência do seu jeito.",
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
          titulo: "Separar cálculo fiscal do modelo de pedido",
          cenario:
            "Uma reforma tributária muda as regras de imposto a cada trimestre, enquanto o modelo de pedido permanece estável há dois anos.",
          aplicacao:
            "O cálculo fiscal sai para um módulo próprio, versionado por vigência. Alterações fiscais deixam de tocar a classe que o resto do sistema usa para tudo.",
          tradeoff:
            "Passa a ser necessário decidir onde o imposto é aplicado e garantir que ninguém esqueça de chamá-lo — o acoplamento sumiu, mas surgiu a obrigação de compor corretamente.",
        },
        {
          titulo: "Extrair envio de e-mail de serviço de cadastro",
          cenario:
            "O serviço que cria usuários também monta e envia o e-mail de boas-vindas, e o time de marketing pede ajustes semanais no texto.",
          aplicacao:
            "O envio vira um módulo separado, acionado por evento. Marketing altera o conteúdo sem que ninguém encoste na regra de criação de conta.",
          tradeoff:
            "A operação deixa de ser atômica: o usuário pode ser criado e o e-mail falhar. Isso exige decidir explicitamente o que acontece nesse caso, decisão que o acoplamento anterior escondia.",
        },
        {
          titulo: "Dividir um controller que virou orquestrador",
          cenario:
            "Um endpoint de checkout valida entrada, aplica desconto, chama o gateway, grava e dispara notificação — quinhentas linhas que quatro times editam.",
          aplicacao:
            "Cada preocupação vira um colaborador e o controller passa a apenas coordenar. Os conflitos de merge caem porque cada time trabalha no seu arquivo.",
          tradeoff:
            "Entender o fluxo completo passa a exigir abrir cinco arquivos em vez de um. Sem bons nomes e um ponto de composição legível, a clareza perdida pode superar o ganho.",
        },
      ],
    },
    {
      tipo: "passos",
      titulo: "Como aplicar, passo a passo",
      passos: [
        {
          titulo: "Nomear os atores",
          texto:
            "Pergunte quem pede mudança neste arquivo: fiscal, dados, layout, marketing. Cada resposta diferente é um candidato a módulo.",
        },
        {
          titulo: "Separar por razão de mudar",
          texto:
            "O que muda junto fica junto; o que muda por motivo distinto sai. O critério é o interessado, não a contagem de métodos.",
        },
        {
          titulo: "Compor num ponto só",
          texto:
            "Um caso de uso ou serviço de aplicação orquestra as peças. Sem isso, cada chamador remonta a sequência do seu jeito.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O SRP que só escondeu os métodos",
      comoSeParece:
        "A classe 'emagreceu' na API pública: imposto e PDF viraram `private`. Parece organizado — mas os três atores ainda moram no mesmo arquivo e ainda conflitam no mesmo diff.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Na reforma tributária",
          efeito: "O PR de alíquota ainda toca a classe que salva no banco e gera PDF — o risco de regressão não mudou.",
        },
        {
          quando: "No merge",
          efeito: "Times diferentes continuam conflitando no mesmo arquivo; só o nome dos métodos privados mudou.",
        },
        {
          quando: "No teste",
          efeito: "Testar o total ainda arrasta persistência e geração de nota, porque tudo continua acoplado por dentro.",
        },
      ],
      correcao:
        "Extrair de verdade: `CalculadoraImpostos`, `RepositorioPedidos` e `EmissorNota` em módulos distintos. `private` não é fronteira — módulo e ator são.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Confundir com 'faz uma coisa só'",
          texto:
            "Levar a leitura literal ao extremo produz classes de um método, e o sistema vira uma nuvem de peças minúsculas onde nenhuma responde sozinha a uma pergunta de negócio. O critério é razão para mudar; uma classe coesa com dez métodos que servem ao mesmo ator está correta.",
        },
        {
          titulo: "Separar antes de saber os eixos",
          texto:
            "Sem histórico de mudanças, dividir é adivinhação — e a divisão errada é pior que a ausência de divisão, porque cria fronteiras que toda mudança precisa atravessar. Em código novo, é razoável deixar junto até que os motivos de mudança se revelem.",
        },
        {
          titulo: "Modelo anêmico como efeito colateral",
          texto:
            "Levar toda a lógica para fora das entidades em nome do SRP deixa o domínio como um saco de getters e setters, com as regras espalhadas em serviços. Regra de negócio que pertence ao pedido deve ficar no pedido; o que sai são as responsabilidades de outros atores.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Uma classe muda por motivos que nada têm a ver entre si.",
        "Times diferentes conflitam no mesmo arquivo.",
        "Descrever a classe exige um 'e' no meio da frase.",
      ],
      evitar: [
        "Dividir por contagem de linhas ou métodos.",
        "Separar antes de conhecer os eixos reais de mudança.",
        "Fragmentar código pequeno e estável.",
      ],
    },
  ],
};
