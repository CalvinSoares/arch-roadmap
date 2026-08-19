"use client";

import type { Desafio, RespostaDesafio } from "@/shared/types/desafio";
import { DesafioMcqView } from "@/shared/components/jornada/desafios/mcq";
import { DesafioVfView } from "@/shared/components/jornada/desafios/vf";
import { DesafioLacunaView } from "@/shared/components/jornada/desafios/lacuna";
import { DesafioOrdenarView } from "@/shared/components/jornada/desafios/ordenar";
import { DesafioParearView } from "@/shared/components/jornada/desafios/parear";
import { DesafioDoisCodigosView } from "@/shared/components/jornada/desafios/dois-codigos";

/**
 * Renderiza o desafio ativo. Tipos com construção progressiva (ordenar/parear)
 * reportam rascunho via `onRascunho`; os demais disparam `onResponder` no toque.
 */
export function DesafioView({
  desafio,
  revelado,
  reduzir,
  resposta,
  onResponder,
  onRascunho,
}: {
  desafio: Desafio;
  revelado: boolean;
  reduzir: boolean;
  resposta: RespostaDesafio | null;
  onResponder: (r: RespostaDesafio) => void;
  onRascunho: (r: RespostaDesafio) => void;
}) {
  switch (desafio.tipo) {
    case "mcq":
      return (
        <DesafioMcqView
          desafio={desafio}
          escolha={
            resposta?.tipo === "mcq" ? resposta.escolha : null
          }
          revelado={revelado}
          reduzir={reduzir}
          onEscolher={(id) => onResponder({ tipo: "mcq", escolha: id })}
        />
      );
    case "vf":
      return (
        <DesafioVfView
          desafio={desafio}
          escolha={resposta?.tipo === "vf" ? resposta.escolha : null}
          revelado={revelado}
          reduzir={reduzir}
          onEscolher={(v) => onResponder({ tipo: "vf", escolha: v })}
        />
      );
    case "lacuna":
      return (
        <DesafioLacunaView
          desafio={desafio}
          escolha={
            resposta?.tipo === "lacuna" ? resposta.escolha : null
          }
          revelado={revelado}
          reduzir={reduzir}
          onEscolher={(op) => onResponder({ tipo: "lacuna", escolha: op })}
        />
      );
    case "ordenar":
      return (
        // key remonta ao trocar de desafio: o estado interno zera sem effect
        // (o pai já reseta o rascunho em avancar/praticarDeNovo)
        <DesafioOrdenarView
          key={desafio.id}
          desafio={desafio}
          revelado={revelado}
          onMudar={(ordem) => onRascunho({ tipo: "ordenar", ordem })}
        />
      );
    case "parear":
      return (
        <DesafioParearView
          key={desafio.id}
          desafio={desafio}
          revelado={revelado}
          sementeEmbaralhe={hashId(desafio.id)}
          onMudar={(ligacoes) => onRascunho({ tipo: "parear", ligacoes })}
        />
      );
    case "dois-codigos":
      return (
        <DesafioDoisCodigosView
          desafio={desafio}
          escolha={
            resposta?.tipo === "dois-codigos" ? resposta.escolha : null
          }
          revelado={revelado}
          reduzir={reduzir}
          onEscolher={(lado) =>
            onResponder({ tipo: "dois-codigos", escolha: lado })
          }
        />
      );
  }
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h || 1;
}

/** Desafios que precisam de botão "Conferir" (montagem progressiva). */
export function precisaConferir(desafio: Desafio): boolean {
  return desafio.tipo === "ordenar" || desafio.tipo === "parear";
}

export function rascunhoCompleto(
  desafio: Desafio,
  rascunho: RespostaDesafio | null
): boolean {
  if (!rascunho || rascunho.tipo !== desafio.tipo) return false;
  if (desafio.tipo === "ordenar" && rascunho.tipo === "ordenar") {
    return rascunho.ordem.length === desafio.itens.length;
  }
  if (desafio.tipo === "parear" && rascunho.tipo === "parear") {
    return desafio.pares.every((p) => rascunho.ligacoes[p.esquerda]);
  }
  return false;
}
