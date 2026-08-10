"use client";

import { useMemo, useState } from "react";
import type { Conceito } from "@/shared/types/conceito";
import {
  filtrarConceitos,
  type FiltroCategoria,
} from "../utils/catalogo.utils";

/**
 * Estado e derivação do catálogo. Na Fase 1, migrar filtros para URL (nuqs),
 * seguindo o padrão de listagens do PaaS.
 */
export function useCatalogo(conceitos: Conceito[]) {
  const [categoria, setCategoria] = useState<FiltroCategoria>("todas");
  const [busca, setBusca] = useState("");

  const resultado = useMemo(
    () => filtrarConceitos(conceitos, categoria, busca),
    [conceitos, categoria, busca]
  );

  return { categoria, setCategoria, busca, setBusca, resultado };
}
