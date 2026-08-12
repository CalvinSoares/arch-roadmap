import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class TipoArvore {
        <<flyweight>>
        -especie
        -textura
        +desenhar(x, y)
    }
    class Fabrica {
        -cache
        +obter(especie) TipoArvore
    }
    class Arvore {
        -x
        -y
        -tipo
    }
    Fabrica o-- TipoArvore : reaproveita
    Arvore --> TipoArvore : compartilha`;

const CAMADAS = [
  {
    id: "intrinseco",
    titulo: "Estado intrínseco",
    descricao: "O que é igual entre muitos objetos e pode ser compartilhado — coração do padrão",
    destaque: true,
  },
  { id: "extrinseco", titulo: "Estado extrínseco", descricao: "O que muda por instância e fica de fora" },
  { id: "fabrica", titulo: "Fábrica", descricao: "Garante que cada valor intrínseco exista uma vez só" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Flyweight: so o estado INTRINSECO (igual para milhares de arvores)
class TipoArvore {
  constructor(
    readonly especie: string,
    readonly textura: string, // imagina alguns MB
  ) {}

  // o estado EXTRINSECO chega por parametro
  desenhar(x: number, y: number): void {
    console.log(\`\${this.especie} em (\${x},\${y})\`);
  }
}

// Fabrica: garante uma instancia por especie
class FabricaTipos {
  private cache = new Map<string, TipoArvore>();

  obter(especie: string, textura: string): TipoArvore {
    let t = this.cache.get(especie);
    if (!t) {
      t = new TipoArvore(especie, textura);
      this.cache.set(especie, t);
    }
    return t;
  }

  get tamanho(): number {
    return this.cache.size;
  }
}

// Contexto: leve, so guarda o que e proprio + referencia ao flyweight
class Arvore {
  constructor(
    private x: number,
    private y: number,
    private tipo: TipoArvore,
  ) {}
  desenhar(): void {
    this.tipo.desenhar(this.x, this.y);
  }
}

const fabrica = new FabricaTipos();
const floresta: Arvore[] = [];
for (let i = 0; i < 100_000; i++) {
  const especie = i % 2 ? "pinheiro" : "carvalho";
  floresta.push(new Arvore(i, i, fabrica.obter(especie, "textura...")));
}

console.log(floresta.length, "árvores usando", fabrica.tamanho, "texturas"); // 100000 / 2`,
  },
  {
    lang: "python" as const,
    code: `class TipoArvore:
    """Flyweight: so o estado INTRINSECO."""
    __slots__ = ("especie", "textura")

    def __init__(self, especie, textura):
        self.especie, self.textura = especie, textura

    # o estado EXTRINSECO chega por parametro
    def desenhar(self, x, y):
        print(f"{self.especie} em ({x},{y})")

class FabricaTipos:
    def __init__(self):
        self._cache = {}

    def obter(self, especie, textura):
        if especie not in self._cache:
            self._cache[especie] = TipoArvore(especie, textura)
        return self._cache[especie]

    def __len__(self):
        return len(self._cache)

class Arvore:
    """Contexto: leve, guarda so o que e proprio."""
    __slots__ = ("x", "y", "tipo")

    def __init__(self, x, y, tipo):
        self.x, self.y, self.tipo = x, y, tipo

    def desenhar(self):
        self.tipo.desenhar(self.x, self.y)

fabrica = FabricaTipos()
floresta = [
    Arvore(i, i, fabrica.obter("pinheiro" if i % 2 else "carvalho", "textura..."))
    for i in range(100_000)
]

print(len(floresta), "arvores usando", len(fabrica), "texturas")  # 100000 / 2`,
  },
];

