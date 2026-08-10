"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";
import type { CamadaId, EstadoProjeto, ScoreProjeto } from "@/shared/types/construtor";
import {
  camadaDef,
  padraoDef,
  posicaoCanonica,
} from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import {
  avaliarRegras,
  calcularScore,
  paresForaDeOrdem,
  TEMPLATES,
} from "@/content/construtor/regras";
import {
  revisarProjeto,
  sugerir,
  type Sugestao,
} from "@/content/construtor/sugestoes";
import { useArmazenamentoLocal } from "@/shared/hook/use-armazenamento-local";

const CHAVE = "devatlas:construtor:v1";
const VAZIO: EstadoProjeto = { camadas: [] };

export interface UltimaAcao {
  titulo: string;
  descricao: string;
  /** detalhes opcionais em bullets (ex.: o "porquê" de um modelo). */
  bullets?: string[];
}

/** Valida/sanitiza um estado vindo de fora (URL): só ids conhecidos passam. */
function sanitizarEstado(bruto: unknown): EstadoProjeto | null {
  if (!bruto || typeof bruto !== "object") return null;
  const camadasBrutas = (bruto as { camadas?: unknown }).camadas;
  if (!Array.isArray(camadasBrutas)) return null;
  const vistos = new Set<string>();
  const camadas = camadasBrutas.flatMap((c) => {
    if (!c || typeof c !== "object") return [];
    const { camadaId, padroes, tecnologias } = c as {
      camadaId?: unknown;
      padroes?: unknown;
      tecnologias?: unknown;
    };
    if (typeof camadaId !== "string" || !camadaDef(camadaId) || vistos.has(camadaId))
      return [];
    vistos.add(camadaId);
    const listaPadroes = Array.isArray(padroes)
      ? [...new Set(padroes.filter((p): p is string => typeof p === "string" && !!padraoDef(p)))]
      : [];
    const listaTechs = Array.isArray(tecnologias)
      ? [...new Set(tecnologias.filter((t): t is string => typeof t === "string" && !!tecnologiaDef(t)))]
      : [];
    return [
      { camadaId: camadaId as CamadaId, padroes: listaPadroes, tecnologias: listaTechs },
    ];
  });
  return { camadas };
}

/** Estados salvos antes das tecnologias existirem ganham o campo vazio. */
function normalizarEstado(e: EstadoProjeto): EstadoProjeto {
  return {
    camadas: e.camadas.map((c) => ({ ...c, tecnologias: c.tecnologias ?? [] })),
  };
}

/** Serializa o estado para a URL (base64 de JSON — ids são ASCII). */
export function codificarEstado(estado: EstadoProjeto): string {
  return btoa(JSON.stringify(estado));
}

function decodificarEstado(b64: string): EstadoProjeto | null {
  try {
    return sanitizarEstado(JSON.parse(atob(b64)));
  } catch {
    return null;
  }
}

/** Lê o projeto da query `?p=` — leitura pura, sem efeito colateral. */
function projetoDoLink(): EstadoProjeto | null {
  if (typeof window === "undefined") return null;
  const compartilhado = new URLSearchParams(window.location.search).get("p");
  return compartilhado ? decodificarEstado(compartilhado) : null;
}

/**
 * Semeia o localStorage com o projeto da URL, se houver, e devolve a narração
 * correspondente. Roda no inicializador preguiçoso do `useState` — antes,
 * portanto, de o `useArmazenamentoLocal` abaixo ler a chave.
 *
 * É idempotente de propósito: gravar o mesmo projeto duas vezes (StrictMode
 * renderiza o inicializador duas vezes em desenvolvimento) não muda nada.
 */
function adotarProjetoDoLink(): UltimaAcao | null {
  const doLink = projetoDoLink();
  if (!doLink) return null;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(doLink));
  } catch {
    /* storage indisponível — o projeto vive só nesta sessão */
  }
  return {
    titulo: "Projeto carregado do link",
    descricao: "Este é um projeto compartilhado — edite à vontade, a cópia é sua.",
  };
}

