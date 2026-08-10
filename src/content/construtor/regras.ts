import type {
  EstadoProjeto,
  Insight,
  Regra,
  ScoreProjeto,
  TemplateProjeto,
} from "@/shared/types/construtor";
import { camadaDef, padraoDef, posicaoCanonica } from "./blocos";
import { tecnologiaDef } from "./tecnologias";

// ——— predicados auxiliares ———
const tem = (p: EstadoProjeto, id: string) =>
  p.camadas.some((c) => c.camadaId === id);
const temPadrao = (p: EstadoProjeto, padrao: string) =>
  p.camadas.some((c) => c.padroes.includes(padrao));
const padraoEm = (p: EstadoProjeto, padrao: string, camada: string) =>
  p.camadas.some((c) => c.camadaId === camada && c.padroes.includes(padrao));
const padraoForaDe = (p: EstadoProjeto, padrao: string, permitidas: string[]) =>
  p.camadas.some(
    (c) => c.padroes.includes(padrao) && !permitidas.includes(c.camadaId)
  );
const indice = (p: EstadoProjeto, id: string) =>
  p.camadas.findIndex((c) => c.camadaId === id);
const totalPadroes = (p: EstadoProjeto) =>
  p.camadas.reduce((acc, c) => acc + c.padroes.length, 0);
const temTech = (p: EstadoProjeto, id: string) =>
  p.camadas.some((c) => c.tecnologias.includes(id));
/** `a` está acima de `b` na pilha (ambas presentes). */
const acimaDe = (p: EstadoProjeto, a: string, b: string) => {
  const ia = indice(p, a);
  const ib = indice(p, b);
  return ia >= 0 && ib >= 0 && ia < ib;
};
const DADOS: string[] = ["write-store", "read-store", "fila", "infra"];
/** Camadas de dados que aparecem acima do domínio. */
const dadosAcimaDoDominio = (p: EstadoProjeto) =>
  indice(p, "dominio") >= 0
    ? DADOS.filter((d) => acimaDe(p, d, "dominio"))
    : [];
/** Pares consecutivos que violam a ordem canônica. */
export function paresForaDeOrdem(p: EstadoProjeto) {
  const fora: { acima: string; abaixo: string }[] = [];
  for (let i = 0; i < p.camadas.length - 1; i++) {
    const a = p.camadas[i].camadaId;
    const b = p.camadas[i + 1].camadaId;
    if (posicaoCanonica(a) > posicaoCanonica(b)) fora.push({ acima: a, abaixo: b });
  }
  return fora;
}
export const ordemCanonica = (p: EstadoProjeto) => paresForaDeOrdem(p).length === 0;
const techEm = (p: EstadoProjeto, id: string, camada: string) =>
  p.camadas.some((c) => c.camadaId === camada && c.tecnologias.includes(id));
const temBancoDuravel = (p: EstadoProjeto) =>
  temTech(p, "postgres") || temTech(p, "mongodb");
const totalTechs = (p: EstadoProjeto) =>
  p.camadas.reduce((acc, c) => acc + c.tecnologias.length, 0);

