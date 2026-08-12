"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Blocks,
  GitCompareArrows,
  CircleHelp,
  LayoutGrid,
  Map,
  Search,
  Sparkles,
} from "lucide-react";
import { CATEGORIAS } from "@/shared/config/categorias";
import {
  listConceitos,
  listRoadmaps,
  listComparacoes,
  getConceito,
} from "@/shared/lib/content";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const conceitos = listConceitos();
  const roadmaps = listRoadmaps();
  // título dos dois lados resolvido aqui para a busca casar por nome
  const comparacoes = listComparacoes().map((c) => ({
    slug: c.slug,
    tituloA: getConceito(c.a)?.titulo ?? c.a,
    tituloB: getConceito(c.b)?.titulo ?? c.b,
  }));

  const ir = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Busca"
      className="entra-subindo fixed left-1/2 top-[max(4rem,env(safe-area-inset-top))] z-[100] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-card-border bg-elevated shadow-[var(--shadow-lg)]"
      overlayClassName="fixed inset-0 z-[99] bg-[#1a0f09]/55 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-card-border px-4">
        <Search className="size-4 shrink-0 text-muted" />
        <Command.Input
          placeholder="Buscar conceitos e roadmaps…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>
      <Command.List className="max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain p-2">
        <Command.Empty className="py-8 text-center text-sm text-muted">
          Nada encontrado.
        </Command.Empty>

        <Command.Group
          heading="Ferramentas"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted"
        >
          <Command.Item
            value="construtor de projeto arquitetura montar drag drop"
            onSelect={() => ir("/construtor")}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/12 data-[selected=true]:text-primary"
          >
            <Blocks className="size-4 shrink-0 text-muted" />
            Construtor de Projeto
          </Command.Item>
          <Command.Item
            value="quiz armadilhas perguntas teste treinar"
            onSelect={() => ir("/quiz")}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/12 data-[selected=true]:text-primary"
            >
              <CircleHelp className="size-4 shrink-0 text-muted" />
              Quiz das armadilhas
            </Command.Item>


          <Command.Item
            value="novidades changelog atualizacoes mudancas versao release"
            onSelect={() => ir("/novidades")}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/12 data-[selected=true]:text-primary"
          >
            <Sparkles className="size-4 shrink-0 text-muted" />
            Novidades
          </Command.Item>
        </Command.Group>

        <Command.Group
          heading="Comparações"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted"
        >
          {comparacoes.map((c) => (
            <Command.Item
              key={c.slug}
              value={`comparar ${c.tituloA} ${c.tituloB} versus diferenca`}
              onSelect={() => ir(`/comparar/${c.slug}`)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/12 data-[selected=true]:text-primary"
            >
              <GitCompareArrows className="size-4 shrink-0 text-muted" />
              {c.tituloA} × {c.tituloB}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Roadmaps"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted"
        >
          {roadmaps.map((r) => (
            <Command.Item
              key={r.slug}
              value={`roadmap ${r.titulo}`}
              onSelect={() => ir(`/roadmaps/${r.slug}`)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/12 data-[selected=true]:text-primary"
            >
              <Map className="size-4 shrink-0 text-muted" />
              {r.titulo}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Conceitos"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted"
        >
          {conceitos.map((c) => (
            <Command.Item
              key={c.slug}
              value={`${c.titulo} ${c.tags.join(" ")} ${CATEGORIAS[c.categoria].label}`}
              onSelect={() => ir(`/conceitos/${c.slug}`)}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/12 data-[selected=true]:text-primary"
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="size-4 shrink-0 text-muted" />
                {c.titulo}
              </span>
              <span className={`text-xs ${CATEGORIAS[c.categoria].text}`}>
                {CATEGORIAS[c.categoria].label}
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
