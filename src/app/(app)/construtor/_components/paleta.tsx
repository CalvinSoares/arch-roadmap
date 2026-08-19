"use client";

import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Plus,
  Layers,
  Puzzle,
  GripVertical,
  Cpu,
  Search,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CAMADAS_DEF, PADROES_DEF } from "@/content/construtor/blocos";
import { TECNOLOGIAS_DEF } from "@/content/construtor/tecnologias";
import {
  CAMADA_VISUAL,
  CATEGORIA_TECH_VISUAL,
  iconeDoPadrao,
  iconeDaTech,
} from "@/shared/config/construtor-visual";
import type { EstadoProjeto } from "@/shared/types/construtor";

/** itens mostrados antes do "ver mais" em cada seção. */
const LIMITE = 5;

/**
 * Função de módulo (e não closure sobre `termo`) para os `useMemo` abaixo
 * terem lista de dependências honesta.
 */
function filtrar<T extends { nome: string; descricao: string }>(
  itens: T[],
  termo: string
): T[] {
  if (!termo) return itens;
  return itens.filter(
    (i) =>
      i.nome.toLowerCase().includes(termo) ||
      i.descricao.toLowerCase().includes(termo)
  );
}

interface ItemProps {
  dragId: string;
  nome: string;
  descricao: string;
  icone: LucideIcon;
  iconeClasse?: string;
  iconeFundo?: string;
  desabilitado?: boolean;
  onAdd: () => void;
  data: Record<string, unknown>;
}

function ItemPaleta({
  dragId,
  nome,
  descricao,
  icone: Icone,
  iconeClasse,
  iconeFundo,
  desabilitado,
  onAdd,
  data,
}: ItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data,
    disabled: desabilitado,
  });

  return (
    <div
      ref={setNodeRef}
      title={desabilitado ? `${nome} já está no projeto` : descricao}
      aria-disabled={desabilitado}
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-lg border bg-card px-1.5 py-1.5 text-[13px] transition-colors",
        desabilitado
          ? "border-dashed border-card-border"
          : "border-card-border hover:border-primary/60",
        isDragging && "opacity-40"
      )}
    >
      <button
        type="button"
        aria-label={`Arrastar ${nome}`}
        {...listeners}
        {...attributes}
        disabled={desabilitado}
        className="cursor-grab touch-none text-muted/60 hover:text-foreground disabled:cursor-default"
      >
        <GripVertical className="size-3.5" />
      </button>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          iconeFundo ?? "bg-muted/10",
          desabilitado && "opacity-50"
        )}
      >
        <Icone className={cn("size-3.5", iconeClasse ?? "text-muted")} strokeWidth={1.8} />
      </span>
      <span className={cn("min-w-0 flex-1 truncate", desabilitado && "text-muted")}>
        {nome}
      </span>
      <button
        type="button"
        aria-label={`Adicionar ${nome}`}
        onClick={onAdd}
        disabled={desabilitado}
        className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/12 hover:text-primary disabled:cursor-default"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function Secao({
  titulo,
  icone: Icone,
  total,
  aberta,
  onToggle,
  children,
  rodape,
}: {
  titulo: string;
  icone: LucideIcon;
  total: number;
  aberta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-card-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberta}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-foreground"
      >
        <Icone className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">{titulo}</span>
        <span className="rounded-full bg-muted/12 px-1.5 text-[10px] tabular-nums">
          {total}
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", aberta && "rotate-180")}
        />
      </button>
      {aberta && (
        <div className="space-y-1 px-2 pb-2">
          {children}
          {rodape}
        </div>
      )}
    </section>
  );
}

interface PaletaProps {
  estado: EstadoProjeto;
  onAddCamada: (camadaId: string) => void;
  onAddPadrao: (padraoId: string) => void;
  onAddTech: (techId: string) => void;
}

