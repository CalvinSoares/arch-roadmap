import type { EstadoProjeto } from "@/shared/types/construtor";

/**
 * Modo "quebre isto": em vez de montar, você recebe uma arquitetura pronta e
 * tem que achar o defeito.
 *
 * O gabarito **não é transcrito** — é o que `avaliarRegras(estado)` devolve.
 * `esperadas` só nomeia quais dos alertas o desafio cobra, e há spec garantindo
 * que todos existem e que nenhum alerta ficou de fora. Se alguém mexer numa
 * regra, o desafio que dependia dela falha na hora, em vez de virar uma
 * pergunta sem resposta.
 */
export interface Desafio {
  id: string;
  /** O enunciado: o que esta arquitetura deveria fazer. */
  contexto: string;
  /** A pilha montada, com o defeito plantado. */
  estado: EstadoProjeto;
  /** Ids das regras de nível `alerta` que o desafio cobra. */
  esperadas: string[];
  /** A explicação que aparece depois da tentativa. */
  veredito: string;
}

export const DESAFIOS: Desafio[] = [
  {
    id: "webhook-no-request",
    contexto:
      "Um gateway de pagamento notifica a sua aplicação por webhook a cada cobrança aprovada. O time montou a rota de recebimento e processa a baixa do pedido ali mesmo, dentro da requisição. Em produção, o provedor começou a reenviar notificações e alguns pedidos foram baixados duas vezes.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        {
          camadaId: "api",
          padroes: ["webhooks", "autenticacao", "rate-limiting"],
          tecnologias: ["nginx"],
        },
        { camadaId: "aplicacao", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "infra", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["webhooks-sem-fila"],
    veredito:
      "Processar o webhook dentro da requisição amarra o tempo de resposta ao trabalho pesado — e o provedor, ao não receber `200` a tempo, reenvia. A reentrega é o comportamento **correto** dele. A saída é receber, persistir e responder rápido, deixando o processamento para uma fila — e tornar a baixa idempotente, para que a reentrega não produza efeito novo.",
  },
  {
    id: "indice-sem-pipeline",
    contexto:
      "Uma vitrine de e-commerce usa Postgres para a escrita e Elasticsearch para a busca. O time separou os dois stores para escalar a leitura. Semanas depois, clientes reclamam que produtos esgotados continuam aparecendo na busca, e que produtos novos demoram a aparecer.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        { camadaId: "api", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "read-store", padroes: [], tecnologias: ["elasticsearch"] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["elastic-sem-fila"],
    veredito:
      "Dois stores separados não se sincronizam sozinhos. Sem um caminho explícito levando as mudanças da escrita para o índice, a divergência é questão de tempo — e ela não aparece em teste, porque em desenvolvimento alguém reindexa à mão. O par de stores só é honesto com uma projeção declarada no meio.",
  },
  {
    id: "sem-dominio",
    contexto:
      "Um time montou um serviço de checkout distribuído: a API recebe o pedido, coordena pagamento e estoque com uma Saga, e grava tudo. Postgres, Redis e Kafka estão na infra. O código do fluxo mora nos controladores da API.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        {
          camadaId: "api",
          padroes: ["saga", "autenticacao", "rate-limiting"],
          tecnologias: ["nginx"],
        },
        {
          camadaId: "infra",
          padroes: [],
          tecnologias: ["postgres", "redis", "kafka"],
        },
      ],
    },
    esperadas: [
      "sem-dominio",
      "saga-sem-fila",
      "padrao-fora:saga:api",
      "tech-fora:redis:infra",
      "tech-fora:kafka:infra",
    ],
    veredito:
      "Coordenar uma transação distribuída é a regra de negócio mais delicada que este sistema tem — e ela está no controlador, misturada com desserialização de JSON e código de HTTP. Sem camada de domínio, não há onde testar a compensação isoladamente, e a Saga fica presa ao formato da requisição que a disparou.",
  },
  {
    id: "eventos-sem-projecao",
    contexto:
      "Um time adotou Event Sourcing no domínio para ter auditoria completa: nada é sobrescrito, tudo vira evento. Três meses depois, a tela de listagem de pedidos começou a levar oito segundos para carregar, e piora a cada semana.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        { camadaId: "api", padroes: [], tecnologias: [] },
        { camadaId: "aplicacao", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: ["event-sourcing"], tecnologias: [] },
        { camadaId: "infra", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["event-sourcing-sem-cqrs", "padrao-fora:event-sourcing:dominio"],
    veredito:
      "Event Sourcing guarda o histórico, não o estado atual. Cada leitura reconstrói o agregado reproduzindo todos os eventos dele — e a lentidão cresce com o tempo, de forma que nenhum teste de carga inicial revela. É por isso que Event Sourcing quase nunca anda sozinho: sem projeções para leitura, ele entrega auditoria e cobra a consulta.",
  },
  {
    id: "retry-sem-rede",
    contexto:
      "Depois de um incidente em que uma API externa ficou instável por dez minutos, o time adicionou retry em todas as chamadas de saída: três tentativas com espera crescente. A instabilidade seguinte não gerou erro para o usuário — gerou dois pedidos cobrados em duplicidade e um pool de conexões esgotado.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        {
          camadaId: "api",
          padroes: ["retry", "autenticacao", "rate-limiting"],
          tecnologias: ["nginx"],
        },
        { camadaId: "aplicacao", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["retry-sem-timeout", "retry-sem-idempotencia"],
    veredito:
      "Retry foi adicionado sozinho, e ele não funciona sozinho. Sem **timeout**, não existe evento de falha para o retry reagir: a primeira tentativa pendura e as outras duas nunca acontecem — daí o pool esgotado. E sem **idempotência**, um timeout numa escrita é ambíguo (pode ter sido executada e só a resposta ter se perdido), então repetir cobra duas vezes. A ordem de adoção é Timeout → Idempotência → Retry; invertê-la produz exatamente os dois sintomas do enunciado.",
  },
  {
    id: "fila-sem-rede-de-seguranca",
    contexto:
      "Um checkout distribuído usa Saga para coordenar pagamento, estoque e entrega, publicando cada passo numa fila. Depois de um deploy do produtor que mudou o formato de um campo, a fila acumulou 40 mil mensagens em uma hora, o consumo travou — e alguns pedidos ficaram parados num passo que já tinha acontecido.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        {
          camadaId: "api",
          padroes: ["timeout", "autenticacao", "rate-limiting"],
          tecnologias: ["nginx"],
        },
        { camadaId: "aplicacao", padroes: ["saga"], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "fila", padroes: [], tecnologias: ["kafka"] },
      ],
    },
    esperadas: ["fila-sem-dlq", "saga-sem-outbox"],
    veredito:
      "Os dois sintomas do enunciado têm causas diferentes. As 40 mil mensagens são *poison message*: sem **Dead Letter Queue**, a mensagem que nunca vai dar certo volta para a fila indefinidamente e bloqueia quem está atrás. Os pedidos parados num passo já executado são outra coisa: gravar no banco e publicar na fila são duas operações sem transação em comum, e o processo morreu entre elas — o dado mudou e ninguém foi avisado. É o que o **Outbox** resolve, gravando o evento na mesma transação do dado.",
  },
  {
    id: "ordem-invertida",
    contexto:
      "Um time novo montou a arquitetura de um serviço interno. Cada camada isolada faz sentido e o serviço funciona. Mas a revisão de arquitetura reprovou o desenho antes mesmo de olhar o código.",
    estado: {
      camadas: [
        { camadaId: "infra", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "api", padroes: [], tecnologias: [] },
        { camadaId: "ui", padroes: [], tecnologias: [] },
      ],
    },
    esperadas: ["api-acima-da-ui", "dados-acima-do-dominio"],
    veredito:
      "A ordem das camadas é a direção das dependências, e aqui ela aponta para o lado errado: os dados estão acima do domínio, e a API acima da interface que a consome. Um desenho invertido costuma sobreviver ao primeiro release e cobrar caro no segundo, quando alguém precisa trocar o banco e descobre que o domínio depende dele.",
  },
  {
    id: "api-publica-aberta",
    contexto:
      "O time lançou o painel web e a API no mesmo dia. Qualquer um que descubra a URL de `POST /admin/usuarios` cria contas e apaga dados — não há login, não há token, não há gateway. O bug report veio de um cliente que 'só estava testando com curl'.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        { camadaId: "api", padroes: [], tecnologias: ["nginx"] },
        { camadaId: "aplicacao", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: ["hexagonal"], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["api-sem-autenticacao"],
    veredito:
      "Nginx na frente não autentica — só termina TLS e balanceia. Sem sessão, JWT, IdP ou gateway com auth, a API é pública de verdade. O primeiro passo é autenticação na borda; autorização e rate limit vêm em seguida.",
  },
  {
    id: "login-sem-freio",
    contexto:
      "O login usa sessão com cookie httpOnly — desenho correto. Em uma noite, um atacante testou milhões de pares e-mail/senha contra `/login`. As contas fracas caíram; o banco de autenticação ficou saturado. Não havia teto de tentativas.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        { camadaId: "api", padroes: ["autenticacao"], tecnologias: ["nginx"] },
        { camadaId: "aplicacao", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["autenticacao-sem-rate-limit"],
    veredito:
      "Autenticação sem rate limit convida stuffing e força bruta. O corte barato é limitar tentativas por IP e por conta (e preferir MFA nas contas de valor). Gateway ou WAF com quota também contam.",
  },
  {
    id: "roles-sem-identidade",
    contexto:
      "O time adicionou guards de role (`admin`, `editor`) em todas as rotas sensíveis. Em staging, as rotas devolviam 403 para todo mundo — inclusive depois do 'login' fake que só setava `req.roles` no middleware sem nunca autenticar um usuário real.",
    estado: {
      camadas: [
        { camadaId: "ui", padroes: [], tecnologias: [] },
        {
          camadaId: "api",
          padroes: ["autorizacao", "rate-limiting"],
          tecnologias: ["nginx"],
        },
        { camadaId: "aplicacao", padroes: [], tecnologias: [] },
        { camadaId: "dominio", padroes: [], tecnologias: [] },
        { camadaId: "write-store", padroes: [], tecnologias: ["postgres"] },
      ],
    },
    esperadas: ["autorizacao-sem-autenticacao", "api-sem-autenticacao"],
    veredito:
      "Roles precisam de identidade. Sem autenticação (ou JWT/IdP), o guard não tem em quem colar o papel — ou bloqueia todo mundo, ou confia num `roles` que qualquer cliente inventa. Autentique primeiro; autorize depois.",
  },
];
