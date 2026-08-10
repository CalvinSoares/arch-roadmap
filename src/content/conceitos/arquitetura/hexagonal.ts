import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class ControllerHTTP {
      +postPedido(req)
    }
    class CriarPedido {
      <<interface>>
      +executar(cmd)
    }
    class ServicoPedido {
      +executar(cmd)
    }
    class RepositorioPedido {
      <<interface>>
      +salvar(p)
    }
    class RepositorioSQL {
      +salvar(p)
    }
    ControllerHTTP --> CriarPedido : usa porta entrada
    CriarPedido <|.. ServicoPedido
    ServicoPedido --> RepositorioPedido : usa porta saida
    RepositorioPedido <|.. RepositorioSQL`;

const CAMADAS = [
  {
    id: "adaptadores-driving",
    titulo: "Adaptadores (driving)",
    descricao: "Controllers HTTP, CLI, consumers — acionam o domínio",
  },
  { id: "portas-entrada", titulo: "Portas de entrada", descricao: "Interfaces de casos de uso" },
  {
    id: "dominio",
    titulo: "Domínio",
    descricao: "Regras de negócio isoladas — onde a arquitetura protege",
    destaque: true,
  },
  { id: "portas-saida", titulo: "Portas de saída", descricao: "Interfaces de persistência/serviços" },
  {
    id: "adaptadores-driven",
    titulo: "Adaptadores (driven)",
    descricao: "Repositórios SQL, clientes REST, brokers — servem o domínio",
  },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Porta de saída (driven): o domínio declara o que precisa
interface RepositorioPedido {
  salvar(pedido: Pedido): Promise<void>;
}

// Porta de entrada (driving): caso de uso
interface CriarPedido {
  executar(cmd: { itens: string[] }): Promise<string>;
}

// Domínio: depende só das interfaces
class ServicoPedido implements CriarPedido {
  constructor(private repo: RepositorioPedido) {}
  async executar(cmd: { itens: string[] }) {
    const pedido = Pedido.novo(cmd.itens);
    await this.repo.salvar(pedido);
    return pedido.id;
  }
}

// Adaptador driven: implementa a porta com infra concreta
class RepositorioSQL implements RepositorioPedido {
  async salvar(pedido: Pedido) { /* INSERT ... */ }
}`,
  },
  {
    lang: "python" as const,
    code: `from typing import Protocol

# Porta de saída (driven)
class RepositorioPedido(Protocol):
    def salvar(self, pedido: "Pedido") -> None: ...

# Domínio depende só da abstração
class ServicoPedido:
    def __init__(self, repo: RepositorioPedido):
        self._repo = repo
    def criar(self, itens: list[str]) -> str:
        pedido = Pedido.novo(itens)
        self._repo.salvar(pedido)
        return pedido.id

# Adaptador driven concreto
class RepositorioSQL:
    def salvar(self, pedido: "Pedido") -> None:
        ...  # INSERT ...

# Em teste, injeta-se um dublê sem tocar no domínio
class RepositorioFake:
    def __init__(self):
        self.itens = []
    def salvar(self, pedido):
        self.itens.append(pedido)`,
  },
];