export function Paleta({ estado, onAddCamada, onAddPadrao, onAddTech }: PaletaProps) {
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState({
    camadas: true,
    padroes: false,
    techs: false,
  });
  const [verTodos, setVerTodos] = useState({
    camadas: false,
    padroes: false,
    techs: false,
  });

  const termo = busca.trim().toLowerCase();

  const camadas = useMemo(() => filtrar(CAMADAS_DEF, termo), [termo]);
  const padroes = useMemo(() => filtrar(PADROES_DEF, termo), [termo]);
  const techs = useMemo(() => filtrar(TECNOLOGIAS_DEF, termo), [termo]);

  // buscando: tudo aberto e sem limite
  const buscando = termo.length > 0;
  const aberta = (k: keyof typeof abertas) => buscando || abertas[k];
  const limite = (k: keyof typeof verTodos, total: number) =>
    buscando || verTodos[k] ? total : LIMITE;

  const toggle = (k: keyof typeof abertas) =>
    setAbertas((s) => ({ ...s, [k]: !s[k] }));

  const rodapeVerMais = (k: keyof typeof verTodos, total: number) => {
    if (buscando || total <= LIMITE) return null;
    const oculto = total - LIMITE;
    return (
      <button
        type="button"
        onClick={() => setVerTodos((s) => ({ ...s, [k]: !s[k] }))}
        className="mt-1 w-full rounded-md py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/8"
      >
        {verTodos[k] ? "ver menos" : `ver mais (${oculto})`}
      </button>
    );
  };

  return (
    <aside
      aria-label="Paleta de blocos"
      className="space-y-2 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1"
    >
      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar blocos…"
          aria-label="Filtrar blocos da paleta"
          className="h-8 w-full rounded-lg border border-card-border bg-card pl-8 pr-7 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            aria-label="Limpar filtro"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {buscando && camadas.length + padroes.length + techs.length === 0 && (
        <p className="rounded-lg border border-dashed border-card-border p-3 text-center text-xs text-muted">
          Nada encontrado para “{busca}”.
        </p>
      )}

      {/* Camadas */}
      {(!buscando || camadas.length > 0) && (
        <Secao
          titulo="Camadas"
          icone={Layers}
          total={camadas.length}
          aberta={aberta("camadas")}
          onToggle={() => toggle("camadas")}
          rodape={rodapeVerMais("camadas", camadas.length)}
        >
          {camadas.slice(0, limite("camadas", camadas.length)).map((c) => {
            const v = CAMADA_VISUAL[c.id];
            return (
              <ItemPaleta
                key={c.id}
                dragId={`pal-camada:${c.id}`}
                data={{ tipo: "pal-camada", id: c.id, nome: c.nome }}
                nome={c.nome}
                descricao={c.descricao}
                icone={v?.icon ?? Layers}
                iconeClasse={v?.text}
                iconeFundo={v?.bg}
                desabilitado={estado.camadas.some((x) => x.camadaId === c.id)}
                onAdd={() => onAddCamada(c.id)}
              />
            );
          })}
        </Secao>
      )}

      {/* Padrões */}
      {(!buscando || padroes.length > 0) && (
        <Secao
          titulo="Padrões"
          icone={Puzzle}
          total={padroes.length}
          aberta={aberta("padroes")}
          onToggle={() => toggle("padroes")}
          rodape={rodapeVerMais("padroes", padroes.length)}
        >
          {padroes.slice(0, limite("padroes", padroes.length)).map((p) => (
            <ItemPaleta
              key={p.id}
              dragId={`pal-padrao:${p.id}`}
              data={{ tipo: "pal-padrao", id: p.id, nome: p.nome }}
              nome={p.nome}
              descricao={`${p.descricao} (solte sobre uma camada)`}
              icone={iconeDoPadrao(p.id)}
              onAdd={() => onAddPadrao(p.id)}
            />
          ))}
        </Secao>
      )}

      {/* Tecnologias */}
      {(!buscando || techs.length > 0) && (
        <Secao
          titulo="Tecnologias"
          icone={Cpu}
          total={techs.length}
          aberta={aberta("techs")}
          onToggle={() => toggle("techs")}
          rodape={rodapeVerMais("techs", techs.length)}
        >
          {techs.slice(0, limite("techs", techs.length)).map((t) => {
            const cat = CATEGORIA_TECH_VISUAL[t.categoria];
            return (
              <ItemPaleta
                key={t.id}
                dragId={`pal-tech:${t.id}`}
                data={{ tipo: "pal-tech", id: t.id, nome: t.nome }}
                nome={t.nome}
                descricao={`${t.descricao} Vive em: ${t.viveEm.join(", ")}.`}
                icone={iconeDaTech(t.id)}
                iconeClasse={cat.text}
                iconeFundo={cat.bg}
                onAdd={() => onAddTech(t.id)}
              />
            );
          })}
        </Secao>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-muted">
        Arraste para a camada certa: as recomendadas se acendem. Ou use{" "}
        <Plus className="inline size-3" /> para aplicar no lugar típico.
      </p>
    </aside>
  );
}
