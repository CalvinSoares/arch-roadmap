import type { Conceito } from "@/shared/types/conceito";
import type { Roadmap } from "@/shared/types/roadmap";
import { factoryMethod } from "@/content/conceitos/factory-method";
import { observer } from "@/content/conceitos/observer";
import { adapter } from "@/content/conceitos/adapter";
import { strategy } from "@/content/conceitos/comportamentais/strategy";
import { hexagonal } from "@/content/conceitos/arquitetura/hexagonal";
import { cqs } from "@/content/conceitos/principios/cqs";
import { srp } from "@/content/conceitos/principios/srp";
import { ocp } from "@/content/conceitos/principios/ocp";
import { lsp } from "@/content/conceitos/principios/lsp";
import { isp } from "@/content/conceitos/principios/isp";
import { dip } from "@/content/conceitos/principios/dip";
import { cqrs } from "@/content/conceitos/arquitetura/cqrs";
import { saga } from "@/content/conceitos/arquitetura/saga";
import { abstractFactory } from "@/content/conceitos/criacionais/abstract-factory";
import { builder } from "@/content/conceitos/criacionais/builder";
import { singleton } from "@/content/conceitos/criacionais/singleton";
import { decorator } from "@/content/conceitos/estruturais/decorator";
import { facade } from "@/content/conceitos/estruturais/facade";
import { proxy } from "@/content/conceitos/estruturais/proxy";
import { composite } from "@/content/conceitos/estruturais/composite";
import { command } from "@/content/conceitos/comportamentais/command";
import { templateMethod } from "@/content/conceitos/comportamentais/template-method";
import { chainOfResponsibility } from "@/content/conceitos/comportamentais/chain-of-responsibility";
import { memento } from "@/content/conceitos/comportamentais/memento";
import { iterator } from "@/content/conceitos/comportamentais/iterator";
import { mediator } from "@/content/conceitos/comportamentais/mediator";
import { visitor } from "@/content/conceitos/comportamentais/visitor";
import { interpreter } from "@/content/conceitos/comportamentais/interpreter";
import { prototype } from "@/content/conceitos/criacionais/prototype";
import { bridge } from "@/content/conceitos/estruturais/bridge";
import { flyweight } from "@/content/conceitos/estruturais/flyweight";
import { state } from "@/content/conceitos/comportamentais/state";
import { eventSourcing } from "@/content/conceitos/arquitetura/event-sourcing";
import { roadmapPadroes } from "@/content/roadmaps/padroes";
import { roadmapBackend } from "@/content/roadmaps/backend";
import { roadmapFrontend } from "@/content/roadmaps/frontend";
import { roadmapArquitetura } from "@/content/roadmaps/arquitetura";

/**
 * Camada de conteúdo (substitui a camada tRPC do PaaS).
 * Registro estático — trocável por loader de MDX na Fase 1 sem mudar a API.
 */
const CONCEITOS: Conceito[] = [
  factoryMethod,
  abstractFactory,
  builder,
  singleton,
  adapter,
  decorator,
  prototype,
  facade,
  proxy,
  composite,
  bridge,
  flyweight,
  observer,
  strategy,
  state,
  command,
  templateMethod,
  chainOfResponsibility,
  memento,
  iterator,
  mediator,
  visitor,
  interpreter,
  hexagonal,
  cqs,
  srp,
  ocp,
  lsp,
  isp,
  dip,
  cqrs,
  saga,
  eventSourcing,
];
const ROADMAPS: Roadmap[] = [
  roadmapPadroes,
  roadmapBackend,
  roadmapFrontend,
  roadmapArquitetura,
];

export function listConceitos(): Conceito[] {
  return [...CONCEITOS].sort((a, b) => a.titulo.localeCompare(b.titulo));
}

export function getConceito(slug: string): Conceito | undefined {
  return CONCEITOS.find((c) => c.slug === slug);
}

export function getConceitos(slugs: string[]): Conceito[] {
  return slugs
    .map((s) => getConceito(s))
    .filter((c): c is Conceito => Boolean(c));
}

export function listRoadmaps(): Roadmap[] {
  return [...ROADMAPS];
}

/** Onde um conceito aparece nas trilhas (roadmap + seção). */
export interface OcorrenciaEmRoadmap {
  roadmapSlug: string;
  roadmapTitulo: string;
  secaoTitulo: string;
}

/**
 * Caminho inverso do `conceito` declarado nos itens de roadmap: dado um
 * conceito, em que trilhas ele aparece.
 *
 * É **derivado**, e não um campo no conceito, porque a versão armazenada
 * (`roadmapNodes`) envelheceu sem ninguém notar — apontava para ids de nó que
 * não existiam mais. Aqui a fonte da verdade é uma só: o roadmap.
 */
export function roadmapsDoConceito(slug: string): OcorrenciaEmRoadmap[] {
  const achados: OcorrenciaEmRoadmap[] = [];
  for (const r of ROADMAPS) {
    for (const s of r.sections) {
      const aparece =
        s.conceito === slug || s.items.some((i) => i.conceito === slug);
      if (!aparece) continue;
      achados.push({
        roadmapSlug: r.slug,
        roadmapTitulo: r.titulo,
        secaoTitulo: s.titulo,
      });
    }
  }
  return achados;
}

export function getRoadmap(slug: string): Roadmap | undefined {
  return ROADMAPS.find((r) => r.slug === slug);
}
