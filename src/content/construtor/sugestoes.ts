import type { CamadaId, EstadoProjeto } from "@/shared/types/construtor";
import { ORDEM_CANONICA } from "./blocos";
import { avaliarRegras, calcularScore, paresForaDeOrdem } from "./regras";

/** Ação que a sugestão aplica com um clique. */
export type AcaoSugestao =
  | { tipo: "camada"; camadaId: CamadaId }
  | { tipo: "padrao"; padraoId: string; camadaId: CamadaId }
  | { tipo: "tech"; techId: string; camadaId: CamadaId }
  | { tipo: "ordem" };

export interface Sugestao {
  id: string;
  titulo: string;
  /** por que isso é o próximo passo. */
  porQue: string;
  /** rótulo do botão de aplicar. */
  rotulo: string;
  acao: AcaoSugestao;
}

const tem = (p: EstadoProjeto, id: string) =>
  p.camadas.some((c) => c.camadaId === id);
const temPadrao = (p: EstadoProjeto, id: string) =>
  p.camadas.some((c) => c.padroes.includes(id));
const temTech = (p: EstadoProjeto, id: string) =>
  p.camadas.some((c) => c.tecnologias.includes(id));
const camadaVazia = (p: EstadoProjeto, id: CamadaId) =>
  p.camadas.find((c) => c.camadaId === id)?.tecnologias.length === 0;
const temBanco = (p: EstadoProjeto) =>
  temTech(p, "postgres") || temTech(p, "mongodb");
const temBroker = (p: EstadoProjeto) =>
  temTech(p, "kafka") || temTech(p, "rabbitmq");

/**
 * Catálogo declarativo de sugestões.
 *
 * Antes isto era uma sequência de `if (cond) out.push(...)` dentro de
 * `sugerir()`. A condição de cada sugestão ficava enterrada no fluxo, e o
 * motor sabia dizer o que **fazer** mas não o que estava **faltando** para uma
 * sugestão aparecer.
 *
 * Com a condição declarada, as duas perguntas saem da mesma fonte: `sugerir()`
 * devolve as que passam, `porQueNaoSugeriu()` explica as que não. Sem isso, a
 * explicação seria uma segunda cópia da condição — e as duas divergiriam.
 */
interface RegraSugestao {
  id: string;
  titulo: string;
  /** Quando a sugestão se aplica. */
  quando: (p: EstadoProjeto) => boolean;
  /**
   * Por que ela **não** apareceu. É a condição na negativa, em prosa — e é
   * ensino de graça: "Circuit Breaker não foi sugerido porque não há chamada
   * externa na sua pilha" ensina mais que o silêncio.
   */
  porQueNao: (p: EstadoProjeto) => string;
  monta: (p: EstadoProjeto) => Omit<Sugestao, "id" | "titulo">;
}

/** Sugestão de fundação, para o projeto totalmente vazio. */
const COMECE: Sugestao = {
  id: "comece-dominio",
  titulo: "Comece pelo domínio",
  porQue:
    "É onde vivem as regras de negócio — tudo o mais existe para servi-lo. Depois desça para os dados e suba para a borda.",
  rotulo: "Adicionar Domínio",
  acao: { tipo: "camada", camadaId: "dominio" },
};

