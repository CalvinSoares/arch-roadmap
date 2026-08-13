import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Clonavel {
        <<interface>>
        +clonar() Clonavel
    }
    class Documento {
        -titulo
        -blocos
        -config
        +clonar() Documento
    }
    class Registro {
        -prototipos
        +registrar(nome, p)
        +criar(nome) Documento
    }
    Clonavel <|.. Documento
    Registro o-- Documento : guarda modelos`;

const CAMADAS = [
  { id: "prototipo", titulo: "Protótipo", descricao: "O objeto-modelo já configurado" },
  {
    id: "clone",
    titulo: "clonar()",
    descricao: "O objeto sabe se copiar, inclusive o que é privado — coração do padrão",
    destaque: true,
  },
  { id: "registro", titulo: "Registro", descricao: "Catálogo de modelos prontos, criados por nome" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Clonavel<T> {
  clonar(): T;
}

class Documento implements Clonavel<Documento> {
  constructor(
    public titulo: string,
    public blocos: string[],
    public config: { tema: string; margens: number },
  ) {}

  clonar(): Documento {
    // copia PROFUNDA: sem isso, o clone compartilha o array e o objeto
    return new Documento(
      this.titulo,
      [...this.blocos],
      { ...this.config },
    );
  }
}

// Registro de modelos prontos
class Registro {
  private modelos = new Map<string, Documento>();

  registrar(nome: string, p: Documento): void {
    this.modelos.set(nome, p);
  }

  criar(nome: string): Documento {
    const p = this.modelos.get(nome);
    if (!p) throw new Error("modelo desconhecido: " + nome);
    return p.clonar(); // o modelo nunca sai do registro
  }
}

const registro = new Registro();
registro.registrar(
  "contrato",
  new Documento("Contrato padrão", ["cláusula 1", "cláusula 2"], { tema: "formal", margens: 3 }),
);

const meu = registro.criar("contrato");
meu.blocos.push("cláusula extra");
console.log(registro.criar("contrato").blocos.length); // 2 — o modelo segue intacto`,
  },
  {
    lang: "python" as const,
    code: `import copy

class Documento:
    def __init__(self, titulo, blocos, config):
        self.titulo, self.blocos, self.config = titulo, blocos, config

    def clonar(self):
        # copia PROFUNDA: sem isso o clone compartilha a lista e o dict
        return copy.deepcopy(self)

class Registro:
    def __init__(self):
        self._modelos = {}

    def registrar(self, nome, p):
        self._modelos[nome] = p

    def criar(self, nome):
        if nome not in self._modelos:
            raise KeyError("modelo desconhecido: " + nome)
        return self._modelos[nome].clonar()  # o modelo nunca sai

registro = Registro()
registro.registrar(
    "contrato",
    Documento("Contrato padrao", ["clausula 1", "clausula 2"], {"tema": "formal"}),
)

meu = registro.criar("contrato")
meu.blocos.append("clausula extra")
print(len(registro.criar("contrato").blocos))  # 2 — o modelo segue intacto`,
  },
];

const ANTI_EXEMPLO = `class Documento {
  constructor(
    public titulo: string,
    public blocos: string[],
    public config: { tema: string },
  ) {}

  // "Clone" que so copia a casca — listas e objetos ficam compartilhados.
  clonar(): Documento {
    return new Documento(this.titulo, this.blocos, this.config);
  }
}

const modelo = new Documento("Contrato", ["clausula 1"], { tema: "formal" });
const copia = modelo.clonar();
copia.blocos.push("clausula extra");
copia.config.tema = "informal";

// O modelo "protegido" tambem mudou.
console.log(modelo.blocos);   // ["clausula 1", "clausula extra"]
console.log(modelo.config.tema); // "informal"`;

