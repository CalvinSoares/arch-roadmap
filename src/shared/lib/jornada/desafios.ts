import { getConceito, listConceitos } from "@/shared/lib/content";
import { gerarRodada } from "@/shared/lib/quiz-formatos";
import { mascarar } from "@/shared/lib/quiz";
import { listCasosClinica } from "@/shared/lib/clinica";
import {
  desafiosCheckpointCurados,
  chaveCheckpoint,
} from "@/content/jornada/checkpoints";
import type { Bloco } from "@/shared/types/bloco";
import type { Conceito } from "@/shared/types/conceito";
import type { RoadmapItem } from "@/shared/types/roadmap";
import type {
  Desafio,
  DesafioDoisCodigos,
  DesafioLacuna,
  DesafioMcq,
  DesafioOrdenar,
  DesafioParear,
  DesafioVf,
  RespostaDesafio,
} from "@/shared/types/desafio";

function prng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function embaralhar<T>(itens: T[], rnd: () => number): T[] {
  const out = [...itens];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(itens: T[], rnd: () => number): T | undefined {
  if (itens.length === 0) return undefined;
  return itens[Math.floor(rnd() * itens.length)];
}

function truncar(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).trimEnd()}…`;
}

/* ------------------------------------------------------------------ *
 * Avaliação                                                            *
 * ------------------------------------------------------------------ */

export function avaliarDesafio(
  desafio: Desafio,
  resposta: RespostaDesafio
): { ok: boolean; explicacao: string } {
  if (resposta.tipo !== desafio.tipo) {
    return { ok: false, explicacao: desafio.explicacao };
  }
  switch (desafio.tipo) {
    case "mcq":
      return {
        ok: (resposta as Extract<RespostaDesafio, { tipo: "mcq" }>).escolha ===
          desafio.correta,
        explicacao: desafio.explicacao,
      };
    case "vf":
      return {
        ok: (resposta as Extract<RespostaDesafio, { tipo: "vf" }>).escolha ===
          desafio.correta,
        explicacao: desafio.explicacao,
      };
    case "lacuna":
      return {
        ok:
          (resposta as Extract<RespostaDesafio, { tipo: "lacuna" }>).escolha ===
          desafio.correta,
        explicacao: desafio.explicacao,
      };
    case "ordenar": {
      const ordem = (resposta as Extract<RespostaDesafio, { tipo: "ordenar" }>)
        .ordem;
      const ok =
        ordem.length === desafio.ordemCorreta.length &&
        ordem.every((id, i) => id === desafio.ordemCorreta[i]);
      return { ok, explicacao: desafio.explicacao };
    }
    case "parear": {
      const ligacoes = (
        resposta as Extract<RespostaDesafio, { tipo: "parear" }>
      ).ligacoes;
      const ok = desafio.pares.every(
        (p) => ligacoes[p.esquerda] === p.direita
      );
      return { ok, explicacao: desafio.explicacao };
    }
    case "dois-codigos":
      return {
        ok:
          (resposta as Extract<RespostaDesafio, { tipo: "dois-codigos" }>)
            .escolha === desafio.correta,
        explicacao: desafio.explicacao,
      };
  }
}

/* ------------------------------------------------------------------ *
 * Conversão MCQ do banco de quiz                                       *
 * ------------------------------------------------------------------ */

function perguntaParaMcq(
  p: ReturnType<typeof gerarRodada>[number]
): DesafioMcq {
  const labels: Record<string, string> = {};
  for (const slug of p.alternativas) {
    labels[slug] = getConceito(slug)?.titulo ?? slug;
  }
  return {
    tipo: "mcq",
    id: `mcq:${p.id}`,
    enunciado: p.enunciado,
    correta: p.correta,
    alternativas: p.alternativas,
    labels,
    explicacao: p.explicacao,
    formato: p.formato,
    codigo: p.codigo,
  };
}

/* ------------------------------------------------------------------ *
 * Geradores por tipo (conceito) — sem eco de resumo/título             *
 * ------------------------------------------------------------------ */

function vfDoConceito(c: Conceito, rnd: () => number): DesafioVf[] {
  const out: DesafioVf[] = [];
  for (const [i, onde] of (c.ondeAparece ?? []).entries()) {
    out.push({
      tipo: "vf",
      id: `vf:${c.slug}:onde:${i}`,
      afirmacao: `No código do dia a dia, "${mascarar(onde.onde, c)}" é um lugar onde este conceito aparece de verdade.`,
      correta: true,
      explicacao: onde.explicacao,
    });
  }
  if (c.custo?.naoValeSe) {
    out.push({
      tipo: "vf",
      id: `vf:${c.slug}:custo`,
      afirmacao: `Ainda vale adotar este conceito mesmo quando ${c.custo.naoValeSe}`,
      correta: false,
      explicacao: `O próprio verbete avisa: não vale se ${c.custo.naoValeSe}`,
    });
  }
  // Afirmação falsa com contexto: "sobre ESTE conceito, vale dizer que…"
  const outros = listConceitos().filter(
    (x) => x.slug !== c.slug && x.categoria === c.categoria && x.resumo
  );
  const outro = pick(outros, rnd);
  if (outro?.resumo) {
    out.push({
      tipo: "vf",
      id: `vf:${c.slug}:alheio`,
      afirmacao: `Sobre ${c.titulo}, é correto dizer: ${truncar(outro.resumo, 140)}`,
      correta: false,
      explicacao: `Isso descreve ${outro.titulo}, não ${c.titulo}.`,
    });
  }
  const armadilhas = (c.blocos ?? []).find((b) => b.tipo === "armadilhas");
  if (armadilhas && armadilhas.tipo === "armadilhas" && armadilhas.itens[0]) {
    const item = armadilhas.itens[0];
    out.push({
      tipo: "vf",
      id: `vf:${c.slug}:armadilha`,
      afirmacao: `Uma armadilha clássica deste conceito: ${item.titulo}.`,
      correta: true,
      explicacao: item.texto,
    });
  }
  return out;
}

const STOP_LACUNA = new Set(
  [
    "neste",
    "nessa",
    "sobre",
    "entre",
    "quando",
    "onde",
    "como",
    "para",
    "pelo",
    "pela",
    "uma",
    "que",
    "não",
    "sem",
    "com",
    "dos",
    "das",
    "mais",
    "menos",
    "ainda",
    "também",
    "depois",
    "antes",
    "este",
    "esta",
    "isso",
    "aqui",
    "return",
    "const",
    "class",
    "function",
  ].map((s) => s.toLowerCase())
);

function palavraChave(texto: string): string | null {
  const palavras = texto
    .split(/[\s,.;:!?—–\-_/()"'`]+/)
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length >= 5 &&
        !/^\d+$/.test(p) &&
        !STOP_LACUNA.has(p.toLowerCase())
    );
  palavras.sort((a, b) => b.length - a.length);
  return palavras[0] ?? null;
}

