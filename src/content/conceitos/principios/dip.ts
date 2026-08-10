import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class CriarPedido {
        -repo
        +executar(dados)
    }
    class RepositorioPedidos {
        <<interface>>
        +salvar(p)
    }
    class PostgresPedidos {
        +salvar(p)
    }
    CriarPedido --> RepositorioPedidos : depende da abstracao
    RepositorioPedidos <|.. PostgresPedidos : infra implementa`;

const CAMADAS = [
  {
    id: "alto",
    titulo: "Política (alto nível)",
    descricao: "As regras de negócio — e é ela quem declara o contrato — coração do princípio",
    destaque: true,
  },
  { id: "abstracao", titulo: "A abstração", descricao: "Pertence a quem usa, não a quem implementa" },
  { id: "baixo", titulo: "Detalhe (baixo nível)", descricao: "Banco, HTTP, fila — implementa o contrato alheio" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// ANTES: a regra de negocio depende do detalhe concreto
class PostgresPedidos {
  salvar(p: unknown): void { console.log("INSERT ..."); }
}
class CriarPedidoRuim {
  private repo = new PostgresPedidos(); // acoplado ao banco
  executar(dados: unknown): void {
    this.repo.salvar(dados);            // testar exige um Postgres
  }
}

// DEPOIS: a abstracao pertence a quem USA
// (declarada junto do caso de uso, no dominio)
interface RepositorioPedidos {
  salvar(p: Pedido): void;
}
interface Pedido {
  id: string;
  total: number;
}

class CriarPedido {
  // depende da abstracao; nao sabe que Postgres existe
  constructor(private repo: RepositorioPedidos) {}

  executar(p: Pedido): void {
    if (p.total <= 0) throw new Error("total inválido");
    this.repo.salvar(p);
  }
}

// A infra implementa o contrato do dominio — a seta se inverteu
class PostgresPedidosOk implements RepositorioPedidos {
  salvar(p: Pedido): void { console.log("INSERT INTO pedidos", p.id); }
}

// Em teste, sem banco nenhum
class RepoEmMemoria implements RepositorioPedidos {
  readonly salvos: Pedido[] = [];
  salvar(p: Pedido): void { this.salvos.push(p); }
}

const repo = new RepoEmMemoria();
new CriarPedido(repo).executar({ id: "1", total: 100 });
console.log(repo.salvos.length); // 1`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

# A abstracao pertence a quem USA (fica junto do caso de uso)
class RepositorioPedidos(ABC):
    @abstractmethod
    def salvar(self, p): ...

class CriarPedido:
    # depende da abstracao; nao sabe que Postgres existe
    def __init__(self, repo: RepositorioPedidos):
        self._repo = repo

    def executar(self, p):
        if p["total"] <= 0:
            raise ValueError("total invalido")
        self._repo.salvar(p)

# A infra implementa o contrato do dominio — a seta se inverteu
class PostgresPedidos(RepositorioPedidos):
    def salvar(self, p):
        print("INSERT INTO pedidos", p["id"])

# Em teste, sem banco nenhum
class RepoEmMemoria(RepositorioPedidos):
    def __init__(self):
        self.salvos = []
    def salvar(self, p):
        self.salvos.append(p)

repo = RepoEmMemoria()
CriarPedido(repo).executar({"id": "1", "total": 100})
print(len(repo.salvos))  # 1`,
  },
];

