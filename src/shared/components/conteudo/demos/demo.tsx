"use client";

import type { DemoId } from "@/shared/types/bloco";
import { ObserverPlayground } from "./observer-playground";
import { StrategyPlayground } from "./strategy-playground";
import { AdapterPlayground } from "./adapter-playground";
import { CqrsPlayground } from "./cqrs-playground";
import { IsolamentoPlayground } from "./isolamento-playground";
import { EscalaPlayground } from "./escala-playground";
import { FalhaPlayground } from "./falha-playground";

/** Seleciona a demo interativa pelo id declarado no bloco. */
export function Demo({ id }: { id: DemoId }) {
  switch (id) {
    case "observer":
      return <ObserverPlayground />;
    case "strategy":
      return <StrategyPlayground />;
    case "adapter":
      return <AdapterPlayground />;
    case "cqrs":
      return <CqrsPlayground />;
    case "isolamento":
      return <IsolamentoPlayground />;
    case "escala":
      return <EscalaPlayground />;
    case "falha-cache":
      return <FalhaPlayground variante="cache" />;
    case "falha-timeout":
      return <FalhaPlayground variante="timeout" />;
    default:
      return null;
  }
}