/** Regras didáticas avaliadas a cada mudança no projeto. */
export const REGRAS: Regra[] = [
  // ——— estrutura ———
  {
    id: "sem-dominio",
    quando: (p) => p.camadas.length > 0 && !tem(p, "dominio"),
    nivel: "alerta",
    titulo: "Cadê o domínio?",
    explicacao:
      "Toda arquitetura aqui parte de um domínio — é onde vivem as regras de negócio. Sem ele, as outras camadas não têm o que proteger.",
    conceitos: ["hexagonal"],
  },
  {
    id: "ui-grudada-na-infra",
    quando: (p) => {
      const ui = indice(p, "ui");
      const infra = indice(p, "infra");
      return ui >= 0 && infra >= 0 && Math.abs(ui - infra) === 1;
    },
    nivel: "alerta",
    titulo: "UI a um passo do banco",
    explicacao:
      "Com a UI adjacente à infraestrutura, as telas tendem a consultar o banco direto — regras de negócio vazam para o frontend. Coloque API e/ou casos de uso entre elas.",
  },
  {
    id: "dominio-abaixo-da-infra",
    quando: (p) => {
      const dom = indice(p, "dominio");
      const infra = indice(p, "infra");
      return dom >= 0 && infra >= 0 && infra < dom;
    },
    nivel: "info",
    titulo: "Infra acima do domínio",
    explicacao:
      "Convencionalmente a pilha vai do usuário (topo) à infraestrutura (base), com o domínio protegido no meio. A ordem atual sugere que a infra dita as regras — inverta para deixar a dependência apontando para o domínio.",
    conceitos: ["hexagonal"],
  },
  {
    id: "estrutura-sem-padroes",
    quando: (p) => p.camadas.length >= 4 && totalPadroes(p) === 0,
    nivel: "info",
    titulo: "Estrutura pronta — falta comportamento",
    explicacao:
      "As camadas dão forma; os padrões dão comportamento. Arraste padrões da paleta para dentro das camadas e veja o que cada um muda.",
  },
  {
    id: "stores-sem-cqrs",
    quando: (p) =>
      tem(p, "read-store") && tem(p, "write-store") && !temPadrao(p, "cqrs"),
    nivel: "info",
    titulo: "Dois stores, nenhum papel",
    explicacao:
      "Read e write stores separados sem CQRS é replicação sem propósito claro. Aplique CQRS para dar a cada um o seu papel: escrita com regras, leitura por tela.",
    conceitos: ["cqrs"],
  },
  {
    id: "fila-sem-consumidor",
    quando: (p) =>
      tem(p, "fila") &&
      !temPadrao(p, "cqrs") &&
      !temPadrao(p, "saga") &&
      !temPadrao(p, "observer"),
    nivel: "info",
    titulo: "Fila sem consumidores",
    explicacao:
      "Há uma fila de eventos, mas nenhum padrão a consome. Observer (reação a eventos), CQRS (projeções) ou Saga (compensações) dão função à mensageria.",
    conceitos: ["observer", "cqrs", "saga"],
  },

  // ——— ordem da pilha ———
  {
    id: "ordem-canonica",
    quando: (p) => p.camadas.length >= 4 && ordemCanonica(p),
    nivel: "sinergia",
    titulo: "Fluxo limpo, de cima para baixo",
    explicacao:
      "A pilha segue a ordem canônica: usuário no topo, infraestrutura na base, domínio protegido no meio. A requisição desce sem zigue-zague e as dependências apontam para dentro.",
    conceitos: ["hexagonal"],
  },
  {
    id: "api-acima-da-ui",
    quando: (p) => acimaDe(p, "api", "ui"),
    nivel: "alerta",
    titulo: "API na frente da UI",
    explicacao:
      "A API aparece antes da interface — invertido: é a UI que fica mais próxima do usuário e chama a API. Nessa ordem, o diagrama sugere que a API entrega telas (e o fluxo da requisição fica ilegível).",
  },
  {
    id: "dominio-antes-da-aplicacao",
    quando: (p) => acimaDe(p, "dominio", "aplicacao"),
    nivel: "info",
    titulo: "Domínio antes dos casos de uso",
    explicacao:
      "Convencionalmente a requisição passa pela camada de aplicação (que orquestra) antes de tocar as entidades do domínio. Com o domínio acima, a orquestração parece vir depois da regra — inverta para o fluxo ficar óbvio.",
    conceitos: ["hexagonal", "cqs"],
  },
  {
    id: "dados-acima-do-dominio",
    quando: (p) => dadosAcimaDoDominio(p).length > 0,
    nivel: "alerta",
    titulo: "Dados acima do domínio",
    explicacao:
      "Stores/filas aparecem antes do domínio na pilha. Isso é o retrato do database-driven design: o esquema do banco ditando as regras. Coloque a persistência abaixo do domínio — ela é detalhe, não fundamento.",
    conceitos: ["hexagonal"],
  },
  {
    id: "fila-no-topo",
    quando: (p) => p.camadas.length > 1 && indice(p, "fila") === 0,
    nivel: "info",
    titulo: "Fila no topo da pilha",
    explicacao:
      "A fila de eventos abrindo o fluxo sugere que toda requisição entra por mensageria. Isso existe (arquiteturas event-driven puras), mas o normal é a fila receber eventos DEPOIS que a borda e o domínio processaram — abaixo deles, portanto.",
    conceitos: ["observer", "saga"],
  },
  {
    id: "ui-fora-do-topo",
    quando: (p) => indice(p, "ui") > 0,
    nivel: "info",
    titulo: "UI não está no topo",
    explicacao:
      "A interface é o que o usuário toca primeiro — o lugar natural dela é o topo da pilha. Fora dele, alguma camada está se colocando entre o usuário e a tela.",
  },
  {
    id: "infra-fora-da-base",
    quando: (p) => {
      const i = indice(p, "infra");
      return i >= 0 && i !== p.camadas.length - 1;
    },
    nivel: "info",
    titulo: "Infraestrutura não está na base",
    explicacao:
      "Infra (servidores, drivers, serviços gerenciados) é o alicerce: fica na base, servindo o que está acima. No meio da pilha, ela vira algo que o domínio atravessa — sinal de acoplamento.",
    conceitos: ["hexagonal"],
  },

  // ——— hexagonal ———
  {
    id: "hexagonal-no-dominio",
    quando: (p) => padraoEm(p, "hexagonal", "dominio"),
    nivel: "sinergia",
    titulo: "Núcleo protegido por portas",
    explicacao:
      "Hexagonal no domínio: as regras só conversam com o mundo por interfaces (portas). Banco, HTTP e filas viram detalhes plugáveis — e o domínio testa em milissegundos.",
    conceitos: ["hexagonal"],
  },
  {
    id: "hexagonal-fora-do-dominio",
    quando: (p) => padraoForaDe(p, "hexagonal", ["dominio"]),
    nivel: "alerta",
    titulo: "Hexagonal no lugar errado",
    explicacao:
      "Ports & Adapters organiza o sistema AO REDOR do domínio — é lá que o padrão se aplica. Em outra camada ele vira só pastas com nomes bonitos.",
    conceitos: ["hexagonal"],
  },
  {
    id: "hexagonal-com-adapter",
    quando: (p) =>
      padraoEm(p, "hexagonal", "dominio") &&
      (padraoEm(p, "adapter", "api") || padraoEm(p, "adapter", "infra")),
    nivel: "sinergia",
    titulo: "Portas dentro, adaptadores fora",
    explicacao:
      "Combinação clássica: o domínio declara portas e os Adapters nas bordas as implementam, traduzindo SDKs e protocolos. Cada peça no seu lugar.",
    conceitos: ["hexagonal", "adapter"],
  },

  // ——— adapter ———
  {
    id: "adapter-na-borda",
    quando: (p) =>
      (padraoEm(p, "adapter", "api") || padraoEm(p, "adapter", "infra")) &&
      !padraoForaDe(p, "adapter", ["api", "infra"]),
    nivel: "sinergia",
    titulo: "Tradução na borda",
    explicacao:
      "Adapter na API/infra: contratos externos são traduzidos na fronteira e o resto do sistema fala só a língua do domínio. Trocar um SDK vira detalhe.",
    conceitos: ["adapter"],
  },
  {
    id: "adapter-no-nucleo",
    quando: (p) =>
      padraoEm(p, "adapter", "dominio") || padraoEm(p, "adapter", "aplicacao"),
    nivel: "alerta",
    titulo: "Adapter dentro do núcleo",
    explicacao:
      "Adapter existe para segurar o mundo externo na borda. No domínio/aplicação, ele indica que um contrato externo vazou para dentro — mova a tradução para API ou infra.",
    conceitos: ["adapter", "hexagonal"],
  },

  // ——— cqrs ———
  {
    id: "cqrs-sem-stores",
    quando: (p) =>
      temPadrao(p, "cqrs") && !(tem(p, "read-store") && tem(p, "write-store")),
    nivel: "alerta",
    titulo: "CQRS sem modelos separados",
    explicacao:
      "CQRS pede escrita e leitura com modelos próprios. Adicione Write e Read stores para a separação física — ou assuma que é só separação lógica (metade do ganho).",
    conceitos: ["cqrs"],
  },
  {
    id: "cqrs-completo",
    quando: (p) =>
      temPadrao(p, "cqrs") && tem(p, "read-store") && tem(p, "write-store"),
    nivel: "sinergia",
    titulo: "Escrita e leitura, cada uma no seu ritmo",
    explicacao:
      "CQRS com stores dedicados: o write model guarda invariantes, os read models servem cada tela sem joins. Os dois lados escalam separados.",
    conceitos: ["cqrs"],
  },
  {
    id: "cqrs-sem-fila",
    quando: (p) =>
      temPadrao(p, "cqrs") &&
      tem(p, "read-store") &&
      tem(p, "write-store") &&
      !tem(p, "fila"),
    nivel: "info",
    titulo: "Projeção síncrona",
    explicacao:
      "Sem fila, a projeção do read model roda junto da escrita: mais simples e sempre consistente, mas a escrita paga o custo. Uma fila desacopla — ao preço da consistência eventual.",
    conceitos: ["cqrs"],
  },
  {
    id: "cqrs-com-fila",
    quando: (p) => temPadrao(p, "cqrs") && tem(p, "fila"),
    nivel: "sinergia",
    titulo: "Projeção assíncrona",
    explicacao:
      "Eventos na fila alimentam os read models sem segurar a escrita. Surge a janela de consistência eventual — desenhe a UX para ela ('processando…').",
    conceitos: ["cqrs"],
  },

  // ——— saga ———
  {
    id: "saga-sem-fila",
    quando: (p) => temPadrao(p, "saga") && !tem(p, "fila"),
    nivel: "alerta",
    titulo: "Saga sem mensageria",
    explicacao:
      "Compensações confiáveis precisam de entrega garantida entre os passos. Sem fila, uma falha no meio da saga deixa o sistema pela metade, sem como retomar.",
    conceitos: ["saga"],
  },
  {
    id: "saga-com-cqrs",
    quando: (p) => temPadrao(p, "saga") && temPadrao(p, "cqrs"),
    nivel: "sinergia",
    titulo: "Transações longas + leitura desacoplada",
    explicacao:
      "Saga coordena o fluxo entre serviços; CQRS projeta o estado de cada passo para leitura. O usuário acompanha o pedido enquanto a saga ainda roda.",
    conceitos: ["saga", "cqrs"],
  },

  // ——— comportamentais / princípios ———
  {
    id: "observer-na-ui",
    quando: (p) => padraoEm(p, "observer", "ui"),
    nivel: "sinergia",
    titulo: "UI reativa",
    explicacao:
      "A tela se inscreve no estado e reage a mudanças — sem polling, sem acoplamento com quem produz o dado. É a base de todo framework reativo.",
    conceitos: ["observer"],
  },
  {
    id: "observer-em-cascata",
    quando: (p) =>
      p.camadas.filter((c) => c.padroes.includes("observer")).length >= 3,
    nivel: "alerta",
    titulo: "Observers demais",
    explicacao:
      "Observer em 3+ camadas cria cascatas de notificação difíceis de depurar: um evento dispara outro que dispara outro. Centralize a reatividade onde ela paga.",
    conceitos: ["observer"],
  },
  {
    id: "strategy-no-dominio",
    quando: (p) => padraoEm(p, "strategy", "dominio"),
    nivel: "sinergia",
    titulo: "Regras voláteis isoladas",
    explicacao:
      "Strategy no domínio: cada variação de regra (preço, frete, desconto) vira uma classe testável e substituível — sem if/else crescendo no núcleo.",
    conceitos: ["strategy"],
  },
  {
    id: "factory-no-nucleo",
    quando: (p) =>
      padraoEm(p, "factory-method", "dominio") ||
      padraoEm(p, "factory-method", "aplicacao"),
    nivel: "sinergia",
    titulo: "Criação desacoplada",
    explicacao:
      "Factory Method no núcleo: quem usa os objetos não conhece as classes concretas. Novos tipos entram sem alterar o código cliente.",
    conceitos: ["factory-method"],
  },
  {
    id: "cqs-aplicado",
    quando: (p) => temPadrao(p, "cqs"),
    nivel: "sinergia",
    titulo: "Comandos e consultas separados",
    explicacao:
      "CQS é o princípio mais barato da paleta: métodos que mudam estado não retornam dados, e vice-versa. Qualquer camada fica mais previsível — e é o primeiro passo rumo ao CQRS.",
    conceitos: ["cqs", "cqrs"],
  },
  {
    id: "dominio-sobrecarregado",
    quando: (p) => {
      const dom = p.camadas.find((c) => c.camadaId === "dominio");
      return !!dom && dom.padroes.length >= 4;
    },
    nivel: "info",
    titulo: "Domínio carregado de padrões",
    explicacao:
      "Quatro ou mais padrões no domínio: garanta que cada um resolve um problema real daqui — padrão sem dor correspondente é complexidade gratuita.",
  },

  // ——— estruturais extras ———
  {
    id: "decorator-na-borda",
    quando: (p) =>
      padraoEm(p, "decorator", "api") || padraoEm(p, "decorator", "aplicacao"),
    nivel: "sinergia",
    titulo: "Comportamento empilhável",
    explicacao:
      "Decorator na borda: logging, retry, cache e métricas entram como camadas finas em volta do serviço — cada uma opcional e combinável, sem tocar no código decorado.",
    conceitos: ["decorator"],
  },
  {
    id: "facade-na-api",
    quando: (p) =>
      padraoEm(p, "facade", "api") || padraoEm(p, "facade", "aplicacao"),
    nivel: "sinergia",
    titulo: "Um balcão para o subsistema",
    explicacao:
      "Facade dá aos clientes um ponto de entrada simples: quem chama não precisa conhecer os serviços internos nem a ordem certa de chamá-los.",
    conceitos: ["facade"],
  },
  {
    id: "facade-e-adapter-juntos",
    quando: (p) => temPadrao(p, "facade") && temPadrao(p, "adapter"),
    nivel: "info",
    titulo: "Facade ≠ Adapter",
    explicacao:
      "Você usou os dois — ótimo lugar para fixar a diferença: o Adapter TRADUZ uma interface existente para outra; o Facade SIMPLIFICA um subsistema criando uma interface nova. Um converte, o outro resume.",
    conceitos: ["facade", "adapter"],
  },

  // ——— singleton ———
  {
    id: "singleton-na-infra",
    quando: (p) => padraoEm(p, "singleton", "infra"),
    nivel: "info",
    titulo: "Instância única na infra",
    explicacao:
      "Pool de conexões, cliente HTTP, configuração: casos legítimos de instância única. Prefira ainda assim entregá-la por injeção de dependência, para os testes substituírem.",
    conceitos: ["singleton"],
  },
  {
    id: "singleton-no-nucleo",
    quando: (p) =>
      padraoEm(p, "singleton", "dominio") ||
      padraoEm(p, "singleton", "aplicacao") ||
      padraoEm(p, "singleton", "ui"),
    nivel: "alerta",
    titulo: "Singleton fora da infra",
    explicacao:
      "Singleton no núcleo (ou na UI) é estado global disfarçado: acopla tudo a uma instância escondida e trava os testes. Injete dependências em vez de buscá-las num ponto global.",
    conceitos: ["singleton"],
  },

  // ——— event sourcing ———
  {
    id: "event-sourcing-com-cqrs",
    quando: (p) => temPadrao(p, "event-sourcing") && temPadrao(p, "cqrs"),
    nivel: "sinergia",
    titulo: "O log é a verdade; as projeções, as visões",
    explicacao:
      "Event Sourcing + CQRS é o par natural: o write store vira um log de eventos imutável e cada read model é uma projeção reconstruível do log — auditoria completa de graça.",
    conceitos: ["event-sourcing", "cqrs"],
  },
  {
    id: "event-sourcing-sem-cqrs",
    quando: (p) => temPadrao(p, "event-sourcing") && !temPadrao(p, "cqrs"),
    nivel: "alerta",
    titulo: "Event Sourcing sem projeções",
    explicacao:
      "Guardar eventos sem CQRS significa reconstruir o estado por replay a cada leitura — caro e lento. Aplique CQRS para projetar os eventos em read models consultáveis.",
    conceitos: ["event-sourcing", "cqrs"],
  },

  // ——— criacionais / estado ———
  {
    id: "state-no-dominio",
    quando: (p) => padraoEm(p, "state", "dominio"),
    nivel: "sinergia",
    titulo: "Máquina de estados no domínio",
    explicacao:
      "State no domínio: o ciclo de vida da entidade (pedido → pago → enviado) vira objetos com transições explícitas, em vez de um enum com if/else espalhado.",
    conceitos: ["state"],
  },
  {
    id: "state-e-strategy",
    quando: (p) => temPadrao(p, "state") && temPadrao(p, "strategy"),
    nivel: "info",
    titulo: "State ≠ Strategy",
    explicacao:
      "Os dois trocam comportamento por composição, mas quem decide difere: no Strategy o CLIENTE escolhe o algoritmo; no State o próprio estado decide a transição para o próximo. Estrutura parecida, intenção oposta.",
    conceitos: ["state", "strategy"],
  },
  {
    id: "builder-com-abstract-factory",
    quando: (p) => temPadrao(p, "builder") && temPadrao(p, "abstract-factory"),
    nivel: "info",
    titulo: "Builder e Abstract Factory juntos",
    explicacao:
      "Papéis complementares: Abstract Factory garante que uma FAMÍLIA de objetos combine entre si; Builder monta UM objeto complexo passo a passo. Juntos fazem sentido — só não confunda os papéis.",
    conceitos: ["builder", "abstract-factory"],
  },

  // ——— tecnologias ———
  {
    id: "redis-read-model",
    quando: (p) => techEm(p, "redis", "read-store") && temPadrao(p, "cqrs"),
    nivel: "sinergia",
    titulo: "Read model em memória",
    explicacao:
      "Redis servindo o lado de leitura do CQRS: as projeções alimentam o cache e a consulta volta em microssegundos — a tela mais quente do sistema sai do banco.",
    conceitos: ["cqrs"],
  },
  {
    id: "redis-sem-fonte-da-verdade",
    quando: (p) => temTech(p, "redis") && !temBancoDuravel(p),
    nivel: "alerta",
    titulo: "Cache sem fonte da verdade",
    explicacao:
      "Redis está no projeto, mas nenhum banco durável. A persistência do Redis é opcional (AOF/RDB) — se ele é o único store, um restart pode levar seus dados. Adicione PostgreSQL ou MongoDB como fonte da verdade.",
  },
  {
    id: "kafka-saga",
    quando: (p) => temTech(p, "kafka") && temPadrao(p, "saga"),
    nivel: "sinergia",
    titulo: "Saga sobre log durável",
    explicacao:
      "Kafka dá à Saga um transporte durável e reproduzível: cada passo/compensação vira evento no log — se um serviço cai, retoma de onde parou relendo o tópico.",
    conceitos: ["saga"],
  },
  {
    id: "kafka-event-sourcing",
    quando: (p) => temTech(p, "kafka") && temPadrao(p, "event-sourcing"),
    nivel: "sinergia",
    titulo: "O log encontra o log",
    explicacao:
      "Event Sourcing com Kafka: o modelo (estado = sequência de eventos) casa com a tecnologia (log particionado durável). Projeções consomem tópicos e reconstróem qualquer visão.",
    conceitos: ["event-sourcing"],
  },
  {
    id: "elasticsearch-projecao",
    quando: (p) => techEm(p, "elasticsearch", "read-store") && temPadrao(p, "cqrs"),
    nivel: "sinergia",
    titulo: "Busca como projeção",
    explicacao:
      "Elasticsearch como read model de busca: eventos de escrita projetam para o índice, e relevância/facetas ficam fora do caminho transacional.",
    conceitos: ["cqrs"],
  },
  {
    id: "elasticsearch-como-verdade",
    quando: (p) => temTech(p, "elasticsearch") && !temBancoDuravel(p),
    nivel: "alerta",
    titulo: "Índice não é fonte da verdade",
    explicacao:
      "Elasticsearch é uma projeção derivada e reindexável — não a fonte da verdade. Sem um banco durável por trás, não há de onde reconstruir o índice quando (não se) ele precisar de reindex.",
  },
  {
    id: "dois-caches",
    quando: (p) => temTech(p, "redis") && temTech(p, "memcached"),
    nivel: "info",
    titulo: "Dois caches no projeto",
    explicacao:
      "Redis e Memcached juntos: justifique — normalmente um basta. Padrão comum: Memcached para fragmentos simples, Redis quando precisa de estruturas/pub-sub. Dois caches = duas invalidações para errar.",
  },
  {
    id: "duas-filas",
    quando: (p) => temTech(p, "kafka") && temTech(p, "rabbitmq"),
    nivel: "info",
    titulo: "Kafka e RabbitMQ juntos",
    explicacao:
      "Papéis diferentes: Kafka é log de eventos (consumidores releem; integração e streaming); RabbitMQ é fila de trabalho (mensagem consumida some; jobs com retry/DLQ). Juntos fazem sentido — desde que cada um fique no seu papel.",
  },
  {
    id: "fila-sem-broker",
    quando: (p) => {
      const fila = p.camadas.find((c) => c.camadaId === "fila");
      return (
        !!fila &&
        fila.tecnologias.length === 0 &&
        (temPadrao(p, "saga") || temPadrao(p, "cqrs") || temPadrao(p, "event-sourcing"))
      );
    },
    nivel: "info",
    titulo: "A fila precisa de um broker",
    explicacao:
      "Você tem camada de fila e padrões que dependem de eventos, mas nenhum broker concreto. Arraste Kafka (log de eventos/streaming) ou RabbitMQ (jobs com retry) para materializar a escolha.",
  },
  {
    id: "sem-observabilidade",
    quando: (p) => p.camadas.length >= 5 && !temTech(p, "prometheus"),
    nivel: "info",
    titulo: "Quem vigia essa arquitetura?",
    explicacao:
      "Cinco ou mais camadas e nenhuma métrica: em produção, você descobriria problemas pelo usuário. Prometheus + Grafana tornam visíveis latência, erros e saturação de cada peça.",
  },
  {
    id: "cdn-estaticos",
    quando: (p) => techEm(p, "cdn", "ui"),
    nivel: "sinergia",
    titulo: "Estáticos na borda",
    explicacao:
      "CDN servindo a UI: assets chegam de um ponto a ~20ms do usuário e a origem quase não vê tráfego estático. Versione os arquivos para invalidar cache sem sofrimento.",
  },

  // ——— tecnologias: rodada 2 ———
  {
    id: "cache-na-aplicacao",
    quando: (p) => techEm(p, "redis", "aplicacao") || techEm(p, "memcached", "aplicacao"),
    nivel: "info",
    titulo: "Cache na aplicação",
    explicacao:
      "Cache junto dos casos de uso serve bem para sessão, rate limiting e lock distribuído. Mas cachear dado de negócio aqui esconde a invalidação dentro da regra — para dado quente, prefira o read store.",
  },
  {
    id: "memcached-para-sessao",
    quando: (p) => temTech(p, "memcached") && !temTech(p, "redis"),
    nivel: "info",
    titulo: "Memcached é 100% volátil",
    explicacao:
      "Sem persistência nem replicação: um restart limpa tudo. Ótimo para cache descartável de consulta; para sessão de usuário ou carrinho, Redis (com AOF) evita derrubar todo mundo num deploy.",
  },
  {
    id: "elastic-sem-fila",
    quando: (p) => temTech(p, "elasticsearch") && !temTech(p, "kafka") && !temTech(p, "rabbitmq"),
    nivel: "alerta",
    titulo: "Índice sem pipeline de atualização",
    explicacao:
      "Elasticsearch está no projeto, mas não há broker para alimentá-lo. Sem eventos, a indexação acaba acoplada à escrita (lenta e frágil) ou feita por cron — e o reindex completo não tem por onde correr.",
    conceitos: ["cqrs", "event-sourcing"],
  },
  {
    id: "kafka-sem-consumidor-concreto",
    quando: (p) =>
      temTech(p, "kafka") &&
      !temTech(p, "worker") &&
      !temPadrao(p, "cqrs") &&
      !temPadrao(p, "saga") &&
      !temPadrao(p, "observer"),
    nivel: "info",
    titulo: "Kafka sem quem consuma",
    explicacao:
      "Tópicos sem consumidor viram log que ninguém lê. Adicione um Worker de jobs, ou um padrão que consuma (CQRS projeta, Saga coordena, Observer reage).",
    conceitos: ["observer", "cqrs", "saga"],
  },
  {
    id: "poliglota-justifique",
    quando: (p) => temTech(p, "postgres") && temTech(p, "mongodb"),
    nivel: "info",
    titulo: "Persistência poliglota",
    explicacao:
      "Postgres e MongoDB juntos: defensável quando cada um resolve uma coisa (relacional na escrita, documentos nas projeções). Mas são dois bancos para operar, versionar e restaurar — justifique com um caso, não com preferência.",
  },
  {
    id: "prometheus-sozinho",
    quando: (p) => temTech(p, "prometheus") && totalTechs(p) === 1,
    nivel: "info",
    titulo: "Métricas sem sistema",
    explicacao:
      "Observabilidade é o único componente concreto do projeto. Ela mede as outras peças — comece pela fonte da verdade (um banco) e volte aqui.",
  },
  {
    id: "rabbitmq-com-saga",
    quando: (p) => temTech(p, "rabbitmq") && temPadrao(p, "saga"),
    nivel: "sinergia",
    titulo: "Compensações com retry e DLQ",
    explicacao:
      "RabbitMQ dá à Saga o que ela precisa operacionalmente: ack por mensagem, retry com backoff e dead-letter para o passo que não compensou. Cada etapa vira uma tarefa rastreável.",
    conceitos: ["saga"],
  },
  {
    id: "s3-com-cdn",
    quando: (p) => temTech(p, "s3") && temTech(p, "cdn"),
    nivel: "sinergia",
    titulo: "Mídia servida da borda",
    explicacao:
      "S3 guarda o arquivo, CDN entrega perto do usuário: upload direto ao bucket por URL assinada e download cacheado na borda. A sua aplicação nunca vê o byte do arquivo.",
  },
  {
    id: "replica-sem-cqrs",
    quando: (p) => temTech(p, "replica-leitura") && !temPadrao(p, "cqrs"),
    nivel: "info",
    titulo: "Réplica sem separar responsabilidade",
    explicacao:
      "A réplica escala leitura, mas o código continua tratando tudo igual. Com CQRS explícito, fica claro qual caminho tolera lag de replicação e qual exige o primário.",
    conceitos: ["cqrs"],
  },
  {
    id: "replica-lag",
    quando: (p) => temTech(p, "replica-leitura"),
    nivel: "alerta",
    titulo: "Cuidado com o lag da réplica",
    explicacao:
      "Ler da réplica logo após escrever pode devolver o dado ANTERIOR (replication lag). Para fluxos 'salvei e mostro o resultado', force a leitura no primário ou responda com o retorno da própria escrita.",
    conceitos: ["cqrs"],
  },
  {
    id: "replica-e-cache",
    quando: (p) => temTech(p, "replica-leitura") && (temTech(p, "redis") || temTech(p, "memcached")),
    nivel: "info",
    titulo: "Réplica e cache resolvem o mesmo problema",
    explicacao:
      "Ambos aliviam leitura, por caminhos diferentes: cache elimina a consulta (µs, mas exige invalidação); réplica mantém o SQL e a flexibilidade (ms, com lag). Ter os dois é válido em escala — só saiba qual atende cada tela.",
  },
  {
    id: "worker-sem-fila",
    quando: (p) => temTech(p, "worker") && !temTech(p, "kafka") && !temTech(p, "rabbitmq"),
    nivel: "alerta",
    titulo: "Worker sem fila para consumir",
    explicacao:
      "Um worker sem broker fica varrendo o banco em polling — desperdício e corrida entre instâncias. Adicione RabbitMQ (jobs) ou Kafka (eventos) para ele ter de onde puxar trabalho.",
  },
  {
    id: "worker-com-fila",
    quando: (p) => temTech(p, "worker") && (temTech(p, "kafka") || temTech(p, "rabbitmq")),
    nivel: "sinergia",
    titulo: "Trabalho pesado fora da requisição",
    explicacao:
      "Worker + broker: o usuário recebe 202 na hora e PDF, e-mail ou processamento de imagem acontecem em segundo plano, com retry. Só garanta idempotência — entrega é at-least-once.",
    conceitos: ["saga"],
  },
  {
    id: "gateway-com-facade",
    quando: (p) => temTech(p, "api-gateway") && temPadrao(p, "facade"),
    nivel: "sinergia",
    titulo: "Facade na infra e no código",
    explicacao:
      "O gateway é o Facade em forma de infraestrutura: um ponto de entrada esconde o subsistema. Com o padrão Facade também no código, a simplificação é coerente das duas pontas.",
    conceitos: ["facade"],
  },
  {
    id: "gateway-com-decorator",
    quando: (p) => temTech(p, "api-gateway") && temPadrao(p, "decorator"),
    nivel: "info",
    titulo: "Plugins do gateway são Decorators",
    explicacao:
      "Autenticação, rate limit e log no gateway são exatamente o Decorator aplicado à infraestrutura: camadas empilhadas em volta da requisição, cada uma adicionando um comportamento.",
    conceitos: ["decorator"],
  },
  {
    id: "gateway-e-nginx",
    quando: (p) => temTech(p, "api-gateway") && temTech(p, "nginx"),
    nivel: "info",
    titulo: "Duas camadas na borda",
    explicacao:
      "Nginx e API Gateway se sobrepõem em TLS, roteamento e rate limit. Combinação comum é Nginx/LB na frente e gateway cuidando de auth e quotas — mas se um só resolve, tire uma peça de operação.",
  },
  {
    id: "grpc-interno",
    quando: (p) => techEm(p, "grpc", "aplicacao"),
    nivel: "sinergia",
    titulo: "Contrato forte entre serviços",
    explicacao:
      "gRPC na aplicação: chamadas internas binárias com contrato versionado em protobuf — mais rápidas que JSON e sem quebra silenciosa de campo.",
    conceitos: ["adapter"],
  },
  {
    id: "grpc-na-borda",
    quando: (p) => techEm(p, "grpc", "api") && !temTech(p, "api-gateway") && !temTech(p, "nginx"),
    nivel: "alerta",
    titulo: "gRPC exposto ao browser",
    explicacao:
      "Browser não fala gRPC nativamente — precisa de gRPC-Web com proxy de tradução. Sem gateway ou Nginx na frente, clientes web simplesmente não conseguem chamar essa API.",
    conceitos: ["adapter"],
  },
  {
    id: "sem-gestao-de-segredos",
    quando: (p) => totalTechs(p) >= 4 && !temTech(p, "vault"),
    nivel: "info",
    titulo: "Onde ficam as credenciais?",
    explicacao:
      "Com quatro ou mais tecnologias, são várias credenciais circulando (banco, broker, storage). Um gerenciador de segredos tira isso do .env, permite rotação sem redeploy e deixa o acesso auditável.",
  },
  {
    id: "vault-com-segredos",
    quando: (p) => temTech(p, "vault"),
    nivel: "sinergia",
    titulo: "Segredos fora do código",
    explicacao:
      "Credenciais saem do repositório e do ambiente: acesso por identidade, rotação automática e auditoria. Lembre-se de cachear localmente — o cofre passa a ser dependência do boot.",
  },
  // ——— dinheiro, eventos e repetição ———
  {
    id: "fila-sem-idempotencia",
    quando: (p) => tem(p, "fila") && !temPadrao(p, "idempotencia"),
    nivel: "info",
    titulo: "Quem consome essa fila aguenta repetição?",
    explicacao:
      "Fila entrega ao-menos-uma-vez: rebalanceamento e timeout reentregam a mesma mensagem. Sem consumo idempotente, todo retry é um efeito duplicado esperando acontecer — e a corrida entre duas entregas simultâneas vem de brinde.",
    conceitos: ["idempotencia", "race-condition"],
  },
  {
    id: "idempotencia-com-saga",
    quando: (p) => temPadrao(p, "idempotencia") && temPadrao(p, "saga"),
    nivel: "sinergia",
    titulo: "Saga com passos idempotentes",
    explicacao:
      "Saga reexecuta passos e compensações quando algo falha no meio — e reexecutar só é seguro se cada passo tolerar repetição. Juntas, as duas peças fazem a transação distribuída sobreviver a retry sem efeito dobrado.",
    conceitos: ["saga", "idempotencia"],
  },
  {
    id: "webhooks-sem-fila",
    quando: (p) => temPadrao(p, "webhooks") && !tem(p, "fila"),
    nivel: "alerta",
    titulo: "Webhook processando dentro do request",
    explicacao:
      "Sem fila, o handler trabalha enquanto o emissor espera — o timeout dele dispara reenvio, que vira processamento duplicado em paralelo. Receba, valide a assinatura, enfileire e responda 200; o trabalho pesado acontece depois.",
    conceitos: ["webhooks", "idempotencia"],
  },
  {
    id: "webhooks-com-fila",
    quando: (p) => temPadrao(p, "webhooks") && tem(p, "fila"),
    nivel: "sinergia",
    titulo: "Webhook que responde em milissegundos",
    explicacao:
      "O endpoint valida, deduplica, enfileira e devolve 200 na hora — o emissor não reenvia, e o worker processa no ritmo do sistema. É o desenho canônico de recepção de eventos externos.",
    conceitos: ["webhooks"],
  },
  {
    id: "ledger-sem-store-duravel",
    quando: (p) =>
      temPadrao(p, "ledger") && !tem(p, "write-store") && !tem(p, "infra"),
    nivel: "alerta",
    titulo: "Ledger sem onde morar",
    explicacao:
      "O livro-razão é a fonte da verdade do dinheiro: precisa de armazenamento durável (write store ou infra com banco) para os lançamentos imutáveis. Sem isso, é contabilidade em memória — some no primeiro restart.",
    conceitos: ["ledger", "append-only"],
  },
  {
    id: "ledger-com-append-only",
    quando: (p) => temPadrao(p, "ledger") && temPadrao(p, "append-only"),
    nivel: "sinergia",
    titulo: "Lançamentos que ninguém edita",
    explicacao:
      "Ledger sobre armazenamento append-only é o par natural: partidas dobradas dão a estrutura contábil, a imutabilidade física dá o valor de prova — nem bug nem UPDATE de emergência reescrevem o passado.",
    conceitos: ["ledger", "append-only"],
  },
  {
    id: "maquina-de-estados-com-fila",
    quando: (p) => temPadrao(p, "maquina-de-estados") && tem(p, "fila"),
    nivel: "sinergia",
    titulo: "Transições à prova de eventos atrasados",
    explicacao:
      "Eventos de fila chegam duplicados e fora de ordem — e a tabela de transições rejeita o que não vale mais ('paga' não expira). A máquina de estados é o porteiro que faz o consumo assíncrono ficar seguro.",
    conceitos: ["maquina-de-estados", "webhooks"],
  },

];

