import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Iteravel {
        <<interface>>
        +iterador() Iterador
    }
    class Iterador {
        <<interface>>
        +proximo() Item
        +temProximo() bool
    }
    class Arvore {
        -raiz
        +iterador()
    }
    class IteradorEmOrdem {
        -pilha
        +proximo()
        +temProximo()
    }
    Iteravel <|.. Arvore
    Iterador <|.. IteradorEmOrdem
    Arvore ..> IteradorEmOrdem : cria`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Percorre sem saber como a coleção é feita por dentro" },
  {
    id: "iterador",
    titulo: "Iterador",
    descricao: "Carrega a posição e sabe achar o próximo — coração do padrão",
    destaque: true,
  },
  { id: "colecao", titulo: "Coleção", descricao: "Guarda os itens e sabe fabricar iteradores sobre si" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A colecao esconde a estrutura (aqui, uma arvore binaria)
class No {
  constructor(
    readonly valor: number,
    readonly esq?: No,
    readonly dir?: No,
  ) {}
}

class Arvore {
  constructor(private raiz?: No) {}

  // Iterador em ordem, sem materializar a arvore inteira
  *[Symbol.iterator](): Generator<number> {
    function* percorrer(n?: No): Generator<number> {
      if (!n) return;
      yield* percorrer(n.esq);
      yield n.valor;          // pausa aqui e devolve o controle
      yield* percorrer(n.dir);
    }
    yield* percorrer(this.raiz);
  }
}

const arvore = new Arvore(
  new No(5, new No(3, new No(1)), new No(8, new No(7))),
);

// O cliente nao sabe que ha uma arvore embaixo
for (const v of arvore) console.log(v); // 1 3 5 7 8

// E ganha de graca tudo que fala a linguagem de iteracao
console.log([...arvore].filter((v) => v > 4)); // [5, 7, 8]`,
  },
  {
    lang: "python" as const,
    code: `class No:
    def __init__(self, valor, esq=None, dir=None):
        self.valor, self.esq, self.dir = valor, esq, dir

class Arvore:
    def __init__(self, raiz=None):
        self._raiz = raiz

    # Iterador em ordem, sem materializar a arvore inteira
    def __iter__(self):
        def percorrer(n):
            if n is None:
                return
            yield from percorrer(n.esq)
            yield n.valor        # pausa aqui e devolve o controle
            yield from percorrer(n.dir)
        yield from percorrer(self._raiz)

arvore = Arvore(No(5, No(3, No(1)), No(8, No(7))))

# O cliente nao sabe que ha uma arvore embaixo
for v in arvore:
    print(v)  # 1 3 5 7 8

# E ganha de graca tudo que fala a linguagem de iteracao
print([v for v in arvore if v > 4])  # [5, 7, 8]`,
  },
];