export const flyweight: Conceito = {
  slug: "flyweight",
  titulo: "Flyweight",
  categoria: "estrutural",
  resumo:
    "Reduz o consumo de memória compartilhando entre muitos objetos a parte do estado que é igual em todos, mantendo fora apenas o que varia de instância para instância.",
  tags: ["memoria", "compartilhamento", "cache", "gof"],
  dificuldade: "avancado",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "Interning de string",
      explicacao:
        "Runtimes reaproveitam a mesma string literal em memória em vez de guardar mil cópias iguais.",
    },
    {
      onde: "Symbol.for",
      explicacao:
        "O registro global devolve o mesmo símbolo para a mesma chave, em qualquer parte do programa.",
    },
    {
      onde: "React.memo",
      explicacao:
        "Evita recriar a saída quando as props não mudaram — o estado extrínseco decide, o intrínseco se reaproveita.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Estado intrínseco compartilhado; extrínseco por instância.
const glyph = GlyphFactory.obter("A", fonte);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Separar estado intrínseco de extrínseco complica o modelo e é fácil de errar",
      "O pool de objetos compartilhados vira estado global, com todos os cuidados que isso exige",
    ],
    naoValeSe:
      "não há muitos objetos quase iguais consumindo memória — sem esse volume, a economia não paga a complexidade.",
  },
  relacionados: ["singleton", "proxy", "composite"],
  problema: [
    "Sistemas que criam centenas de milhares de objetos parecidos gastam memória repetindo os mesmos dados: a mesma textura em cada árvore, a mesma fonte em cada caractere, o mesmo modelo em cada partícula.",
    "A memória acaba antes do processamento, e o custo não está no que difere entre os objetos, mas no que se repete em todos eles.",
  ],
  solucao: [
    "Dividir o estado em duas partes: o intrínseco (igual em muitos objetos, imutável) e o extrínseco (próprio de cada instância). O intrínseco vira um objeto compartilhado.",
    "Uma fábrica garante que cada valor intrínseco exista uma única vez. O estado extrínseco é passado como parâmetro nas operações, em vez de ser armazenado.",
  ],
  quandoUsar: [
    "Você cria muitos objetos semelhantes e a memória é o gargalo comprovado.",
    "Boa parte do estado é duplicada entre eles e pode ser tornada imutável.",
    "A identidade individual de cada objeto não importa — só o comportamento.",
  ],
  quandoEvitar: [
    "A quantidade de objetos é modesta — o padrão adiciona indireção sem ganho mensurável.",
    "O estado é majoritariamente único por instância: não há o que compartilhar.",
    "Você não mediu: adotar por suposição é otimização prematura com custo de legibilidade.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Cem mil árvores não precisam de cem mil texturas: elas precisam de duas, e de cem mil pares de coordenadas. O padrão separa o que se repete (compartilhado e imutável) do que varia (passado por parâmetro) e troca memória por uma indireção.",
    },
    {
      tipo: "analogia",
      emoji: "🔤",
      titulo: "Os tipos móveis da gráfica",
      texto:
        "Uma tipografia não funde um bloco de metal novo para cada letra impressa no livro. Ela tem um tipo para o 'a' e o reutiliza milhares de vezes; o que muda a cada uso é a posição na página, não a letra. O molde é caro e único; a posição é barata e infinita.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Quando o número de objetos vai à casa das centenas de milhares, o que era desprezível vira decisivo. Alguns quilobytes duplicados por objeto se tornam gigabytes.",
        "O detalhe importante é onde está o desperdício: quase nunca no que diferencia os objetos, quase sempre no que eles têm em comum.",
      ],
      extensao: [
        "A divisão entre intrínseco e extrínseco é a decisão de projeto do padrão, e não é óbvia. Intrínseco é o que pode ser compartilhado sem que ninguém perceba: precisa ser imutável e independente do contexto. Extrínseco é tudo o que dá identidade à instância — posição, estado, dono.",
        "Como o objeto compartilhado não pode guardar o extrínseco, ele deixa de ser autossuficiente: as operações passam a receber por parâmetro o que antes era campo. Isso muda a assinatura dos métodos e é o principal impacto do padrão na legibilidade.",
        "Vale distinguir de **Singleton**: ali existe uma instância única por decisão de projeto, para controlar acesso. Aqui existem várias instâncias compartilhadas por valor, para economizar memória — a fábrica devolve uma por espécie, não uma no total. E de **cache**: o objetivo do cache é evitar recomputar; o do flyweight é evitar duplicar.",
      ],
    },
    {
      tipo: "secao",
      id: "medir",
      titulo: "Meça antes, sempre",
      resumo: [
        "Este é, entre os padrões do GoF, o mais claramente motivado por desempenho — e por isso o mais sujeito a ser aplicado sem necessidade.",
      ],
      extensao: [
        "Linguagens modernas já compartilham mais do que se imagina. Strings literais são internadas, valores pequenos são reaproveitados, e coletores de lixo compactam objetos. Boa parte do ganho que o padrão prometia em 1994 hoje vem de graça.",
        "Antes de adotar, o número que importa é quanto da memória está em estado duplicado. Se cem mil objetos ocupam 800 MB e o intrínseco compartilhável representa 90% disso, o padrão é a resposta. Se representa 5%, ele só vai adicionar indireção e complicar a leitura.",
        "Vale considerar alternativas antes: estruturas orientadas a dados (arrays paralelos em vez de objetos), tipos de valor, `__slots__` em Python, ou simplesmente não materializar todos os objetos ao mesmo tempo. Às vezes a resposta certa não é compartilhar, é não criar.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Flyweight: cada objeto carrega tudo",
        itens: [
          "100.000 árvores, cada uma com sua cópia da textura",
          "o mesmo dado repetido dezenas de milhares de vezes",
          "memória proporcional ao número de instâncias",
          "objetos autossuficientes e fáceis de ler",
        ],
        nota: "O código é direto e o objeto é completo — o que só vira problema quando a escala cresce o suficiente para a memória acabar.",
      },
      depois: {
        titulo: "Com Flyweight: o comum é compartilhado",
        itens: [
          "duas texturas para 100.000 árvores",
          "cada árvore guarda só x, y e uma referência",
          "memória proporcional à variedade, não à quantidade",
          "métodos recebem o estado extrínseco por parâmetro",
        ],
        nota: "O custo é legibilidade e disciplina: o flyweight precisa ser imutável, e o objeto deixa de ser autoexplicativo porque parte do seu estado vive fora dele.",
      },
      legenda:
        "A troca é memória por indireção e clareza. Só compensa depois de medir — e a medida que importa é quanto do consumo está em estado que se repete.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "fabrica",
          label: "FabricaTipos",
          nota: "uma instância por espécie, no máximo",
          destaque: true,
          filhos: [
            { id: "pinheiro", label: "TipoArvore 'pinheiro'", nota: "intrínseco — textura pesada, imutável" },
            { id: "carvalho", label: "TipoArvore 'carvalho'", nota: "intrínseco — compartilhado por 50 mil árvores" },
          ],
        },
        {
          id: "contexto",
          label: "Arvore ×100.000",
          nota: "extrínseco — só x, y e a referência ao tipo",
        },
      ],
      legenda:
        "Cem mil objetos leves apontando para dois pesados. A fábrica é o que garante que o segundo pedido de 'pinheiro' devolva o mesmo objeto do primeiro.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "flyweight",
          titulo: "Flyweight",
          curto: "o estado que se repete",
          detalhe:
            "Guarda apenas o intrínseco e precisa ser imutável — ele é compartilhado por milhares de contextos, e uma alteração afetaria todos de uma vez. Suas operações recebem o extrínseco por parâmetro.",
          exemplo: "class TipoArvore { constructor(readonly especie: string, readonly textura: string) {} }",
          seViolar:
            "flyweight com campo mutável faz uma árvore alterar a aparência de todas as outras da mesma espécie.",
        },
        {
          id: "contexto",
          titulo: "Contexto",
          curto: "o que é único de cada instância",
          detalhe:
            "Objeto leve que guarda o estado extrínseco e uma referência ao flyweight. É ele que existe aos milhares, então cada campo aqui é multiplicado pela escala inteira.",
          exemplo: "class Arvore { constructor(private x, private y, private tipo: TipoArvore) {} }",
          seViolar:
            "contexto que copia dados do flyweight 'por conveniência' desfaz exatamente a economia que o padrão foi buscar.",
        },
        {
          id: "fabrica",
          titulo: "Fábrica",
          curto: "garante unicidade por valor",
          detalhe:
            "Mantém o cache de flyweights e devolve o existente quando a chave se repete. Sem ela, nada impede a criação de duplicatas e o padrão não produz efeito nenhum.",
          exemplo: "obter(especie) { return this.cache.get(especie) ?? this.criar(especie) }",
          seViolar:
            "permitir `new TipoArvore()` fora da fábrica abre caminho para duplicatas silenciosas — a economia some sem nenhum erro aparecer.",
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
          titulo: "Vegetação em cenário de jogo",
          cenario:
            "Um mapa aberto tem centenas de milhares de árvores, arbustos e pedras, com poucas dezenas de modelos e texturas distintos entre eles.",
          aplicacao:
            "Modelo e textura viram flyweights compartilhados; cada instância guarda apenas posição, rotação e escala. É a base do rendering por instanciação nas placas de vídeo.",
          tradeoff:
            "Ganha-se memória e perde-se a possibilidade de variar detalhes por instância sem quebrar o compartilhamento — dar uma cor levemente diferente a uma árvore específica exige tirá-la do grupo ou mover a cor para o extrínseco.",
        },
        {
          titulo: "Glifos em editor de texto",
          cenario:
            "Um documento com um milhão de caracteres não pode ter um objeto completo por caractere, com fonte, tamanho e métricas replicados.",
          aplicacao:
            "Cada glifo de uma fonte é um flyweight com sua forma e métricas; o documento guarda a sequência de códigos e as posições. É o exemplo original do GoF, e continua válido.",
          tradeoff:
            "Formatação por trecho (negrito numa palavra) precisa ser representada fora dos glifos, normalmente como intervalos — o que torna operações de edição no meio do texto bem mais complicadas do que seriam com objetos completos.",
        },
        {
          titulo: "Metadados de eventos em telemetria",
          cenario:
            "Um coletor processa milhões de eventos por minuto, e cada um carrega nome, tipo, unidade e conjunto de rótulos que se repetem muito.",
          aplicacao:
            "Os descritores de métrica são internados numa tabela; cada evento guarda a referência e apenas valor e timestamp. A economia é grande porque a variedade de descritores é baixa.",
          tradeoff:
            "A tabela de internamento cresce com a cardinalidade e vira vazamento se as chaves forem geradas dinamicamente (um rótulo com id de usuário, por exemplo) — o cache passa a guardar tudo para sempre.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Flyweight mutável",
          texto:
            "É o erro fatal do padrão. Como o objeto é compartilhado por milhares de contextos, qualquer alteração se propaga para todos eles — e o sintoma aparece como 'algumas árvores mudaram de cor sozinhas'. O estado intrínseco precisa ser imutável por construção, não por convenção.",
        },
        {
          titulo: "Cache que nunca esvazia",
          texto:
            "A fábrica guarda flyweights indefinidamente. Se a chave tiver cardinalidade alta ou vier de entrada do usuário, o cache cresce sem limite e vira vazamento de memória — justamente no padrão adotado para economizar memória. Chaves precisam ter domínio conhecido e limitado, ou o cache precisa de descarte.",
        },
        {
          titulo: "Adotar sem medir",
          texto:
            "O padrão piora a legibilidade: métodos ganham parâmetros, objetos deixam de ser autossuficientes e surge uma fábrica obrigatória. Pagar esse preço sem um número que justifique é otimização prematura no sentido mais literal. Meça o consumo, identifique quanto está duplicado e só então decida.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Há muitos objetos semelhantes e a memória é o gargalo medido.",
        "Boa parte do estado se repete e pode ser imutável.",
        "A identidade individual dos objetos não importa.",
      ],
      evitar: [
        "A quantidade de objetos é modesta.",
        "O estado é quase todo único por instância.",
        "Você ainda não mediu onde a memória está indo.",
      ],
    },
  ],
};