/**
 * Insights dinâmicos: tecnologia colocada fora das camadas onde tipicamente
 * vive gera um alerta explicando o porquê (não bloqueia — ensina).
 */
/** Padrões que já têm regra dedicada de "lugar errado" (evita duplicar). */
const PADROES_COM_REGRA_PROPRIA = new Set(["hexagonal", "adapter", "singleton"]);

/**
 * Padrão aplicado fora das camadas típicas (`aplicaEm`) gera alerta
 * persistente — antes isso só aparecia na narração transitória.
 */
function insightsPadraoForaDoLugar(p: EstadoProjeto): Insight[] {
  const out: Insight[] = [];
  for (const camada of p.camadas) {
    for (const padraoId of camada.padroes) {
      if (PADROES_COM_REGRA_PROPRIA.has(padraoId)) continue;
      const def = padraoDef(padraoId);
      if (!def || def.aplicaEm.includes(camada.camadaId)) continue;
      const nomes = def.aplicaEm.map((id) => camadaDef(id)?.nome ?? id).join(", ");
      out.push({
        id: `padrao-fora:${padraoId}:${camada.camadaId}`,
        nivel: "alerta",
        titulo: `${def.nome} em camada atípica`,
        explicacao: `${def.nome} normalmente atua em: ${nomes}. Em "${camadaDef(camada.camadaId)?.nome}" ele resolve um problema que não é dali — ${def.descricao.toLowerCase()} Ou mova o padrão, ou justifique a exceção.`,
        conceitos: [padraoId],
      });
    }
  }
  return out;
}