export const prototype: Conceito = {
  slug: "prototype",
  titulo: "Prototype",
  categoria: "criacional",
  resumo:
    "Cria objetos novos copiando um modelo já configurado, em vez de construí-los do zero — útil quando montar a configuração é caro ou quando o tipo concreto não deve ser conhecido.",
  tags: ["clonagem", "copia", "modelo", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: gof(
    "Self (1987) construiu a linguagem inteira em cima de clonagem de " +
      "protótipos, sem classe nenhuma — e o JavaScript herdou isso."
  ),
  ondeAparece: [
    {
      onde: "Object.create",
      explicacao:
        "Cria um objeto novo a partir de outro que serve de molde — é o padrão como chamada de linguagem.",
    },
    {
      onde: "structuredClone",
      explicacao:
        "Cópia profunda de um objeto existente, sem precisar conhecer a classe dele.",
    },
    {
      onde: "A cadeia de protótipos do JS",
      explicacao:
        "Herança em JavaScript é clonagem de protótipo, não instanciação de classe — a classe é açúcar por cima.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Clona em vez de reconfigurar do zero.
const copia = structuredClone(modelo);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Cada classe precisa saber se clonar, incluindo a decisão entre cópia rasa e profunda",
      "Clone mal feito compartilha referências sem querer e vira bug de estado partilhado",
    ],
    naoValeSe:
      "criar do zero é barato e claro — clonar só ganha quando a construção é cara ou o estado a copiar é grande.",
  },
  relacionados: ["builder", "abstract-factory", "memento"],
  problema: [
    "Alguns objetos custam caro para montar: leem configuração, consultam serviços, aplicam dezenas de ajustes. Repetir esse trabalho a cada instância é desperdício.",
    "Às vezes você precisa de uma cópia de um objeto que recebeu, mas não conhece sua classe concreta — só a interface. Não há construtor para chamar.",
  ],
  solucao: [
    "Dar ao próprio objeto a responsabilidade de se copiar. Ele conhece seus campos, inclusive os privados, e sabe o que deve ser duplicado e o que pode ser compartilhado.",
    "Modelos prontos ficam num registro e são clonados sob demanda. Criar passa a ser 'copie aquele que já está do jeito certo'.",
  ],
  quandoUsar: [
    "Montar o objeto é caro e a configuração se repete entre instâncias.",
    "Você precisa copiar um objeto conhecendo apenas sua interface.",
    "Existem variantes pré-configuradas que fazem sentido como catálogo de modelos.",
  ],
  quandoEvitar: [
    "O objeto é simples de construir — um construtor é mais explícito que uma cópia.",
    "O objeto é imutável: compartilhar a referência já é seguro e mais barato que clonar.",
    "O grafo interno tem ciclos ou recursos não copiáveis (conexões, arquivos abertos).",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Em vez de construir do zero, você parte de um modelo pronto e pede a ele uma cópia. Como quem clona é o próprio objeto, ele copia até o que é privado — e quem chama não precisa conhecer a classe concreta.",
    },
    {
      tipo: "analogia",
      emoji: "🍪",
      titulo: "A massa já temperada",
      texto:
        "Um confeiteiro não recomeça a receita a cada biscoito: prepara uma massa-base temperada e corta porções dela. Cada porção nasce com todo o trabalho já feito e pode ser decorada de um jeito diferente. O que ninguém faz é decorar a massa-base — se ela for alterada, todos os biscoitos seguintes saem errados.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Construção cara acontece mais do que parece: objetos que leem configuração, aplicam padrões corporativos ou derivam dezenas de campos a partir de poucos.",
        "E há o caso em que simplesmente não existe construtor a chamar: você recebeu algo tipado pela interface e precisa de uma cópia independente.",
      ],
      extensao: [
        "O segundo caso é o mais estrutural. Sem o padrão, copiar exige descobrir a classe concreta — o que devolve ao código o conhecimento que a interface existia para esconder. Delegar a cópia ao objeto resolve isso do mesmo modo que o polimorfismo resolve qualquer outra decisão por tipo.",
        "Vale distinguir dos vizinhos criacionais. **Builder** monta um objeto complexo passo a passo, partindo do nada, e é ideal quando cada instância difere bastante. **Abstract Factory** cria famílias coerentes de objetos relacionados. **Prototype** parte de algo que já existe e quer variações próximas dele.",
        "Em JavaScript há uma coincidência de nomes que confunde: a linguagem tem herança prototipal, em que objetos herdam de outros objetos. É um mecanismo da linguagem, não este padrão — embora `Object.create` e `structuredClone` sejam ferramentas úteis para implementá-lo.",
      ],
    },
    {
      tipo: "secao",
      id: "profundidade",
      titulo: "Cópia rasa × profunda",
      resumo: [
        "Toda a dificuldade do padrão está numa pergunta: ao copiar, o que deve ser duplicado e o que pode continuar compartilhado?",
      ],
      extensao: [
        "A **cópia rasa** duplica o objeto e mantém as referências internas apontando para os mesmos alvos. É barata e correta quando o que está dentro é imutável ou deliberadamente compartilhado.",
        "A **cópia profunda** duplica recursivamente todo o grafo. É o que a intuição espera de 'clone', e é onde os bugs moram: ciclos causam recursão infinita, recursos externos (conexões, handles de arquivo) não podem ser duplicados, e objetos grandes ficam caros.",
        "A escolha honesta é caso a caso, e é justamente por isso que o padrão coloca `clonar` dentro do objeto: só ele sabe que a lista de blocos precisa ser duplicada, que a configuração é um valor e que a conexão com o banco deve ser reaproveitada. Um clonador genérico externo nunca teria essa informação.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Prototype: reconstruir sempre",
        itens: [
          "cada instância refaz a leitura de configuração",
          "os mesmos vinte ajustes repetidos em cada ponto de criação",
          "copiar algo tipado pela interface exige descobrir a classe",
          "variantes pré-configuradas viram subclasses ou flags",
        ],
        nota: "O custo de montagem é pago toda vez, e o conhecimento sobre como montar corretamente se espalha por quem cria.",
      },
      depois: {
        titulo: "Com Prototype: copiar um modelo",
        itens: [
          "o trabalho de configuração acontece uma vez",
          "criar é clonar o modelo certo do catálogo",
          "o próprio objeto copia o que é privado",
          "variantes são registros no catálogo, não classes",
        ],
        nota: "O custo é a disciplina da cópia: decidir raso ou profundo por campo, e proteger o modelo de ser modificado por quem recebeu um clone.",
      },
      legenda:
        "O ganho é deslocar a complexidade de 'como montar' para 'o que copiar'. Isso compensa quando a montagem é cara e as instâncias se parecem muito entre si.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "registro",
          label: "Registro de modelos",
          nota: "guarda os protótipos, nunca os entrega",
          destaque: true,
          filhos: [
            { id: "contrato", label: "Modelo 'contrato'", nota: "já configurado" },
            { id: "proposta", label: "Modelo 'proposta'", nota: "já configurado" },
          ],
        },
        {
          id: "clone",
          label: "Documento (clone)",
          nota: "cópia independente entregue a quem pediu",
        },
      ],
      legenda:
        "O modelo fica dentro do registro e só sai como cópia. É essa fronteira que impede alguém de alterar o protótipo e contaminar todas as criações seguintes.",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Preparar o modelo", texto: "Monte uma vez o objeto já configurado (o protótipo) e trate-o como somente-leitura." },
        { titulo: "Implementar clonar()", texto: "O próprio objeto decide o que duplicar (cópia profunda nos mutáveis) e o que compartilhar." },
        { titulo: "Registrar no catálogo", texto: "Guarde os modelos por nome; o registro nunca devolve o original — só clones." },
        { titulo: "Criar pedindo cópia", texto: "Quem precisa de uma instância chama criar(nome) e edita a cópia, sem tocar no modelo." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "prototipo",
          titulo: "Protótipo",
          curto: "o modelo já pronto",
          detalhe:
            "Uma instância configurada que serve de base. Deve ser tratada como somente-leitura pelo sistema inteiro: quem precisa alterar, clona antes.",
          exemplo: "new Documento('Contrato padrão', ['cláusula 1'], { tema: 'formal' })",
          seViolar:
            "alterar o protótipo em vez do clone contamina todas as criações futuras — e o bug aparece em objetos que ninguém tocou.",
        },
        {
          id: "clonar",
          titulo: "clonar()",
          curto: "a cópia decidida por dentro",
          detalhe:
            "Implementado no próprio objeto, que sabe quais campos duplicar e quais compartilhar. É o único ponto do sistema com informação suficiente para acertar essa decisão.",
          exemplo: "clonar() { return new Documento(this.titulo, [...this.blocos], { ...this.config }) }",
          seViolar:
            "clonar copiando só a referência da lista faz o clone e o original apontarem para o mesmo array — alterar um altera o outro.",
        },
        {
          id: "registro",
          titulo: "Registro",
          curto: "catálogo de modelos por nome",
          detalhe:
            "Guarda os protótipos e devolve clones. Permite adicionar variantes em tempo de execução, sem criar classes nem alterar quem cria.",
          exemplo: "criar(nome) { return this.modelos.get(nome).clonar() }",
          seViolar:
            "registro que devolve o próprio protótipo em vez de um clone entrega o modelo para ser corrompido pelo primeiro que o receber.",
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
          titulo: "Modelos de documento em editor",
          cenario:
            "Um editor oferece modelos de contrato, proposta e relatório, cada um com estrutura, estilos e cláusulas padrão já montados.",
          aplicacao:
            "Cada modelo é um protótipo no registro. 'Novo a partir de modelo' clona o escolhido, e o usuário edita a cópia sem risco para o original.",
          tradeoff:
            "Atualizar um modelo não afeta os documentos já criados a partir dele — o que é desejável na maioria das vezes e frustrante quando a empresa muda uma cláusula obrigatória e precisa propagar.",
        },
        {
          titulo: "Entidades pré-configuradas em testes",
          cenario:
            "Uma suíte precisa de centenas de clientes válidos, variando um campo por vez, e montar cada um do zero deixa os testes verbosos.",
          aplicacao:
            "Um protótipo de cliente válido é clonado e ajustado em cada teste. O teste passa a mostrar apenas o que é relevante para ele, e o resto vem pronto.",
          tradeoff:
            "Se o protótipo for compartilhado entre testes sem clonagem correta, um teste altera o objeto e contamina os seguintes — produzindo falhas que dependem da ordem de execução e somem quando você roda o teste isolado.",
        },
        {
          titulo: "Duplicar elementos num editor gráfico",
          cenario:
            "Um usuário seleciona uma forma qualquer — retângulo, grupo, texto — e pede 'duplicar'; o editor não sabe de antemão qual tipo recebeu.",
          aplicacao:
            "Toda forma implementa `clonar()`. O comando de duplicar chama o método pela interface comum, e cada tipo cuida da própria cópia, inclusive de filhos aninhados.",
          tradeoff:
            "Grupos aninhados exigem cópia profunda cuidadosa; e formas que referenciam recursos externos (uma imagem carregada) precisam decidir se duplicam o recurso ou compartilham — decisão que muda o consumo de memória do editor.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O clone que compartilha o miolo",
      comoSeParece:
        "Existe `clonar()`, o registro devolve 'cópias', tudo parece certo — mas listas e objetos internos continuam sendo a mesma referência. Alterar o clone altera o modelo.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "No teste seguinte", efeito: "O modelo 'limpo' já veio contaminado pelo teste anterior — falhas que dependem da ordem." },
        { quando: "Em produção", efeito: "Um usuário edita o documento e o template padrão muda para todo mundo." },
        { quando: "Ao depurar", efeito: "Ninguém tocou no modelo; mesmo assim ele mudou — a referência compartilhada esconde a causa." },
      ],
      correcao:
        "Clone profundo no que é mutável (`[...blocos]`, `{ ...config }`, ou `structuredClone`). O teste que importa: clonar, alterar profundamente a cópia e afirmar que o original não mudou.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Cópia rasa disfarçada de clone",
          texto:
            "É o bug número um do padrão. `{ ...this }` copia o objeto mas mantém listas e objetos internos compartilhados; alterar o clone altera o original de forma invisível. O teste que pega isso é clonar, modificar profundamente o clone e verificar que o original não mudou.",
        },
        {
          titulo: "Protótipo mutável no registro",
          texto:
            "Se qualquer código conseguir uma referência ao protótipo e alterá-lo, todas as criações seguintes saem contaminadas — e a causa fica muito distante do sintoma. O registro deve entregar apenas clones, e o protótipo idealmente ser imutável ou congelado.",
        },
        {
          titulo: "Clonar o que não deve ser clonado",
          texto:
            "Uma cópia profunda ingênua tenta duplicar conexões de banco, sockets, caches e até o container de injeção de dependências. O resultado vai de erro imediato a vazamento silencioso de recursos. Cada classe precisa dizer explicitamente o que se copia e o que se reaproveita.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Montar o objeto é caro e a configuração se repete.",
        "Você precisa copiar conhecendo apenas a interface.",
        "Existem variantes pré-configuradas que cabem num catálogo.",
      ],
      evitar: [
        "O objeto é simples de construir.",
        "O objeto é imutável — compartilhar já é seguro.",
        "O grafo interno tem ciclos ou recursos não copiáveis.",
      ],
    },
  ],
};
