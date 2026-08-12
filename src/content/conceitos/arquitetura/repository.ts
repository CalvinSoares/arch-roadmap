import type { Conceito } from "@/shared/types/conceito";

const ANTI_EXEMPLO = `// "Repositorio" que so repassa o ORM: nao esconde nada.
class PedidoRepository {
  constructor(private db: PrismaClient) {}

  // Devolve o tipo do ORM. Quem chama fica acoplado ao Prisma.
  findMany(where: Prisma.PedidoWhereInput) {
    return this.db.pedido.findMany({ where });
  }

  // E aqui a fronteira ja se dissolveu de vez:
  get raw() { return this.db.pedido; }
}

// O servico monta a consulta — ou seja, a regra de "quais pedidos
// contam como pendentes" mora na aplicacao, espalhada:
const pendentes = await repo.findMany({
  status: { in: ["AGUARDANDO", "EM_ANALISE"] },
  criadoEm: { lt: new Date(Date.now() - 3600_000) },
});

// A mesma condicao reaparece em outros quatro lugares,
// e um dia tres deles sao atualizados e o quarto nao.`;

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A interface mora no DOMINIO e fala a linguagem dele.
// Nada de Prisma, SQL, tabela ou coluna aqui.
export interface PedidosRepositorio {
  porId(id: PedidoId): Promise<Pedido | null>;
  pendentesHaMaisDe(horas: number, agora: Date): Promise<Pedido[]>;
  salvar(pedido: Pedido): Promise<void>;
}

// A implementacao mora na INFRA e e a unica que conhece o banco.
export class PedidosNoPostgres implements PedidosRepositorio {
  constructor(private db: PrismaClient) {}

  async pendentesHaMaisDe(horas: number, agora: Date): Promise<Pedido[]> {
    const linhas = await this.db.pedido.findMany({
      where: {
        status: { in: ["AGUARDANDO", "EM_ANALISE"] },
        criadoEm: { lt: new Date(agora.getTime() - horas * 3600_000) },
      },
    });
    // traduz linha -> objeto de dominio; o ORM para aqui
    return linhas.map(paraDominio);
  }

  async salvar(pedido: Pedido): Promise<void> {
    const dados = paraLinha(pedido);
    await this.db.pedido.upsert({
      where: { id: dados.id }, create: dados, update: dados,
    });
  }

  async porId(id: PedidoId) {
    const l = await this.db.pedido.findUnique({ where: { id: String(id) } });
    return l ? paraDominio(l) : null;
  }
}

// No teste, uma implementacao em memoria — sem banco, sem container.
export class PedidosEmMemoria implements PedidosRepositorio { /* ... */ }`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod
from datetime import datetime, timedelta

class PedidosRepositorio(ABC):
    """Contrato no dominio, na linguagem do negocio."""

    @abstractmethod
    def por_id(self, id: PedidoId) -> Pedido | None: ...

    @abstractmethod
    def pendentes_ha_mais_de(self, horas: int, agora: datetime) -> list[Pedido]: ...

    @abstractmethod
    def salvar(self, pedido: Pedido) -> None: ...


class PedidosNoPostgres(PedidosRepositorio):
    """Unica classe que sabe que existe SQLAlchemy."""

    def __init__(self, sessao):
        self._sessao = sessao

    def pendentes_ha_mais_de(self, horas: int, agora: datetime) -> list[Pedido]:
        corte = agora - timedelta(hours=horas)
        linhas = (
            self._sessao.query(PedidoORM)
            .filter(PedidoORM.status.in_(["AGUARDANDO", "EM_ANALISE"]))
            .filter(PedidoORM.criado_em < corte)
            .all()
        )
        return [para_dominio(l) for l in linhas]  # o ORM para aqui`,
  },
];