/** Lacuna só em trechos de código / onde-aparece — nunca no título do conceito. */
function lacunaDoConceito(c: Conceito, rnd: () => number): DesafioLacuna[] {
  const out: DesafioLacuna[] = [];
  const candidatos: { frase: string; explicacao: string }[] = [];
  if (c.emUmaLinha?.code) {
    candidatos.push({
      frase: c.emUmaLinha.code.replace(/\s+/g, " ").trim(),
      explicacao: `Snippet mínimo de ${c.titulo}.`,
    });
  }
  for (const o of c.ondeAparece ?? []) {
    candidatos.push({
      frase: `${o.onde} — ${o.explicacao}`,
      explicacao: o.explicacao,
    });
  }

  const tituloLower = c.titulo.toLowerCase();
  for (const [i, cand] of candidatos.entries()) {
    const mascarada = mascarar(cand.frase, c);
    // não virar quiz de nome: a frase mascarada não pode ser quase só o título
    if (mascarada.trim().length < 24) continue;
    const chave = palavraChave(mascarada);
    if (!chave) continue;
    if (tituloLower.includes(chave.toLowerCase())) continue;
    const idx = mascarada.toLowerCase().indexOf(chave.toLowerCase());
    if (idx < 0) continue;
    const distratores = embaralhar(
      listConceitos()
        .filter((x) => x.slug !== c.slug)
        .map((x) => palavraChave(x.emUmaLinha?.code ?? x.titulo) ?? x.titulo.split(/\s+/)[0])
        .filter(
          (w) =>
            !!w &&
            w.toLowerCase() !== chave.toLowerCase() &&
            !tituloLower.includes(w.toLowerCase())
        ),
      rnd
    ).slice(0, 3);
    if (distratores.length < 2) continue;
    out.push({
      tipo: "lacuna",
      id: `lacuna:${c.slug}:${i}`,
      fraseAntes: mascarada.slice(0, idx),
      fraseDepois: mascarada.slice(idx + chave.length),
      correta: chave,
      opcoes: embaralhar([chave, ...distratores], rnd),
      explicacao: cand.explicacao,
    });
  }
  return out;
}