export const iterator: Conceito = {
  slug: "iterator",
  titulo: "Iterator",
  categoria: "comportamental",
  resumo:
    "Oferece uma forma de percorrer os elementos de uma coleção sequencialmente sem expor como ela é construída por dentro — e permite mais de uma travessia simultânea.",
  tags: ["travessia", "colecao", "lazy", "gof"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  relacionados: ["composite", "visitor", "strategy"],
  problema: [
    "Percorrer uma coleção exige conhecer sua estrutura: índice em array, ponteiro em lista ligada, pilha em árvore. Espalhar esse conhecimento pelo código amarra todo mundo à implementação atual.",
    "A própria coleção não deveria carregar a posição da travessia: se ela guarda 'onde estamos', dois laços simultâneos sobre a mesma coleção atrapalham um ao outro.",
  ],
  solucao: [
    "Extrair a travessia para um objeto separado que guarda a posição e sabe avançar. A coleção sabe fabricar iteradores; cada um tem seu próprio cursor.",
    "O cliente conversa com uma interface mínima — 'me dê o próximo', 'ainda tem?' — e funciona igual para array, árvore, arquivo ou resultado paginado de API.",
  ],
  quandoUsar: [
    "A estrutura interna da coleção não deveria vazar para quem a percorre.",
    "Você quer oferecer mais de uma forma de travessia (em ordem, por nível, filtrada) sobre a mesma estrutura.",
    "A sequência é grande, infinita ou cara de materializar e precisa ser produzida sob demanda.",
  ],
  quandoEvitar: [
    "A coleção é um array simples e a linguagem já resolve isso — escrever um iterador à mão é reinventar o que existe.",
    "O acesso é aleatório por índice, não sequencial.",
    "A travessia precisa modificar a coleção durante o percurso, o que a maioria dos iteradores proíbe.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "A travessia vira um objeto com cursor próprio. O cliente pede 'o próximo' e recebe, sem saber se atrás há um array, uma árvore ou uma API paginada — e dois percursos simultâneos não se atrapalham porque cada um tem seu iterador.",
    },
    {
      tipo: "analogia",
      emoji: "🔖",
      titulo: "O marcador de página",
      texto:
        "O marcador guarda onde você parou; o livro não. É por isso que duas pessoas podem ler o mesmo exemplar em ritmos diferentes, cada uma com seu marcador. Se a posição estivesse anotada no livro, a segunda leitora apagaria o progresso da primeira. O marcador também funciona igual em qualquer livro, sem saber nada do assunto.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Cada estrutura se percorre de um jeito. Se o cliente precisa saber qual delas está usando, trocar a estrutura vira uma refatoração em todo lugar que a percorre.",
        "Guardar a posição dentro da própria coleção parece prático e quebra na primeira travessia aninhada: o laço de fora e o de dentro compartilham o mesmo cursor.",
      ],
      extensao: [
        "Este é, provavelmente, o padrão do GoF mais absorvido pelas linguagens. `for...of` com `Symbol.iterator`, `__iter__` em Python, `IEnumerable` em C#, `Iterable` em Java — todos são o Iterator embutido no idioma. Por isso o padrão hoje raramente se implementa do zero; ele se **implementa aderindo ao protocolo da linguagem**, que é o que o exemplo faz com geradores.",
        "Aderir ao protocolo é o que rende o benefício maior: sua coleção passa a funcionar com desestruturação, spread, `for...of`, e com toda a biblioteca que fala essa língua. Um iterador caseiro com `proximo()` e `temProximo()` funciona, mas fica fora do ecossistema.",
        "Geradores resolvem a parte mais chata do padrão. Um iterador de árvore escrito à mão precisa manter uma pilha explícita para lembrar onde estava; com `yield`, a própria linguagem congela a posição da recursão. O que era uma classe com estado vira uma função com pausas.",
      ],
    },
    {
      tipo: "secao",
      id: "preguica",
      titulo: "Travessia preguiçosa",
      resumo: [
        "Um iterador não precisa ter todos os itens prontos. Produzir sob demanda permite percorrer sequências grandes, caras ou infinitas com memória constante.",
      ],
      extensao: [
        "Ler um arquivo de dez gigabytes linha a linha, paginar uma API buscando a próxima página só quando a atual acabar, gerar números primos indefinidamente — todos são iteradores preguiçosos. A memória fica proporcional ao item atual, não à sequência.",
        "Isso muda a forma de compor: `filter` e `map` preguiçosos não criam listas intermediárias, então encadear cinco transformações sobre um milhão de itens continua custando um item por vez.",
        "O preço é que a preguiça esconde trabalho. Um `for` que parece percorrer uma lista pode estar disparando uma chamada HTTP por página, e o custo real aparece no meio do laço. Iteradores preguiçosos sobre recursos externos precisam deixar isso explícito no nome e tratar falha no meio da travessia.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "for...of" },
        { id: "it", label: "Iterador", destaque: true },
        { id: "colecao", label: "Árvore" },
        { id: "item", label: "Próximo valor" },
      ],
      setas: [
        { label: "pede o próximo" },
        { label: "avança o cursor interno" },
        { label: "devolve e pausa", tracejada: true },
      ],
      legenda:
        "O cursor vive no iterador, não na árvore — por isso dois laços simultâneos sobre a mesma coleção não se atrapalham, cada um com sua posição.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Iterator: cada travessia conhece a estrutura",
        itens: [
          "o cliente escreve a pilha e a recursão da árvore",
          "trocar árvore por lista quebra todo mundo",
          "dois percursos simultâneos brigam pelo mesmo cursor",
          "a coleção precisa expor os nós internos",
        ],
        nota: "A estrutura de dados vira contrato público: mudá-la deixa de ser detalhe de implementação e passa a ser quebra de compatibilidade.",
      },
      depois: {
        titulo: "Com Iterator: a travessia é um objeto",
        itens: [
          "o cliente só pede o próximo",
          "trocar a estrutura interna não afeta ninguém",
          "cada laço tem seu cursor independente",
          "a mesma coleção oferece várias ordens de travessia",
        ],
        nota: "O custo é uma indireção por item e, se você aderir ao protocolo da linguagem, praticamente nenhuma cerimônia — mas a coleção não pode mais ser modificada durante o percurso.",
      },
      legenda:
        "O ganho é a fronteira: depois de existir um iterador, a estrutura interna da coleção volta a ser assunto dela — que é onde deveria estar desde o começo.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "consome a sequência",
          detalhe:
            "Usa o protocolo de iteração da linguagem e depende só dele. Não guarda índices nem assume que pode voltar — se precisar de acesso aleatório, iterador é a ferramenta errada.",
          exemplo: "for (const v of arvore) console.log(v);",
          seViolar:
            "cliente que faz `colecao.nos[i]` para 'otimizar' rompeu a fronteira e volta a depender da estrutura.",
        },
        {
          id: "iterador",
          titulo: "Iterador",
          curto: "cursor + regra de avanço",
          detalhe:
            "Guarda a posição atual e sabe calcular a próxima. É onde mora a ordem da travessia: em ordem, pré-ordem, por nível — variações que convivem sobre a mesma estrutura.",
          exemplo: "function* emOrdem(n) { yield* emOrdem(n.esq); yield n.valor; yield* emOrdem(n.dir) }",
          seViolar:
            "iterador que guarda referência a índices da coleção quebra silenciosamente quando ela é modificada no meio do laço.",
        },
        {
          id: "colecao",
          titulo: "Coleção",
          curto: "fabrica iteradores sobre si",
          detalhe:
            "Mantém os itens e expõe um método que devolve um iterador novo, sempre do começo. Nunca guarda a posição — essa é a diferença que permite travessias simultâneas.",
          exemplo: "*[Symbol.iterator]() { yield* percorrer(this.raiz) }",
          seViolar:
            "coleção que guarda um campo `posicaoAtual` reintroduz o estado compartilhado e quebra laços aninhados.",
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
          titulo: "Paginação transparente de API",
          cenario:
            "Um cliente de API precisa percorrer cem mil registros que o servidor devolve em páginas de cem, e nenhum consumidor deveria escrever o laço de paginação.",
          aplicacao:
            "O SDK expõe uma coleção iterável que busca a próxima página quando a atual se esgota. Quem consome escreve um `for` simples e nunca vê um token de paginação.",
          tradeoff:
            "A travessia esconde chamadas de rede: um laço aparentemente inocente pode fazer mil requisições, e uma falha no meio deixa o consumidor com metade dos dados sem sinal claro de que faltou algo.",
        },
        {
          titulo: "Leitura de arquivo grande",
          cenario:
            "Um job precisa processar um CSV de vários gigabytes numa máquina com pouca memória.",
          aplicacao:
            "Um iterador entrega uma linha por vez, lendo do disco em blocos. O processamento roda com memória constante, independentemente do tamanho do arquivo.",
          tradeoff:
            "Só serve para uma passada: operações que precisam olhar o arquivo duas vezes (como calcular média e depois desvio) exigem reabrir e percorrer de novo, ou acumular estado à parte.",
        },
        {
          titulo: "Travessias múltiplas de uma árvore de categorias",
          cenario:
            "Um catálogo precisa listar categorias em ordem alfabética para o menu, por profundidade para o breadcrumb e por nível para o sitemap.",
          aplicacao:
            "A mesma árvore expõe três iteradores diferentes. A estrutura é escrita uma vez; as ordens de leitura são objetos independentes que podem ser testados isoladamente.",
          tradeoff:
            "Cada travessia nova é código novo com sua própria chance de bug sutil (um nó visitado duas vezes, um ramo esquecido) — e esses erros costumam passar por testes de árvores pequenas.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Modificar a coleção durante o percurso",
          texto:
            "Remover ou inserir itens enquanto se itera é a fonte clássica de comportamento indefinido: itens pulados, visitados duas vezes ou exceção de modificação concorrente. A saída é coletar as mudanças durante a travessia e aplicá-las depois, ou iterar sobre uma cópia quando a coleção for pequena.",
        },
        {
          titulo: "Iterador de uso único tratado como coleção",
          texto:
            "Um gerador se esgota: depois do primeiro `for`, o segundo não vê nada. Quando isso é devolvido de uma função com nome de coleção, o segundo consumidor recebe uma lista vazia sem erro nenhum. Ou o nome deixa a preguiça explícita, ou a função devolve algo reiterável.",
        },
        {
          titulo: "Preguiça sobre recurso que fecha",
          texto:
            "Um iterador que lê de um arquivo ou conexão mantém o recurso aberto enquanto não termina. Se o consumidor abandona o laço no meio com um `break`, o recurso pode vazar. Iteradores sobre recursos externos precisam de encerramento garantido — o que a linguagem oferece via `try/finally` no gerador.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "A estrutura interna da coleção não deve vazar para quem percorre.",
        "Você quer oferecer várias formas de travessia sobre a mesma estrutura.",
        "A sequência é grande, cara ou infinita e precisa ser produzida sob demanda.",
      ],
      evitar: [
        "É um array simples e a linguagem já resolve.",
        "O acesso é aleatório por índice, não sequencial.",
        "A coleção precisa ser modificada durante a travessia.",
      ],
    },
  ],
};