export const repository: Conceito = {
  slug: "repository",
  titulo: "Repository",
  categoria: "arquitetura",
  resumo:
    "Uma coleção de objetos de domínio que finge não ter banco atrás. O repositório expõe operações na linguagem do negócio — 'pedidos pendentes há mais de uma hora' — e é o único lugar que sabe como isso vira consulta.",
  tags: ["ddd", "persistencia", "fronteira", "dominio", "teste"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2003", ano: 2003, precisao: "aproximada" },
    fonte:
      "Eric Evans, 'Domain-Driven Design', 2003; também catalogado por Martin Fowler em 'Patterns of Enterprise Application Architecture', 2002",
    precursor:
      "A ideia de uma coleção em memória que esconde a persistência já aparecia no mapeamento objeto-relacional dos anos 1990, antes de ganhar o nome de Repository.",
  },
  ondeAparece: [
    {
      onde: "JpaRepository do Spring Data",
      explicacao:
        "Você declara a interface e o framework gera a implementação — o padrão virou infraestrutura de framework.",
    },
    {
      onde: "Repository do TypeORM",
      explicacao:
        "A classe tem o nome do padrão e o papel dele: mediar entre o objeto e a tabela.",
    },
    {
      onde: "O Manager do Django",
      explicacao:
        "`Pedido.objects` é o ponto único de consulta, e `Manager` customizado é onde os filtros de negócio se concentram.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Metodo com nome de negocio, retorno de dominio.
const pendentes = await pedidos.pendentesHaMaisDe(1, agora);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma interface e uma implementação por agregado",
      "Consultas de tela não cabem bem, e forçá-las distorce a interface",
      "O acesso ao banco fica escondido — um N+1 parece código limpo",
    ],
    naoValeSe:
      "é CRUD honesto. O repositório vira repasse método a método, sem esconder nada.",
  },
  relacionados: ["hexagonal", "dip", "facade", "adapter"],
  problema: [
    "Quando a consulta ao banco é montada dentro do serviço, a regra de negócio embutida nela — o que conta como 'pendente', o que conta como 'ativo' — se espalha por todo lugar que precisa da mesma resposta.",
    "E o domínio passa a conhecer o ORM: trocar de banco, ou testar sem banco, deixa de ser possível sem tocar em quase tudo.",
  ],
  solucao: [
    "Declarar, no domínio, uma interface que fala a linguagem do negócio e devolve objetos de domínio — sem qualquer tipo de infraestrutura na assinatura.",
    "Implementá-la na camada de infraestrutura, onde o conhecimento sobre tabelas, SQL e ORM fica confinado a uma classe.",
  ],
  quandoUsar: [
    "Quando existe um modelo de domínio de verdade, com regras próprias, e não apenas CRUD sobre tabelas.",
    "Quando a mesma pergunta de negócio é feita em vários lugares e precisa de uma definição só.",
    "Quando testar a regra sem subir banco é um objetivo real.",
  ],
  quandoEvitar: [
    "Em CRUD honesto, onde o repositório vira um repasse de método por método sem esconder nada.",
    "Quando a equipe aceita o ORM como parte do domínio — aí o Active Record é mais simples e mais franco.",
    "Para consultas de relatório, que pedem projeção e não agregado; forçá-las no repositório distorce os dois.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O domínio declara uma interface na linguagem dele — `pendentesHaMaisDe(1h)` — e a infraestrutura implementa. Nenhum tipo do ORM atravessa essa fronteira. O ganho não é 'trocar de banco um dia': é a regra de negócio ter um lugar só e o teste rodar sem container.",
    },
    {
      tipo: "analogia",
      emoji: "📚",
      titulo: "O bibliotecário",
      texto:
        "Você pede 'os livros de ficção científica publicados antes de 1970'. Não pede a estante 4, prateleira B. O bibliotecário sabe onde as coisas estão e devolve livros — não coordenadas de prateleira. Se a biblioteca for reorganizada amanhã, o seu pedido continua igual. E se ele te entregasse um mapa da estante em vez do livro, você teria ganhado um intermediário sem ganhar independência nenhuma.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "A regra que mora na consulta",
      resumo: [
        "Toda consulta com filtro carrega uma decisão de negócio. `status IN ('AGUARDANDO','EM_ANALISE') AND criado_em < agora - 1h` não é técnica: é a definição de 'pedido pendente' que alguém tomou.",
        "Quando essa condição é escrita no serviço, ela é copiada para o próximo serviço que precisa da mesma resposta — e um dia três cópias são atualizadas e a quarta não.",
      ],
      extensao: [
        "O repositório dá um nome a essa decisão. `pendentesHaMaisDe(1, agora)` é um lugar só onde a definição vive, e a próxima pessoa que precisar da mesma lista não vai reinventar o filtro — vai encontrar o método. Isso é mais valioso, no dia a dia, do que a independência de banco que costuma ser usada para justificar o padrão.",
        "A segunda consequência é o teste. Se o serviço depende de uma interface, o teste injeta uma implementação em memória e roda em milissegundos, sem container, sem migração, sem estado sujo entre casos. É a mesma inversão do **DIP** e a mesma fronteira que a **Arquitetura Hexagonal** desenha — Repository é uma porta, no vocabulário dela.",
        "Vale ser honesto sobre o argumento de trocar de banco: quase ninguém troca. Ele aparece em toda justificativa e raramente se realiza. Os benefícios que **de fato** se realizam são o nome único para a regra, o teste rápido, e a capacidade de mudar o *como* (adicionar cache, trocar a consulta por uma view materializada, particionar) sem tocar em quem chama.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "dominio",
          label: "Domínio",
          nota: "não conhece banco, ORM nem SQL",
          filhos: [
            { id: "pedido", label: "Pedido", nota: "objeto com as regras" },
            {
              id: "interface",
              label: "PedidosRepositorio (interface)",
              nota: "fala a linguagem do negócio — onde a fronteira é declarada",
              destaque: true,
            },
          ],
        },
        {
          id: "infra",
          label: "Infraestrutura",
          nota: "a única camada que sabe que existe banco",
          filhos: [
            {
              id: "pg",
              label: "PedidosNoPostgres",
              nota: "traduz linha ↔ objeto de domínio",
              destaque: true,
            },
            {
              id: "memoria",
              label: "PedidosEmMemoria",
              nota: "mesma interface, para teste",
              opcional: true,
            },
          ],
        },
      ],
      legenda:
        "A seta de dependência aponta da infraestrutura para o domínio, nunca o contrário. É por isso que o teste pode trocar a implementação sem que o domínio perceba.",
    },
    {
      tipo: "secao",
      id: "granularidade",
      titulo: "Um repositório por agregado, não por tabela",
      resumo: [
        "O erro mais comum de granularidade é criar um repositório para cada tabela. Isso reproduz o esquema do banco dentro do domínio — exatamente o que o padrão existia para evitar.",
        "O escopo certo é o agregado: a unidade que é salva e carregada inteira, com suas invariantes.",
      ],
      extensao: [
        "Um `Pedido` com seus `ItemDePedido` é um agregado: não faz sentido carregar um item solto e alterá-lo sem passar pelo pedido, porque a regra 'o total do pedido é a soma dos itens' só pode ser garantida com os dois juntos. Então existe `PedidosRepositorio`, e não existe `ItensDePedidoRepositorio`.",
        "A pergunta prática que resolve quase todos os casos: **quem é dono da invariante?** Se salvar A sozinho pode deixar B inconsistente, A e B são um agregado só, e há um repositório para o conjunto.",
        "Há uma exceção legítima e frequente: **consultas de leitura para tela**. Uma lista com filtros, ordenação e paginação, juntando cinco tabelas, não quer agregados — quer uma projeção achatada. Forçar isso no repositório de domínio produz um método com dez parâmetros e um objeto que não é o do domínio. O caminho honesto ali é uma consulta de leitura separada, que é exatamente o que **CQRS** propõe.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "A definição de 'cliente ativo' que divergiu",
          cenario:
            "Três serviços precisavam listar clientes ativos. Cada um escreveu o próprio filtro. Quando a regra mudou para excluir clientes em inadimplência, dois foram atualizados e o de cobrança não — e passou a cobrar quem já tinha sido excluído.",
          aplicacao:
            "`ClientesRepositorio.ativos()` passa a ser o único lugar que define 'ativo'. Mudar a regra é mudar um método.",
          tradeoff:
            "Nem toda variação cabe num método só, e a tentação seguinte é adicionar parâmetros até ele virar um construtor de consulta. Manter poucos métodos com nomes de negócio exige disciplina contínua.",
        },
        {
          titulo: "A suíte que dependia de container",
          cenario:
            "Os testes de regra de negócio subiam Postgres em Docker, aplicavam migrações e limpavam tabelas entre casos. A suíte levava sete minutos e falhava de forma intermitente quando dois casos disputavam a mesma linha.",
          aplicacao:
            "Com a regra dependendo da interface, os testes de domínio passaram a usar uma implementação em memória. Só os testes do próprio repositório continuam tocando o banco.",
          tradeoff:
            "A implementação em memória pode divergir da real — ela não valida constraint, não tem transação de verdade e ordena diferente. Isso exige um conjunto de testes de contrato rodando contra as duas.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O repositório que só repassa o ORM",
      comoSeParece:
        "A classe tem o nome do padrão, mas os métodos aceitam e devolvem os tipos do ORM — e há um `get raw()` para quando isso não bastar. Ganhou-se uma camada de indireção sem ganhar nenhuma fronteira.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "Ao trocar o ORM",
          efeito:
            "Como os tipos dele estão nas assinaturas públicas, a migração toca todos os chamadores — exatamente o que o repositório prometia evitar.",
        },
        {
          quando: "No teste",
          efeito:
            "Simular o repositório exige construir objetos do ORM, o que é quase tão trabalhoso quanto usar o banco de verdade.",
        },
        {
          quando: "Ao mudar a regra",
          efeito:
            "A condição de negócio continua espalhada por quem monta o `where`, então a mudança precisa ser caçada em todos os pontos de chamada.",
        },
      ],
      correcao:
        "A fronteira é a assinatura, não o nome da classe. Método com nome de negócio, parâmetros primitivos ou de domínio, retorno de domínio — e nenhum escape hatch para o objeto cru. Se traduzir tudo parecer caro demais, talvez o caso seja CRUD e o padrão não se pague ali.",
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Um repositório por tabela",
          texto:
            "Reproduzir o esquema do banco dentro do domínio devolve ao código exatamente o acoplamento que o padrão existia para remover. O escopo é o agregado — quem é dono da invariante —, não a tabela.",
        },
        {
          titulo: "Método genérico de consulta",
          texto:
            "Um `buscar(criterio)` que aceita qualquer condição transforma o repositório num construtor de consultas com outro nome. A regra volta a morar em quem chama, e a fronteira existe só no diagrama.",
        },
        {
          titulo: "Vazar o tipo do ORM",
          texto:
            "Entrada, saída **e erro** precisam ser do domínio. Um método que devolve a entidade do ORM, ou que deixa escapar a exceção do driver, mantém o acoplamento intacto sob uma camada a mais.",
        },
        {
          titulo: "Implementação em memória que mente",
          texto:
            "A versão de teste não valida constraint, não tem transação e ordena diferente do banco. Sem um conjunto de testes de contrato rodando contra as duas implementações, a suíte fica verde enquanto a produção quebra.",
        },
        {
          titulo: "Forçar relatório no repositório de domínio",
          texto:
            "Listagem com filtros, ordenação e junção de cinco tabelas quer projeção, não agregado. Espremer isso no repositório produz métodos com dez parâmetros e objetos que não são os do domínio.",
        },
        {
          titulo: "N+1 escondido pela fronteira",
          texto:
            "A boa notícia do repositório é que ele esconde o acesso; a má é a mesma. Um laço que chama `porId` mil vezes parece código de domínio limpo e é uma consulta por iteração. A fronteira precisa vir acompanhada de observabilidade.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Interface no domínio, implementação na infra",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando há modelo de domínio com regras próprias, não só CRUD.",
        "Quando a mesma pergunta de negócio aparece em vários lugares.",
        "Quando testar a regra sem subir banco é objetivo real.",
      ],
      evitar: [
        "Em CRUD honesto, onde o repositório vira repasse método a método.",
        "Para relatórios e listagens — ali cabe consulta de leitura separada.",
        "Quando a equipe já aceita o ORM como parte do domínio.",
      ],
    },
  ],
};