const CATALOGO: RegraSugestao[] = [
  // 1) fundação
  {
    id: "add-dominio",
    titulo: "Falta o domínio",
    quando: (p) => !tem(p, "dominio"),
    porQueNao: () => "o domínio já está na pilha.",
    monta: () => ({
      porQue:
        "Sem uma camada de regras de negócio, as outras não têm o que proteger — e a lógica se espalha pela borda e pelo banco.",
      rotulo: "Adicionar Domínio",
      acao: { tipo: "camada", camadaId: "dominio" },
    }),
  },
  {
    id: "arrumar-ordem",
    titulo: "A pilha está fora de ordem",
    quando: (p) => paresForaDeOrdem(p).length > 0,
    porQueNao: () => "a pilha já está na ordem canônica, de cima para baixo.",
    monta: () => ({
      porQue:
        "O diagrama fica ilegível e as dependências parecem apontar para fora do domínio. Uma reordenação resolve.",
      rotulo: "Organizar ordem",
      acao: { tipo: "ordem" },
    }),
  },
  {
    id: "add-banco",
    titulo: "Defina a fonte da verdade",
    quando: (p) => !temBanco(p),
    porQueNao: () => "já existe um banco durável no projeto.",
    monta: (p) => {
      const alvo: CamadaId = tem(p, "write-store") ? "write-store" : "infra";
      return {
        porQue:
          "Nenhum banco durável no projeto: sem ele não há onde persistir com garantia — cache e índice são derivados.",
        rotulo: tem(p, alvo) ? "Adicionar PostgreSQL" : "Adicionar Infra / Banco",
        acao: tem(p, alvo)
          ? { tipo: "tech", techId: "postgres", camadaId: alvo }
          : { tipo: "camada", camadaId: "infra" },
      };
    },
  },

  // 2) camada de dados sem tecnologia
  {
    id: "read-store-vazio",
    titulo: "Read store sem tecnologia",
    quando: (p) => tem(p, "read-store") && !!camadaVazia(p, "read-store"),
    porQueNao: (p) =>
      !tem(p, "read-store")
        ? "não há camada de read store na pilha."
        : "o read store já tem tecnologia.",
    monta: () => ({
      porQue:
        "A camada de leitura existe mas está vazia. Redis serve as consultas quentes em microssegundos e alivia o banco.",
      rotulo: "Adicionar Redis",
      acao: { tipo: "tech", techId: "redis", camadaId: "read-store" },
    }),
  },
  {
    id: "write-store-vazio",
    titulo: "Write store sem tecnologia",
    quando: (p) => tem(p, "write-store") && !!camadaVazia(p, "write-store"),
    porQueNao: (p) =>
      !tem(p, "write-store")
        ? "não há camada de write store na pilha."
        : "o write store já tem tecnologia.",
    monta: () => ({
      porQue:
        "O lado de escrita precisa de um banco com transações para garantir as invariantes do domínio.",
      rotulo: "Adicionar PostgreSQL",
      acao: { tipo: "tech", techId: "postgres", camadaId: "write-store" },
    }),
  },
  {
    id: "fila-vazia",
    titulo: "Fila sem broker",
    quando: (p) => tem(p, "fila") && !temBroker(p),
    porQueNao: (p) =>
      !tem(p, "fila")
        ? "não há camada de fila na pilha."
        : "a fila já tem um broker concreto.",
    monta: () => ({
      porQue:
        "Escolha o papel: Kafka é log de eventos (consumidores releem, integração/streaming); RabbitMQ é fila de trabalho (jobs com retry e DLQ).",
      rotulo: "Adicionar Kafka",
      acao: { tipo: "tech", techId: "kafka", camadaId: "fila" },
    }),
  },

  // 3) padrões que destravam valor
  {
    id: "add-hexagonal",
    titulo: "Proteja o domínio com portas",
    quando: (p) => tem(p, "dominio") && !temPadrao(p, "hexagonal"),
    porQueNao: (p) =>
      !tem(p, "dominio")
        ? "não há domínio para proteger — ele vem primeiro."
        : "o domínio já está protegido por portas.",
    monta: () => ({
      porQue:
        "Hexagonal deixa infraestrutura plugável e o domínio testável em milissegundos, sem subir banco nem HTTP.",
      rotulo: "Aplicar Hexagonal no domínio",
      acao: { tipo: "padrao", padraoId: "hexagonal", camadaId: "dominio" },
    }),
  },
  {
    id: "add-cqrs",
    titulo: "Dê papel aos dois stores",
    quando: (p) =>
      tem(p, "read-store") &&
      tem(p, "write-store") &&
      !temPadrao(p, "cqrs") &&
      tem(p, "aplicacao"),
    porQueNao: (p) => {
      if (temPadrao(p, "cqrs")) return "CQRS já está aplicado.";
      if (!tem(p, "read-store") || !tem(p, "write-store")) {
        return "só faz sentido com read store e write store separados — hoje falta pelo menos um.";
      }
      return "falta a camada de aplicação, que é onde o roteamento entre os dois lados mora.";
    },
    monta: () => ({
      porQue:
        "Read e write separados sem CQRS é replicação sem propósito. Com o padrão, cada lado é otimizado para o próprio trabalho.",
      rotulo: "Aplicar CQRS na aplicação",
      acao: { tipo: "padrao", padraoId: "cqrs", camadaId: "aplicacao" },
    }),
  },
  {
    id: "kafka-projecao",
    titulo: "Use os eventos para projetar leitura",
    quando: (p) => temTech(p, "kafka") && !temPadrao(p, "cqrs") && tem(p, "aplicacao"),
    porQueNao: (p) => {
      if (temPadrao(p, "cqrs")) return "CQRS já está aplicado.";
      if (!temTech(p, "kafka")) return "não há Kafka no projeto para projetar a partir dos eventos.";
      return "falta a camada de aplicação, onde a projeção seria orquestrada.";
    },
    monta: () => ({
      porQue:
        "Com Kafka no projeto, CQRS transforma cada evento de escrita em atualização de read model — leitura rápida sem tocar no caminho transacional.",
      rotulo: "Aplicar CQRS na aplicação",
      acao: { tipo: "padrao", padraoId: "cqrs", camadaId: "aplicacao" },
    }),
  },

  // 4) resiliência e operação
  {
    id: "add-worker",
    titulo: "Quem consome a fila?",
    quando: (p) => temBroker(p) && !temTech(p, "worker"),
    porQueNao: (p) =>
      !temBroker(p)
        ? "não há broker na pilha — sem fila, não há o que consumir."
        : "já existe um Worker para consumir a fila.",
    monta: (p) => ({
      porQue:
        "Um Worker tira o trabalho pesado da requisição: o usuário recebe 202 na hora e o processamento acontece depois, com retry.",
      rotulo: "Adicionar Worker",
      acao: {
        tipo: "tech",
        techId: "worker",
        camadaId: tem(p, "aplicacao") ? "aplicacao" : "infra",
      },
    }),
  },
  {
    id: "add-timeout",
    titulo: "Nenhuma chamada tem prazo",
    quando: (p) =>
      tem(p, "api") &&
      !temPadrao(p, "timeout") &&
      (temBanco(p) || temBroker(p) || temTech(p, "s3")),
    porQueNao: (p) => {
      if (temPadrao(p, "timeout")) return "já existe Timeout na pilha.";
      if (!tem(p, "api")) return "não há camada de borda onde o prazo seria configurado.";
      return "não há dependência concreta a chamar — sem banco, fila ou storage, não há prazo a impor.";
    },
    monta: () => ({
      porQue:
        "Há dependências concretas e nenhum prazo. Sem timeout, uma delas ficar lenta prende conexões até o pool esgotar — e o serviço que cai não é o que quebrou.",
      rotulo: "Aplicar Timeout na borda",
      acao: { tipo: "padrao", padraoId: "timeout", camadaId: "api" },
    }),
  },
  {
    id: "add-dlq",
    titulo: "A fila não tem rede de segurança",
    quando: (p) => tem(p, "fila") && !temPadrao(p, "dead-letter-queue"),
    porQueNao: (p) =>
      !tem(p, "fila")
        ? "não há fila na pilha — a DLQ é o desvio de uma."
        : "a fila já tem Dead Letter Queue.",
    monta: () => ({
      porQue:
        "Sem desvio, a mensagem que nunca vai dar certo volta para a fila indefinidamente: consome capacidade e, com ordenação, bloqueia tudo atrás dela.",
      rotulo: "Aplicar Dead Letter Queue",
      acao: { tipo: "padrao", padraoId: "dead-letter-queue", camadaId: "fila" },
    }),
  },
  {
    id: "add-observabilidade",
    titulo: "Ninguém está vigiando",
    quando: (p) =>
      p.camadas.length >= 5 && !temTech(p, "prometheus") && tem(p, "infra"),
    porQueNao: (p) => {
      if (temTech(p, "prometheus")) return "já há observabilidade na pilha.";
      if (!tem(p, "infra")) return "falta a camada de infra, onde a coleta viveria.";
      return "a pilha ainda é pequena (menos de cinco camadas) — observabilidade entra quando há o que observar.";
    },
    monta: () => ({
      porQue:
        "Com essa quantidade de peças, você descobriria incidentes pelo usuário reclamando. Métricas viram alerta antes de virar lentidão.",
      rotulo: "Adicionar Prometheus",
      acao: { tipo: "tech", techId: "prometheus", camadaId: "infra" },
    }),
  },
  {
    id: "add-cache",
    titulo: "O banco é seu ponto único de leitura",
    quando: (p) =>
      temBanco(p) &&
      !temTech(p, "redis") &&
      !temTech(p, "memcached") &&
      p.camadas.length >= 4,
    porQueNao: (p) => {
      if (temTech(p, "redis") || temTech(p, "memcached")) return "já há cache na pilha.";
      if (!temBanco(p)) return "não há banco cuja leitura o cache poderia absorver.";
      return "a pilha ainda é pequena (menos de quatro camadas) — cache é otimização, e vem depois da estrutura.";
    },
    monta: (p) => ({
      porQue:
        "Um cache absorve as consultas quentes: latência em µs e, num incidente do banco, o cache quente ainda serve leitura.",
      rotulo: tem(p, "read-store")
        ? "Adicionar Redis no read store"
        : "Adicionar camada Read store",
      acao: tem(p, "read-store")
        ? { tipo: "tech", techId: "redis", camadaId: "read-store" }
        : { tipo: "camada", camadaId: "read-store" },
    }),
  },
  {
    id: "add-cdn",
    titulo: "Entregue a mídia pela borda",
    quando: (p) => temTech(p, "s3") && !temTech(p, "cdn") && tem(p, "ui"),
    porQueNao: (p) => {
      if (temTech(p, "cdn")) return "já há CDN na pilha.";
      if (!temTech(p, "s3")) return "não há storage de objetos cujos arquivos a CDN serviria.";
      return "não há camada de UI — a CDN serve o que o browser busca.";
    },
    monta: () => ({
      porQue:
        "Com storage no projeto, uma CDN na frente serve os arquivos da borda, perto do usuário, e poupa a origem.",
      rotulo: "Adicionar CDN",
      acao: { tipo: "tech", techId: "cdn", camadaId: "ui" },
    }),
  },
  {
    id: "add-vault",
    titulo: "Credenciais espalhadas",
    quando: (p) =>
      p.camadas.reduce((a, c) => a + c.tecnologias.length, 0) >= 4 &&
      !temTech(p, "vault") &&
      tem(p, "infra"),
    porQueNao: (p) => {
      if (temTech(p, "vault")) return "já há gerenciador de segredos na pilha.";
      if (!tem(p, "infra")) return "falta a camada de infra, onde o cofre viveria.";
      return "há menos de quatro tecnologias concretas — poucas credenciais para justificar um cofre.";
    },
    monta: () => ({
      porQue:
        "Várias tecnologias significam várias credenciais. Um cofre permite rotação sem redeploy e acesso auditável.",
      rotulo: "Adicionar gerenciador de segredos",
      acao: { tipo: "tech", techId: "vault", camadaId: "infra" },
    }),
  },
  {
    id: "add-autenticacao",
    titulo: "API aberta sem identidade",
    quando: (p) =>
      tem(p, "api") &&
      tem(p, "ui") &&
      !!p.camadas.find(
        (c) =>
          c.camadaId === "api" &&
          (c.padroes.length > 0 || c.tecnologias.length > 0)
      ) &&
      !temPadrao(p, "autenticacao") &&
      !temPadrao(p, "jwt") &&
      !temTech(p, "api-gateway") &&
      !temTech(p, "idp"),
    porQueNao: (p) => {
      if (
        temPadrao(p, "autenticacao") ||
        temPadrao(p, "jwt") ||
        temTech(p, "api-gateway") ||
        temTech(p, "idp")
      )
        return "já há autenticação (padrão, JWT, gateway ou IdP).";
      if (!tem(p, "ui")) return "sem UI na frente, a API pode ser só interna.";
      return "não há API em uso (com peça) para proteger.";
    },
    monta: () => ({
      porQue:
        "Sem prova de identidade, qualquer cliente que alcançar a rota age em nome de ninguém — e de todo mundo.",
      rotulo: "Adicionar autenticação na API",
      acao: { tipo: "padrao", padraoId: "autenticacao", camadaId: "api" },
    }),
  },
  {
    id: "add-rate-limit-login",
    titulo: "Login sem freio de tentativas",
    quando: (p) =>
      (temPadrao(p, "autenticacao") || temPadrao(p, "jwt") || temTech(p, "idp")) &&
      !temPadrao(p, "rate-limiting") &&
      !temTech(p, "waf") &&
      !temTech(p, "api-gateway"),
    porQueNao: (p) => {
      if (temPadrao(p, "rate-limiting") || temTech(p, "waf") || temTech(p, "api-gateway"))
        return "já há rate limit, WAF ou gateway com quota.";
      return "ainda não há autenticação — rate limit no login vem depois.";
    },
    monta: () => ({
      porQue:
        "Força bruta e stuffing batem no login primeiro. Rate limiting na API corta barato.",
      rotulo: "Adicionar rate limiting",
      acao: { tipo: "padrao", padraoId: "rate-limiting", camadaId: "api" },
    }),
  },
  {
    id: "add-idp",
    titulo: "Delegue identidade a um IdP",
    quando: (p) =>
      temPadrao(p, "autenticacao") &&
      temPadrao(p, "mfa") &&
      !temTech(p, "idp") &&
      tem(p, "api"),
    porQueNao: (p) => {
      if (temTech(p, "idp")) return "já há Identity Provider.";
      if (!temPadrao(p, "autenticacao") || !temPadrao(p, "mfa"))
        return "IdP brilha quando já há auth + MFA para centralizar.";
      return "falta a camada de API.";
    },
    monta: () => ({
      porQue:
        "Auth + MFA no seu código duplica o que um IdP já faz bem: SSO, PKCE e segundo fator num lugar só.",
      rotulo: "Adicionar Identity Provider",
      acao: { tipo: "tech", techId: "idp", camadaId: "api" },
    }),
  },

  // 5) borda
  {
    id: "api-vazia",
    titulo: "Borda sem porta de entrada",
    quando: (p) => tem(p, "api") && !!camadaVazia(p, "api"),
    porQueNao: (p) =>
      !tem(p, "api")
        ? "não há camada de API na pilha."
        : "a borda já tem tecnologia.",
    monta: () => ({
      porQue:
        "Nginx (TLS, balanceamento) ou API Gateway (auth, rate limit) tiram preocupações transversais de dentro dos serviços.",
      rotulo: "Adicionar Nginx",
      acao: { tipo: "tech", techId: "nginx", camadaId: "api" },
    }),
  },
];