export const hexagonal: Conceito = {
  slug: "hexagonal",
  titulo: "Arquitetura Hexagonal",
  categoria: "arquitetura",
  resumo:
    "Isola o domínio no centro e o conecta ao mundo externo por portas (interfaces) e adaptadores (implementações), tornando infraestrutura um detalhe plugável.",
  tags: ["ports-and-adapters", "clean-architecture", "isolamento", "ddd"],
  dificuldade: "avancado",
  tempoLeitura: 9,
  relacionados: ["adapter", "cqrs"],
  roadmapNodes: ["arq-hexagonal"],
  problema: [
    "Quando as regras de negócio ficam grudadas no framework web, no ORM ou no SDK de terceiros, o domínio passa a depender de detalhes de infraestrutura. Trocar o banco, o broker de mensagens ou a camada HTTP obriga a reescrever lógica que nada tem a ver com essas tecnologias.",
    "Esse acoplamento também sabota os testes: para exercitar uma regra simples é preciso subir banco, servidor e filas.",
  ],
  solucao: [
    "Também chamada de Ports & Adapters (Alistair Cockburn): domínio no centro, portas (interfaces) como única forma de entrar ou sair dele, adaptadores concretos nas bordas.",
    "O domínio depende só das interfaces — a dependência aponta sempre para dentro (inversão de dependência).",
  ],
  quandoUsar: [
    "O domínio é rico e valioso, e você quer protegê-lo de mudanças de framework/infra.",
    "Precisa testar regras de negócio sem subir banco, HTTP ou filas.",
    "Há múltiplos pontos de entrada (REST, CLI, fila) ou de saída (SQL, NoSQL, APIs) para a mesma lógica.",
  ],
  quandoEvitar: [
    "CRUDs simples sem regras relevantes — as camadas viram cerimônia sem retorno.",
    "Protótipos e MVPs de vida curta, onde a indireção atrasa a entrega.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Domínio no centro, interfaces (portas) como única fronteira e infraestrutura plugável nas bordas — dá para trocar banco, fila ou framework sem tocar numa regra de negócio.",
    },
    {
      tipo: "analogia",
      emoji: "🔌",
      titulo: "Como um console de videogame",
      texto:
        "O console (domínio) não sabe se você usa controle com fio, sem fio ou volante — ele só expõe a entrada padrão (porta). Qualquer acessório que implemente aquele plugue (adaptador) funciona. Trocar de controle nunca exige abrir o console.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Regras de negócio grudadas no framework web, no ORM ou em SDKs fazem o domínio depender de detalhes de infraestrutura. Trocar banco, broker ou camada HTTP obriga a reescrever lógica que não tem nada a ver com essas tecnologias.",
        "O acoplamento também sabota os testes: para exercitar uma regra simples é preciso subir banco, servidor e filas — o teste de unidade vira integração lenta e frágil.",
      ],
      extensao: [
        "O sintoma clássico é o 'domínio anêmico invertido': as entidades são structs vazias e as regras moram em controllers e services amarrados ao framework. Qualquer upgrade de versão do framework vira um projeto de risco, porque as regras passam por cima dele.",
        "A raiz do problema é a direção das dependências. Em um sistema em camadas tradicional, o negócio depende da infraestrutura (chama o ORM, conhece o SQL). A hexagonal inverte isso: a infraestrutura passa a depender do negócio, implementando interfaces que o próprio domínio define. É o Dependency Inversion Principle aplicado à arquitetura inteira.",
        "Onion Architecture e Clean Architecture são variações do mesmo princípio — mudam os nomes dos anéis, mas a regra de ouro é idêntica: dependências apontam sempre para dentro, e o centro não conhece ninguém.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "http", label: "HTTP / Fila / CLI" },
        { id: "porta-in", label: "Porta de entrada" },
        { id: "dominio", label: "Domínio", destaque: true },
        { id: "porta-out", label: "Porta de saída" },
        { id: "infra", label: "SQL / APIs / Broker" },
      ],
      setas: [
        { label: "aciona" },
        { label: "implementada por" },
        { label: "declara" },
        { label: "implementada por", tracejada: true },
      ],
      legenda:
        "A dependência aponta sempre para dentro: adaptadores conhecem portas; o domínio não conhece ninguém.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "adaptadores-driving",
          titulo: "Adaptadores de entrada (driving)",
          curto: "quem aciona o domínio",
          detalhe:
            "Controllers HTTP, handlers de CLI, consumers de fila. Traduzem o mundo externo (request, mensagem, argumento) para uma chamada de caso de uso. Não contêm regra de negócio — só tradução e validação de formato.",
          exemplo: 'app.post("/pedidos", (req) => criarPedido.executar(req.body));',
          seViolar:
            "regra de negócio no controller → duplicação entre canais (REST faz uma coisa, fila outra) e testes que só rodam subindo HTTP.",
        },
        {
          id: "portas-entrada",
          titulo: "Portas de entrada",
          curto: "contratos dos casos de uso",
          detalhe:
            "Interfaces que descrevem o que o sistema faz (CriarPedido, CancelarAssinatura). O adaptador conhece apenas a porta; quem a implementa é um serviço do domínio. É o cardápio público do núcleo.",
          exemplo: "interface CriarPedido { executar(cmd: Cmd): Promise<string>; }",
          seViolar:
            "adaptador instanciando classes concretas do domínio → acoplamento com detalhes internos; refatorar o núcleo passa a quebrar as bordas.",
        },
        {
          id: "dominio",
          titulo: "Domínio (o centro)",
          curto: "regras de negócio puras",
          detalhe:
            "Entidades, invariantes e serviços de aplicação. Depende exclusivamente de interfaces (as portas) — nenhum import de framework, ORM ou SDK. É a parte valiosa e estável do sistema; tudo em volta existe para servi-la.",
          exemplo:
            "class ServicoPedido implements CriarPedido {\n  constructor(private repo: RepositorioPedido) {}\n}",
          seViolar:
            "um import de ORM aqui e o domínio vira refém da infra: testes exigem banco de pé e a troca de tecnologia contamina as regras.",
        },
        {
          id: "portas-saida",
          titulo: "Portas de saída",
          curto: "o que o domínio precisa do mundo",
          detalhe:
            "Interfaces de persistência, mensageria e gateways — declaradas PELO domínio, na linguagem do domínio ('salvar pedido', não 'executar INSERT'). É aqui que a inversão de dependência acontece.",
          exemplo: "interface RepositorioPedido { salvar(p: Pedido): Promise<void>; }",
          seViolar:
            "domínio chamando SDK/driver direto → impossível trocar a infra ou usar dublês; todo teste vira integração.",
        },
        {
          id: "adaptadores-driven",
          titulo: "Adaptadores de saída (driven)",
          curto: "implementações concretas",
          detalhe:
            "Repositório SQL, cliente REST, publisher de eventos — implementam as portas de saída na borda do sistema. Conhecem tecnologia; não conhecem regra de negócio.",
          exemplo: "class RepositorioSQL implements RepositorioPedido { /* INSERT */ }",
          seViolar:
            "regra de negócio dentro do repositório → lógica espalhada, invisível ao domínio e sem cobertura dos testes de unidade.",
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
          titulo: "Migrar de banco sem tocar no negócio",
          cenario:
            "Uma fintech precisa trocar Postgres por DynamoDB no serviço de pedidos por causa de escala.",
          aplicacao:
            "Só nasce um novo adaptador driven implementando RepositorioPedido. O domínio, os casos de uso e os controllers não mudam uma linha — o deploy pode até rodar com os dois adaptadores em paralelo para comparação.",
          tradeoff:
            "Exige disciplina no design das portas: se a interface vazou detalhes de SQL, a troca deixa de ser plugável.",
        },
        {
          titulo: "Mesma lógica, três canais",
          cenario:
            "Um pedido pode ser criado por REST (app), por fila (integração B2B) e por CLI (backoffice).",
          aplicacao:
            "Três adaptadores driving finos chamam a mesma porta de entrada CriarPedido. Validação de negócio existe uma vez só, no domínio — os canais apenas traduzem formato.",
          tradeoff: "Cada canal ganha uma camada de tradução própria — mais arquivos, menos duplicação.",
        },
        {
          titulo: "CI rápido com testes de unidade",
          cenario:
            "O pipeline levava 25 min porque todo teste subia banco e broker via containers.",
          aplicacao:
            "Com as regras atrás de portas, os testes de domínio usam dublês em memória e rodam em milissegundos; integração real fica para uma suíte menor de testes de contrato dos adaptadores.",
          tradeoff:
            "Os testes de contrato continuam necessários — dublê que diverge do adaptador real cria falsa confiança.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Hexagonal de fachada",
          texto:
            "Criar pastas ports/ e adapters/ mas deixar as regras nos controllers. A arquitetura vira cerimônia: você paga a indireção sem ganhar o isolamento.",
        },
        {
          titulo: "Porta espelhando o banco",
          texto:
            "Desenhar portas como CRUD genérico (findById, updateAll) em vez de necessidades do domínio ('reservar estoque'). O vocabulário da infra invade o núcleo e a troca de tecnologia volta a doer.",
        },
        {
          titulo: "Uma porta para cada coisa",
          texto:
            "Abstrair até lib de log e util de data. Portas nascem de necessidades do domínio que variam de implementação — abstração especulativa é só indireção sem valor.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O domínio é rico e valioso, e você quer protegê-lo de mudanças de framework/infra.",
        "Precisa testar regras de negócio sem subir banco, HTTP ou filas.",
        "Há múltiplos pontos de entrada (REST, CLI, fila) ou de saída (SQL, NoSQL, APIs) para a mesma lógica.",
      ],
      evitar: [
        "CRUDs simples sem regras relevantes — as camadas viram cerimônia sem retorno.",
        "Protótipos e MVPs de vida curta, onde a indireção atrasa a entrega.",
      ],
    },
  ],
};