function insightsTechForaDoLugar(p: EstadoProjeto): Insight[] {
  const out: Insight[] = [];
  for (const camada of p.camadas) {
    for (const techId of camada.tecnologias) {
      const def = tecnologiaDef(techId);
      if (!def || def.viveEm.includes(camada.camadaId)) continue;
      const nomes = def.viveEm
        .map((id) => camadaDef(id)?.nome ?? id)
        .join(", ");
      out.push({
        id: `tech-fora:${techId}:${camada.camadaId}`,
        nivel: "alerta",
        titulo: `${def.nome} fora do lugar típico`,
        explicacao: `${def.nome} costuma viver em: ${nomes}. Em "${camadaDef(camada.camadaId)?.nome}", ela mistura responsabilidades — ${def.descricao.toLowerCase()}`,
      });
    }
  }
  return out;
}

export function avaliarRegras(p: EstadoProjeto) {
  return [
    // o predicado não faz parte do insight entregue à UI
    ...REGRAS.filter((r) => r.quando(p)).map((r) => ({
      id: r.id,
      nivel: r.nivel,
      titulo: r.titulo,
      explicacao: r.explicacao,
      ...(r.conceitos ? { conceitos: r.conceitos } : {}),
    })),
    ...insightsPadraoForaDoLugar(p),
    ...insightsTechForaDoLugar(p),
  ];
}

