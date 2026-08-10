import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Map,
  Blocks,
  Clock,
  Sparkles,
  Zap,
  MousePointerClick,
  Code2,
  Scale,
  BookOpen,
} from "lucide-react";
import { Button } from "@/shared/components/global/ui/button";
import { Badge } from "@/shared/components/global/ui/badge";
import { Aurora } from "@/shared/components/global/ui/aurora";
import { Reveal, RevealItem } from "@/shared/components/global/ui/reveal";
import { SpotlightCard } from "@/shared/components/global/ui/spotlight-card";
import { SeloNovo } from "@/shared/components/global/ui/selo-novo";
import { Contador } from "@/shared/components/global/ui/contador";
import { CATEGORIAS } from "@/shared/config/categorias";
import { listConceitos, listRoadmaps } from "@/shared/lib/content";
import {
  listNovidades,
  temNovidadeRecente,
  formatarData,
  slugsNovos,
} from "@/shared/lib/novidades";
import type { Categoria } from "@/shared/types/conceito";

/* ------------------------------------------------------------------ */

const PILARES = [
  {
    icon: Map,
    titulo: "Roadmaps navegáveis",
    desc: "Trilhas em grafo — do básico ao avançado, com dependências claras e progresso salvo no navegador.",
    cor: "var(--cat-estrutural)",
  },
  {
    icon: Layers,
    titulo: "Camadas & diagramas",
    desc: "Veja onde cada peça atua na arquitetura, camada por camada, não só a teoria em prosa.",
    cor: "var(--cat-criacional)",
  },
  {
    icon: Code2,
    titulo: "Código real",
    desc: "Exemplos em TypeScript, Python e Java lado a lado, prontos para copiar.",
    cor: "var(--primary)",
  },
];

/** O que cada família de conceito responde. */
const FAMILIAS: { id: Categoria; pergunta: string; desc: string }[] = [
  {
    id: "criacional",
    pergunta: "Como objetos nascem?",
    desc: "Quem decide o que instanciar — e como esconder essa decisão de quem usa.",
  },
  {
    id: "estrutural",
    pergunta: "Como as peças se encaixam?",
    desc: "Composição, tradução e embrulho: juntar coisas que não nasceram juntas.",
  },
  {
    id: "comportamental",
    pergunta: "Como os objetos conversam?",
    desc: "Quem avisa quem, quem decide o quê, e como trocar comportamento em execução.",
  },
  {
    id: "principio",
    pergunta: "Que regra atravessa tudo?",
    desc: "Diretrizes que não são padrão nenhum, mas guiam a escolha de todos eles.",
  },
  {
    id: "arquitetura",
    pergunta: "Como o sistema inteiro se organiza?",
    desc: "Decisões de fronteira: o que fica no núcleo e o que é detalhe plugável.",
  },
];

/** A trilha de leitura de um verbete — mostra a profundidade do conteúdo. */
const ANATOMIA = [
  { icon: Zap, titulo: "Em 10 segundos", desc: "A resposta curta, antes de qualquer teoria." },
  { icon: Sparkles, titulo: "Analogia", desc: "O gancho no mundo real que faz a ideia grudar." },
  { icon: BookOpen, titulo: "O problema", desc: "Por que o padrão existe — com aprofundamento opcional." },
  { icon: MousePointerClick, titulo: "Interativo", desc: "Uma demo onde a teoria vira comportamento." },
  { icon: Layers, titulo: "Anatomia", desc: "As camadas navegáveis, uma de cada vez." },
  { icon: Code2, titulo: "Código", desc: "Três linguagens, o mesmo desenho." },
  { icon: Scale, titulo: "Decisão", desc: "Quando usar, quando evitar e as armadilhas." },
];

