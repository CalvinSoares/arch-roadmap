"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Cache de snapshot por chave. `useSyncExternalStore` exige que
 * `getSnapshot` devolva a MESMA referência enquanto o dado não muda — sem
 * isso, cada renderização produziria um objeto novo e o React entraria em
 * laço infinito. Guardamos o texto bruto ao lado do valor já parseado para
 * saber se algo realmente mudou.
 */
const cache = new Map<string, { bruto: string | null; valor: unknown }>();

/** Escritas na própria aba não disparam `storage` — este alvo cobre isso. */
const avisos = new EventTarget();
const EVENTO = "devatlas:armazenamento";

function lerBruto(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    // modo privado, cota estourada ou storage bloqueado por política
    return null;
  }
}

function snapshot<T>(chave: string, padrao: T): T {
  const bruto = lerBruto(chave);
  const anterior = cache.get(chave);
  if (anterior && anterior.bruto === bruto) return anterior.valor as T;

  let valor: T;
  try {
    valor = bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    // conteúdo corrompido: volta ao padrão em vez de derrubar a tela
    valor = padrao;
  }
  cache.set(chave, { bruto, valor });
  return valor;
}

function inscrever(chave: string, aoMudar: () => void): () => void {
  const doOutroLugar = (e: Event) => {
    // `storage` vem de outra aba; o evento interno vem desta mesma
    if (e instanceof StorageEvent && e.key !== null && e.key !== chave) return;
    if (e instanceof CustomEvent && e.detail !== chave) return;
    aoMudar();
  };
  window.addEventListener("storage", doOutroLugar);
  avisos.addEventListener(EVENTO, doOutroLugar);
  return () => {
    window.removeEventListener("storage", doOutroLugar);
    avisos.removeEventListener(EVENTO, doOutroLugar);
  };
}

/**
 * Estado persistido em `localStorage`, tratado como store externa.
 *
 * Devolve `padrao` durante o SSR e na primeira renderização do cliente, e o
 * valor guardado logo em seguida — sem `useEffect` de hidratação, portanto
 * sem a renderização em cascata que ele provoca. Escritas nesta aba e
 * alterações vindas de outras abas atualizam todos os componentes inscritos
 * na mesma chave.
 *
 * `padrao` precisa ser referencialmente estável (constante de módulo), já que
 * é a resposta usada quando não há nada guardado.
 */
export function useArmazenamentoLocal<T>(
  chave: string,
  padrao: T
): [T, (proximo: T) => void] {
  const valor = useSyncExternalStore(
    useCallback((aoMudar: () => void) => inscrever(chave, aoMudar), [chave]),
    useCallback(() => snapshot(chave, padrao), [chave, padrao]),
    useCallback(() => padrao, [padrao])
  );

  const gravar = useCallback(
    (proximo: T) => {
      try {
        localStorage.setItem(chave, JSON.stringify(proximo));
      } catch {
        /* storage indisponível — segue só em memória nesta sessão */
      }
      // atualiza o cache mesmo se a gravação falhar: a UI reflete a intenção
      cache.set(chave, { bruto: lerBruto(chave), valor: proximo });
      avisos.dispatchEvent(new CustomEvent(EVENTO, { detail: chave }));
    },
    [chave]
  );

  return [valor, gravar];
}
