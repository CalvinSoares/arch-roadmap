import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// SEM Unit of Work: cada repositorio grava sozinho, na hora.
await pedidos.salvar(pedido);   // grava e commita
await estoque.baixar(itens);    // grava e commita
// Se ESTA linha falhar, o pedido ja foi salvo. Estado meio-aplicado.

// COM Unit of Work: as mudancas sao ACUMULADAS e vao juntas.
const uow = new UnitOfWork();
uow.registrar(pedido);          // so marca "sujo", nao grava
uow.registrar(estoqueBaixado);  // idem
await uow.commit();             // UMA transacao: ou tudo, ou nada
// Falhou no meio? rollback. Nada foi aplicado. Sem meio-termo.

// O UoW rastreia o que foi criado, alterado e removido durante a
// operacao, e traduz isso em um unico commit atomico no fim.`,
  },
];

export const unitOfWork: Conceito = {
  slug: "unit-of-work",
  titulo: "Unit of Work",
  categoria: "arquitetura",
  resumo:
    "Uma operação de negócio quase nunca é uma escrita só: salva o pedido, baixa o estoque, registra o log. O Unit of Work acumula todas essas mudanças durante a operação e as confirma juntas, numa transação única — ou tudo, ou nada. Ele tira de cada repositório a decisão de quando gravar e a centraliza num commit atômico, evitando o estado meio-aplicado.",
  tags: ["ddd", "transacao", "persistencia", "atomicidade", "repository"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "2002", ano: 2002, precisao: "aproximada" },
    fonte:
      "Martin Fowler, 'Patterns of Enterprise Application Architecture', 2002 — catalogou o Unit of Work como padrão de persistência",
    precursor:
      "Acumular mudanças e confirmá-las juntas é a própria transação de banco levada para a camada de objetos, anterior ao nome do padrão.",
  },
  ondeAparece: [
    {
      onde: "SaveChanges() do Entity Framework",
      explicacao:
        "O EF rastreia as mudanças nos objetos e grava todas numa transação quando você chama SaveChanges — um Unit of Work embutido.",
    },
    {
      onde: "a session do Hibernate / JPA",
      explicacao:
        "A sessão acumula as alterações dos objetos gerenciados e as sincroniza com o banco no flush, dentro de uma transação.",
    },
    {
      onde: "o commit() do repositório",
      explicacao:
        "Um repositório que junta várias operações e expõe um commit único está implementando um Unit of Work à mão.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Uma transação rastreia todas as mudanças.
uow.add(pedido); await uow.commit();`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Rastrear o que mudou exige um mecanismo de tracking, com seu próprio custo e casos de borda",
      "Segurar as mudanças até o commit alonga a transação, aumentando a janela de contenção no banco",
    ],
    naoValeSe:
      "cada operação já é uma escrita atômica independente — sem várias mudanças que precisam ir juntas, o Unit of Work não tem o que agrupar.",
  },
  relacionados: ["repository", "niveis-de-isolamento", "outbox"],
  problema: [
    "Uma operação de negócio toca vários objetos: cria um pedido, baixa o estoque, credita pontos de fidelidade. Se cada repositório grava na hora, uma falha no meio deixa o sistema num estado meio-aplicado — o pedido existe, mas o estoque não baixou.",
    "Espalhar `commit` por cada repositório também impede controlar a transação de fora: quem chama não consegue dizer 'faça tudo isto junto ou nada', porque as gravações já aconteceram uma a uma pelo caminho.",
  ],
  solucao: [
    "Acumular as mudanças (criações, alterações, remoções) durante a operação, sem gravar, e confirmá-las todas de uma vez num commit único. Ou a transação inteira passa, ou nenhuma parte é aplicada.",
    "Centralizar a fronteira transacional no Unit of Work: os repositórios registram o que mudou, e um único ponto decide quando confirmar, mantendo a atomicidade da operação de negócio inteira.",
  ],
  quandoUsar: [
    "Quando uma operação de negócio altera vários objetos que precisam ser salvos juntos.",
    "Para dar a quem orquestra a operação o controle da fronteira transacional.",
    "Junto com repositórios, tirando deles a decisão de quando gravar.",
  ],
  quandoEvitar: [
    "Quando cada operação é uma escrita atômica única e independente.",
    "Quando o ORM ou o framework já oferece o mesmo agrupamento e reinventá-lo só duplica.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "O Unit of Work acumula todas as mudanças de uma operação de negócio e as confirma juntas, num commit atômico: ou tudo, ou nada. Ele tira de cada repositório a decisão de quando gravar e a centraliza numa fronteira transacional única, evitando o estado meio-aplicado em que o pedido foi salvo mas o estoque não baixou. Na maioria dos ORMs modernos, ele já existe embutido — a session do Hibernate, o SaveChanges do EF.",
    },
    {
      tipo: "analogia",
      emoji: "🛒",
      titulo: "O carrinho antes do caixa",
      texto:
        "No supermercado, você não paga item por item enquanto anda pelos corredores — coloca tudo no carrinho e paga uma vez, no caixa. Se desistir no meio, devolve o carrinho e nada foi cobrado. O Unit of Work é o carrinho: as mudanças vão sendo acumuladas enquanto a operação acontece, e só no 'caixa' (o commit) tudo é cobrado de uma vez. Pagar item a item pelos corredores seria gravar a cada passo — e não teria como desistir depois de já ter pago metade.",
    },
    {
      tipo: "secao",
      id: "fronteira-transacional",
      titulo: "Quem decide quando gravar",
      resumo: [
        "Sem Unit of Work, cada repositório grava quando é chamado, e a fronteira da transação fica implícita e espalhada. Com ele, os repositórios só registram o que mudou; a decisão de confirmar vira uma só, no fim da operação.",
        "Essa centralização é o valor real: quem orquestra a operação de negócio passa a controlar a atomicidade dela inteira. 'Salvar pedido e baixar estoque' vira uma unidade — as duas gravações vivem ou morrem juntas.",
      ],
      extensao: [
        "O Unit of Work anda de mãos dadas com o **Repository**: o repositório é a coleção-como-se-estivesse-em-memória, e o Unit of Work é quem sincroniza essa 'memória' com o banco de uma vez. Por isso, na maioria dos ORMs, eles vêm juntos e escondidos — a `session` do Hibernate/JPA e o `DbContext` do Entity Framework são Units of Work que rastreiam objetos sujos e gravam tudo no `flush`/`SaveChanges`. Muitas vezes o padrão certo é usar o que o ORM já dá, não reimplementá-lo.",
        "Há um limite que o Unit of Work não cruza: ele garante atomicidade **dentro de um banco**, via transação. Quando a operação precisa mudar o banco **e** publicar um evento, ou tocar dois bancos, a transação local não abrange o segundo destino — e aí o padrão certo passa a ser o **Outbox** (gravar o evento na mesma transação e despachá-lo depois) ou uma **saga** (passos com compensação). O Unit of Work resolve o 'tudo ou nada' de uma fronteira transacional; além dela, a consistência vira eventual.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O pedido salvo sem baixar o estoque",
          cenario:
            "Uma finalização de compra salvava o pedido e, em seguida, baixava o estoque em chamadas separadas, cada uma com seu commit. Quando a baixa de estoque falhava, o pedido já estava gravado — vendido sem reservar o produto.",
          aplicacao:
            "As duas gravações passaram a acontecer sob um Unit of Work: registradas durante a operação e confirmadas num commit único. Uma falha na baixa de estoque reverte o pedido junto.",
          tradeoff:
            "A transação passou a abranger as duas escritas, o que a torna um pouco mais longa e disputada. Em troca, o estado meio-aplicado — vendido sem estoque — deixou de ser possível.",
        },
        {
          titulo: "O UoW reinventado por cima do ORM",
          cenario:
            "Um time construiu um Unit of Work manual completo, com rastreamento próprio de objetos sujos, sobre um ORM que já fazia exatamente isso na sua session. O código de tracking virou fonte de bugs sutis.",
          aplicacao:
            "O Unit of Work manual foi removido e a operação passou a usar a transação e o flush do próprio ORM, que já implementava o padrão de forma testada.",
          tradeoff:
            "Perdeu-se o controle fino que o tracking manual dava em casos raros. Em troca, sumiram os bugs de sincronização e o código ficou muito menor, apoiado no que o ORM já garantia.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Cada repositório commitando sozinho",
          texto:
            "Se os repositórios gravam na hora, não há fronteira transacional para a operação de negócio: uma falha no meio deixa parte aplicada. O commit tem que ser único, no fim, controlado pelo Unit of Work.",
        },
        {
          titulo: "Segurar a transação por tempo demais",
          texto:
            "Acumular mudanças e só confirmar lá na frente alonga a transação. Se, no meio, a operação chama um serviço externo lento, os locks ficam presos esperando — a transação deve conter só o trabalho de banco e ser curta.",
        },
        {
          titulo: "Reinventar o que o ORM já faz",
          texto:
            "A session do Hibernate e o DbContext do EF já são Units of Work testados. Construir um do zero por cima deles costuma duplicar tracking e introduzir bugs de sincronização — vale usar o que o framework oferece.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Do commit por operação ao commit único",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando uma operação altera vários objetos que precisam ser salvos juntos.",
        "Para dar a quem orquestra o controle da fronteira transacional.",
        "Junto com repositórios, tirando deles a decisão de quando gravar.",
      ],
      evitar: [
        "Quando cada operação é uma escrita atômica única.",
        "Quando o ORM já oferece o mesmo agrupamento.",
      ],
    },
  ],
};
