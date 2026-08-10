import type { ItemPlanejado, Novidade } from "@/shared/types/novidade";

/**
 * O que está planejado e ainda não saiu — aparece como "A seguir" na página
 * de novidades. Plano detalhado em PLANEJAMENTO-PRODUTOS.md. Quando uma
 * feature for entregue, remova daqui e registre na entrega.
 */
export const A_SEGUIR: ItemPlanejado[] = [
  {
    id: "mais-duelos",
    titulo: "Mais comparações",
    descricao:
      "O comparador nasceu com sete duelos. A lista cresce conforme as dúvidas aparecem — Command × Memento e Builder × Abstract Factory são as próximas da fila.",
  },
  {
    id: "quiz-modos",
    titulo: "Quiz com mais formatos",
    descricao:
      "Hoje toda pergunta é 'de qual padrão é esta armadilha?'. Cabem outros: identificar o padrão pelo diagrama, ou escolher entre dois candidatos num cenário real.",
  },
  {
    id: "quiz-placar",
    titulo: "Histórico do quiz",
    descricao:
      "Guardar o desempenho por assunto pra mostrar onde você erra mais — e sugerir o próximo quiz a partir disso, em vez de sortear no escuro.",
  },
  {
    id: "testes-ui",
    titulo: "Testes de interface",
    descricao:
      "Os 427 testes cobrem regras, conteúdo e cálculos — tudo que é função pura. Os componentes ainda são conferidos no olho; falta uma rede pra eles também.",
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
          "Ícone próprio do DevAtlas no lugar do padrão do Next, e a imagem de compartilhamento passou a usar as cores da marca.",
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
