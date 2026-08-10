import type { CamadaDef, CamadaId, PadraoDef } from "@/shared/types/construtor";

/** Camadas disponíveis na paleta (uma instância de cada por projeto). */
export const CAMADAS_DEF: CamadaDef[] = [
  {
    id: "ui",
    nome: "UI / Frontend",
    descricao: "Telas e interação com o usuário. Traduz cliques em intenções.",
  },
  {
    id: "api",
    nome: "API / Gateway",
    descricao: "Borda HTTP do sistema: rotas, autenticação, tradução de contratos.",
  },
  {
    id: "aplicacao",
    nome: "Aplicação (casos de uso)",
    descricao: "Orquestra o domínio: cada caso de uso é um fluxo de negócio.",
  },
  {
    id: "dominio",
    nome: "Domínio",
    descricao: "Regras e invariantes de negócio — a parte valiosa e estável.",
  },
  {
    id: "infra",
    nome: "Infra / Banco",
    descricao: "Persistência, clientes externos, detalhes de tecnologia.",
  },
  {
    id: "write-store",
    nome: "Write store",
    descricao: "Modelo de escrita: normalizado, consistente, dono das invariantes.",
  },
  {
    id: "read-store",
    nome: "Read store",
    descricao: "Modelos de leitura desnormalizados, moldados por tela.",
  },
  {
    id: "fila",
    nome: "Fila de eventos",
    descricao: "Mensageria: desacopla produtores de consumidores no tempo.",
  },
];

/** Padrões aplicáveis às camadas (soltar numa camada = aplicar). */
export const PADROES_DEF: PadraoDef[] = [
  {
    id: "factory-method",
    nome: "Factory Method",
    descricao: "Criação de objetos sem acoplar o cliente às classes concretas.",
    aplicaEm: ["aplicacao", "dominio"],
  },
  {
    id: "adapter",
    nome: "Adapter",
    descricao: "Traduz contratos incompatíveis na borda do sistema.",
    aplicaEm: ["api", "infra"],
  },
  {
    id: "observer",
    nome: "Observer",
    descricao: "Objetos reagem a mudanças de estado sem acoplamento direto.",
    aplicaEm: ["ui", "aplicacao", "fila"],
  },
  {
    id: "strategy",
    nome: "Strategy",
    descricao: "Algoritmos intercambiáveis atrás de uma interface comum.",
    aplicaEm: ["dominio", "aplicacao"],
  },
  {
    id: "cqs",
    nome: "CQS",
    descricao: "Métodos ou comandam ou consultam — nunca os dois.",
    aplicaEm: ["ui", "api", "aplicacao", "dominio", "infra"],
  },
  {
    id: "hexagonal",
    nome: "Hexagonal",
    descricao: "Domínio no centro; portas e adaptadores nas bordas.",
    aplicaEm: ["dominio"],
  },
  {
    id: "cqrs",
    nome: "CQRS",
    descricao: "Modelo de escrita separado do(s) modelo(s) de leitura.",
    aplicaEm: ["aplicacao", "write-store", "read-store"],
  },
  {
    id: "saga",
    nome: "Saga",
    descricao: "Transações distribuídas por passos locais + compensações.",
    aplicaEm: ["aplicacao", "fila"],
  },
  {
    id: "decorator",
    nome: "Decorator",
    descricao: "Empilha comportamentos (log, retry, cache) sem alterar o objeto.",
    aplicaEm: ["api", "aplicacao"],
  },
  {
    id: "facade",
    nome: "Facade",
    descricao: "Um ponto de entrada simples escondendo um subsistema complexo.",
    aplicaEm: ["api", "aplicacao"],
  },
  {
    id: "singleton",
    nome: "Singleton",
    descricao: "Instância única global — use com parcimônia.",
    aplicaEm: ["infra"],
  },
  {
    id: "event-sourcing",
    nome: "Event Sourcing",
    descricao: "O estado é a sequência de eventos imutáveis, não um snapshot.",
    aplicaEm: ["write-store"],
  },
  {
    id: "abstract-factory",
    nome: "Abstract Factory",
    descricao: "Cria famílias de objetos que precisam combinar entre si.",
    aplicaEm: ["aplicacao", "dominio", "infra"],
  },
  {
    id: "builder",
    nome: "Builder",
    descricao: "Monta objetos complexos passo a passo, sem construtor gigante.",
    aplicaEm: ["aplicacao", "dominio"],
  },
  {
    id: "state",
    nome: "State",
    descricao: "O objeto muda de comportamento conforme o estado interno.",
    aplicaEm: ["dominio", "aplicacao"],
  },
];

export const camadaDef = (id: string) => CAMADAS_DEF.find((c) => c.id === id);
export const padraoDef = (id: string) => PADROES_DEF.find((p) => p.id === id);

/**
 * Ordem canônica da pilha: do mais próximo do usuário (topo) ao mais próximo
 * do metal (base). Base das regras de ordem e do botão "Organizar".
 */
export const ORDEM_CANONICA: CamadaId[] = [
  "ui",
  "api",
  "aplicacao",
  "dominio",
  "write-store",
  "read-store",
  "fila",
  "infra",
];

export const posicaoCanonica = (id: string) =>
  ORDEM_CANONICA.indexOf(id as CamadaId);