export const dip: Conceito = {
  slug: "dip",
  titulo: "DIP — Inversão de Dependência",
  categoria: "principio",
  resumo:
    "Módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações — e a abstração pertence a quem a usa, não a quem a implementa.",
  tags: ["solid", "abstracao", "inversao", "arquitetura"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  relacionados: ["hexagonal", "ocp", "adapter"],
  problema: [
    "A regra de negócio instancia diretamente o banco, o cliente HTTP e o serviço de e-mail. Para testá-la é preciso subir infraestrutura, e trocar qualquer detalhe implica mexer no domínio.",
    "A dependência aponta na direção errada: o que é estável e valioso (a política) passa a depender do que é volátil e substituível (o detalhe).",
  ],
  solucao: [
    "A camada de alto nível declara a interface de que precisa, em seus próprios termos. A camada de baixo nível implementa essa interface.",
    "A dependência em tempo de compilação passa a apontar da infraestrutura para o domínio — o oposto do fluxo de execução. É daí que vem o nome 'inversão'.",
  ],
  quandoUsar: [
    "A regra de negócio precisa ser testável sem banco, rede ou fila.",
    "Detalhes de infraestrutura podem mudar (trocar de provedor, de banco, de gateway).",
    "Você quer que o domínio seja legível sem conhecimento de framework.",
  ],
  quandoEvitar: [
    "Scripts e ferramentas pequenas, onde a indireção custa mais do que o acoplamento.",
    "Abstrair algo que nunca terá segunda implementação nem precisa ser substituído em teste.",
    "Criar interfaces espelho de bibliotecas inteiras: envolver o mundo todo tem custo alto e ganho baixo.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O caso de uso declara `RepositorioPedidos` do jeito que precisa; o Postgres implementa esse contrato. A seta de dependência passa a apontar da infraestrutura para o domínio — e o domínio vira testável sem subir nada.",
    },
    {
      tipo: "analogia",
      emoji: "🔩",
      titulo: "O parafuso e a rosca padronizada",
      texto:
        "A indústria não fabrica uma furadeira para cada marca de parafuso. Ela definiu roscas padrão, e os fabricantes de parafuso se adaptam a elas. Quem tem o problema a resolver definiu o encaixe; quem fornece a peça obedece. Se fosse ao contrário, cada fornecedor novo obrigaria a trocar a ferramenta.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Sem inversão, a regra de negócio importa o driver do banco, o SDK do provedor de e-mail e o cliente HTTP. Ela deixa de ser legível como negócio e passa a ser um roteiro de integrações.",
        "Testar exige infraestrutura, mudar de fornecedor exige tocar no domínio, e o código mais valioso do sistema fica refém do mais substituível.",
      ],
      extensao: [
        "A parte que costuma passar despercebida é a segunda metade do princípio: **a abstração pertence a quem a usa**. Criar uma interface e colocá-la no pacote de infraestrutura não inverte nada — a dependência continua apontando para fora. A interface precisa viver junto do domínio, escrita no vocabulário dele.",
        "Isso muda o desenho do contrato. Um repositório definido pelo domínio fala de `salvar(pedido)` e `buscarPorCliente(id)` — não de conexões, transações ou SQL. Se a interface parece a API do banco, ela foi escrita do lado errado.",
        "Convém separar do que costuma ser confundido: **injeção de dependência** é uma técnica de fornecer colaboradores, e **inversão de controle** é sobre quem chama quem. Nenhuma das duas garante DIP. Dá para injetar uma classe concreta de infraestrutura e continuar com a dependência apontando na direção errada — o princípio é sobre a direção da seta, não sobre o mecanismo.",
      ],
    },
    {
      tipo: "secao",
      id: "arquitetura",
      titulo: "O princípio em escala de arquitetura",
      resumo: [
        "DIP é o único dos cinco princípios SOLID que se aplica igual da classe até a arquitetura inteira — é a regra que sustenta hexagonal, ports and adapters e clean architecture.",
      ],
      extensao: [
        "Em todas essas arquiteturas, a regra é a mesma: as dependências apontam para dentro, em direção ao domínio, e o núcleo não conhece nada do que está fora. As 'portas' são exatamente as abstrações declaradas pelo domínio; os 'adaptadores' são as implementações de infraestrutura.",
        "O ganho prático mais imediato é a testabilidade. Com as portas no lugar, a suíte do domínio roda em milissegundos com implementações em memória, sem docker, sem migração, sem rede — e isso muda o ritmo de trabalho mais do que qualquer outra decisão de design.",
        "O ganho de longo prazo é a substituibilidade real. Trocar de provedor de e-mail ou de banco deixa de ser projeto e passa a ser escrever um adaptador novo. Vale notar que essa troca acontece menos do que se imagina — o que quase sempre se paga é o primeiro ganho, não o segundo.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Dependência apontando para fora",
        itens: [
          "CriarPedido instancia PostgresPedidos diretamente",
          "testar a regra exige um banco de verdade",
          "trocar de banco toca no caso de uso",
          "o domínio importa driver e SDK",
        ],
        nota: "O código mais valioso e estável passa a depender do mais volátil e substituível — e qualquer mudança de infraestrutura sobe até a regra de negócio.",
      },
      depois: {
        titulo: "Dependência invertida",
        itens: [
          "CriarPedido declara e depende de RepositorioPedidos",
          "o teste injeta um repositório em memória",
          "trocar de banco é escrever outro adaptador",
          "o domínio não importa nada de infraestrutura",
        ],
        nota: "O custo é uma interface a mais por porta e um lugar onde tudo é montado (a composição). Aplicado sem critério, produz interfaces com um implementador só e indireção sem ganho.",
      },
      legenda:
        "A seta em tempo de compilação passa a apontar no sentido contrário ao do fluxo de execução: em runtime o caso de uso chama o banco, mas no código quem depende de quem se inverteu.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "dominio",
          label: "Domínio / caso de uso",
          nota: "não importa nada de fora",
          destaque: true,
          filhos: [
            {
              id: "porta",
              label: "interface RepositorioPedidos",
              nota: "a porta — declarada aqui dentro",
              destaque: true,
            },
          ],
        },
        {
          id: "infra",
          label: "Infraestrutura",
          nota: "conhece o domínio, e não o contrário",
          filhos: [
            { id: "pg", label: "PostgresPedidos", nota: "adaptador de produção" },
            { id: "mem", label: "RepoEmMemoria", nota: "adaptador de teste", opcional: true },
          ],
        },
      ],
      legenda:
        "A interface fica dentro da fronteira do domínio — esse é o detalhe que faz a inversão existir. Colocá-la no pacote de infraestrutura mantém a dependência apontando para fora.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "politica",
          titulo: "Política (alto nível)",
          curto: "as regras, sem saber de infraestrutura",
          detalhe:
            "Contém o que dá valor ao sistema e muda por motivo de negócio. Não importa driver, framework nem SDK — se importar, a inversão não aconteceu.",
          exemplo: "class CriarPedido { constructor(private repo: RepositorioPedidos) {} }",
          seViolar:
            "um `import` de biblioteca de banco dentro do caso de uso já denuncia a dependência na direção errada.",
        },
        {
          id: "porta",
          titulo: "A porta",
          curto: "declarada por quem usa",
          detalhe:
            "Interface escrita no vocabulário do domínio e mantida junto dele. Deve ser pequena e refletir a necessidade, não as capacidades da tecnologia que a implementará.",
          exemplo: "interface RepositorioPedidos { salvar(p: Pedido): void }",
          seViolar:
            "porta que fala de transação, cursor ou statement copiou a API do banco — a abstração nasceu do lado errado e vaza tecnologia para dentro.",
        },
        {
          id: "adaptador",
          titulo: "O adaptador",
          curto: "implementa o contrato alheio",
          detalhe:
            "Traduz entre o vocabulário do domínio e o da tecnologia. É substituível: produção usa Postgres, teste usa memória, e o domínio não percebe diferença.",
          exemplo: "class PostgresPedidos implements RepositorioPedidos { salvar(p) { /* SQL */ } }",
          seViolar:
            "adaptador com regra de negócio dentro espalha o domínio pela infraestrutura e desfaz a fronteira.",
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
          titulo: "Domínio testável sem banco",
          cenario:
            "A suíte de testes levava oito minutos porque cada caso subia um container de banco e aplicava migrações.",
          aplicacao:
            "Os casos de uso passam a depender de portas de repositório; os testes injetam implementações em memória. A suíte de domínio cai para segundos e roda a cada salvamento.",
          tradeoff:
            "Implementações em memória divergem do banco real em detalhes que importam (unicidade, ordenação, transação). Sem uma suíte de contrato rodando contra as duas, os testes rápidos passam a validar um comportamento que a produção não tem.",
        },
        {
          titulo: "Troca de provedor de pagamento",
          cenario:
            "A empresa precisa migrar de gateway por questão de taxa, e a integração atual está espalhada por vários serviços.",
          aplicacao:
            "Uma porta de cobrança declarada pelo domínio e dois adaptadores permitem migrar por etapas, inclusive rodando os dois em paralelo para comparar resultados.",
          tradeoff:
            "A porta precisa ser genérica o bastante para os dois provedores sem virar o menor denominador comum — e recursos exclusivos de um deles ficam de fora ou vazam por opções específicas.",
        },
        {
          titulo: "Relógio e aleatoriedade injetados",
          cenario:
            "Regras que dependem de data ('vence em 30 dias') e de sorteio ('amostragem de 10%') são impossíveis de testar de forma determinística.",
          aplicacao:
            "Tempo e aleatoriedade viram portas. Em produção usam o relógio e o gerador reais; em teste, valores fixos. Regras temporais passam a ter teste confiável.",
          tradeoff:
            "É invasivo: praticamente todo objeto que precisa da data passa a recebê-la, e o código fica mais verboso em troca de determinismo nos testes.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Interface no pacote errado",
          texto:
            "Criar `RepositorioPedidos` dentro do módulo de infraestrutura é o erro mais comum e o mais invisível: o código ganha uma interface, parece seguir o princípio, e a dependência continua apontando para fora. A abstração precisa morar junto de quem a usa — é isso que inverte a seta.",
        },
        {
          titulo: "Abstrair tudo por precaução",
          texto:
            "Uma interface para cada classe, com um implementador cada, transforma navegar no código numa caçada e não entrega substituibilidade nenhuma. Abstraia as fronteiras que realmente separam política de detalhe: banco, rede, relógio, fila. O resto pode ser concreto.",
        },
        {
          titulo: "Porta modelada pela tecnologia",
          texto:
            "Se a interface tem `executarQuery`, `abrirTransacao` ou `commit`, ela é a API do banco com outro nome. O domínio passa a depender de um conceito de infraestrutura disfarçado, e trocar de tecnologia continua exigindo mexer nele — a inversão é só aparente.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "A regra de negócio precisa ser testável sem infraestrutura.",
        "Detalhes externos podem mudar de provedor ou tecnologia.",
        "O domínio deve ser legível sem conhecimento de framework.",
      ],
      evitar: [
        "Scripts e ferramentas pequenas.",
        "Abstrações sem segunda implementação nem uso em teste.",
        "Espelhar bibliotecas inteiras atrás de interfaces próprias.",
      ],
    },
  ],
};
