import type { Conceito } from "@/shared/types/conceito";
import type { Roadmap } from "@/shared/types/roadmap";
import { factoryMethod } from "@/content/conceitos/factory-method";
import { observer } from "@/content/conceitos/observer";
import { adapter } from "@/content/conceitos/adapter";
import { strategy } from "@/content/conceitos/comportamentais/strategy";
import { hexagonal } from "@/content/conceitos/arquitetura/hexagonal";
import { cqs } from "@/content/conceitos/principios/cqs";
import { cqrs } from "@/content/conceitos/arquitetura/cqrs";
import { saga } from "@/content/conceitos/arquitetura/saga";
import { abstractFactory } from "@/content/conceitos/criacionais/abstract-factory";
import { builder } from "@/content/conceitos/criacionais/builder";
import { singleton } from "@/content/conceitos/criacionais/singleton";
import { decorator } from "@/content/conceitos/estruturais/decorator";
import { facade } from "@/content/conceitos/estruturais/facade";
import { state } from "@/content/conceitos/comportamentais/state";
import { eventSourcing } from "@/content/conceitos/arquitetura/event-sourcing";
import { roadmapPadroes } from "@/content/roadmaps/padroes";

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
  facade,
  observer,
  strategy,
  state,
  hexagonal,
  cqs,
  cqrs,
  saga,
  eventSourcing,
];
const ROADMAPS: Roadmap[] = [roadmapPadroes];

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

export function getRoadmap(slug: string): Roadmap | undefined {
  return ROADMAPS.find((r) => r.slug === slug);
}
