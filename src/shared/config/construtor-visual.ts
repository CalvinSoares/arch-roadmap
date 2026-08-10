import {
  Monitor,
  Globe,
  Workflow,
  Gem,
  Server,
  Database,
  DatabaseZap,
  Inbox,
  Factory,
  Boxes,
  Hammer,
  CircleDot,
  Plug,
  PackagePlus,
  DoorOpen,
  Bell,
  Route,
  ToggleLeft,
  Split,
  GitFork,
  Undo2,
  Hexagon,
  History,
  Puzzle,
  Zap,
  MemoryStick,
  Leaf,
  AudioLines,
  Rabbit,
  Search,
  Network,
  Earth,
  Archive,
  Activity,
  Cpu,
  Copy,
  Cog,
  Cable,
  KeyRound,
  Repeat,
  Milestone,
  Landmark,
  ScrollText,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import type { CategoriaTech } from "@/shared/types/construtor";

interface VisualCamada {
  icon: LucideIcon;
  /** classes de acento (texto / fundo suave) — tokens do tema. */
  text: string;
  bg: string;
  border: string;
}

/** Identidade visual de cada camada no construtor (ícone + acento). */
export const CAMADA_VISUAL: Record<string, VisualCamada> = {
  ui: {
    icon: Monitor,
    text: "text-cat-estrutural",
    bg: "bg-cat-estrutural/12",
    border: "border-cat-estrutural/50",
  },
  api: {
    icon: Globe,
    text: "text-cat-comportamental",
    bg: "bg-cat-comportamental/12",
    border: "border-cat-comportamental/50",
  },
  aplicacao: {
    icon: Workflow,
    text: "text-primary",
    bg: "bg-primary/12",
    border: "border-primary/50",
  },
  dominio: {
    icon: Gem,
    text: "text-cat-criacional",
    bg: "bg-cat-criacional/12",
    border: "border-cat-criacional/50",
  },
  infra: {
    icon: Server,
    text: "text-muted",
    bg: "bg-muted/12",
    border: "border-muted/50",
  },
  "write-store": {
    icon: Database,
    text: "text-cat-principio",
    bg: "bg-cat-principio/12",
    border: "border-cat-principio/50",
  },
  "read-store": {
    icon: DatabaseZap,
    text: "text-cat-principio",
    bg: "bg-cat-principio/12",
    border: "border-cat-principio/50",
  },
  fila: {
    icon: Inbox,
    text: "text-cat-arquitetura",
    bg: "bg-cat-arquitetura/12",
    border: "border-cat-arquitetura/50",
  },
};

/** Ícone de cada padrão (paleta, chips no canvas). */
export const PADRAO_ICON: Record<string, LucideIcon> = {
  "factory-method": Factory,
  "abstract-factory": Boxes,
  builder: Hammer,
  singleton: CircleDot,
  adapter: Plug,
  decorator: PackagePlus,
  facade: DoorOpen,
  observer: Bell,
  strategy: Route,
  state: ToggleLeft,
  cqs: Split,
  cqrs: GitFork,
  saga: Undo2,
  hexagonal: Hexagon,
  "event-sourcing": History,
  idempotencia: Repeat,
  "maquina-de-estados": Milestone,
  ledger: Landmark,
  "append-only": ScrollText,
  webhooks: Webhook,
};

export function iconeDoPadrao(id: string): LucideIcon {
  return PADRAO_ICON[id] ?? Puzzle;
}

/** Ícone de cada tecnologia (paleta, chips, ficha). */
export const TECH_ICON: Record<string, LucideIcon> = {
  redis: Zap,
  memcached: MemoryStick,
  "replica-leitura": Copy,
  worker: Cog,
  "api-gateway": DoorOpen,
  grpc: Cable,
  vault: KeyRound,
  postgres: Database,
  mongodb: Leaf,
  kafka: AudioLines,
  rabbitmq: Rabbit,
  elasticsearch: Search,
  nginx: Network,
  cdn: Earth,
  s3: Archive,
  prometheus: Activity,
};

export function iconeDaTech(id: string): LucideIcon {
  return TECH_ICON[id] ?? Cpu;
}

interface VisualCategoriaTech {
  text: string;
  bg: string;
  label: string;
}

/** Acento visual por categoria de tecnologia. */
export const CATEGORIA_TECH_VISUAL: Record<CategoriaTech, VisualCategoriaTech> = {
  cache: { text: "text-cat-principio", bg: "bg-cat-principio/12", label: "Cache" },
  banco: { text: "text-cat-estrutural", bg: "bg-cat-estrutural/12", label: "Banco de dados" },
  fila: { text: "text-cat-comportamental", bg: "bg-cat-comportamental/12", label: "Fila / Streaming" },
  busca: { text: "text-cat-criacional", bg: "bg-cat-criacional/12", label: "Busca" },
  borda: { text: "text-primary", bg: "bg-primary/12", label: "Borda / Rede" },
  storage: { text: "text-cat-arquitetura", bg: "bg-cat-arquitetura/12", label: "Storage" },
  observabilidade: { text: "text-muted", bg: "bg-muted/12", label: "Observabilidade" },
  compute: { text: "text-cat-criacional", bg: "bg-cat-criacional/12", label: "Processamento" },
  seguranca: { text: "text-cat-arquitetura", bg: "bg-cat-arquitetura/12", label: "Segurança" },
};
