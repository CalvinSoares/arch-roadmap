import type { Comparacao } from "@/shared/types/comparacao";

/**
 * Os duelos que os próprios conceitos já travam nas seções de extensão.
 *
 * Só entram pares em que a confusão é real e documentada — 33 conceitos dão
 * 528 combinações possíveis, e quase todas seriam ruído. Crescer por demanda,
 * não por completude.
 */
export const COMPARACOES: Comparacao[] = [
  {
    a: "proxy",
    b: "decorator",
    vereditoRapido:
      "Os dois embrulham um objeto mantendo a interface. O Decorator **acrescenta** comportamento que o cliente pediu; o Proxy **controla** se a chamada chega ao destino, e o cliente costuma nem saber que ele existe.",
    criterios: [
      {
        pergunta: "Qual é a intenção?",
        ladoA: "Controlar o acesso: adiar a criação, cachear, exigir permissão, cruzar a rede.",
        ladoB: "Somar comportamento ao resultado: log, retry, compressão, formatação.",
      },
      {
        pergunta: "Quem monta a pilha?",
        ladoA: "Normalmente ninguém — o proxy é injetado no lugar do real, invisível.",
        ladoB: "O cliente, deliberadamente, escolhendo a ordem das camadas.",
      },
      {
        pergunta: "Quantas camadas?",
        ladoA: "Uma. Empilhar proxies é raro e costuma indicar modelagem confusa.",
        ladoB: "Várias, empilháveis em qualquer ordem — é o ponto do padrão.",
      },
      {
        pergunta: "O resultado muda?",
        ladoA: "Não. Mesma resposta, obtida de forma mais barata ou mais segura.",
        ladoB: "Sim. Cada camada agrega algo visível ao que volta.",
      },
      {
        pergunta: "Quem decide se a chamada acontece?",
        ladoA: "O proxy pode barrar, adiar ou responder do cache sem tocar o real.",
        ladoB: "O decorator sempre delega — interromper não é sua função.",
      },
    ],
    escolhaA:
      "O objeto é caro, sensível ou remoto, e você quer que isso seja invisível para quem chama.",
    escolhaB:
      "As responsabilidades extras são opcionais, combináveis e decididas em tempo de execução.",
    confusaoComum:
      "Como o desenho é idêntico — mesma interface, referência ao interno, delegação —, muita gente escolhe pelo formato. A pergunta que resolve não é 'como está construído?', é 'estou controlando o acesso ou enriquecendo o comportamento?'. Chamar tudo de proxy faz o nome perder o poder de comunicar intenção.",
  },
  {
    a: "strategy",
    b: "template-method",
    vereditoRapido:
      "Ambos isolam a parte que varia de um algoritmo. Strategy varia por **composição**, trocável em tempo de execução; Template Method varia por **herança**, fixado em tempo de compilação.",
    criterios: [
      {
        pergunta: "Como a variação entra?",
        ladoA: "Um objeto injetado — você troca a estratégia quando quiser.",
        ladoB: "Uma subclasse que preenche os passos abertos pela base.",
      },
      {
        pergunta: "Quem controla o fluxo?",
        ladoA: "O contexto chama a estratégia e faz o resto.",
        ladoB: "A classe base: ela chama a subclasse nos momentos certos.",
      },
      {
        pergunta: "Dá para mudar depois de criado?",
        ladoA: "Sim, o objeto pode trocar de comportamento em pleno voo.",
        ladoB: "Não. A escolha ficou selada na hora da instanciação.",
      },
      {
        pergunta: "E se houver duas dimensões de variação?",
        ladoA: "Duas famílias de estratégias independentes, injetadas em separado.",
        ladoB: "A hierarquia explode em subclasses cruzadas.",
      },
      {
        pergunta: "Quanto custa uma variação nova?",
        ladoA: "Uma classe (ou uma função) que implementa a interface.",
        ladoB: "Uma subclasse — mais barata quando as variações são poucas e estáveis.",
      },
    ],
    escolhaA:
      "As variações se combinam, mudam com frequência ou precisam trocar em tempo de execução.",
    escolhaB:
      "A sequência é a invariante que você quer proteger, e as variações são poucas e estáveis.",
    confusaoComum:
      "Os dois resolvem 'este trecho muda, o resto não', então parecem intercambiáveis. Não são: a pergunta é se a variação precisa ser escolhida depois que o objeto existe. Se precisar, herança não serve — e Template Method ainda consome a única herança disponível em linguagens sem herança múltipla.",
  },
  {
    a: "mediator",
    b: "observer",
    vereditoRapido:
      "Os dois reduzem acoplamento entre componentes. A diferença é **onde mora a regra**: no Observer cada observador decide sozinho o que fazer; no Mediator a decisão é centralizada em um lugar só.",
    criterios: [
      {
        pergunta: "Onde vive a lógica de reação?",
        ladoA: "No mediador, concentrada e legível de uma vez.",
        ladoB: "Distribuída entre os observadores, cada um por si.",
      },
      {
        pergunta: "Quem conhece quem?",
        ladoA: "Os colegas conhecem o mediador explicitamente, e ele conhece todos.",
        ladoB: "O sujeito não sabe nem quantos observadores existem.",
      },
      {
        pergunta: "Como cresce?",
        ladoA: "Risco de virar god object — cada regra nova engorda o centro.",
        ladoB: "Risco de virar cascata — um evento dispara outro, difícil de rastrear.",
      },
      {
        pergunta: "Serve para quê?",
        ladoA: "Coordenar peças com regras de interação entre elas.",
        ladoB: "Notificar interessados de que algo aconteceu.",
      },
    ],
    escolhaA:
      "Existe regra sobre COMO os componentes reagem juntos — 'trocar o destino limpa a data'.",
    escolhaB:
      "É difusão pura: cada interessado decide sozinho, e o emissor não se importa com o resultado.",
    confusaoComum:
      "Na prática eles costumam aparecer juntos — o canal de avisos é Observer, a lógica de reação é Mediator — e isso faz parecer que são o mesmo padrão. A pergunta que separa: se eu adicionar um componente novo, alguém precisa decidir como ele interage com os outros? Se sim, há um mediador ali, mesmo que os avisos cheguem por eventos.",
  },
  {
    a: "adapter",
    b: "facade",
    vereditoRapido:
      "Adapter é sobre **compatibilidade**: traduz uma interface que existe para outra que o cliente espera. Facade é sobre **conveniência**: cria uma interface nova e menor sobre várias peças.",
    criterios: [
      {
        pergunta: "Quantos objetos por trás?",
        ladoA: "Normalmente um — é uma tradução de contrato, quase sempre 1 para 1.",
        ladoB: "Vários — é uma coreografia, 1 para muitos.",
      },
      {
        pergunta: "A interface já existia?",
        ladoA: "Sim, dos dois lados. Você concilia duas que não se encaixam.",
        ladoB: "Não. Você inventa uma, de nível mais alto que as internas.",
      },
      {
        pergunta: "Por que existe?",
        ladoA: "Remediação: algo incompatível precisa funcionar junto.",
        ladoB: "Simplificação: alguém não deveria precisar conhecer o subsistema.",
      },
      {
        pergunta: "Dá para usar o que está por trás?",
        ladoA: "Em geral não interessa — o adaptado só existe para ser adaptado.",
        ladoB: "Sim, e isso é desejável: a facade é porta, não muralha.",
      },
    ],
    escolhaA:
      "Você tem duas interfaces incompatíveis e precisa que conversem sem alterar nenhuma.",
    escolhaB:
      "Vários clientes repetem a mesma sequência de chamadas a um subsistema complexo.",
    confusaoComum:
      "Ambos são 'uma classe no meio que simplifica minha vida', e por isso o nome vira intercambiável nas conversas. O teste rápido: se você removesse a classe do meio, o cliente teria um problema de **encaixe** (tipos incompatíveis) ou de **quantidade** (teria que chamar seis coisas na ordem certa)? Encaixe é Adapter; quantidade é Facade.",
  },
  {
    a: "composite",
    b: "decorator",
    vereditoRapido:
      "Os dois compõem objetos da mesma interface recursivamente. O Composite agrupa **N filhos** para representar uma hierarquia; o Decorator embrulha **um** objeto para acrescentar comportamento.",
    criterios: [
      {
        pergunta: "Quantos objetos contidos?",
        ladoA: "Vários — é uma árvore parte-todo.",
        ladoB: "Exatamente um — é uma casca sobre outra casca.",
      },
      {
        pergunta: "O que a estrutura representa?",
        ladoA: "Os dados: pastas dentro de pastas, itens dentro de grupos.",
        ladoB: "O comportamento: camadas de responsabilidade sobre o mesmo objeto.",
      },
      {
        pergunta: "O que a operação faz nos filhos?",
        ladoA: "Agrega: soma, concatena, escolhe o máximo.",
        ladoB: "Delega e complementa: faz o extra e repassa.",
      },
    ],
    escolhaA:
      "A estrutura é uma hierarquia de profundidade variável e o cliente deve tratar item e grupo igual.",
    escolhaB:
      "Você quer somar responsabilidades opcionais a um objeto, combináveis em runtime.",
    confusaoComum:
      "O código se parece muito — interface comum, referência ao interno, recursão. A diferença é o que você está modelando: se remover uma camada muda **o que existe**, é Composite; se muda **o que acontece**, é Decorator.",
  },
  {
    a: "bridge",
    b: "strategy",
    vereditoRapido:
      "Mecanicamente parecidos: os dois delegam para um objeto injetado. Strategy é uma decisão **local** (um algoritmo dentro de um objeto); Bridge é uma decisão **estrutural** (duas hierarquias inteiras que evoluem em separado).",
    criterios: [
      {
        pergunta: "Qual a escala?",
        ladoA: "Duas árvores de tipos, cada uma com seus próprios subtipos.",
        ladoB: "Um ponto de variação, muitas vezes um método só.",
      },
      {
        pergunta: "Quando se decide usar?",
        ladoA: "No projeto, antecipando duas dimensões que vão crescer.",
        ladoB: "Quando um condicional sobre variações começa a incomodar.",
      },
      {
        pergunta: "O que se ganha?",
        ladoA: "Crescimento em soma (M+N) no lugar de produto (M×N).",
        ladoB: "Trocar o algoritmo sem tocar em quem o usa.",
      },
    ],
    escolhaA:
      "O conceito varia em duas dimensões independentes e você vê classes com nomes compostos.",
    escolhaB:
      "Há uma família de algoritmos intercambiáveis para o mesmo trabalho.",
    confusaoComum:
      "Como o Bridge usa composição igual ao Strategy, é comum chamá-lo de 'Strategy grande'. A diferença que importa é se o outro lado é uma **hierarquia com vida própria** — canais de entrega, drivers de banco, plataformas de renderização — ou apenas variações de um cálculo.",
  },
  {
    a: "state",
    b: "strategy",
    vereditoRapido:
      "Estruturalmente gêmeos. No Strategy quem escolhe é **o cliente**, e as opções não se conhecem; no State quem decide a próxima é **o próprio estado**, que conhece os outros.",
    criterios: [
      {
        pergunta: "Quem troca o objeto injetado?",
        ladoA: "O próprio estado atual, ao processar um evento.",
        ladoB: "O cliente, de fora, antes ou durante o uso.",
      },
      {
        pergunta: "As alternativas se conhecem?",
        ladoA: "Sim — cada estado sabe para quais pode transitar.",
        ladoB: "Não, e não deveriam: são intercambiáveis e independentes.",
      },
      {
        pergunta: "O que está sendo modelado?",
        ladoA: "Um ciclo de vida: rascunho → pago → enviado → entregue.",
        ladoB: "Uma escolha de como fazer: Sedex, PAC, retirada.",
      },
      {
        pergunta: "A ordem importa?",
        ladoA: "Sim — transições inválidas devem ser impossíveis.",
        ladoB: "Não. Qualquer estratégia serve a qualquer momento.",
      },
    ],
    escolhaA:
      "O objeto tem um ciclo de vida com transições legítimas e ilegítimas.",
    escolhaB:
      "Existem várias formas de fazer a mesma coisa e alguém de fora escolhe qual.",
    confusaoComum:
      "O diagrama de classes é praticamente o mesmo, o que leva a usar um pelo outro sem prejuízo aparente — até o dia em que uma transição inválida acontece porque ninguém era dono da regra. Se existe 'não pode ir de X para Y', é State.",
  },
];
