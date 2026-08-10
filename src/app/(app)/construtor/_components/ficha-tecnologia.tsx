"use client";

import Link from "next/link";
import { X, ArrowUpRight, Check } from "lucide-react";
import { Badge } from "@/shared/components/global/ui/badge";
import { Icone } from "@/shared/components/global/icone";
import { cn } from "@/shared/utils/cn";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import { camadaDef } from "@/content/construtor/blocos";
import { getConceito } from "@/shared/lib/content";
import {
  iconeDaTech,
  CATEGORIA_TECH_VISUAL,
  CAMADA_VISUAL,
} from "@/shared/config/construtor-visual";

interface Props {
  techId: string | null;
  onClose: () => void;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted">{rotulo}</span>
      <span className="text-foreground">{valor}</span>
    </div>
  );
}

/** Drawer com a ficha técnica de uma tecnologia do catálogo. */
export function FichaTecnologia({ techId, onClose }: Props) {
  if (!techId) return null;
  const def = tecnologiaDef(techId);
  if (!def) return null;

  const cat = CATEGORIA_TECH_VISUAL[def.categoria];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside
        aria-label={`Ficha de ${def.nome}`}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-card-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-card-border p-5">
          <div className="flex items-center gap-3">
            <span className={cn("flex size-11 items-center justify-center rounded-xl", cat.bg)}>
              <Icone
                de={iconeDaTech(def.id)}
                className={cn("size-5", cat.text)}
                strokeWidth={1.8}
              />
            </span>
            <div>
              <h2 className="text-xl font-semibold">{def.nome}</h2>
              <Badge className={cn("mt-1", cat.bg, cat.text)}>{cat.label}</Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted hover:bg-muted/10"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-foreground">{def.diferencaQueFaz}</p>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Onde vive
            </p>
            <div className="flex flex-wrap gap-1.5">
              {def.viveEm.map((cid) => {
                const c = camadaDef(cid);
                const v = CAMADA_VISUAL[cid];
                return (
                  <span
                    key={cid}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                      v?.bg,
                      v?.text
                    )}
                  >
                    {v?.icon && <Icone de={v.icon} className="size-3.5" />}
                    {c?.nome ?? cid}
                  </span>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Usos típicos
            </p>
            <ul className="space-y-1.5">
              {def.usos.map((u) => (
                <li key={u} className="flex gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-cat-criacional" />
                  {u}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-1.5 rounded-xl border border-card-border bg-background p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Especificações
            </p>
            <Linha rotulo="Modelo" valor={def.especificacoes.modelo} />
            <Linha rotulo="Persistência" valor={def.especificacoes.persistencia} />
            <Linha rotulo="Consistência" valor={def.especificacoes.consistencia} />
            <Linha rotulo="Latência" valor={def.especificacoes.latencia} />
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Alternativas
            </p>
            <p className="text-sm text-muted">{def.alternativas.join(" · ")}</p>
          </section>

          {def.conceitos && def.conceitos.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Conceitos relacionados
              </p>
              <div className="flex flex-wrap gap-2">
                {def.conceitos.map((slug) => {
                  const c = getConceito(slug);
                  if (!c) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/conceitos/${slug}`}
                      className="flex items-center gap-1 rounded-lg border border-card-border px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary"
                    >
                      {c.titulo} <ArrowUpRight className="size-3" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
