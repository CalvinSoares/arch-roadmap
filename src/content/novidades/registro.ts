import type { ItemPlanejado, Novidade } from "@/shared/types/novidade";

/**
 * O que está planejado e ainda não saiu — aparece como "A seguir" na página
 * de novidades. Plano detalhado em PLANEJAMENTO.md. Quando uma feature for
 * entregue, remova daqui e registre na entrega.
 */
export const A_SEGUIR: ItemPlanejado[] = [
  {
    id: "mais-duelos",
    titulo: "Mais comparações",
    descricao:
      "O comparador cresce sob demanda. Próximo candidato natural: Event Sourcing × arquitetura orientada a eventos — quando (e se) EDA virar página própria.",
  },
  {
    id: "explique-erro-mais",
    titulo: "Mais perguntas de explique o erro",
    descricao:
      "Segurança já entrou no formato. Vale expandir ainda para dados e incidentes de produção — sempre à mão, nunca gerado.",
  },
];

/**
 * Histórico de entregas, da mais recente para a mais antiga.
 *
 * Ao publicar um conceito ou roadmap novo, adicione o slug em `conceitos` /
 * `roadmaps` da entrada mais recente: o badge "novo" no catálogo aparece
 * sozinho e some quando a entrega envelhece.
 */
export const NOVIDADES: Novidade[] = [
  {
    versao: "0.10.0",
    data: "2026-08-11",
    titulo: "Prática: código errado, entrevista e lab de falha",
    resumo:
      "O plano de profundidade fecha com superfícies onde se erra de propósito: trechos tortos para diagnosticar, entrevista de código ao lado do system design, lab de falha com baseline e proteções, e postmortems jogáveis.",
    conceitos: ["encapsulamento", "polimorfismo"],
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "Fundamentos OOP na trilha de Padrões: Encapsulamento e Polimorfismo viram verbetes jogáveis (antes eram só checkpoints de texto).",
      },
      {
        tipo: "novo",
        texto:
          "Código errado (/clinica): trechos reais com o conceito mal aplicado — você escolhe qual, vê o que quebra e a correção.",
      },
      {
        tipo: "novo",
        texto:
          "Construtor/entrevista ganha aba de código (explique o erro + duelos cronometrados) ao lado do system design.",
      },
      {
        tipo: "novo",
        texto:
          "Lab de falha nos conceitos de Cache e Timeout: injeta a falha, liga proteções e compara o delta com a baseline.",
      },
      {
        tipo: "melhoria",
        texto:
          "Postmortems jogáveis, escala de latência reescrita em torno de “quantas vezes cabe?”, e Novidades mais legível no mobile.",
      },
    ],
  },
  {
    versao: "0.9.0",
    data: "2026-08-11",
    titulo: "Segurança de aplicação: catálogo, Construtor e trilhas",
    resumo:
      "Família nova no mesmo espírito da resiliência: autenticação, JWT, OAuth, MFA, autorização, allowlist e gestão de segredos — ligados ao Backend, ao fluxo do Construtor, a duelos e ao quiz.",
    conceitos: [
      "autenticacao",
      "jwt",
      "oauth2",
      "mfa",
      "autorizacao",
      "allowlist",
      "gestao-de-segredos",
    ],
    mudancas: [
      {
        tipo: "novo",
        texto:
          "Categoria Segurança com sete conceitos: sessão/httpOnly, JWT, OAuth2, MFA, RBAC/guards, allowlist e gestão de segredos.",
      },
      {
        tipo: "conteudo",
        texto:
          "Roadmap Backend: auth e segurança deixam de ser só links OWASP — nós com conceito, pré-requisitos e essenciais. Frontend ganha cookie httpOnly e allowlist CORS.",
      },
      {
        tipo: "novo",
        texto:
          "Construtor: padrões e techs (IdP, WAF), regras (API aberta, login sem rate limit, roles sem identidade), simulador narrando auth/quota, três desafios Quebre isto.",
      },
      {
        tipo: "conteudo",
        texto:
          "Quatro duelos (auth×JWT, auth×authz, auth×OAuth, allowlist×rate limit) e cinco explique-o-erro de segurança.",
      },
    ],
  },
  {
    versao: "0.8.0",
    data: "2026-08-11",
    titulo: "Explique o erro, uma linha em tudo, duelos e testes de UI",
    resumo:
      "O último ciclo do A seguir: quiz com código quebrado, emUmaLinha em 100% do catálogo, três duelos novos e a suíte de componentes com Testing Library.",
    mudancas: [
      {
        tipo: "novo",
        texto:
          "Quiz: formato Explique o erro — oito perguntas à mão (SOLID, CQS, Deméter, composição). O código aparece no card; a resposta é o princípio violado.",
      },
      {
        tipo: "conteudo",
        texto:
          "emUmaLinha em todo o catálogo — o snippet mínimo deixou de ser privilégio de dezesseis conceitos. Spec impede regressão.",
      },
      {
        tipo: "conteudo",
        texto:
          "Três duelos novos: CQRS × Event Sourcing, API Gateway × BFF, Repository × Unit of Work.",
      },
      {
        tipo: "melhoria",
        texto:
          "Testes de UI com Vitest + happy-dom + Testing Library. O Quiz tem smoke test de resposta e de estado vazio; a suíte unitária segue em node.",
      },
    ],
  },
  {
    versao: "0.7.0",
    data: "2026-08-11",
    titulo: "Cache, grafo nas trilhas e quiz que já era inteligente",
    resumo:
      "Fecha a inconsistência Redis↔catálogo, declara pré-requisitos reais nas roadmaps e registra o que o quiz já fazia em silêncio: cinco formatos e placar de desempenho.",
    conceitos: ["cache"],
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "Conceito novo: Cache e invalidação — cache-aside, TTL, stampede e a diferença entre Redis, CDN, réplica e índice. Redis, Memcached e CDN no Construtor passam a apontar para ele; o nó do roadmap de Backend também.",
      },
      {
        tipo: "novo",
        texto:
          "Roadmaps como grafo: itens declaram `prerequisitos` e `essencial`. Na trilha de resiliência as curvas ligam Timeout → Retry → Idempotência → Circuit Breaker e a cadeia de entrega; o painel mostra 'O que preciso antes' e o toggle 'Só o essencial' enxuga a trilha.",
      },
      {
        tipo: "melhoria",
        texto:
          "Quiz: cinco formatos (armadilha, onde aparece, duelo, jeito errado, incidente) e placar de desempenho por assunto já estavam no ar — saíram do 'A seguir' e entram no histórico. Novo duelo: Command × Memento.",
      },
      {
        tipo: "melhoria",
        texto:
          "Profundidade fechada de verdade: ondeAparece e custo em 100% do catálogo; os testes de fila viraram regressão.",
      },
    ],
  },
  {
    versao: "0.6.0",
    data: "2026-08-10",
    titulo: "O catálogo aprende a sobreviver",
    resumo:
      "Faltava no DevMappa a família inteira que o dia a dia de produção exige: o catálogo ensinava a construir, não a continuar de pé quando a dependência cai. Entram seis conceitos de resiliência e uma trilha nova — e todo padrão GoF agora mostra onde você já o usa sem saber.",
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "Seis conceitos novos de resiliência: Timeout, Retry com backoff e jitter, Circuit Breaker, Bulkhead, Rate limiting e Dead Letter Queue — cada um com as armadilhas de configuração que definem a família (o retry sem jitter que sincroniza a manada, o disjuntor que abre por ruído estatístico).",
      },
      {
        tipo: "conteudo",
        texto:
          "Trilha nova: Sistemas que aguentam produção. Ela liga os seis conceitos novos a Idempotência, Saga, Webhooks e Event Sourcing, que já estavam no catálogo esperando esse contexto.",
      },
      {
        tipo: "novo",
        texto:
          "Todo padrão GoF ganhou a seção 'Onde isto aparece de verdade'. O objeto Proxy do JS é o padrão virado palavra-chave; o objeto que os plugins do Babel exportam se chama literalmente `visitor`; as strategies do Passport também.",
      },
      {
        tipo: "novo",
        texto:
          "Conceitos agora têm data de nascimento — e ela conta a verdade: os 23 GoF são de 1994 por convenção, porque o livro catalogou o que já existia. O Observer já estava no MVC do Smalltalk em 1979, e o Iterator no CLU da Barbara Liskov em 1975.",
      },
      {
        tipo: "melhoria",
        texto:
          "Categoria nova no catálogo (Resiliência) com filtro próprio, em vez de empurrar os seis conceitos para dentro de Arquitetura.",
      },
      {
        tipo: "conteudo",
        texto:
          "Três conceitos que fechavam ciclos abertos: Repository (a fronteira entre domínio e persistência), Transactional Outbox (sem ele a Saga perde evento e trava no meio) e Garantias de entrega — que explica por que 'exactly-once' entre sistemas distintos é impossível, e o que os brokers realmente vendem com esse nome.",
      },
      {
        tipo: "novo",
        texto:
          "O Construtor agora diz por que NÃO sugeriu algo. Cada sugestão carrega a própria condição, então as duas respostas saem da mesma fonte: 'Dead Letter Queue não foi sugerido porque não há fila na pilha' é diferente de 'porque a fila já tem uma' — e o painel distingue as duas.",
      },
      {
        tipo: "novo",
        texto:
          "Comparar arquiteturas: duas pilhas lado a lado, com o diff das cinco métricas, das peças e dos alertas que a variante resolve ou introduz. Em complexidade e custo o sinal é invertido, porque menor é melhor — e o resumo se recusa a fingir que existe lado certo.",
      },
      {
        tipo: "melhoria",
        texto:
          "O simulador passou a reagir às peças de resiliência. A mesma dependência quebrada custa 30 segundos sem timeout, 2 segundos com prazo, 6 com retry, e microssegundos com o disjuntor aberto — quatro tempos separados por ordens de grandeza, que é a lição que texto não consegue dar.",
      },
      {
        tipo: "novo",
        texto:
          "Os conceitos de resiliência entraram no Construtor: Timeout, Retry, Circuit Breaker, Bulkhead, Outbox e Dead Letter Queue agora são peças arrastáveis, com nove regras novas. Arraste Retry sozinho e o motor avisa que sem prazo não existe falha para ele reagir — some o alerta ao adicionar Timeout, e a sinergia aparece no lugar.",
      },
      {
        tipo: "correcao",
        texto:
          "As regras novas revelaram que os modelos curados estavam incompletos: cinco tinham fila sem Dead Letter Queue e dois tinham Saga sem Outbox. A barra que exige 'template nasce sem alerta' pegou — e o conteúdo foi corrigido, não a regra.",
      },
      {
        tipo: "conteudo",
        texto:
          "Dois desafios novos no Quebre isto, que era a família que faltava: o retry adicionado sozinho (que esgota o pool e cobra em duplicidade) e a Saga com fila sem rede de segurança (poison message de um lado, evento perdido do outro).",
      },
      {
        tipo: "novo",
        texto:
          "Escala de latência: vinte pontos numa régua só, do ciclo de CPU à travessia São Paulo ↔ Singapura. O botão de 'escala real' é a lição — em logarítmica os sete pontos sub-milissegundo se espalham pela tela; em linear, cinco deles caem no mesmo pixel. RAM contra ida e volta de região dá 1,2 milhões de vezes.",
      },
      {
        tipo: "correcao",
        texto:
          "O simulador do Construtor repetia a latência de cada passo em dois lugares — no argumento e na narração ('…(~15ms)', 15) — sem nada garantindo que continuassem iguais. Eram 23 menções, e a interface já mostrava o número na mesma tela. A narração agora explica só o que acontece, e os valores vivem numa tabela única, que também alimenta a escala.",
      },
      {
        tipo: "novo",
        texto:
          "Laboratório de concorrência: duas transações lado a lado, você escolhe o nível de isolamento e vê a anomalia acontecer passo a passo. No roteiro de lost update, o saldo final dá 50 onde deveria dar 20 — e nenhuma das duas transações recebe erro. Em SERIALIZABLE, o banco aborta uma com 40001 em vez de perder o débito.",
      },
      {
        tipo: "conteudo",
        texto:
          "Categoria nova: Dados. Estreia com níveis de isolamento (as cinco anomalias, e por que subir o nível raramente é a saída) e lock otimista × pessimista — mais uma seção na trilha de resiliência ligando os dois à condição de corrida.",
      },
      {
        tipo: "novo",
        texto:
          "Cinco conceitos ganharam 'do cheiro ao padrão': a refatoração passo a passo, com o motivo de cada passo e o saldo no fim — o que se ganhou e o que se pagou. No Observer, o segundo passo existe só porque o primeiro cria um vazamento de memória.",
      },
      {
        tipo: "novo",
        texto:
          "Quebre isto: o Construtor ao contrário. Você recebe uma arquitetura pronta e aponta o que está errado — e quem corrige é o mesmo motor de regras que analisa o que você monta, então o gabarito nunca fica desatualizado.",
      },
      {
        tipo: "novo",
        texto:
          "Postmortems anotados: quatro incidentes públicos (AWS S3 2017, Cloudflare 2019, GitLab 2017, Knight Capital 2012) ligados aos conceitos que eles provam. Em todos, a causa raiz não é o erro que disparou — é o sistema que permitiu que ele tivesse aquele tamanho. E cada conceito agora mostra onde ele já custou caro.",
      },
      {
        tipo: "novo",
        texto:
          "Conceitos ganharam 'o padrão em uma linha' (o snippet mínimo, sem cerimônia) e o custo declarado: quantas indireções ele adiciona, o que fica mais difícil depois, e quando ele não vale a pena. O catálogo só mostrava o benefício, o que é propaganda.",
      },
      {
        tipo: "conteudo",
        texto:
          "Dois duelos novos no comparador: Factory Method × Abstract Factory (a confusão nº1 do GoF — e a resposta é que um não substitui o outro, a Abstract Factory costuma ser implementada com Factory Methods) e CQS × CQRS, onde uma letra a mais custa um sistema distribuído.",
      },
      {
        tipo: "correcao",
        texto:
          "O `**negrito**` e o `código` escritos na prosa dos conceitos apareciam como asterisco e crase literais na tela — em 139 trechos, espalhados por 25 arquivos. Agora renderizam de verdade, em toda prosa escrita à mão.",
      },
      {
        tipo: "novo",
        texto:
          "Nove conceitos ganharam a seção 'O jeito errado': o padrão mal implementado, com o código, o que quebra e sob qual condição. O Singleton que virou variável global e derruba a suíte de testes, o Observer que vaza porque ninguém desinscreve, a Strategy que continua sendo um switch, a compensação de Saga que não é idempotente e estorna duas vezes.",
      },
    ],
    conceitos: [
      "timeout",
      "repository",
      "outbox",
      "garantias-de-entrega",
      "retry",
      "circuit-breaker",
      "bulkhead",
      "rate-limiting",
      "dead-letter-queue",
    ],
    roadmaps: ["resiliencia"],
  },
  {
    versao: "0.5.1",
    data: "2026-08-10",
    titulo: "Quiz repensado",
    resumo:
      "O quiz ficou mais gostoso de jogar: tudo cabe na tela, dá pra emendar perguntas no Enter, uma chama acende quando você engata acertos — e errar trocando um padrão pelo outro agora leva direto pro duelo dos dois.",
    mudancas: [
      {
        tipo: "melhoria",
        texto:
          "Chega de rolar a página atrás do botão de próxima: as alternativas viraram uma grade compacta e o botão já nasce visível e focado — Enter avança.",
      },
      {
        tipo: "melhoria",
        texto:
          "A rodada virou uma barra de segmentos (verde acertou, vermelho errou) e acertos seguidos acendem uma chama. No fim, os erros viram atalhos de releitura.",
      },
      {
        tipo: "novo",
        texto:
          "Errou trocando Proxy por Decorator? O feedback reconhece o duelo e linka a comparação dos dois lado a lado.",
      },
      {
        tipo: "correcao",
        texto:
          "Contraste dos numerinhos da trilha de leitura ajustado pra leitores com baixa visão.",
      },
    ],
  },
  {
    versao: "0.5.0",
    data: "2026-08-10",
    titulo: "Sistemas de verdade: dinheiro, concorrência e onde o código roda",
    resumo:
      "Nove conceitos que aparecem no primeiro sistema que lida com dinheiro ou tráfego de verdade: idempotência, race condition, ledger, webhooks — e uma categoria nova de infra, com Docker, Kubernetes e VPS explicados do chão pra cima.",
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "O lado dos pagamentos: idempotência (com chave e tudo), ledger de partidas dobradas, logs append-only e race conditions — os quatro com exemplos de PIX, saldo e carteira.",
      },
      {
        tipo: "conteudo",
        texto:
          "Máquina de estados como conceito próprio: a tabela de transições que impede uma cobrança paga de ser cancelada — e webhooks, com o contrato completo de quem recebe (assinatura, duplicata, 200 rápido).",
      },
      {
        tipo: "conteudo",
        texto:
          "Categoria nova no catálogo: Infra. Docker, Kubernetes (com pods, probes e o loop de reconciliação) e VPS — do 'na minha máquina funciona' até o cluster, explicando o que cada camada esconde.",
      },
      {
        tipo: "melhoria",
        texto:
          "Os roadmaps de Backend e Arquitetura ganharam paradas novas ligando esses conceitos — inclusive ganchos que já existiam sem página, como 'Idempotência e retry', agora com verbete completo.",
      },
      {
        tipo: "novo",
        texto:
          "O Construtor aprendeu as peças novas: idempotência, ledger, máquina de estados, append-only e webhooks viraram padrões arrastáveis, com sete regras novas de aviso e sinergia — e um sétimo modelo pronto, a Carteira digital (fintech).",
      },
    ],
    conceitos: [
      "idempotencia",
      "race-condition",
      "maquina-de-estados",
      "ledger",
      "append-only",
      "webhooks",
      "docker",
      "kubernetes",
      "vps",
    ],
  },
  {
    versao: "0.4.0",
    data: "2026-08-10",
    titulo: "Estudar, comparar e levar o projeto pra reunião",
    resumo:
      "Quatro coisas novas que usam o que você já fazia por aqui: o progresso das trilhas virou modo de estudo com revisão espaçada, os padrões que se confundem ganharam páginas lado a lado, as armadilhas viraram quiz, e o Construtor agora exporta um documento de arquitetura.",
    mudancas: [
      {
        tipo: "novo",
        texto:
          "Modo estudo: continue de onde parou, veja os próximos conceitos da sua trilha e revise o que já estudou em intervalos que crescem a cada acerto.",
      },
      {
        tipo: "novo",
        texto:
          "Comparador: sete duelos clássicos (Proxy × Decorator, State × Strategy, Adapter × Facade e outros) resolvidos critério a critério, com o veredito logo no topo.",
      },
      {
        tipo: "novo",
        texto:
          "Quiz das armadilhas: você lê um erro clássico com o nome do padrão escondido e tenta acertar de quem é. Errar agenda uma revisão.",
      },
      {
        tipo: "novo",
        texto:
          "O quiz tem página própria, e dá pra escolher o assunto: por categoria (criacionais, estruturais…) ou por trilha. Cada conceito também tem o quiz das armadilhas dele no fim da página.",
      },
      {
        tipo: "novo",
        texto:
          "O Construtor exporta o projeto como ADR em Markdown — contexto, decisão, consequências e riscos, com link pra reabrir a montagem.",
      },
      {
        tipo: "melhoria",
        texto:
          "A página de cada conceito passou a mostrar com quais padrões ele costuma ser confundido.",
      },
      {
        tipo: "melhoria",
        texto:
          "Ícone próprio do DevMappa no lugar do padrão do Next, e a imagem de compartilhamento passou a usar as cores da marca.",
      },
    ],
  },
  {
    versao: "0.3.0",
    data: "2026-08-10",
    titulo: "GoF completo, SOLID, três trilhas novas e uma rede de testes",
    resumo:
      "A maior entrega até aqui: o catálogo mais que dobrou (18 conceitos novos, fechando os 23 padrões GoF e o SOLID inteiro), chegaram três roadmaps, e o projeto ganhou 352 testes automatizados — que já encontraram e mataram dois bugs de verdade.",
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "Os 23 padrões GoF agora estão completos: entraram Prototype, Bridge, Composite, Flyweight, Proxy e os 8 comportamentais que faltavam — cada um com casos reais, armadilhas e código.",
      },
      {
        tipo: "conteudo",
        texto:
          "SOLID inteiro como conceitos próprios: SRP, OCP, LSP, ISP e DIP, com a mesma profundidade dos padrões.",
      },
      {
        tipo: "conteudo",
        texto:
          "Três roadmaps novos — Backend, Frontend e Arquitetura de Software — todos linkando os conceitos do catálogo.",
      },
      {
        tipo: "novo",
        texto:
          "Dois jeitos novos de ilustrar: caixas aninhadas (quem embrulha quem) e comparação antes × depois, com alternador no celular.",
      },
      {
        tipo: "novo",
        texto:
          "A página de cada conceito agora mostra em quais trilhas ele aparece — e leva você de volta pro roadmap.",
      },
      {
        tipo: "melhoria",
        texto:
          "O painel do Construtor foi refeito: as abas não somem mais quando você rola, a narração recolhe, e nenhum insight fica escondido atrás de 'ver mais'.",
      },
      {
        tipo: "melhoria",
        texto:
          "352 testes automatizados vigiando as 72 regras do Construtor, o simulador de falhas e a qualidade de cada conceito publicado.",
      },
      {
        tipo: "correcao",
        texto:
          "A barra de complexidade vivia colada no teto em projetos grandes (4 dos 6 modelos marcavam 100) — recalibrada pra voltar a dizer alguma coisa.",
      },
      {
        tipo: "correcao",
        texto:
          "O modelo 'Tempo real' nascia com um alerta indevido de Observer em excesso; contraste e ordem de títulos ajustados pra leitores de tela em todo o site.",
      },
    ],
    conceitos: [
      "prototype",
      "bridge",
      "composite",
      "flyweight",
      "proxy",
      "chain-of-responsibility",
      "command",
      "interpreter",
      "iterator",
      "mediator",
      "memento",
      "template-method",
      "visitor",
      "srp",
      "ocp",
      "lsp",
      "isp",
      "dip",
    ],
    roadmaps: ["backend", "frontend", "arquitetura"],
  },
  {
    versao: "0.2.0",
    data: "2026-08-10",
    titulo: "Os primeiros 15 conceitos e o Construtor",
    resumo:
      "Saiu a primeira leva de conteúdo de verdade. São 15 conceitos escritos do zero, o roadmap de padrões e uma ferramenta pra montar arquitetura arrastando bloco.",
    lancamentoInicial: true,
    mudancas: [
      {
        tipo: "conteudo",
        texto:
          "15 conceitos no ar, entre padrões criacionais, estruturais, comportamentais, princípios e arquitetura.",
      },
      {
        tipo: "conteudo",
        texto:
          "Roadmap de Padrões de Projeto. Dá pra marcar o que já estudou; fica salvo no navegador.",
      },
      {
        tipo: "novo",
        texto:
          "Construtor de Projeto: você arrasta os blocos, liga as camadas e vê o caminho que uma requisição faria.",
      },
      {
        tipo: "novo",
        texto:
          "Demos que dá pra mexer em Observer, Strategy, Adapter e CQRS.",
      },
      { tipo: "novo", texto: "Busca global com Ctrl + K." },
    ],
  },
  {
    versao: "0.1.0",
    data: "2026-08-09",
    titulo: "Primeira versão no ar",
    resumo:
      "Só o esqueleto: as rotas, o tema claro e escuro, e a estrutura pra receber o conteúdo.",
    mudancas: [
      { tipo: "novo", texto: "Rotas, layout e alternância de tema claro/escuro." },
    ],
  },
];