/** Score didático (heurísticas transparentes — os fatores são exibidos). */
export function calcularScore(p: EstadoProjeto): ScoreProjeto {
  const fatores: string[] = [];
  let desacoplamento = 20;
  let testabilidade = 20;

  if (tem(p, "dominio")) {
    desacoplamento += 15;
    testabilidade += 15;
    fatores.push("+ domínio presente (regras têm um lar)");
  }
  if (tem(p, "aplicacao")) {
    desacoplamento += 10;
    fatores.push("+ casos de uso separam orquestração de regra");
  }
  if (padraoEm(p, "hexagonal", "dominio")) {
    desacoplamento += 20;
    testabilidade += 25;
    fatores.push("+ hexagonal: infra plugável, domínio testável isolado");
  }
  if (padraoEm(p, "adapter", "api") || padraoEm(p, "adapter", "infra")) {
    desacoplamento += 10;
    fatores.push("+ adapter na borda traduz contratos externos");
  }
  if (padraoEm(p, "strategy", "dominio")) {
    testabilidade += 10;
    fatores.push("+ strategy: regras voláteis testáveis uma a uma");
  }
  if (temPadrao(p, "cqs")) {
    testabilidade += 10;
    fatores.push("+ CQS: métodos previsíveis (comando ou consulta)");
  }
  if (temPadrao(p, "cqrs") && tem(p, "read-store") && tem(p, "write-store")) {
    desacoplamento += 10;
    fatores.push("+ CQRS completo: leitura e escrita independentes");
  }
  if (padraoEm(p, "adapter", "dominio") || padraoEm(p, "adapter", "aplicacao")) {
    desacoplamento -= 15;
    fatores.push("− adapter no núcleo: contrato externo vazou para dentro");
  }
  if (p.camadas.length > 0 && !tem(p, "dominio")) {
    testabilidade -= 10;
    fatores.push("− sem domínio: regras espalhadas pelas camadas");
  }

  if (techEm(p, "redis", "read-store") || techEm(p, "memcached", "read-store")) {
    desacoplamento += 5;
    fatores.push("+ cache na leitura alivia a fonte da verdade");
  }
  if (temTech(p, "prometheus")) {
    testabilidade += 5;
    fatores.push("+ observabilidade: comportamento verificável em produção");
  }

  // ——— resiliência: aguenta perder peças? ———
  let resiliencia = 20;
  const cacheNaLeitura =
    techEm(p, "redis", "read-store") || techEm(p, "memcached", "read-store");
  if (cacheNaLeitura) {
    resiliencia += 15;
    fatores.push("+ cache quente serve leitura mesmo se o banco cair");
  }
  if (temTech(p, "kafka") || temTech(p, "rabbitmq")) {
    resiliencia += 20;
    fatores.push("+ fila absorve escrita durante incidentes (202 em vez de 503)");
  }
  if (temPadrao(p, "saga")) {
    resiliencia += 15;
    fatores.push("+ Saga compensa passos quando algo falha no meio");
  }
  if (temTech(p, "prometheus")) {
    resiliencia += 10;
    fatores.push("+ métricas: incidente vira alerta antes de virar reclamação");
  }
  if (temTech(p, "cdn")) {
    resiliencia += 5;
    fatores.push("+ CDN mantém estáticos no ar independente da origem");
  }
  if (temBancoDuravel(p) && !cacheNaLeitura && p.camadas.length >= 5) {
    resiliencia -= 10;
    fatores.push("− banco é ponto único de leitura: sem cache, ele absorve tudo");
  }
  if (!temBancoDuravel(p) && p.camadas.length > 0) {
    resiliencia -= 15;
    fatores.push("− sem fonte da verdade durável: perda de dados em restart");
  }

  // ——— custo operacional: quantas peças e quão pesadas ———
  const PESO_OPERACIONAL: Record<string, number> = {
    kafka: 18,
    elasticsearch: 14,
    mongodb: 10,
    postgres: 9,
    rabbitmq: 10,
    redis: 6,
    memcached: 5,
    nginx: 5,
    prometheus: 7,
    s3: 3,
    cdn: 3,
  };
  const custoOperacional = Math.min(
    100,
    p.camadas.reduce(
      (acc, c) => acc + c.tecnologias.reduce((a, t) => a + (PESO_OPERACIONAL[t] ?? 5), 0),
      0
    )
  );
  if (custoOperacional >= 55)
    fatores.push("• muitas peças para operar: cada uma pede deploy, backup e alerta");

  /**
   * Pesos calibrados para que uma arquitetura real e completa (8 camadas, ~5
   * padrões, ~8 tecnologias) caia por volta de 85 — alto, mas ainda com
   * resolução acima. Com os pesos antigos (8/7/4) qualquer projeto sério
   * estourava 100 e a barra ficava presa no teto: 4 dos 6 templates marcavam
   * exatamente 100, então "cada peça precisa pagar o próprio custo" deixava de
   * ser visível justamente onde importa, e a marca de referência do modelo
   * carregado não tinha como mostrar diferença. O teto agora é para exagero.
   */
  const complexidade = Math.min(
    100,
    p.camadas.length * 5 + totalPadroes(p) * 4 + totalTechs(p) * 3
  );
  if (complexidade > 60)
    fatores.push("• complexidade alta: cada peça precisa pagar o próprio custo");

  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return {
    desacoplamento: clamp(desacoplamento),
    testabilidade: clamp(testabilidade),
    resiliencia: clamp(resiliencia),
    complexidade,
    custoOperacional,
    fatores,
  };
}