/**
 * Motor proativo: olha o estado e propõe o próximo passo mais valioso.
 * Ordenado por prioridade — a UI mostra os primeiros.
 */
export function sugerir(p: EstadoProjeto): Sugestao[] {
  if (p.camadas.length === 0) return [COMECE];
  return CATALOGO.filter((r) => r.quando(p)).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    ...r.monta(p),
  }));
}

/** Uma sugestão que **não** apareceu, e a condição que falta. */
export interface SugestaoAusente {
  id: string;
  titulo: string;
  /** A condição não satisfeita, em prosa. */
  porQueNao: string;
}

/**
 * O outro lado do motor: por que cada sugestão **não** apareceu.
 *
 * Sai da mesma fonte que `sugerir()`, então nunca divergem. É ensino de graça:
 * o motor já sabia a resposta e a guardava para si.
 */
export function porQueNaoSugeriu(p: EstadoProjeto): SugestaoAusente[] {
  if (p.camadas.length === 0) {
    return CATALOGO.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      porQueNao: "o projeto está vazio — comece pelo domínio.",
    }));
  }
  return CATALOGO.filter((r) => !r.quando(p)).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    porQueNao: r.porQueNao(p),
  }));
}

export interface RevisaoProjeto {
  fortes: string[];
  riscos: string[];
  proximos: string[];
  veredito: string;
}

