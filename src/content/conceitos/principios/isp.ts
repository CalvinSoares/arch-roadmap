import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Impressora {
        <<interface gorda>>
        +imprimir()
        +digitalizar()
        +enviarFax()
    }
    class Legivel {
        <<interface>>
        +imprimir()
    }
    class Digitalizavel {
        <<interface>>
        +digitalizar()
    }
    class ImpressoraSimples {
        +imprimir()
    }
    class Multifuncional {
        +imprimir()
        +digitalizar()
    }
    Legivel <|.. ImpressoraSimples
    Legivel <|.. Multifuncional
    Digitalizavel <|.. Multifuncional`;

const CAMADAS = [
  {
    id: "cliente",
    titulo: "O cliente",
    descricao: "Quem consome define o tamanho certo da interface — coração do princípio",
    destaque: true,
  },
  { id: "papel", titulo: "Interfaces por papel", descricao: "Contratos pequenos, um por capacidade" },
  { id: "implementacao", titulo: "Implementação", descricao: "Assina só o que sabe cumprir" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ANTES: interface gorda obriga todo mundo a tudo
interface MaquinaEscritorio {
  imprimir(doc: string): void;
  digitalizar(): string;
  enviarFax(numero: string): void;
}

class ImpressoraSimplesRuim implements MaquinaEscritorio {
  imprimir(doc: string): void { console.log("imprimindo", doc); }
  digitalizar(): string { throw new Error("não suportado"); }   // mentira
  enviarFax(_n: string): void { throw new Error("não suportado"); } // mentira
}

// DEPOIS: uma interface por capacidade
interface Imprimivel {
  imprimir(doc: string): void;
}
interface Digitalizavel {
  digitalizar(): string;
}
interface Faxeavel {
  enviarFax(numero: string): void;
}

class ImpressoraSimples implements Imprimivel {
  imprimir(doc: string): void { console.log("imprimindo", doc); }
}

class Multifuncional implements Imprimivel, Digitalizavel {
  imprimir(doc: string): void { console.log("imprimindo", doc); }
  digitalizar(): string { return "imagem"; }
}

// O cliente pede exatamente o que usa — nem mais, nem menos
function imprimirRelatorio(p: Imprimivel): void {
  p.imprimir("relatório mensal");
}

imprimirRelatorio(new ImpressoraSimples()); // ok
imprimirRelatorio(new Multifuncional());    // ok`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

# ANTES: interface gorda obriga todo mundo a tudo
class MaquinaEscritorio(ABC):
    @abstractmethod
    def imprimir(self, doc): ...
    @abstractmethod
    def digitalizar(self): ...
    @abstractmethod
    def enviar_fax(self, numero): ...

class ImpressoraSimplesRuim(MaquinaEscritorio):
    def imprimir(self, doc): print("imprimindo", doc)
    def digitalizar(self): raise NotImplementedError      # mentira
    def enviar_fax(self, numero): raise NotImplementedError  # mentira

# DEPOIS: uma interface por capacidade
class Imprimivel(ABC):
    @abstractmethod
    def imprimir(self, doc): ...

class Digitalizavel(ABC):
    @abstractmethod
    def digitalizar(self): ...

class ImpressoraSimples(Imprimivel):
    def imprimir(self, doc): print("imprimindo", doc)

class Multifuncional(Imprimivel, Digitalizavel):
    def imprimir(self, doc): print("imprimindo", doc)
    def digitalizar(self): return "imagem"

# O cliente pede exatamente o que usa
def imprimir_relatorio(p: Imprimivel):
    p.imprimir("relatorio mensal")

