"use client";

import { useSyncExternalStore } from "react";

/** Nada muda depois da hidratação — o subscribe existe só para satisfazer a API. */
const semInscricao = () => () => {};
const noCliente = () => true;
const noServidor = () => false;

/**
 * `false` durante o SSR e na primeira renderização do cliente; `true` depois
 * da hidratação.
 *
 * Serve de portão para o que não pode ser renderizado no servidor — React
 * Flow, Mermaid, qualquer coisa que meça o DOM. Feito com
 * `useSyncExternalStore` em vez do clássico `useEffect(() => setX(true), [])`
 * porque o efeito dispara uma segunda renderização em cascata (e o lint
 * `react-hooks/set-state-in-effect` reclama, com razão).
 */
export function useMontado(): boolean {
  return useSyncExternalStore(semInscricao, noCliente, noServidor);
}
