"use client";

import { useCallback, useMemo, useState } from "react";
import type { Conceito } from "@/shared/types/conceito";
import {
  filtrarConceitos,
  type FiltroCategoria,
  type FiltroDificuldade,
} from "../utils/catalogo.utils";

/**
 * Estado e derivação do catálogo. Na Fase 1, migrar filtros para URL (nuqs),
 * seguindo o padrão de listagens do PaaS.
 */
export function useCatalogo(conceitos: Conceito[]) {
  const [categoria, setCategoria] = useState<FiltroCategoria>("todas");
  const [dificuldade, setDificuldade] = useState<FiltroDificuldade>("todas");
  const [busca, setBusca] = useState("");

  const resultado = useMemo(
    () => filtrarConceitos(conceitos, categoria, dificuldade, busca),
    [conceitos, categoria, dificuldade, busca]
  );

  const temFiltro =
    categoria !== "todas" || dificuldade !== "todas" || busca.trim() !== "";

  const limpar = useCallback(() => {
    setCategoria("todas");
    setDificuldade("todas");
    setBusca("");
  }, []);

  return {
    categoria,
    setCategoria,
    dificuldade,
    setDificuldade,
    busca,
    setBusca,
    resultado,
    temFiltro,
    limpar,
  };
}