imprimir_relatorio(ImpressoraSimples())
imprimir_relatorio(Multifuncional())`,
  },
];

export const isp: Conceito = {
  slug: "isp",
  titulo: "ISP — Segregação de Interfaces",
  categoria: "principio",
  resumo:
    "Nenhum cliente deve ser forçado a depender de métodos que não usa: é melhor várias interfaces pequenas e específicas do que uma grande e genérica.",
  tags: ["solid", "interface", "acoplamento", "design"],
  dificuldade: "intermediario",
  tempoLeitura: 5,
  relacionados: ["lsp", "srp", "dip"],
  problema: [
    "Interfaces crescem para cobrir todos os casos e passam a obrigar cada implementação a fornecer métodos que não fazem sentido para ela — normalmente resolvidos com exceção de 'não suportado'.",
    "Quem consome também sofre: depender de uma interface com quinze métodos significa recompilar, re-testar e se preocupar com mudanças em treze que não usa.",
  ],
  solucao: [
    "Quebrar a interface grande em várias pequenas, uma por papel ou capacidade. Cada implementação assina apenas o que sabe cumprir de verdade.",
    "Cada cliente passa a depender do menor contrato que atende à sua necessidade — o que reduz acoplamento e torna o tipo honesto sobre o que o objeto faz.",
  ],
  quandoUsar: [
    "Implementações precisam lançar exceção porque não sabem cumprir parte da interface.",
    "Clientes diferentes usam subconjuntos disjuntos dos métodos.",
    "Mudanças na interface obrigam a recompilar código que não tem nada a ver com elas.",
  ],
  quandoEvitar: [
    "Fragmentar por reflexo: uma interface por método cria uma explosão de tipos sem ganho real.",
    "Todos os clientes usam todos os métodos — a interface coesa já está do tamanho certo.",
    "O agrupamento é genuinamente coeso e quebrá-lo espalharia um conceito único.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Se uma implementação precisa lançar 'não suportado', a interface é grande demais. Divida por capacidade: quem só imprime implementa só `Imprimivel`, e quem só precisa imprimir depende só disso.",
    },
    {
      tipo: "analogia",
      emoji: "🍽️",
      titulo: "O cardápio do restaurante",
      texto:
        "Um restaurante que serve só almoço não recebe o cardápio completo com café da manhã, jantar e carta de vinhos, com metade das páginas riscadas. Ele recebe o cardápio do almoço. Quem chega para almoçar não precisa folhear o que não está disponível — e mudar a carta de vinhos não obriga a reimprimir o cardápio do almoço.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Interfaces tendem a engordar: cada necessidade nova acrescenta um método, e ninguém remove os antigos por medo de quebrar alguém.",
        "O custo aparece dos dois lados. Quem implementa é obrigado a fornecer o que não faz; quem consome fica acoplado a métodos que nunca chama.",
      ],
      extensao: [
        "O acoplamento de quem consome é o mais subestimado. Depender de uma interface com quinze métodos significa que qualquer alteração em qualquer um deles pode forçar recompilação, revisão e novos testes — mesmo num cliente que usa um método só.",
        "O princípio tem uma relação direta com **LSP**: a exceção de 'não suportado' é simultaneamente uma violação de Liskov (o subtipo não cumpre o contrato) e o sintoma clássico de uma interface mal segregada. Corrigir pelo ISP costuma resolver a violação de Liskov de tabela.",
        "Vale também a comparação com **SRP**: são o mesmo raciocínio em superfícies diferentes. O SRP fala do módulo e de quem pede mudanças nele; o ISP fala do contrato e de quem depende dele. Ambos perguntam 'quem é o interessado?' — e ambos separam quando as respostas divergem.",
      ],
    },
    {
      tipo: "secao",
      id: "tamanho",
      titulo: "Qual é o tamanho certo",
      resumo: [
        "O princípio diz para segregar, não para atomizar. O critério não é a quantidade de métodos, é a coesão de uso entre os clientes.",
      ],
      extensao: [
        "A pergunta que resolve: os clientes usam esses métodos juntos? Se todos que chamam `abrir` também chamam `fechar`, os dois pertencem à mesma interface, por mais que sejam operações distintas. Se um grupo de clientes usa só leitura e outro só escrita, há duas interfaces disfarçadas de uma.",
        "Uma técnica útil é **definir a interface do lado do cliente**, não do lado da implementação. Em vez de perguntar 'o que este objeto faz?', pergunte 'o que este cliente precisa?'. As interfaces nascem menores e mais estáveis, porque refletem necessidades reais em vez de capacidades disponíveis.",
        "O exagero também tem custo: uma interface por método produz assinaturas com cinco tipos e um sistema difícil de navegar. Se cada divisão nova não elimina uma dependência real de alguém, ela provavelmente é só ruído.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Interface gorda",
        itens: [
          "MaquinaEscritorio exige imprimir, digitalizar e enviar fax",
          "a impressora simples lança exceção em dois métodos",
          "quem só imprime depende de três métodos",
          "mudar a assinatura do fax recompila todo mundo",
        ],
        nota: "O tipo mente: ele diz que o objeto sabe fazer três coisas quando sabe fazer uma, e o erro só aparece em tempo de execução.",
      },
      depois: {
        titulo: "Interfaces por capacidade",
        itens: [
          "Imprimivel, Digitalizavel e Faxeavel separadas",
          "cada classe assina só o que cumpre",
          "quem só imprime depende só de Imprimivel",
          "mudar o fax não afeta quem imprime",
        ],
        nota: "O custo é mais tipos para nomear e manter — e a necessidade de compor várias interfaces quando um objeto realmente faz várias coisas.",
      },
      legenda:
        "A segregação faz o sistema de tipos voltar a dizer a verdade. O que antes era exceção em tempo de execução vira erro de compilação — ou simplesmente deixa de ser possível.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "imprimivel",
          label: "interface Imprimivel",
          nota: "um método — o que a maioria dos clientes precisa",
          destaque: true,
          filhos: [
            { id: "simples", label: "ImpressoraSimples", nota: "implementa só isto" },
            { id: "multi1", label: "Multifuncional", nota: "implementa isto e mais" },
          ],
        },
        {
          id: "digitalizavel",
          label: "interface Digitalizavel",
          nota: "capacidade separada",
          destaque: true,
          filhos: [{ id: "multi2", label: "Multifuncional", nota: "a mesma classe, outro papel" }],
        },
      ],
      legenda:
        "A Multifuncional aparece nas duas árvores porque assina os dois papéis. A impressora simples aparece em uma só — e o tipo passa a refletir exatamente o que cada aparelho faz.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "O cliente",
          curto: "define o tamanho da interface",
          detalhe:
            "Quem consome é o ponto de partida: a interface deve ter exatamente o que aquele uso exige. Interfaces desenhadas a partir das necessidades dos clientes nascem pequenas e mudam pouco.",
          exemplo: "function imprimirRelatorio(p: Imprimivel) { p.imprimir('...') }",
          seViolar:
            "cliente que recebe uma interface com quinze métodos para chamar um fica exposto a mudanças que não lhe dizem respeito.",
        },
        {
          id: "interface",
          titulo: "A interface",
          curto: "um papel, poucos métodos",
          detalhe:
            "Agrupa métodos que os clientes usam juntos. O nome deve descrever uma capacidade ('Imprimivel'), não um objeto do mundo ('MaquinaEscritorio').",
          exemplo: "interface Imprimivel { imprimir(doc: string): void }",
          seViolar:
            "interface nomeada por objeto tende a acumular tudo que o objeto faz, e volta a crescer sem limite.",
        },
        {
          id: "implementacao",
          titulo: "A implementação",
          curto: "assina só o que cumpre",
          detalhe:
            "Pode implementar várias interfaces quando realmente tem várias capacidades. O que não pode é assinar um contrato que não consegue honrar.",
          exemplo: "class Multifuncional implements Imprimivel, Digitalizavel { ... }",
          seViolar:
            "implementar por obrigação e lançar 'não suportado' devolve o problema ao tempo de execução e quebra Liskov junto.",
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
          titulo: "Repositório com leitura e escrita separadas",
          cenario:
            "Um repositório de pedidos expõe consultas e comandos, e a maior parte do sistema só lê — relatórios, telas de listagem, exportações.",
          aplicacao:
            "Separar em interfaces de leitura e de escrita permite que a maioria dos consumidores dependa só da leitura, e deixa explícito no tipo quem pode alterar dados.",
          tradeoff:
            "Duas interfaces sobre a mesma implementação exigem coordenação: mudanças de modelo afetam ambas, e é preciso decidir onde ficam operações mistas como 'buscar e travar'.",
        },
        {
          titulo: "Ciclo de vida em plugins",
          cenario:
            "Uma plataforma de plugins define uma interface com inicialização, encerramento, tratamento de eventos e configuração — e a maioria dos plugins usa uma dessas coisas.",
          aplicacao:
            "Cada capacidade vira uma interface opcional. O host verifica quais o plugin implementa e chama apenas essas. Plugins simples ficam com poucas linhas.",
          tradeoff:
            "O host precisa checar capacidades em tempo de execução, o que traz de volta uma forma de verificação de tipo — controlada e explícita, mas ainda assim presente.",
        },
        {
          titulo: "Serviço de notificação com canais desiguais",
          cenario:
            "Um serviço envia notificações por e-mail, SMS e push; só o push tem ações interativas e só o e-mail tem anexos.",
          aplicacao:
            "A interface base cobre o envio simples; capacidades extras ficam em interfaces próprias. Quem precisa de anexo pede o tipo que os suporta.",
          tradeoff:
            "O código que escolhe o canal dinamicamente precisa lidar com capacidades variáveis, e a lógica de fallback ('se não suportar anexo, mande o link') tem de morar em algum lugar.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Atomizar em interfaces de um método",
          texto:
            "Levar o princípio ao extremo produz dezenas de interfaces minúsculas e assinaturas que listam cinco tipos para descrever um colaborador. O critério é coesão de uso: métodos que os clientes sempre chamam juntos pertencem à mesma interface.",
        },
        {
          titulo: "Segregar o contrato e manter a classe gorda",
          texto:
            "Dividir as interfaces sem revisar a implementação resolve o acoplamento de quem consome e deixa intacto o problema de quem implementa — uma classe que faz coisas demais continua sendo uma classe que faz coisas demais. ISP e SRP costumam precisar ser aplicados juntos.",
        },
        {
          titulo: "Nomear interfaces por objeto, não por papel",
          texto:
            "'MaquinaEscritorio' convida a acumular tudo que uma máquina de escritório poderia fazer. 'Imprimivel' delimita naturalmente. O nome é o que impede a interface de voltar a engordar seis meses depois.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Implementações lançam exceção por não saberem cumprir parte do contrato.",
        "Clientes distintos usam subconjuntos disjuntos dos métodos.",
        "Mudanças na interface afetam código que não a usa de fato.",
      ],
      evitar: [
        "Fragmentar sem que isso elimine dependência real de alguém.",
        "Todos os clientes usam todos os métodos.",
        "O agrupamento é coeso e quebrá-lo espalharia um conceito único.",
      ],
    },
  ],
};