/** Estado do projeto do usuário: camadas ordenadas + padrões aplicados. */
export function useConstrutor() {
  /**
   * Antes isto era um `useEffect` com quatro `setState` em sequência: além da
   * renderização em cascata, o usuário via o projeto vazio piscar antes de o
   * conteúdo aparecer.
   */
  const [narracaoDoLink] = useState(adotarProjetoDoLink);

  const [guardado, persistir] = useArmazenamentoLocal(CHAVE, VAZIO);
  /** normaliza estados salvos antes de as tecnologias existirem. */
  const estado = useMemo(() => normalizarEstado(guardado), [guardado]);

  const [ultimaAcao, setUltimaAcao] = useState<UltimaAcao | null>(narracaoDoLink);
  /** score do último modelo carregado — referência para comparar evolução. */
  const [referencia, setReferencia] = useState<ScoreProjeto | null>(null);

  // Só efeito colateral externo: limpa a query para as edições seguintes não
  // parecerem "o link". Nenhum setState aqui.
  useEffect(() => {
    if (!narracaoDoLink) return;
    window.history.replaceState(null, "", window.location.pathname);
  }, [narracaoDoLink]);

  const adicionarCamada = useCallback(
    (camadaId: CamadaId, indice?: number) => {
      const def = camadaDef(camadaId);
      if (!def) return;
      if (estado.camadas.some((c) => c.camadaId === camadaId)) {
        toast.info(`${def.nome} já está no projeto.`);
        return;
      }
      const camadas = [...estado.camadas];
      const nova = { camadaId, padroes: [], tecnologias: [] };
      camadas.splice(indice ?? camadas.length, 0, nova);
      persistir({ camadas });
      setUltimaAcao({
        titulo: `Camada adicionada: ${def.nome}`,
        descricao: def.descricao,
      });
    },
    [estado, persistir]
  );

  const removerCamada = useCallback(
    (camadaId: string) => {
      const def = camadaDef(camadaId);
      persistir({ camadas: estado.camadas.filter((c) => c.camadaId !== camadaId) });
      if (def)
        setUltimaAcao({
          titulo: `Camada removida: ${def.nome}`,
          descricao: "Os padrões aplicados nela saíram junto.",
        });
    },
    [estado, persistir]
  );

  const moverCamada = useCallback(
    (de: number, para: number) => {
      if (para < 0 || para >= estado.camadas.length) return;
      persistir({ camadas: arrayMove(estado.camadas, de, para) });
    },
    [estado, persistir]
  );

  const aplicarPadrao = useCallback(
    (padraoId: string, camadaId: string) => {
      const def = padraoDef(padraoId);
      const alvoDef = camadaDef(camadaId);
      if (!def || !alvoDef) return;
      const alvo = estado.camadas.find((c) => c.camadaId === camadaId);
      if (!alvo) return;
      if (alvo.padroes.includes(padraoId)) {
        toast.info(`${def.nome} já está aplicado em ${alvoDef.nome}.`);
        return;
      }
      persistir({
        camadas: estado.camadas.map((c) =>
          c.camadaId === camadaId ? { ...c, padroes: [...c.padroes, padraoId] } : c
        ),
      });
      const recomendado = def.aplicaEm.includes(alvo.camadaId as CamadaId);
      setUltimaAcao({
        titulo: `${def.nome} aplicado em ${alvoDef.nome}`,
        descricao: recomendado
          ? def.descricao
          : `${def.descricao} — atenção: esta não é a camada típica deste padrão (veja os alertas).`,
      });
    },
    [estado, persistir]
  );

  const removerPadrao = useCallback(
    (padraoId: string, camadaId: string) => {
      persistir({
        camadas: estado.camadas.map((c) =>
          c.camadaId === camadaId
            ? { ...c, padroes: c.padroes.filter((p) => p !== padraoId) }
            : c
        ),
      });
    },
    [estado, persistir]
  );

  const aplicarTecnologia = useCallback(
    (techId: string, camadaId: string) => {
      const def = tecnologiaDef(techId);
      const alvoDef = camadaDef(camadaId);
      if (!def || !alvoDef) return;
      const alvo = estado.camadas.find((c) => c.camadaId === camadaId);
      if (!alvo) return;
      if (alvo.tecnologias.includes(techId)) {
        toast.info(`${def.nome} já está em ${alvoDef.nome}.`);
        return;
      }
      persistir({
        camadas: estado.camadas.map((c) =>
          c.camadaId === camadaId
            ? { ...c, tecnologias: [...c.tecnologias, techId] }
            : c
        ),
      });
      const recomendado = def.viveEm.includes(alvo.camadaId);
      setUltimaAcao({
        titulo: `${def.nome} em ${alvoDef.nome}`,
        descricao: recomendado
          ? def.diferencaQueFaz
          : `${def.diferencaQueFaz} — atenção: ${def.nome} tipicamente vive em ${def.viveEm.join(", ")}, não aqui.`,
      });
    },
    [estado, persistir]
  );

  const removerTecnologia = useCallback(
    (techId: string, camadaId: string) => {
      persistir({
        camadas: estado.camadas.map((c) =>
          c.camadaId === camadaId
            ? { ...c, tecnologias: c.tecnologias.filter((t) => t !== techId) }
            : c
        ),
      });
    },
    [estado, persistir]
  );

  const carregarTemplate = useCallback(
    (id: string) => {
      const t = TEMPLATES.find((x) => x.id === id);
      if (!t) return;
      const novo = structuredClone(t.estado);
      persistir(novo);
      setReferencia(calcularScore(novo));
      setUltimaAcao({
        titulo: `Modelo carregado: ${t.nome}`,
        descricao: t.descricao,
        bullets: t.porQue,
      });
    },
    [persistir]
  );

  /** Reordena a pilha para a ordem canônica (usuário → infra). */
  const organizarOrdem = useCallback(() => {
    const fora = paresForaDeOrdem(estado);
    if (fora.length === 0) {
      toast.info("A pilha já está na ordem canônica.");
      return;
    }
    const antes = estado.camadas.map((c) => camadaDef(c.camadaId)?.nome ?? c.camadaId);
    const camadas = [...estado.camadas].sort(
      (a, b) => posicaoCanonica(a.camadaId) - posicaoCanonica(b.camadaId)
    );
    persistir({ camadas });
    const depois = camadas.map((c) => camadaDef(c.camadaId)?.nome ?? c.camadaId);
    setUltimaAcao({
      titulo: "Pilha reorganizada",
      descricao:
        "As camadas agora seguem o caminho da requisição: usuário no topo, infraestrutura na base, domínio protegido no meio.",
      bullets: [`Antes: ${antes.join(" → ")}`, `Agora: ${depois.join(" → ")}`],
    });
  }, [estado, persistir]);

  const limpar = useCallback(() => {
    persistir(VAZIO);
    setUltimaAcao(null);
    setReferencia(null);
  }, [persistir]);

  /** Aplica uma sugestão do motor proativo com um clique. */
  const aplicarSugestao = useCallback(
    (s: Sugestao) => {
      switch (s.acao.tipo) {
        case "camada":
          adicionarCamada(s.acao.camadaId);
          break;
        case "padrao":
          aplicarPadrao(s.acao.padraoId, s.acao.camadaId);
          break;
        case "tech":
          aplicarTecnologia(s.acao.techId, s.acao.camadaId);
          break;
        case "ordem":
          organizarOrdem();
          break;
      }
    },
    [adicionarCamada, aplicarPadrao, aplicarTecnologia, organizarOrdem]
  );

  const compartilhar = useCallback(async () => {
    if (estado.camadas.length === 0) {
      toast.info("Monte o projeto antes de compartilhar.");
      return;
    }
    const url = `${window.location.origin}/construtor?p=${codificarEstado(estado)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!", {
        description: "Quem abrir vê exatamente este projeto.",
      });
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }, [estado]);

  const insights = useMemo(() => avaliarRegras(estado), [estado]);
  const score = useMemo(() => calcularScore(estado), [estado]);
  const foraDeOrdem = useMemo(() => paresForaDeOrdem(estado).length > 0, [estado]);
  const sugestoes = useMemo(() => sugerir(estado), [estado]);
  const revisao = useMemo(() => revisarProjeto(estado), [estado]);

  return {
    estado,
    ultimaAcao,
    insights,
    score,
    referencia,
    sugestoes,
    revisao,
    aplicarSugestao,
    foraDeOrdem,
    organizarOrdem,
    adicionarCamada,
    removerCamada,
    moverCamada,
    aplicarPadrao,
    removerPadrao,
    aplicarTecnologia,
    removerTecnologia,
    carregarTemplate,
    limpar,
    compartilhar,
  };
}
