import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// A reescrita big-bang: parar tudo, reescrever por meses, virar a chave
// num dia. Historicamente, a forma mais confiavel de matar um sistema.

// STRANGLER FIG: um roteador na frente decide, rota a rota, o que ja
// foi migrado (vai ao novo) e o que ainda nao (vai ao legado).
function rotear(req: Request) {
  const migradas = ["/pedidos", "/carrinho"]; // ja reescritas no novo
  if (migradas.some((p) => req.path.startsWith(p))) {
    return encaminhar(req, "http://sistema-novo");   // <- novo
  }
  return encaminhar(req, "http://sistema-legado");    // <- velho, ainda
}

// A cada release, mais uma rota migra: a lista "migradas" cresce,
// o legado encolhe. O usuario nunca ve um big-bang — ve o sistema
// funcionando o tempo todo, enquanto por dentro ele e substituido.
// Quando a ultima rota migrar, o legado e desligado. Sem virada de chave.`,
  },
];

export const stranglerFig: Conceito = {
  slug: "strangler-fig",
  titulo: "Strangler Fig",
  categoria: "arquitetura",
  resumo:
    "A alternativa à reescrita big-bang, que quase sempre fracassa. Em vez de parar tudo e virar a chave num dia, coloca-se um roteador na frente do sistema antigo e migra-se pedaço a pedaço: cada rota reescrita passa a ir ao novo, o legado encolhe, e o usuário nunca vê uma virada de chave. O nome vem da figueira que cresce sobre a árvore hospedeira até substituí-la — e o custo é conviver com os dois sistemas durante a transição.",
  tags: ["arquitetura", "migracao", "legado", "incremental", "refatoracao"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2004", ano: 2004, precisao: "aproximada" },
    fonte:
      "Martin Fowler, 'StranglerFigApplication' (2004), inspirado nas figueiras estranguladoras que crescem sobre uma árvore hospedeira até substituí-la",
    precursor:
      "A estratégia de substituir um sistema aos poucos, por fora, em vez de num big-bang, é tão antiga quanto o medo — justificado — das reescritas totais.",
  },
  ondeAparece: [
    {
      onde: "o proxy que roteia velho × novo",
      explicacao:
        "Um roteador na frente decide, rota a rota, o que já foi migrado (vai ao novo) e o que ainda não (vai ao legado).",
    },
    {
      onde: "migração por rota, não big-bang",
      explicacao:
        "Substituir o sistema antigo pedaço a pedaço, com o novo crescendo em volta dele, até o velho poder ser desligado.",
    },
    {
      onde: "o legado que encolhe até sumir",
      explicacao:
        "O sistema antigo vai perdendo funções para o novo até restar nada — a figueira que estrangulou a árvore hospedeira.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Novo cresce ao redor; legado encolhe.
proxy.rota("/checkout", podeNovo ? novo : legado);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Manter os dois sistemas vivos e o roteador de fronteira durante toda a migração, que pode durar bastante",
      "Dados que os dois lados leem e escrevem exigem sincronização ou dupla escrita enquanto durar a transição",
    ],
    naoValeSe:
      "o sistema é pequeno e a reescrita direta é rápida e de baixo risco — aí conviver com o legado custa mais do que um corte limpo.",
  },
  relacionados: ["anti-corruption-layer", "monolito-modular", "microsservicos"],
  problema: [
    "Um sistema legado precisa ser substituído, e a tentação é reescrever do zero e virar a chave num único grande lançamento. A reescrita big-bang é célebre por fracassar: o novo demora a alcançar o velho, requisitos escondidos aparecem tarde, e o dia da virada concentra todo o risco num ponto.",
    "Enquanto a reescrita corre por meses numa branch paralela, o legado continua mudando, e o novo persegue um alvo em movimento. Não é raro o projeto ser cancelado antes de entregar, com o legado ainda de pé e o esforço perdido.",
  ],
  solucao: [
    "Colocar um roteador (fachada) na frente do legado e migrar incrementalmente: cada funcionalidade reescrita passa a ser servida pelo sistema novo; o resto continua indo ao legado. A migração acontece rota a rota, em produção, sem parar.",
    "Deixar o novo crescer em volta do velho até assumir tudo, e então desligar o legado. Não há dia de virada: há uma sequência de pequenas migrações verificáveis, cada uma reversível se der errado.",
  ],
  quandoUsar: [
    "Ao substituir um sistema legado grande demais para uma reescrita big-bang segura.",
    "Quando o sistema precisa continuar funcionando e evoluindo durante toda a migração.",
    "Quando reduzir o risco em passos pequenos e reversíveis vale mais que a velocidade de um corte único.",
  ],
  quandoEvitar: [
    "Em sistemas pequenos, onde a reescrita direta é rápida e de baixo risco.",
    "Quando manter os dois lados e sincronizar dados custaria mais que um corte limpo.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Strangler Fig substitui um legado sem a reescrita big-bang: um roteador na frente decide, rota a rota, o que já foi migrado (vai ao novo) e o que ainda não (vai ao velho). O novo cresce em volta do antigo até assumir tudo, e então o legado é desligado — sem dia de virada, em passos pequenos e reversíveis. O custo é conviver com os dois sistemas e sincronizar os dados que ambos tocam durante a transição.",
    },
    {
      tipo: "analogia",
      emoji: "🌳",
      titulo: "A figueira que dá nome ao padrão",
      texto:
        "A figueira estranguladora começa como uma muda no alto de uma árvore hospedeira e vai descendo raízes por fora do tronco dela. Aos poucos, essas raízes envolvem a árvore inteira, assumindo o trabalho de sustentar a copa. Quando a hospedeira finalmente morre e apodrece, a figueira já está de pé sozinha, no formato exato da árvore que substituiu — sem que a floresta jamais visse um buraco onde havia uma árvore. A migração Strangler Fig faz isso com software: o novo cresce em volta do velho até poder ficar de pé sem ele.",
    },
    {
      tipo: "secao",
      id: "por-que-nao-big-bang",
      titulo: "Por que não o big-bang",
      resumo: [
        "A reescrita total falha por uma razão estrutural: ela concentra todo o risco num único evento futuro. Durante meses não há entrega, o novo persegue um legado que continua mudando, e requisitos escondidos no velho só aparecem quando já é tarde. O dia da virada é tudo-ou-nada.",
        "O Strangler Fig troca esse evento único por uma sequência de migrações pequenas, cada uma em produção e reversível. Se uma rota migrada dá problema, você a aponta de volta para o legado — o raio de dano é uma funcionalidade, não o sistema inteiro.",
      ],
      extensao: [
        "A peça técnica que viabiliza tudo é a **fachada de roteamento** na frente dos dois sistemas: ela recebe todas as requisições e decide, por rota, quem atende. No começo, tudo vai ao legado; a cada release, mais rotas apontam para o novo; no fim, nada sobra no velho e ele é desligado. Um **API Gateway** costuma ser exatamente esse roteador, o que faz o padrão se encaixar naturalmente em quem já tem um.",
        "O ponto mais espinhoso não é o código, são os **dados**. Enquanto rotas do legado e do novo coexistem, ambos leem e escrevem dados relacionados, e é preciso mantê-los consistentes: por um banco compartilhado temporário, por sincronização, ou por dupla escrita durante a transição. É aqui que entra a **camada anticorrupção** — a fronteira que traduz o modelo do legado para o do sistema novo, para que o novo não nasça já contaminado pelo modelo que está substituindo. Sem cuidar dos dados, o Strangler Fig vira dois sistemas discordando sobre a verdade; com esse cuidado, ele é a forma mais segura conhecida de aposentar um legado.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O monólito legado aposentado sem parar",
          cenario:
            "Uma empresa precisava substituir um monólito de quinze anos, mas o negócio não podia parar e uma reescrita big-bang anterior já havia sido cancelada depois de um ano sem entregar nada.",
          aplicacao:
            "Um roteador foi posto na frente do monólito, e as funcionalidades foram reescritas uma a uma no sistema novo, migrando rota a rota. A cada release, o legado atendia menos; ao fim, foi desligado.",
          tradeoff:
            "A migração durou bem mais que um big-bang teórico, e exigiu manter e sincronizar os dois sistemas o tempo todo. Em troca, o negócio nunca parou, e cada passo era reversível se desse errado.",
        },
        {
          titulo: "A rota migrada que voltou para o legado",
          cenario:
            "Durante a migração, uma funcionalidade reescrita apresentou um bug sutil de cálculo que só apareceu com tráfego real, ameaçando dados de clientes.",
          aplicacao:
            "Como o roteador controlava o destino por rota, aquela funcionalidade foi reapontada para o legado em minutos, enquanto o bug era corrigido no novo, sem afetar o resto da migração.",
          tradeoff:
            "Aquela rota ficou temporariamente no sistema antigo, atrasando um pouco o cronograma. É exatamente o valor do padrão: o problema ficou contido numa funcionalidade e foi revertido, em vez de derrubar uma virada inteira.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Ignorar a sincronização de dados",
          texto:
            "Enquanto legado e novo coexistem, os dois tocam os mesmos dados. Sem sincronização, banco compartilhado temporário ou dupla escrita, os dois sistemas passam a discordar sobre a verdade — o ponto mais espinhoso da migração, e o mais esquecido.",
        },
        {
          titulo: "Deixar a migração parar no meio",
          texto:
            "Conviver com dois sistemas é caro e deveria ser temporário. Sem dono e prazo, a migração estaciona e o roteador vira permanente, com metade no velho e metade no novo — o custo da transição sem o benefício da conclusão.",
        },
        {
          titulo: "Deixar o modelo do legado contaminar o novo",
          texto:
            "Se o sistema novo lê o legado sem uma camada anticorrupção, o modelo torto do velho vaza para o novo, que nasce já com os vícios que deveria eliminar. A tradução na fronteira é o que preserva o modelo limpo.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Rotear por rota, migrar aos poucos",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ao substituir um legado grande demais para um big-bang seguro.",
        "Quando o sistema precisa funcionar e evoluir durante a migração.",
        "Quando reduzir risco em passos reversíveis vale mais que a velocidade.",
      ],
      evitar: [
        "Em sistemas pequenos, onde a reescrita direta é de baixo risco.",
        "Quando manter e sincronizar os dois lados custaria mais que um corte limpo.",
      ],
    },
  ],
};
