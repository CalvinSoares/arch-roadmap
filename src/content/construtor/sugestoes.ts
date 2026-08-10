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
 * Motor proativo: olha o estado e propõe o próximo passo mais valioso.
 * Ordenado por prioridade — a UI mostra os primeiros.
 */
export function sugerir(p: EstadoProjeto): Sugestao[] {
  const out: Sugestao[] = [];

  // 1) fundação
  if (p.camadas.length === 0) {
    return [
      {
        id: "comece-dominio",
        titulo: "Comece pelo domínio",
        porQue:
          "É onde vivem as regras de negócio — tudo o mais existe para servi-lo. Depois desça para os dados e suba para a borda.",
        rotulo: "Adicionar Domínio",
        acao: { tipo: "camada", camadaId: "dominio" },
      },
    ];
  }
  if (!tem(p, "dominio")) {
    out.push({
      id: "add-dominio",
      titulo: "Falta o domínio",
      porQue:
        "Sem uma camada de regras de negócio, as outras não têm o que proteger — e a lógica se espalha pela borda e pelo banco.",
      rotulo: "Adicionar Domínio",
      acao: { tipo: "camada", camadaId: "dominio" },
    });
  }
  if (paresForaDeOrdem(p).length > 0) {
    out.push({
      id: "arrumar-ordem",
      titulo: "A pilha está fora de ordem",
      porQue:
        "O diagrama fica ilegível e as dependências parecem apontar para fora do domínio. Uma reordenação resolve.",
      rotulo: "Organizar ordem",
      acao: { tipo: "ordem" },
    });
  }
  if (!temBanco(p)) {
    const alvo: CamadaId = tem(p, "write-store")
      ? "write-store"
      : tem(p, "infra")
        ? "infra"
        : "infra";
    out.push({
      id: "add-banco",
      titulo: "Defina a fonte da verdade",
      porQue:
        "Nenhum banco durável no projeto: sem ele não há onde persistir com garantia — cache e índice são derivados.",
      rotulo: tem(p, alvo) ? "Adicionar PostgreSQL" : "Adicionar Infra / Banco",
      acao: tem(p, alvo)
        ? { tipo: "tech", techId: "postgres", camadaId: alvo }
        : { tipo: "camada", camadaId: "infra" },
    });
  }

  // 2) camada de dados sem tecnologia
  if (tem(p, "read-store") && camadaVazia(p, "read-store")) {
    out.push({
      id: "read-store-vazio",
      titulo: "Read store sem tecnologia",
      porQue:
        "A camada de leitura existe mas está vazia. Redis serve as consultas quentes em microssegundos e alivia o banco.",
      rotulo: "Adicionar Redis",
      acao: { tipo: "tech", techId: "redis", camadaId: "read-store" },
    });
  }
  if (tem(p, "write-store") && camadaVazia(p, "write-store")) {
    out.push({
      id: "write-store-vazio",
      titulo: "Write store sem tecnologia",
      porQue:
        "O lado de escrita precisa de um banco com transações para garantir as invariantes do domínio.",
      rotulo: "Adicionar PostgreSQL",
      acao: { tipo: "tech", techId: "postgres", camadaId: "write-store" },
    });
  }
  if (tem(p, "fila") && !temBroker(p)) {
    out.push({
      id: "fila-vazia",
      titulo: "Fila sem broker",
      porQue:
        "Escolha o papel: Kafka é log de eventos (consumidores releem, integração/streaming); RabbitMQ é fila de trabalho (jobs com retry e DLQ).",
      rotulo: "Adicionar Kafka",
      acao: { tipo: "tech", techId: "kafka", camadaId: "fila" },
    });
  }

  // 3) padrões que destravam valor
  if (tem(p, "dominio") && !temPadrao(p, "hexagonal")) {
    out.push({
      id: "add-hexagonal",
      titulo: "Proteja o domínio com portas",
      porQue:
        "Hexagonal deixa infraestrutura plugável e o domínio testável em milissegundos, sem subir banco nem HTTP.",
      rotulo: "Aplicar Hexagonal no domínio",
      acao: { tipo: "padrao", padraoId: "hexagonal", camadaId: "dominio" },
    });
  }
  if (
    tem(p, "read-store") &&
    tem(p, "write-store") &&
    !temPadrao(p, "cqrs") &&
    tem(p, "aplicacao")
  ) {
    out.push({
      id: "add-cqrs",
      titulo: "Dê papel aos dois stores",
      porQue:
        "Read e write separados sem CQRS é replicação sem propósito. Com o padrão, cada lado é otimizado para o próprio trabalho.",
      rotulo: "Aplicar CQRS na aplicação",
      acao: { tipo: "padrao", padraoId: "cqrs", camadaId: "aplicacao" },
    });
  }
  if (temTech(p, "kafka") && !temPadrao(p, "cqrs") && tem(p, "aplicacao")) {
    out.push({
      id: "kafka-projecao",
      titulo: "Use os eventos para projetar leitura",
      porQue:
        "Com Kafka no projeto, CQRS transforma cada evento de escrita em atualização de read model — leitura rápida sem tocar no caminho transacional.",
      rotulo: "Aplicar CQRS na aplicação",
      acao: { tipo: "padrao", padraoId: "cqrs", camadaId: "aplicacao" },
    });
  }

  // 4) resiliência e operação
  if (temBroker(p) && !temTech(p, "worker")) {
    out.push({
      id: "add-worker",
      titulo: "Quem consome a fila?",
      porQue:
        "Um Worker tira o trabalho pesado da requisição: o usuário recebe 202 na hora e o processamento acontece depois, com retry.",
      rotulo: "Adicionar Worker",
      acao: {
        tipo: "tech",
        techId: "worker",
        camadaId: tem(p, "aplicacao") ? "aplicacao" : "infra",
      },
    });
  }
  if (p.camadas.length >= 5 && !temTech(p, "prometheus") && tem(p, "infra")) {
    out.push({
      id: "add-observabilidade",
      titulo: "Ninguém está vigiando",
      porQue:
        "Com essa quantidade de peças, você descobriria incidentes pelo usuário reclamando. Métricas viram alerta antes de virar lentidão.",
      rotulo: "Adicionar Prometheus",
      acao: { tipo: "tech", techId: "prometheus", camadaId: "infra" },
    });
  }
  if (temBanco(p) && !temTech(p, "redis") && !temTech(p, "memcached") && p.camadas.length >= 4) {
    out.push({
      id: "add-cache",
      titulo: "O banco é seu ponto único de leitura",
      porQue:
        "Um cache absorve as consultas quentes: latência em µs e, num incidente do banco, o cache quente ainda serve leitura.",
      rotulo: tem(p, "read-store")
        ? "Adicionar Redis no read store"
        : "Adicionar camada Read store",
      acao: tem(p, "read-store")
        ? { tipo: "tech", techId: "redis", camadaId: "read-store" }
        : { tipo: "camada", camadaId: "read-store" },
    });
  }
  if (temTech(p, "s3") && !temTech(p, "cdn") && tem(p, "ui")) {
    out.push({
      id: "add-cdn",
      titulo: "Entregue a mídia pela borda",
      porQue:
        "Com storage no projeto, uma CDN na frente serve os arquivos a ~20ms do usuário e poupa a origem.",
      rotulo: "Adicionar CDN",
      acao: { tipo: "tech", techId: "cdn", camadaId: "ui" },
    });
  }
  if (
    p.camadas.reduce((a, c) => a + c.tecnologias.length, 0) >= 4 &&
    !temTech(p, "vault") &&
    tem(p, "infra")
  ) {
    out.push({
      id: "add-vault",
      titulo: "Credenciais espalhadas",
      porQue:
        "Várias tecnologias significam várias credenciais. Um cofre permite rotação sem redeploy e acesso auditável.",
      rotulo: "Adicionar gerenciador de segredos",
      acao: { tipo: "tech", techId: "vault", camadaId: "infra" },
    });
  }

  // 5) borda
  if (tem(p, "api") && camadaVazia(p, "api")) {
    out.push({
      id: "api-vazia",
      titulo: "Borda sem porta de entrada",
      porQue:
        "Nginx (TLS, balanceamento) ou API Gateway (auth, rate limit) tiram preocupações transversais de dentro dos serviços.",
      rotulo: "Adicionar Nginx",
      acao: { tipo: "tech", techId: "nginx", camadaId: "api" },
    });
  }

  return out;
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
