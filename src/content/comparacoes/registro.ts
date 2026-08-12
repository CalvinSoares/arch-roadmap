import type { Comparacao } from "@/shared/types/comparacao";

/**
 * Os duelos que os próprios conceitos já travam nas seções de extensão.
 *
 * Só entram pares em que a confusão é real e documentada. O catálogo tem
 * dezenas de conceitos — combinações possíveis viram ruído. Crescer por
 * demanda, não por completude.
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
  {
    a: "factory-method",
    b: "abstract-factory",
    vereditoRapido:
      "Factory Method cria **um** produto e a variação vem de **herança** — a subclasse decide o que instanciar. Abstract Factory cria uma **família** de produtos que precisam combinar entre si, e a variação vem de **composição** — você injeta a fábrica inteira.",
    criterios: [
      {
        pergunta: "Quantos produtos?",
        ladoA: "Um. O método devolve um objeto, e é isso.",
        ladoB: "Vários, relacionados. A fábrica tem um método por produto da família.",
      },
      {
        pergunta: "De onde vem a variação?",
        ladoA: "De herança: a subclasse sobrescreve o método de criação.",
        ladoB: "De composição: você recebe a fábrica pronta e chama os métodos dela.",
      },
      {
        pergunta: "O que o padrão garante?",
        ladoA: "Que quem chama não precisa conhecer a classe concreta do produto.",
        ladoB: "Isso, **mais** a coerência entre os produtos: nunca sai um botão do tema claro com um menu do escuro.",
      },
      {
        pergunta: "Quando a escolha acontece?",
        ladoA: "Ao escolher a subclasse — normalmente em tempo de compilação.",
        ladoB: "Ao escolher a fábrica — normalmente em tempo de execução, na composição da aplicação.",
      },
      {
        pergunta: "O que o cliente segura?",
        ladoA: "A própria classe que contém o método de criação.",
        ladoB: "Uma referência à interface da fábrica, guardada e reutilizada.",
      },
      {
        pergunta: "Como cresce?",
        ladoA: "Produto novo, subclasse nova.",
        ladoB: "Produto novo na família obriga a mexer na **interface** e em **todas** as fábricas — é o custo de garantir coerência.",
      },
    ],
    escolhaA:
      "Existe um único tipo de produto e a subclasse já sabe, pelo contexto, qual variante criar.",
    escolhaB:
      "Existem vários produtos que só fazem sentido juntos, e misturar variantes é um erro que precisa ser impossível.",
    confusaoComum:
      "Abstract Factory costuma ser descrita como 'uma fábrica de fábricas', o que confunde mais do que ajuda — na prática ela é uma interface com vários métodos de criação, e cada um deles é um Factory Method. Por isso os dois aparecem juntos: Abstract Factory é frequentemente **implementada com** Factory Methods, e não uma alternativa a eles. A pergunta que separa é a coerência: se dois produtos precisam ter vindo da mesma família, é Abstract Factory; se um produto basta, o método já resolve.",
  },
  {
    a: "cqs",
    b: "cqrs",
    vereditoRapido:
      "CQS é uma regra sobre **métodos**: ou muda o estado, ou devolve resposta — nunca os dois. CQRS leva a mesma ideia para a **arquitetura**: dois modelos separados, com caminhos, e às vezes bancos, distintos para leitura e escrita. Um cabe numa classe; o outro muda o desenho do sistema.",
    criterios: [
      {
        pergunta: "Qual é a unidade?",
        ladoA: "O método. `carrinho.adicionar(item)` não devolve o total.",
        ladoB: "O modelo. Um lado atende comandos, outro atende consultas.",
      },
      {
        pergunta: "Quanto custa adotar?",
        ladoA: "Quase nada. É disciplina de assinatura, aplicável hoje, em qualquer código.",
        ladoB: "Bastante. Dois modelos para manter, sincronização entre eles e um sistema mais difícil de depurar.",
      },
      {
        pergunta: "Precisa de infraestrutura nova?",
        ladoA: "Nenhuma. É uma decisão que cabe dentro de um arquivo.",
        ladoB: "Quase sempre: projeção, fila ou réplica de leitura para alimentar o lado de consulta.",
      },
      {
        pergunta: "O que se ganha?",
        ladoA: "Código previsível: dá para chamar uma consulta sem medo de efeito colateral.",
        ladoB: "Escalar leitura e escrita separadamente, e modelar cada lado para o que ele realmente faz.",
      },
      {
        pergunta: "E a consistência?",
        ladoA: "Não muda nada — tudo continua no mesmo modelo e na mesma transação.",
        ladoB: "Costuma virar eventual: o lado de leitura fica atrás do de escrita por um intervalo, e a interface precisa assumir isso.",
      },
      {
        pergunta: "Quando surgiu?",
        ladoA: "1988, com Bertrand Meyer, como princípio de projeto de objetos.",
        ladoB: "Por volta de 2010, com Greg Young, levando o princípio à escala arquitetural.",
      },
    ],
    escolhaA:
      "Sempre. É um princípio de baixo custo que torna qualquer código mais previsível, e não pede nada em troca.",
    escolhaB:
      "Quando leitura e escrita divergem de verdade — em volume, em formato ou em ritmo de mudança — e você aceita pagar consistência eventual por isso.",
    confusaoComum:
      "A sigla parecida esconde uma diferença de ordem de grandeza: uma letra a mais custa um sistema distribuído. O erro caro é adotar CQRS por elegância, sem que leitura e escrita realmente divirjam — aí sobram dois modelos para manter, uma projeção para sincronizar e um bug de consistência eventual, em troca de nenhum ganho. O caminho honesto é aplicar CQS em todo lugar desde já, e só considerar CQRS quando existir um problema medido que o justifique.",
  },
  {
    a: "hexagonal",
    b: "clean-architecture",
    vereditoRapido:
      "Os dois isolam o domínio das ferramentas pela mesma regra: a dependência aponta para dentro. Hexagonal fala em **portas e adaptadores** e não conta anéis; Clean Architecture **desenha camadas concêntricas** e nomeia cada uma. Na essência são o mesmo princípio — a diferença é de vocabulário e de quanto a estrutura é prescritiva.",
    criterios: [
      {
        pergunta: "Qual é a metáfora central?",
        ladoA: "Portas (interfaces do domínio) e adaptadores (implementações nas bordas), sem contar camadas.",
        ladoB: "Anéis concêntricos: entidades, casos de uso, adaptadores e frameworks, de dentro para fora.",
      },
      {
        pergunta: "Quão prescritiva é a estrutura?",
        ladoA: "Enxuta: define a fronteira porta/adaptador e deixa o resto por sua conta.",
        ladoB: "Mais detalhada: nomeia as camadas e o papel de cada uma, com regras entre elas.",
      },
      {
        pergunta: "Onde ficam os casos de uso?",
        ladoA: "Não são um conceito nomeado; ficam no domínio, dentro do hexágono.",
        ladoB: "São um anel próprio, entre as entidades e os adaptadores, com nome e lugar.",
      },
      {
        pergunta: "Qual veio antes?",
        ladoA: "2005, Alistair Cockburn, como Ports & Adapters.",
        ladoB: "2012, Robert C. Martin, sintetizando Hexagonal e Onion na mesma regra.",
      },
    ],
    escolhaA:
      "Você quer o princípio no essencial — isolar o domínio atrás de portas — sem prescrição de quantas camadas ter.",
    escolhaB:
      "Você quer um mapa mais detalhado, com camadas nomeadas e o papel de cada uma explícito para o time seguir.",
    confusaoComum:
      "Tratá-los como arquiteturas rivais e discutir qual é 'melhor'. Não são concorrentes: Clean Architecture é, por assunção do próprio autor, uma síntese que inclui a Hexagonal — as duas obedecem à mesma regra de dependência apontando para dentro. Escolher entre elas é escolher vocabulário e nível de prescrição, não filosofia; misturar os termos no mesmo projeto é comum e inofensivo, desde que a regra seja respeitada.",
  },
  {
    a: "saga",
    b: "two-phase-commit",
    vereditoRapido:
      "Os dois coordenam uma operação que cruza vários sistemas. O 2PC busca **atomicidade travada**: todos preparam, travam e commitam juntos. A Saga aceita **consistência eventual**: cada passo commita na hora, e uma falha é desfeita por compensação. Um trava para garantir; o outro não trava e conserta depois.",
    criterios: [
      {
        pergunta: "O que garante ao fim?",
        ladoA: "Consistência eventual: existe uma janela em que o sistema está parcialmente aplicado.",
        ladoB: "Atomicidade imediata: ou todos commitam, ou nenhum, sem estado intermediário visível.",
      },
      {
        pergunta: "Trava recursos?",
        ladoA: "Não. Cada passo commita local e libera na hora; nada fica preso esperando os outros.",
        ladoB: "Sim. Do prepare ao commit, todos os participantes seguram os recursos travados.",
      },
      {
        pergunta: "Como desfaz uma falha?",
        ladoA: "Com ações de compensação que revertem os passos já feitos (estornar, liberar reserva).",
        ladoB: "Com abort na segunda fase: quem preparou desfaz antes de ter commitado de verdade.",
      },
      {
        pergunta: "E se o coordenador cai?",
        ladoA: "Não há coordenador travando ninguém; o fluxo retoma ou compensa, sem recurso preso.",
        ladoB: "Participantes ficam in-doubt: travados, sem saber se commitam ou abortam, até ele voltar.",
      },
      {
        pergunta: "Como escala com mais participantes?",
        ladoA: "Bem: cada serviço é independente, e um lento não trava os outros.",
        ladoB: "Mal: a disponibilidade é o produto das de cada participante, e cai a cada um que entra.",
      },
    ],
    escolhaA:
      "Os passos vivem em serviços independentes, toleram acontecer em momentos diferentes e podem ser desfeitos por compensação.",
    escolhaB:
      "A atomicidade é inegociável, os passos são curtos e os participantes ficam numa fronteira confiável e de baixa latência, como XA entre um banco e um broker.",
    confusaoComum:
      "Achar que a Saga é 'um 2PC para microsserviços'. São filosofias opostas: o 2PC compra atomicidade real ao preço de travar recursos e derrubar a disponibilidade, e por isso é inviável entre serviços independentes; a Saga abre mão da atomicidade instantânea justamente para não travar nada e sobreviver a participantes que falham. Usar 2PC entre microsserviços é a armadilha clássica — a resposta quase sempre é uma saga.",
  },
  {
    a: "microsservicos",
    b: "monolito-modular",
    vereditoRapido:
      "Os dois defendem fronteiras claras entre módulos — a diferença é se essas fronteiras são **físicas** ou **lógicas**. Microsserviços separam por processo e rede (deploy e banco por serviço); o monólito modular separa por módulo dentro de um processo só. O primeiro compra autonomia pagando complexidade distribuída; o segundo mantém a simplicidade de um deploy.",
    criterios: [
      {
        pergunta: "A fronteira é imposta por quê?",
        ladoA: "Pela rede: um serviço simplesmente não acessa o banco do outro.",
        ladoB: "Por disciplina e ferramenta: nada físico impede um import proibido, o lint impede.",
      },
      {
        pergunta: "Quantos deploys?",
        ladoA: "Um por serviço, independentes — cada time entrega no seu ritmo.",
        ladoB: "Um só: o processo inteiro sobe junto, mesmo com muitos módulos.",
      },
      {
        pergunta: "Como é a comunicação entre módulos?",
        ladoA: "Pela rede, com as 8 falácias, timeout e retry em cada chamada.",
        ladoB: "Local, em processo: mantém a transação ACID e o refactor barato.",
      },
      {
        pergunta: "Como se escala uma parte quente?",
        ladoA: "Escalando só o serviço sob carga, isolado dos demais.",
        ladoB: "Subindo réplicas do processo inteiro, não do módulo isolado.",
      },
      {
        pergunta: "Qual o custo operacional?",
        ladoA: "Alto: cada serviço é um sistema a operar, com banco, alerta e plantão próprios.",
        ladoB: "Baixo: um artefato, um banco, uma pilha de operação.",
      },
    ],
    escolhaA:
      "Times independentes travam uns aos outros no mesmo deploy, ou partes do sistema precisam mesmo de escala independente, e as fronteiras já estão estáveis.",
    escolhaB:
      "Você quer fronteiras claras sem o custo distribuído — quase sempre o ponto de partida certo, e o lugar ideal para descobrir onde as fronteiras realmente ficam.",
    confusaoComum:
      "Tratar a escolha como monólito 'legado' contra microsserviços 'moderno'. A dicotomia real não é essa: o oposto de microsserviços não é a bola de lama, é o monólito modular, que tem as mesmas fronteiras lógicas sem a rede no meio. Distribuir para resolver acoplamento é apagar incêndio com gasolina — os pedaços acoplados passam a falar por rede. O caminho saudável costuma ser começar modular e extrair um serviço só quando a escala ou a autonomia justificarem.",
  },
  {
    a: "command",
    b: "memento",
    vereditoRapido:
      "Os dois aparecem no undo — e é aí que se confundem. Command encapsula a **operação** (fazer / desfazer); Memento guarda o **estado** anterior para restaurar. Um é verbo; o outro é foto.",
    criterios: [
      {
        pergunta: "O que é serializado?",
        ladoA: "A intenção: 'apagar estas linhas', 'aplicar este estilo' — com execute e undo.",
        ladoB: "Um snapshot opaco do objeto: o estado de antes, sem expor a estrutura interna.",
      },
      {
        pergunta: "Quem sabe desfazer?",
        ladoA: "O próprio comando: ele conhece a operação inversa ou o delta que aplicou.",
        ladoB: "O originador: recebe o memento e se restaura; o cuidado externo não mexer no snapshot.",
      },
      {
        pergunta: "Quanto custa a memória?",
        ladoA: "Em geral barato: guarda parâmetros e, no máximo, o que a operação alterou.",
        ladoB: "Pode ser caro: uma cópia inteira do estado a cada passo, se não for preguiçoso.",
      },
      {
        pergunta: "Serve para replay?",
        ladoA: "Sim — a fila de comandos é um log de intenções reexecutável.",
        ladoB: "Não diretamente: o memento restaura um ponto, não narra o caminho.",
      },
      {
        pergunta: "Quando a API interna muda?",
        ladoA: "Os comandos antigos podem quebrar se dependiam de detalhes internos.",
        ladoB: "O memento continua opaco: só o originador interpreta o formato.",
      },
    ],
    escolhaA:
      "As ações são bem definidas, o undo é a operação inversa, e você quer histórico, macro ou fila de trabalho.",
    escolhaB:
      "O estado interno é complexo demais para inverter operação a operação, e um snapshot (mesmo preguiçoso) é mais simples e seguro.",
    confusaoComum:
      "Chamar de Memento qualquer coisa que 'lembra o passado' no undo. Se o objeto guardado é 'DeleteTextCommand' com execute/undo, é Command. Se é um blob que o editor engole para voltar no tempo sem saber o que mudou, é Memento. Editores sérios misturam os dois: comandos na UI, mementos (ou patches) por baixo.",
  },
  {
    a: "cqrs",
    b: "event-sourcing",
    vereditoRapido:
      "CQRS separa modelo de escrita e de leitura. Event Sourcing guarda a escrita como sequência de eventos. Dá para ter um sem o outro — e a confusão nasce porque o combo é popular.",
    criterios: [
      {
        pergunta: "O que é obrigatório guardar?",
        ladoA: "O estado atual (ou projeções) — o histórico de eventos é opcional.",
        ladoB: "Os eventos; o estado é uma redução que se pode jogar fora e refazer.",
      },
      {
        pergunta: "Serve só para escalar leitura?",
        ladoA: "É o caso de uso clássico: write model enxuto, read models sob medida.",
        ladoB: "Não — o ganho principal é auditoria, temporalidade e replay, não QPS de SELECT.",
      },
      {
        pergunta: "Dá para usar sozinho?",
        ladoA: "Sim: dois modelos, mesmo banco ou não, sem log de eventos.",
        ladoB: "Sim: um aggregate event-sourced com uma única projeção 'atual'.",
      },
      {
        pergunta: "O que fica difícil?",
        ladoA: "Manter projeções sincronizadas e aceitar consistência eventual na leitura.",
        ladoB: "Versionar eventos, upcasters e a disciplina de nunca 'editar o passado'.",
      },
    ],
    escolhaA:
      "Leituras e escritas têm formatos diferentes e você quer escalá-las ou modelá-las à parte — sem precisar de histórico como fonte da verdade.",
    escolhaB:
      "Você precisa reconstruir o porquê de cada mudança, viajar no tempo ou projetar várias leituras a partir do mesmo log.",
    confusaoComum:
      "Tratar CQRS e Event Sourcing como sinônimos. CQRS é a separação; Event Sourcing é uma forma de persistir o lado de escrita. O combo é poderoso, mas cada um resolve uma pergunta diferente.",
  },
  {
    a: "api-gateway",
    b: "bff",
    vereditoRapido:
      "Os dois ficam na borda. API Gateway é porta compartilhada (auth, rate limit, roteamento). BFF é API moldada para **uma** experiência de cliente.",
    criterios: [
      {
        pergunta: "Para quem a API é desenhada?",
        ladoA: "Para muitos clientes genéricos — um contrato estável de plataforma.",
        ladoB: "Para um cliente específico (web, app, TV) — o shape segue a UI.",
      },
      {
        pergunta: "O que costuma agregar?",
        ladoA: "Cross-cutting: TLS, auth, quota, roteamento para serviços.",
        ladoB: "Dados de vários serviços numa resposta que a tela precisa.",
      },
      {
        pergunta: "Quantos costumam existir?",
        ladoA: "Poucos — idealmente um perímetro de entrada.",
        ladoB: "Um por experiência de front que mereça contrato próprio.",
      },
      {
        pergunta: "Se a UI muda o layout?",
        ladoA: "O gateway em geral não muda — os serviços atrás sim ou não.",
        ladoB: "O BFF muda com a tela: é feature da experiência, não da plataforma.",
      },
    ],
    escolhaA:
      "Você precisa de uma porta única de política (segurança, tráfego) na frente de vários serviços.",
    escolhaB:
      "Um cliente específico sofre com chatty APIs genéricas e precisa de um adaptador de experiência.",
    confusaoComum:
      "Chamar qualquer agregação na borda de 'API Gateway'. Gateway é política e roteamento; BFF é produto da UI. Dá para ter gateway na frente e BFFs atrás — papéis diferentes.",
  },
  {
    a: "repository",
    b: "unit-of-work",
    vereditoRapido:
      "Repository é a coleção de um agregado ('me dê o Pedido 42'). Unit of Work é a transação que rastreia o que mudou e grava tudo de uma vez.",
    criterios: [
      {
        pergunta: "Qual a metáfora?",
        ladoA: "Uma coleção em memória que esconde o banco.",
        ladoB: "Uma unidade de trabalho: o que entrou, saiu e mudou nesta conversa.",
      },
      {
        pergunta: "Quem abre a transação?",
        ladoA: "Em geral cada método de repositório — ou delega ao UoW.",
        ladoB: "O UoW: commit único no fim do caso de uso.",
      },
      {
        pergunta: "Quantos agregados toca?",
        ladoA: "Um tipo de agregado por repositório.",
        ladoB: "Vários, na mesma transação de negócio.",
      },
      {
        pergunta: "Sem um, o que sobra?",
        ladoA: "Dá para salvar com UoW + SQL direto — mas a linguagem do domínio some.",
        ladoB: "Dá para ter só repositórios — e espalhar commits ou esquecer atomicidade.",
      },
    ],
    escolhaA:
      "Você quer nomear a persistência na língua do domínio e trocar o 'como' (SQL, cache) sem o domínio saber.",
    escolhaB:
      "Um caso de uso mexe em vários objetos e precisa de um único commit (ou rollback) coerente.",
    confusaoComum:
      "Achar que Repository 'já é' a transação. Em stacks maduras os dois convivem: o repositório registra no UoW; o UoW comita. ORM que mistura os papéis (DbContext) alimenta a confusão.",
  },
  {
    a: "autenticacao",
    b: "jwt",
    vereditoRapido:
      "Autenticação é o ato de provar identidade (sessão + cookie httpOnly é o default web). JWT é um **formato** de credencial assinada — útil como access token, péssimo como desculpa para token eterno no localStorage.",
    criterios: [
      {
        pergunta: "O que é, exatamente?",
        ladoA: "O processo e o desenho de provar quem você é.",
        ladoB: "Um envelope assinado com claims e prazo.",
      },
      {
        pergunta: "Onde mora a prova, no desenho clássico?",
        ladoA: "Id opaco no cookie httpOnly; estado no servidor.",
        ladoB: "No próprio token que o cliente carrega (Bearer).",
      },
      {
        pergunta: "Logout imediato?",
        ladoA: "Apaga a sessão no store — credencial morre na hora.",
        ladoB: "Só de verdade com TTL curto, denylist ou rotação de chave.",
      },
      {
        pergunta: "Principal risco se guardar mal?",
        ladoA: "CSRF se o cookie não tiver SameSite/anti-CSRF.",
        ladoB: "XSS se o token estiver no localStorage — e cópia até o exp.",
      },
      {
        pergunta: "Precisa um do outro?",
        ladoA: "Não: sessão clássica autentica sem JWT.",
        ladoB: "Não: JWT sozinho não é 'auth completa' — ainda falta login, MFA, refresh.",
      },
    ],
    escolhaA:
      "App web com logout, revogação e cookie httpOnly — identidade no servidor.",
    escolhaB:
      "API/microsserviços ou OAuth em que verificação local de access curto importa.",
    confusaoComum:
      "Tratar JWT como sinônimo de autenticação. JWT é formato; autenticação é o problema. Dá para autenticar sem JWT e dá para usar JWT sem ter desenhado auth de verdade.",
  },
  {
    a: "autenticacao",
    b: "autorizacao",
    vereditoRapido:
      "Autenticação responde *quem é*; autorização responde *o que pode*. Login não é permissão — e `if (user)` não é RBAC.",
    criterios: [
      {
        pergunta: "Qual a pergunta?",
        ladoA: "Você é quem diz ser?",
        ladoB: "Esta identidade pode executar esta ação neste recurso?",
      },
      {
        pergunta: "Status HTTP típico da falha?",
        ladoA: "401 — autentique-se.",
        ladoB: "403 — autenticado, mas proibido.",
      },
      {
        pergunta: "Onde costuma viver no código?",
        ladoA: "Login, sessão, cookie, IdP.",
        ladoB: "Guards, policies, checagem de dono (anti-IDOR).",
      },
      {
        pergunta: "Dá para ter um sem o outro?",
        ladoA: "Sim — recurso público não autentica.",
        ladoB: "Quase não: sem identidade, role não cola.",
      },
    ],
    escolhaA:
      "Quando a dúvida é identidade: login, sessão, MFA, SSO.",
    escolhaB:
      "Quando usuários autenticados têm poderes diferentes ou dados por dono.",
    confusaoComum:
      "Esconder o botão no front e achar que 'autorizou'. Ou um middleware que só checa `user != null` e chama isso de guard de admin.",
  },
  {
    a: "autenticacao",
    b: "oauth2",
    vereditoRapido:
      "Autenticação própria prova identidade no *seu* sistema. OAuth 2 **delega** autorização de acesso (e, com OIDC, identidade) a um IdP — sem a senha do usuário no seu form.",
    criterios: [
      {
        pergunta: "Onde o usuário digita a senha?",
        ladoA: "No seu app (ou no seu IdP interno).",
        ladoB: "No provedor (Google, corporativo) — seu app vê o code/token.",
      },
      {
        pergunta: "Qual o objetivo principal?",
        ladoA: "Saber quem está na sua sessão.",
        ladoB: "Permitir que um client aja com escopos, sem compartilhar senha.",
      },
      {
        pergunta: "Qual a complexidade?",
        ladoA: "Sessão + cookie bem feitos bastam para muitos produtos.",
        ladoB: "Redirects, PKCE, clients, escopos — protocolo cheio.",
      },
      {
        pergunta: "Quando cada um brilha?",
        ladoA: "Um produto, uma base de usuários sua.",
        ladoB: "SSO, login social, APIs para terceiros.",
      },
    ],
    escolhaA:
      "App único sem SSO nem apps de terceiros — sessão sólida.",
    escolhaB:
      "Precisa de 'Login with X', IdP corporativo ou API consumida por clients externos.",
    confusaoComum:
      "Batizar de OAuth um POST `/login` com senha no body do SPA. Isso não é OAuth — é login clássico com nome errado.",
  },
  {
    a: "allowlist",
    b: "rate-limiting",
    vereditoRapido:
      "Allowlist corta por *quem/onde* (origem, IP, URI): default deny. Rate limiting corta por *quanto*: volume acima do orçamento. Um não substitui o outro.",
    criterios: [
      {
        pergunta: "O que mede?",
        ladoA: "Identidade de origem: está na lista ou não.",
        ladoB: "Taxa: requisições/tokens por janela.",
      },
      {
        pergunta: "Qual a resposta típica?",
        ladoA: "403 / CORS bloqueado / conexão recusada.",
        ladoB: "429 + Retry-After.",
      },
      {
        pergunta: "Serve para login abusivo?",
        ladoA: "Só se o atacante vier de fora da lista — IPs dinâmicos furam.",
        ladoB: "Sim: limita tentativas por conta/IP mesmo sendo 'conhecido'.",
      },
      {
        pergunta: "Lista cresce como?",
        ladoA: "Cada parceiro/origem nova precisa entrar na lista.",
        ladoB: "Calibra-se o teto; a chave (user, API key) escala melhor que IP.",
      },
    ],
    escolhaA:
      "Admin interno, redirect OAuth, CORS, webhook de IP fixo.",
    escolhaB:
      "API pública, login, endpoints caros — abuso por volume.",
    confusaoComum:
      "Achar que 'temos WAF/allowlist' e por isso o login não precisa de quota. Atacante na allowlist (ou atrás do mesmo NAT) ainda estoura tentativas.",
  },
];