/** Relatório sob demanda: pontos fortes, riscos e próximos passos. */
export function revisarProjeto(p: EstadoProjeto): RevisaoProjeto {
  const insights = avaliarRegras(p);
  const score = calcularScore(p);
  const fortes = insights.filter((i) => i.nivel === "sinergia").map((i) => i.titulo);
  const riscos = insights.filter((i) => i.nivel === "alerta").map((i) => i.titulo);
  const proximos = sugerir(p).slice(0, 4).map((s) => s.titulo);

  const camadasOrdenadas = [...p.camadas]
    .sort(
      (a, b) =>
        ORDEM_CANONICA.indexOf(a.camadaId) - ORDEM_CANONICA.indexOf(b.camadaId)
    )
    .length;

  let veredito: string;
  if (p.camadas.length === 0) {
    veredito = "Projeto vazio — comece pelo domínio.";
  } else if (riscos.length === 0 && score.desacoplamento >= 60) {
    veredito =
      "Arquitetura coerente: as peças têm papel definido e nenhum alerta em aberto. Daqui para frente, cada adição precisa justificar o próprio custo operacional.";
  } else if (riscos.length >= 3) {
    veredito = `${riscos.length} alertas em aberto — vale resolver os riscos antes de adicionar peças novas.`;
  } else if (score.complexidade > 70) {
    veredito =
      "Complexidade alta para o tamanho do projeto: revise se cada padrão e cada tecnologia resolve uma dor real e presente.";
  } else {
    veredito = `Base sólida com ${camadasOrdenadas} camadas e ${riscos.length} ponto(s) de atenção. Siga pelas sugestões para fechar as lacunas.`;
  }

  return { fortes, riscos, proximos, veredito };
}