/** Montagens prontas — um clique carrega e o painel narra as escolhas. */
export const TEMPLATES: TemplateProjeto[] = [
  {
    id: "crud",
    nome: "CRUD simples",
    descricao: "O ponto de partida honesto: 4 camadas, Postgres e mais nada.",
    porQue: [
      "Zero padrões de propósito: num CRUD, cada abstração extra custa mais do que entrega.",
      "Postgres único como fonte da verdade — sem cache nem read model para manter em sincronia.",
      "É a linha de base para comparar: adicione peças e veja o score de complexidade subir.",
    ],
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        { camadaId: "api", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "infra", padroes: [], tecnologias: ["postgres"] },
      ],
    },
  },
  {
    id: "hexagonal-puro",
    nome: "Hexagonal puro (API-first)",
    descricao:
      "Serviço sem UI própria: domínio protegido por portas, adaptadores nas bordas.",
    porQue: [
      "Sem camada de UI de propósito: é um serviço consumido por outros sistemas (a interface é o contrato da API).",
      "Hexagonal + Strategy no domínio: regras isoladas de infra e variações testáveis uma a uma.",
      "Adapter na API e na infra: HTTP e Postgres entram como detalhes plugáveis, nunca no núcleo.",
    ],
    estado: {
      camadas: [
        { camadaId: "api", padroes: ["adapter"], tecnologias: ["nginx"] },
        { camadaId: "aplicacao", padroes: ["factory-method", "cqs"], tecnologias: [] },
        { camadaId: "dominio", padroes: ["hexagonal", "strategy"], tecnologias: [] },
        { camadaId: "infra", padroes: ["adapter"], tecnologias: ["postgres"] },
      ],
    },
  },
  {
    id: "ecommerce-cqrs",
    nome: "E-commerce com CQRS",
    descricao: "Postgres na escrita, Redis+Elastic na leitura, Kafka no meio.",
    porQue: [
      "CQRS porque leitura e escrita divergem: vitrine lê muito (Redis/Elastic), checkout escreve com invariantes (Postgres).",
      "Kafka projeta os eventos de escrita nos read models — consistência eventual assumida no design.",
      "Saga coordena o checkout distribuído (pagamento, estoque, entrega) com compensações; Prometheus vigia tudo.",
    ],
    estado: {
      camadas: [
        { camadaId: "ui", padroes: ["observer"], tecnologias: ["cdn"] },
        { camadaId: "api", padroes: ["adapter"], tecnologias: ["nginx"] },
        { camadaId: "aplicacao", padroes: ["cqrs", "saga"], tecnologias: [] },
        { camadaId: "dominio", padroes: ["hexagonal"], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "read-store", padroes: [], tecnologias: ["redis", "elasticsearch"] },
        { camadaId: "fila", padroes: [], tecnologias: ["kafka"] },
        { camadaId: "infra", padroes: [], tecnologias: ["prometheus", "s3"] },
      ],
    },
  },
  {
    id: "plataforma-eventos",
    nome: "Plataforma de eventos",
    descricao: "Event Sourcing + Kafka; projeções em Mongo; métricas no ar.",
    porQue: [
      "Event Sourcing no write store: o histórico É a verdade — auditoria completa e replay de qualquer visão.",
      "Kafka como transporte durável dos eventos; Mongo guarda as projeções desnormalizadas para leitura.",
      "Facade na API dá um ponto de entrada simples sobre um subsistema que, por dentro, é bem mais complexo.",
    ],
    estado: {
      camadas: [
        { camadaId: "api", padroes: ["facade", "adapter"], tecnologias: ["nginx"] },
        { camadaId: "aplicacao", padroes: ["cqrs"], tecnologias: ["worker"] },
        { camadaId: "dominio", padroes: ["hexagonal"], tecnologias: [] },
        { camadaId: "write-store", padroes: ["event-sourcing"], tecnologias: ["postgres"] },
        { camadaId: "read-store", padroes: [], tecnologias: ["mongodb"] },
        { camadaId: "fila", padroes: ["observer"], tecnologias: ["kafka"] },
        { camadaId: "infra", padroes: ["singleton"], tecnologias: ["prometheus", "vault"] },
      ],
    },
  },
  {
    id: "servico-midia",
    nome: "Serviço de mídia",
    descricao: "Upload direto ao bucket, entrega pela borda, banco só com metadados.",
    porQue: [
      "S3 + URL assinada: o arquivo vai do cliente direto ao bucket — a aplicação nunca carrega o byte.",
      "CDN entrega o download da borda; o banco guarda apenas caminho e metadados (não BLOBs).",
      "Worker + fila processam derivados (thumbnail, transcode) fora da requisição, com retry; segredos no cofre.",
    ],
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: ["cdn"] },
        { camadaId: "api", padroes: ["facade"], tecnologias: ["api-gateway"] },
        { camadaId: "aplicacao", padroes: ["strategy"], tecnologias: ["worker"] },
        { camadaId: "dominio", padroes: ["hexagonal"], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "fila", padroes: ["observer"], tecnologias: ["rabbitmq"] },
        { camadaId: "infra", padroes: ["adapter"], tecnologias: ["s3", "prometheus", "vault"] },
      ],
    },
  },
  {
    id: "tempo-real",
    nome: "Tempo real (chat/notificações)",
    descricao: "Redis pub/sub distribuindo eventos entre instâncias, fila para o durável.",
    porQue: [
      "Observer na UI e na fila: a tela reage a eventos em vez de ficar perguntando (polling).",
      "Redis faz pub/sub entre instâncias — sem ele, um usuário conectado no servidor A não recebe a mensagem publicada no servidor B.",
      "Kafka guarda o histórico durável (Redis pub/sub é fire-and-forget: quem estava offline perde).",
    ],
    estado: {
      camadas: [
        { camadaId: "ui", padroes: ["observer"], tecnologias: ["cdn"] },
        { camadaId: "api", padroes: ["decorator"], tecnologias: ["nginx"] },
        // Observer fica na UI (tela reage) e na fila (consome o log). Aqui o
        // fan-out é capacidade do Redis (pub/sub), não um terceiro Observer —
        // três camadas com Observer disparariam a cascata de notificações.
        { camadaId: "aplicacao", padroes: ["state"], tecnologias: ["redis"] },
        { camadaId: "dominio", padroes: ["hexagonal"], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "fila", padroes: ["observer"], tecnologias: ["kafka"] },
        { camadaId: "infra", padroes: [], tecnologias: ["prometheus", "vault"] },
      ],
    },
  },
  {
    id: "carteira",
    nome: "Carteira digital (fintech)",
    descricao:
      "Dinheiro de terceiros: idempotência na borda, ledger no núcleo, eventos auditáveis.",
    porQue: [
      "Idempotência + webhooks na API: o PSP pode reenviar a notificação à vontade — nada é processado duas vezes, e o endpoint responde 200 antes de trabalhar.",
      "Ledger em partidas dobradas no domínio: saldo é soma de lançamentos, a soma do sistema fecha em zero, e auditoria vira consulta — não perícia.",
      "Máquina de estados nas cobranças: 'paga não expira' é transição impossível na tabela, não um if espalhado torcendo para ninguém esquecer.",
      "Write store append-only com Postgres: o passado não se edita; estorno é lançamento inverso, e a conciliação diária bate o livro com o extrato do banco.",
    ],
    estado: {
      camadas: [
        { camadaId: "api", padroes: ["idempotencia", "webhooks"], tecnologias: ["nginx"] },
        { camadaId: "aplicacao", padroes: ["saga"], tecnologias: ["worker"] },
        { camadaId: "dominio", padroes: ["ledger", "maquina-de-estados", "hexagonal"], tecnologias: [] },
        { camadaId: "write-store", padroes: ["append-only"], tecnologias: ["postgres"] },
        { camadaId: "fila", padroes: [], tecnologias: ["rabbitmq"] },
        { camadaId: "infra", padroes: [], tecnologias: ["vault", "prometheus"] },
      ],
    },
  },

];
