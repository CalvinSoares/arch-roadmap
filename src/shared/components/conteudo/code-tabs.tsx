"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/global/ui/tabs";
import { Button } from "@/shared/components/global/ui/button";
import { useCopy } from "@/shared/hook/use-copy";
import { LINGUAGENS } from "@/shared/config/categorias";
import type { LinguagemCodigo } from "@/shared/types/conceito";

export interface ExemploDestacado {
  lang: LinguagemCodigo;
  code: string;
  /** HTML gerado pelo Shiki no servidor. */
  html: string;
}

/** Abas de código por linguagem com highlight (Shiki) e botão copiar. */
export function CodeTabs({ exemplos }: { exemplos: ExemploDestacado[] }) {
  const [active, setActive] = useState<LinguagemCodigo>(
    exemplos[0]?.lang ?? "typescript"
  );
  const { copied, copy } = useCopy();

  if (exemplos.length === 0) return null;

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as LinguagemCodigo)}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          {exemplos.map((ex) => (
            <TabsTrigger key={ex.lang} value={ex.lang}>
              {LINGUAGENS[ex.lang] ?? ex.lang}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copy(exemplos.find((e) => e.lang === active)?.code ?? "")}
        >
          {copied ? <Check className="text-cat-criacional" /> : <Copy />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      {exemplos.map((ex) => (
        <TabsContent key={ex.lang} value={ex.lang}>
          <div
            className="text-sm [&_pre]:!m-0"
            dangerouslySetInnerHTML={{ __html: ex.html }}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
