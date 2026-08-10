"use client";

import Link from "next/link";
import { Search, Clock } from "lucide-react";
import { Card } from "@/shared/components/global/ui/card";
import { Badge } from "@/shared/components/global/ui/badge";
import { Button } from "@/shared/components/global/ui/button";
import { CATEGORIAS, DIFICULDADES } from "@/shared/config/categorias";
import { cn } from "@/shared/utils/cn";
import type { Conceito } from "@/shared/types/conceito";
import { useCatalogo } from "../hook/catalogo.hook";
import { OPCOES_CATEGORIA } from "../utils/catalogo.utils";

export function CatalogoConceitos({ conceitos }: { conceitos: Conceito[] }) {
  const { categoria, setCategoria, busca, setBusca, resultado } =
    useCatalogo(conceitos);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, tag…"
            className="h-10 w-full rounded-lg border border-card-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {OPCOES_CATEGORIA.map((op) => (
            <Button
              key={op.value}
              size="sm"
              variant={categoria === op.value ? "primary" : "outline"}
              onClick={() => setCategoria(op.value)}
            >
              {op.label}
            </Button>
          ))}
        </div>
      </div>

      {resultado.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Nenhum conceito encontrado para esse filtro.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultado.map((c) => {
            const cat = CATEGORIAS[c.categoria];
            return (
              <Link key={c.slug} href={`/conceitos/${c.slug}`}>
                <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <Badge className={cat.badge}>{cat.label}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="size-3" /> {c.tempoLeitura} min
                    </span>
                  </div>
                  <h3 className="mt-3 font-medium">{c.titulo}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted">
                    {c.resumo}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <span className={cn("font-medium", cat.text)}>
                      {DIFICULDADES[c.dificuldade]}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