function ordenarDoConceito(c: Conceito): DesafioOrdenar[] {
  const out: DesafioOrdenar[] = [];
  const blocos = c.blocos ?? [];

  for (const [bi, b] of blocos.entries()) {
    if (b.tipo === "passos" && b.passos.length >= 3) {
      const itens = b.passos.slice(0, 5).map((p, i) => ({
        id: `p${i}`,
        label: p.titulo,
      }));
      out.push({
        tipo: "ordenar",
        id: `ordenar:${c.slug}:passos:${bi}`,
        enunciado: b.titulo ?? `Ordene os passos de ${c.titulo}.`,
        itens,
        ordemCorreta: itens.map((x) => x.id),
        explicacao: `A ordem natural dos passos em ${c.titulo}.`,
      });
    }
    if (b.tipo === "refatoracao" && b.passos.length >= 2) {
      const itens = [
        { id: "inicio", label: "Código com o cheiro" },
        ...b.passos.map((p, i) => ({ id: `r${i}`, label: p.titulo })),
      ];
      out.push({
        tipo: "ordenar",
        id: `ordenar:${c.slug}:ref:${bi}`,
        enunciado: `Ordene a refatoração: ${b.cheiro}`,
        itens,
        ordemCorreta: itens.map((x) => x.id),
        explicacao: b.veredito,
      });
    }
    if (
      b.tipo === "ilustracao" &&
      b.arquetipo === "fluxo" &&
      b.atores.length >= 3
    ) {
      const itens = b.atores.slice(0, 5).map((a) => ({
        id: a.id,
        label: a.label,
      }));
      out.push({
        tipo: "ordenar",
        id: `ordenar:${c.slug}:fluxo:${bi}`,
        enunciado: `Ordene o fluxo: ${b.legenda}`,
        itens,
        ordemCorreta: itens.map((x) => x.id),
        explicacao: b.legenda,
      });
    }
  }
  return out;
}

/** Só parear aparições reais — não título↔resumo. */
function parearDoConceito(c: Conceito): DesafioParear[] {
  const out: DesafioParear[] = [];
  if (c.ondeAparece && c.ondeAparece.length >= 2) {
    const pares = c.ondeAparece.slice(0, 3).map((o) => ({
      esquerda: mascarar(o.onde, c),
      direita: truncar(mascarar(o.explicacao, c), 80),
    }));
    if (pares.length >= 2) {
      out.push({
        tipo: "parear",
        id: `parear:${c.slug}:onde`,
        enunciado: "Ligue cada aparição ao que ela representa.",
        pares,
        explicacao: `Onde ${c.titulo} aparece de verdade.`,
      });
    }
  }
  return out;
}

/** Dois códigos só quando os dois lados são código de verdade. */
function doisCodigosDoConceito(
  c: Conceito,
  rnd: () => number
): DesafioDoisCodigos[] {
  const out: DesafioDoisCodigos[] = [];
  const bom = c.emUmaLinha?.code?.trim();
  if (!bom || bom.length < 12) return out;

  const anti = (c.blocos ?? []).filter(
    (b): b is Extract<Bloco, { tipo: "anti-exemplo" }> =>
      b.tipo === "anti-exemplo"
  );
  for (const [i, b] of anti.entries()) {
    const errado = b.codigo?.code?.trim();
    if (!errado || errado.length < 12) continue;
    const correta = rnd() < 0.5 ? ("a" as const) : ("b" as const);
    out.push({
      tipo: "dois-codigos",
      id: `dois:${c.slug}:anti:${i}`,
      enunciado: `${b.comoSeParece} — qual trecho está certo?`,
      a: correta === "a" ? bom : errado,
      b: correta === "b" ? bom : errado,
      correta,
      explicacao: b.correcao,
    });
  }
  const clinica = listCasosClinica().filter((x) => x.slug === c.slug);
  for (const [i, caso] of clinica.entries()) {
    if (out.some((d) => d.id.includes(`anti:${i}`))) continue;
    const errado = caso.codigo.code?.trim();
    if (!errado || errado.length < 12) continue;
    const correta = rnd() < 0.5 ? ("a" as const) : ("b" as const);
    out.push({
      tipo: "dois-codigos",
      id: `dois:${c.slug}:clinica:${i}`,
      enunciado: `${caso.problema} — qual trecho está certo?`,
      a: correta === "a" ? bom : errado,
      b: correta === "b" ? bom : errado,
      correta,
      explicacao: caso.correcao,
    });
  }
  return out;
}