function TituloSecao({
  etiqueta,
  titulo,
  descricao,
  acao,
}: {
  etiqueta: string;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          {etiqueta}
        </p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em]">{titulo}</h2>
        {descricao && (
          <p className="mt-1.5 max-w-[58ch] text-[15px] leading-relaxed text-muted">
            {descricao}
          </p>
        )}
      </div>
      {acao}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function HomePage() {
  const conceitos = listConceitos();
  const roadmaps = listRoadmaps();
  const novidades = listNovidades();
  const novosConceitos = slugsNovos("conceito");
  const temNovidade = temNovidadeRecente();
  const ultima = novidades[0];

  const topicos = roadmaps.reduce(
    (a, r) => a + r.sections.reduce((b, s) => b + s.items.length, 0),
    0
  );

  const numeros = [
    { valor: conceitos.length, label: "conceitos" },
    { valor: roadmaps.length, label: "roadmaps" },
    { valor: topicos, label: "tópicos" },
    { valor: 3, label: "linguagens" },
  ];

  const porCategoria = (id: Categoria) =>
    conceitos.filter((c) => c.categoria === id).length;

  return (
    <div className="page-shell">
      {/* ================================================================ */}
      {/* Hero                                                             */}
      {/* ================================================================ */}
      <section className="borda-gradiente relative overflow-hidden rounded-3xl bg-card/50 px-6 py-14 sm:px-10 sm:py-20">
        <Aurora />

        <div className="relative mx-auto max-w-3xl text-center">
          {temNovidade && ultima ? (
            <Reveal aoAparecer={false}>
              <Link
                href="/novidades"
                className="group/nov inline-flex max-w-full items-center gap-2 rounded-full border border-card-border bg-card/80 py-1 pl-1 pr-3 text-[13px] transition-all duration-300 hover:border-primary/45 hover:shadow-[var(--shadow-md)]"
              >
                <SeloNovo />
                <span className="truncate text-muted transition-colors group-hover/nov:text-foreground">
                  {ultima.titulo}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-primary transition-transform duration-300 group-hover/nov:translate-x-0.5" />
              </Link>
            </Reveal>
          ) : (
            <Reveal aoAparecer={false}>
              <Badge ponto className="bg-accent/12 text-accent">
                Estudo &amp; visualização
              </Badge>
            </Reveal>
          )}

          <Reveal aoAparecer={false} indice={1}>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-6xl">
              Entenda padrões e arquitetura{" "}
              <span className="texto-gradiente">visualmente</span>
            </h1>
          </Reveal>

          <Reveal aoAparecer={false} indice={2}>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              Roadmaps enxutos e verbetes com diagramas, camadas navegáveis e
              código em três linguagens. Sem cadastro, sem ruído — só o
              essencial para aprender.
            </p>
          </Reveal>

          <Reveal aoAparecer={false} indice={3}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/roadmaps">
                  Ver roadmaps <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/conceitos">Explorar conceitos</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal aoAparecer={false} indice={4}>
            <dl className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {numeros.map(({ valor, label }, i) => (
                <div key={label} className="flex flex-col items-center">
                  <dt className="font-mono text-2xl font-semibold tabular-nums text-primary">
                    <Contador valor={valor} atraso={0.4 + i * 0.08} />
                  </dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Pilares                                                          */}
      {/* ================================================================ */}
      <section>
        <TituloSecao
          etiqueta="O que você encontra"
          titulo="Três formas de olhar a mesma ideia"
          descricao="Cada conceito é atacado pela trilha, pelo desenho e pelo código — porque entender de um jeito só costuma não bastar."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {PILARES.map(({ icon: Icon, titulo, desc, cor }, i) => (
            <Reveal key={titulo} indice={i} className="h-full">
              <SpotlightCard cor={cor} className="group h-full p-6">
                <span
                  className="grid size-10 place-items-center rounded-xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                  style={{
                    color: cor,
                    background: `color-mix(in srgb, ${cor} 14%, transparent)`,
                  }}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                  {titulo}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* As cinco famílias                                                */}
      {/* ================================================================ */}
      <section>
        <TituloSecao
          etiqueta="Como o catálogo é organizado"
          titulo="Cinco famílias, cinco perguntas"
          descricao="Todo conceito responde a uma destas perguntas. Saber qual delas você está fazendo já elimina metade das opções."
          acao={
            <Link
              href="/conceitos"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
            >
              Ver o catálogo
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIAS.map((f, i) => {
            const cat = CATEGORIAS[f.id];
            const total = porCategoria(f.id);
            return (
              <RevealItem key={f.id} indice={i} className="h-full">
                  <Link href="/conceitos" className="block h-full">
                    <SpotlightCard cor={cat.cssVar} className="flex h-full flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: cat.cssVar }}
                        >
                          {cat.label}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-muted">
                          {total}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold leading-snug tracking-tight">
                        {f.pergunta}
                      </p>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                        {f.desc}
                      </p>
                      {/* proporção desta família dentro do catálogo */}
                      <span
                        aria-hidden
                        className="mt-4 block h-1 overflow-hidden rounded-full bg-foreground/[0.07]"
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(total / conceitos.length) * 100}%`,
                            background: cat.cssVar,
                          }}
                        />
                      </span>
                    </SpotlightCard>
                  </Link>
              </RevealItem>
            );
          })}
        </ul>
      </section>

      {/* ================================================================ */}
      {/* Anatomia de um verbete                                           */}
      {/* ================================================================ */}
      <section className="borda-gradiente relative overflow-hidden rounded-3xl bg-card/40 p-6 sm:p-9">
        <TituloSecao
          etiqueta="Anatomia de um verbete"
          titulo="Sete paradas, do resumo à decisão"
          descricao="Todo conceito segue a mesma trilha. Você pode parar na primeira parada e já sair sabendo — ou descer até o fim."
        />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ANATOMIA.map(({ icon: Icon, titulo, desc }, i) => (
            <RevealItem
              key={titulo}
              indice={i}
              className="group/passo flex h-full gap-3 rounded-2xl border border-card-border bg-card p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary transition-transform duration-300 group-hover/passo:scale-110">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-baseline gap-1.5 font-medium leading-snug">
                    <span className="font-mono text-[11px] text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {titulo}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{desc}</p>
                </div>
            </RevealItem>
          ))}
          <RevealItem
            indice={ANATOMIA.length}
            className="flex h-full items-center"
          >
            <Button asChild variant="outline" className="w-full">
              <Link href={`/conceitos/${conceitos[0]?.slug ?? ""}`}>
                Ver um verbete <ArrowRight />
              </Link>
            </Button>
          </RevealItem>
        </ol>
      </section>

      {/* ================================================================ */}
      {/* Novidades                                                        */}
      {/* ================================================================ */}
      {novidades.length > 0 && (
        <section>
          <TituloSecao
            etiqueta="Em movimento"
            titulo="O que entrou por último"
            descricao="O projeto está sendo escrito em público. Cada entrega fica registrada, com o que mudou e quando."
            acao={
              <Link
                href="/novidades"
                className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
              >
                Todas as novidades
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {novidades.slice(0, 2).map((n, i) => (
              <Reveal key={n.versao} indice={i} className="h-full">
                <Link href="/novidades" className="block h-full">
                  <SpotlightCard className="flex h-full flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-foreground/[0.06] px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
                        v{n.versao}
                      </span>
                      <time dateTime={n.data} className="text-[13px] text-muted">
                        {formatarData(n.data)}
                      </time>
                      {i === 0 && temNovidade && <SeloNovo />}
                    </div>
                    <h3 className="mt-2.5 font-semibold leading-snug tracking-tight">
                      {n.titulo}
                    </h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                      {n.resumo}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      {n.mudancas.length} mudanças nesta entrega
                    </p>
                  </SpotlightCard>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* Conceitos em destaque                                            */}
      {/* ================================================================ */}
      <section>
        <TituloSecao
          etiqueta="Comece por um"
          titulo="Conceitos em destaque"
          descricao="Padrões, princípios e arquitetura — cada um com demo, diagrama e código."
          acao={
            <Link
              href="/conceitos"
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
            >
              Ver todos ({conceitos.length})
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conceitos.slice(0, 6).map((c, i) => {
            const cat = CATEGORIAS[c.categoria];
            return (
              <Reveal key={c.slug} indice={i % 3} className="h-full">
                <Link href={`/conceitos/${c.slug}`} className="block h-full">
                  <SpotlightCard cor={cat.cssVar} className="flex h-full flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Badge className={cat.badge}>{cat.label}</Badge>
                        {novosConceitos.includes(c.slug) && <SeloNovo />}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                        <Clock className="size-3" /> {c.tempoLeitura} min
                      </span>
                    </div>
                    <h3 className="mt-3.5 font-semibold tracking-tight">{c.titulo}</h3>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
                      {c.resumo}
                    </p>
                  </SpotlightCard>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/* Chamada final                                                    */}
      {/* ================================================================ */}
      <Reveal>
        <section className="borda-gradiente relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 px-6 py-9 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/14 text-accent">
              <Blocks className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold tracking-tight">
                Agora monte um projeto do zero
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Arraste blocos, conecte camadas e simule o caminho de uma
                requisição pela arquitetura que você desenhou.
              </p>
            </div>
          </div>
          <Button asChild variant="accent" className="shrink-0">
            <Link href="/construtor">
              Abrir Construtor <ArrowRight />
            </Link>
          </Button>
        </section>
      </Reveal>
    </div>
  );
}
