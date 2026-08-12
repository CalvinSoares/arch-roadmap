import type { Conceito } from "@/shared/types/conceito";
import type { Roadmap } from "@/shared/types/roadmap";
import type { Comparacao } from "@/shared/types/comparacao";
import { slugComparacao } from "@/shared/types/comparacao";
import { COMPARACOES } from "@/content/comparacoes/registro";
import { POSTMORTEMS } from "@/content/postmortems/registro";
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
import { composicaoSobreHeranca } from "@/content/conceitos/principios/composicao-sobre-heranca";
import { dryKissYagni } from "@/content/conceitos/principios/dry-kiss-yagni";
import { leiDeDemeter } from "@/content/conceitos/principios/lei-de-demeter";
import { leiDeConway } from "@/content/conceitos/principios/lei-de-conway";
import { falaciasSistemasDistribuidos } from "@/content/conceitos/principios/falacias-sistemas-distribuidos";
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
import { idempotencia } from "@/content/conceitos/principios/idempotencia";
import { raceCondition } from "@/content/conceitos/arquitetura/race-condition";
import { maquinaDeEstados } from "@/content/conceitos/comportamentais/maquina-de-estados";
import { ledger } from "@/content/conceitos/arquitetura/ledger";
import { appendOnly } from "@/content/conceitos/arquitetura/append-only";
import { webhooks } from "@/content/conceitos/arquitetura/webhooks";
import { docker } from "@/content/conceitos/infra/docker";
import { kubernetes } from "@/content/conceitos/infra/kubernetes";
import { vps } from "@/content/conceitos/infra/vps";
import { timeout } from "@/content/conceitos/resiliencia/timeout";
import { retry } from "@/content/conceitos/resiliencia/retry";
import { circuitBreaker } from "@/content/conceitos/resiliencia/circuit-breaker";
import { bulkhead } from "@/content/conceitos/resiliencia/bulkhead";
import { rateLimiting } from "@/content/conceitos/resiliencia/rate-limiting";
import { deadLetterQueue } from "@/content/conceitos/resiliencia/dead-letter-queue";
import { garantiasDeEntrega } from "@/content/conceitos/resiliencia/garantias-de-entrega";
import { outbox } from "@/content/conceitos/resiliencia/outbox";
import { repository } from "@/content/conceitos/arquitetura/repository";
import { niveisDeIsolamento } from "@/content/conceitos/dados/niveis-de-isolamento";
import { lockOtimistaPessimista } from "@/content/conceitos/dados/lock-otimista-pessimista";
import { cap } from "@/content/conceitos/dados/cap";
import { consistenciaEventual } from "@/content/conceitos/dados/consistencia-eventual";
import { replicaDeLeitura } from "@/content/conceitos/dados/replica-de-leitura";
import { sharding } from "@/content/conceitos/dados/sharding";
import { twoPhaseCommit } from "@/content/conceitos/dados/two-phase-commit";
import { indice } from "@/content/conceitos/dados/indice";
import { cache } from "@/content/conceitos/dados/cache";
import { filaVsPubsub } from "@/content/conceitos/arquitetura/fila-vs-pubsub";
import { inboxDeduplicacao } from "@/content/conceitos/resiliencia/inbox-deduplicacao";
import { chaveDeParticao } from "@/content/conceitos/arquitetura/chave-de-particao";
import { backpressure } from "@/content/conceitos/resiliencia/backpressure";
import { agregado } from "@/content/conceitos/arquitetura/agregado";
import { valueObject } from "@/content/conceitos/arquitetura/value-object";
import { unitOfWork } from "@/content/conceitos/arquitetura/unit-of-work";
import { antiCorruptionLayer } from "@/content/conceitos/arquitetura/anti-corruption-layer";
import { microsservicos } from "@/content/conceitos/arquitetura/microsservicos";
import { monolitoModular } from "@/content/conceitos/arquitetura/monolito-modular";
import { cleanArchitecture } from "@/content/conceitos/arquitetura/clean-architecture";
import { bff } from "@/content/conceitos/arquitetura/bff";
import { apiGateway } from "@/content/conceitos/arquitetura/api-gateway";
import { stranglerFig } from "@/content/conceitos/arquitetura/strangler-fig";
import { autenticacao } from "@/content/conceitos/seguranca/autenticacao";
import { jwt } from "@/content/conceitos/seguranca/jwt";
import { oauth2 } from "@/content/conceitos/seguranca/oauth2";
import { mfa } from "@/content/conceitos/seguranca/mfa";
import { autorizacao } from "@/content/conceitos/seguranca/autorizacao";
import { allowlist } from "@/content/conceitos/seguranca/allowlist";
import { gestaoDeSegredos } from "@/content/conceitos/seguranca/gestao-de-segredos";
import { roadmapPadroes } from "@/content/roadmaps/padroes";
import { roadmapBackend } from "@/content/roadmaps/backend";
import { roadmapFrontend } from "@/content/roadmaps/frontend";
import { roadmapArquitetura } from "@/content/roadmaps/arquitetura";
import { roadmapResiliencia } from "@/content/roadmaps/resiliencia";

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
  composicaoSobreHeranca,
  dryKissYagni,
  leiDeDemeter,
  leiDeConway,
  falaciasSistemasDistribuidos,
  cqrs,
  saga,
  eventSourcing,
  idempotencia,
  raceCondition,
  maquinaDeEstados,
  ledger,
  appendOnly,
  webhooks,
  docker,
  kubernetes,
  vps,
  timeout,
  retry,
  circuitBreaker,
  bulkhead,
  rateLimiting,
  deadLetterQueue,
  garantiasDeEntrega,
  outbox,
  repository,
  niveisDeIsolamento,
  lockOtimistaPessimista,
  cap,
  consistenciaEventual,
  replicaDeLeitura,
  sharding,
  twoPhaseCommit,
  indice,
  cache,
  filaVsPubsub,
  inboxDeduplicacao,
  chaveDeParticao,
  backpressure,
  agregado,
  valueObject,
  unitOfWork,
  antiCorruptionLayer,
  microsservicos,
  monolitoModular,
  cleanArchitecture,
  bff,
  apiGateway,
  stranglerFig,
  autenticacao,
  jwt,
  oauth2,
  mfa,
  autorizacao,
  allowlist,
  gestaoDeSegredos,
];
const ROADMAPS: Roadmap[] = [
  roadmapPadroes,
  roadmapBackend,
  roadmapFrontend,
  roadmapArquitetura,
  roadmapResiliencia,
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

/** Todas as comparações, com o slug de rota já derivado. */
export function listComparacoes(): (Comparacao & { slug: string })[] {
  return COMPARACOES.map((c) => ({ ...c, slug: slugComparacao(c.a, c.b) }));
}

export function getComparacao(
  slug: string
): (Comparacao & { slug: string }) | undefined {
  return listComparacoes().find((c) => c.slug === slug);
}

/**
 * Com quais conceitos este costuma ser confundido — derivado do registro de
 * comparações, nunca declarado no conceito.
 */
export function comparacoesDoConceito(
  slug: string
): { slug: string; outro: Conceito }[] {
  return listComparacoes().flatMap((c) => {
    if (c.a !== slug && c.b !== slug) return [];
    const outroSlug = c.a === slug ? c.b : c.a;
    const outro = getConceito(outroSlug);
    return outro ? [{ slug: c.slug, outro }] : [];
  });
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

/**
 * Em que incidentes reais este conceito aparece.
 *
 * **Derivado** do registro de postmortems, como `roadmapsDoConceito` — o
 * conceito não guarda lista de postmortems, senão haveria duas fontes de
 * verdade e uma delas envelheceria errada.
 */
export function postmortemsDoConceito(
  slug: string
): { slug: string; titulo: string; organizacao: string; porque: string }[] {
  return POSTMORTEMS.flatMap((p) => {
    const citacao = p.conceitos.find((c) => c.slug === slug);
    return citacao
      ? [
          {
            slug: p.slug,
            titulo: p.titulo,
            organizacao: p.organizacao,
            porque: citacao.porque,
          },
        ]
      : [];
  });
}

export function getRoadmap(slug: string): Roadmap | undefined {
  return ROADMAPS.find((r) => r.slug === slug);
}