/** Fallback sem eco de título/resumo: MCQ do banco (+ relacionados) ou VF de onde/custo. */
function fallbackSolido(c: Conceito, semente: number, rnd: () => number): Desafio[] {
  const escopo = [c.slug, ...(c.relacionados ?? []).slice(0, 4)];
  const mcqs = gerarRodada({
    semente,
    quantas: 6,
    escopo,
  }).map(perguntaParaMcq);
  if (mcqs.length >= 2) return mcqs.slice(0, 3);
  // última linha: VF de onde/custo já filtrados
  return vfDoConceito(c, rnd).slice(0, 2);
}

/**
 * Detecta desafios ocos (eco de resumo, quiz de nome, comentário fingindo código).
 */
export function desafioOco(d: Desafio): boolean {
  const texto =
    d.tipo === "vf"
      ? d.afirmacao
      : d.tipo === "lacuna"
        ? `${d.fraseAntes}${d.fraseDepois}`
        : d.tipo === "mcq" ||
            d.tipo === "ordenar" ||
            d.tipo === "parear" ||
            d.tipo === "dois-codigos"
          ? d.enunciado
          : "";
  const t = texto.toLowerCase();
  if (/se chama|desta lição|este nó trata/.test(t)) return true;
  if (/neste passo da trilha|checkpoint da trilha/.test(t)) return true;
  if (d.id.includes(":resumo") || d.id.includes("fallback-titulo")) return true;
  if (d.tipo === "parear" && d.id.includes(":rel")) return true;
  if (d.tipo === "dois-codigos") {
    if (d.a.trim().startsWith("//") && d.a.length < 80) return true;
    if (d.b.trim().startsWith("//") && d.b.length < 80) return true;
  }
  return false;
}

/**
 * Monta a rodada de uma lição de conceito.
 * Prioridade: dois-códigos / ordenar / MCQ do quiz → depois parear/lacuna/VF úteis.
 */
export function gerarDesafiosLicao(o: {
  slug: string;
  semente: number;
  quantas?: number;
}): Desafio[] {
  const quantas = o.quantas ?? 5;
  const rnd = prng(o.semente);
  const c = getConceito(o.slug);
  if (!c) return [];

  const escopoMcq = [c.slug, ...(c.relacionados ?? []).slice(0, 6)];
  const mcqs = gerarRodada({
    semente: o.semente,
    quantas: Math.max(quantas, 8),
    escopo: escopoMcq,
  }).map(perguntaParaMcq);

  const prioritarios: Desafio[] = [
    ...doisCodigosDoConceito(c, rnd),
    ...ordenarDoConceito(c).map((d) => ({
      ...d,
      itens: embaralhar(d.itens, rnd),
    })),
    ...mcqs,
  ].filter((d) => !desafioOco(d));

  const secundarios: Desafio[] = [
    ...parearDoConceito(c),
    ...lacunaDoConceito(c, rnd),
    ...vfDoConceito(c, rnd),
  ].filter((d) => !desafioOco(d));

  const escolhidos: Desafio[] = [];
  const usados = new Set<string>();
  const tiposUsados = new Set<string>();

  const puxar = (pool: Desafio[], preferDiversificar: boolean) => {
    for (const d of embaralhar(pool, rnd)) {
      if (escolhidos.length >= quantas) break;
      if (usados.has(d.id)) continue;
      if (preferDiversificar && tiposUsados.has(d.tipo) && escolhidos.length < quantas - 1) {
        // deixa um slot para outro tipo, mas não bloqueia se for a única opção
        const aindaTemOutroTipo = pool.some(
          (x) => !usados.has(x.id) && !tiposUsados.has(x.tipo)
        );
        if (aindaTemOutroTipo) continue;
      }
      escolhidos.push(d);
      usados.add(d.id);
      tiposUsados.add(d.tipo);
    }
  };

  // 1) no máx. 1 de cada tipo “pesado”, depois MCQs
  for (const tipo of ["dois-codigos", "ordenar"] as const) {
    const cand = pick(
      prioritarios.filter((d) => d.tipo === tipo && !usados.has(d.id)),
      rnd
    );
    if (cand) {
      escolhidos.push(cand);
      usados.add(cand.id);
      tiposUsados.add(cand.tipo);
    }
  }
  puxar(
    prioritarios.filter((d) => d.tipo === "mcq"),
    false
  );
  puxar(secundarios, true);
  puxar(
    prioritarios.filter((d) => !usados.has(d.id)),
    false
  );

  if (escolhidos.length < 2) {
    for (const d of fallbackSolido(c, o.semente + 17, rnd)) {
      if (desafioOco(d) || usados.has(d.id)) continue;
      escolhidos.push(d);
      usados.add(d.id);
      if (escolhidos.length >= Math.min(2, quantas)) break;
    }
  }

  return embaralhar(escolhidos, rnd).slice(0, quantas);
}

/* ------------------------------------------------------------------ *
 * Checkpoints — só curadoria em content/jornada/checkpoints/           *
 * ------------------------------------------------------------------ */

/**
 * Checkpoints usam banco curado. Não geramos pergunta a partir de
 * `item.descricao` (eco genérico / cheiro de texto automático).
 */
export function gerarDesafiosCheckpoint(o: {
  roadmapSlug: string;
  item: RoadmapItem;
  semente: number;
  quantas?: number;
}): Desafio[] {
  const quantas = o.quantas ?? 3;
  const rnd = prng(o.semente);
  const chave = chaveCheckpoint(o.roadmapSlug, o.item.id);
  const curados = desafiosCheckpointCurados(chave);
  return embaralhar(curados, rnd).slice(0, quantas);
}

/** Chave estável para XP/desempenho em nós sem conceito. */
export function chaveXpCheckpoint(roadmapSlug: string, itemId: string): string {
  return `checkpoint:${roadmapSlug}:${itemId}`;
}

/** True se a chave veio de um nó de checkpoint (não é slug de verbete). */
export function ehChaveCheckpoint(chave: string): boolean {
  return chave.startsWith("checkpoint:");
}

/**
 * Estrelas pela limpeza da tentativa.
 * Lição curta (checkpoint, ≤3): 3★ só sem erro; 1 erro → 2★; senão 1★.
 * Lição longa (conceito): 0 erros → 3★; ≤2 → 2★; senão 1★.
 */
export function estrelasDaLicao(totalDesafios: number, erros: number): number {
  if (totalDesafios <= 0) return 0;
  if (erros <= 0) return 3;
  if (totalDesafios <= 3) return erros === 1 ? 2 : 1;
  return erros <= 2 ? 2 : 1;
}

/**
 * Lição de revisão: mistura desafios dos conceitos em que o usuário mais erra.
 * Round-robin entre slugs para não ficar preso num só.
 */
export function gerarDesafiosRevisao(o: {
  slugs: string[];
  semente: number;
  quantas?: number;
}): Desafio[] {
  const quantas = o.quantas ?? 5;
  const rnd = prng(o.semente);
  const slugs = o.slugs.filter((s) => !!getConceito(s));
  if (slugs.length === 0) return [];

  const out: Desafio[] = [];
  const usados = new Set<string>();
  for (let i = 0; i < quantas * 4 && out.length < quantas; i++) {
    const slug = slugs[i % slugs.length]!;
    const lote = gerarDesafiosLicao({
      slug,
      semente: o.semente + i * 31,
      quantas: 3,
    });
    for (const d of lote) {
      if (usados.has(d.id)) continue;
      usados.add(d.id);
      out.push(d);
      if (out.length >= quantas) break;
    }
  }
  return embaralhar(out, rnd).slice(0, quantas);
}
