"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Check,
  RotateCcw,
  Target,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { getConceito } from "@/shared/lib/content";
import { topicosDisponiveis, type TopicoQuiz } from "@/shared/lib/quiz";
import {
  TODOS_OS_FORMATOS,
  ROTULO_FORMATO,
  DESCRICAO_FORMATO,
  disponibilidadePorFormato,
  type FormatoQuiz,
} from "@/shared/lib/quiz-formatos";
import { paraISO } from "@/shared/lib/estudo";
import { Quiz } from "@/shared/components/conteudo/quiz";
import { useDesempenhoQuiz } from "@/shared/hook/use-desempenho-quiz";
import { pontosFracos, totais, slugsFracos } from "@/shared/lib/desempenho";

/** A partir de quantos pontos fracos vale oferecer o modo "praticar". */
const MIN_FRACOS = 3;

/** Tópico "tudo": o catálogo inteiro, sem escopo. */
const TUDO: TopicoQuiz = {
  id: "tudo",
  titulo: "Catálogo inteiro",
  familia: "categoria",
  slugs: [],
  perguntas: 0,
};

const TAMANHOS = [5, 10, 20] as const;

/** Pílula de opção; o mesmo desenho para formato, assunto e tamanho. */
function Pilula({
  ativo,
  onClick,
  children,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  titulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title={titulo}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-colors",
        ativo
          ? "border-primary bg-primary/12 text-primary"
          : "border-card-border text-muted hover:border-primary/45 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function SeletorQuiz() {
  const topicos = topicosDisponiveis();
  const [escolhido, setEscolhido] = useState<TopicoQuiz>(TUDO);
  const [formatos, setFormatos] = useState<FormatoQuiz[]>([...TODOS_OS_FORMATOS]);
  const [tamanho, setTamanho] = useState<number>(5);
  const [ajustando, setAjustando] = useState(false);
  const hoje = paraISO(new Date());

  const { desempenho, registrar, resetar } = useDesempenhoQuiz();
  const resumo = useMemo(() => totais(desempenho), [desempenho]);
  const fracosRank = useMemo(() => pontosFracos(desempenho, 6), [desempenho]);
  const fracos = useMemo(() => slugsFracos(desempenho), [desempenho]);
  const temPraticaFracos = fracos.length >= MIN_FRACOS;
  // Snapshot: o escopo dos pontos fracos é capturado no clique (via
  // `escolhido.slugs`), então uma resposta no meio da rodada não remexe as
  // perguntas em andamento.
  const topicoFracos: TopicoQuiz = {
    id: "fracos",
    titulo: "Pontos fracos",
    familia: "categoria",
    slugs: fracos,
    perguntas: 0,
  };

  const escopo = escolhido.id === "tudo" ? undefined : escolhido.slugs;
  const disponivel = useMemo(() => disponibilidadePorFormato(escopo), [escopo]);

  const alternarFormato = (f: FormatoQuiz) =>
    setFormatos((atual) =>
      atual.includes(f)
        ? // nunca deixa zerar: sem formato não há rodada
          atual.length > 1
          ? atual.filter((x) => x !== f)
          : atual
        : [...atual, f]
    );

  const todosLigados = formatos.length === TODOS_OS_FORMATOS.length;
  // a chave reinicia a rodada quando qualquer opção muda
  const chave = `${escolhido.id}:${tamanho}:${[...formatos].sort().join(",")}`;

  return (
    <div className="space-y-4">
      {/*
        O quiz vem primeiro de propósito: antes havia 14 botões de filtro
        acima dele e a pergunta ficava abaixo da dobra, atrás de um formulário
        de configuração que quase ninguém precisa mexer.
      */}
      <section aria-live="polite">
        <Quiz
          key={chave}
          hoje={hoje}
          escopo={escopo}
          quantidade={tamanho}
          formatos={formatos}
          onResponder={registrar}
          vazio="Nenhuma pergunta com estes filtros. Solte um formato ou volte para o catálogo inteiro."
        />
      </section>

      {/*
        Desempenho: só aparece quando há histórico. O quiz alimenta o
        histórico e o botão "Praticar" devolve um sorteio focado nos
        conceitos com mais erros.
      */}
      {resumo.respostas > 0 && (
        <section className="rounded-2xl border border-card-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              <Target className="size-3.5" />
              Seu desempenho
            </h2>
            <button
              type="button"
              onClick={resetar}
              title="Apaga o histórico guardado neste navegador"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-cat-principio"
            >
              <Trash2 className="size-3.5" />
              Limpar
            </button>
          </div>

          <p className="mt-2.5 text-sm">
            <span className="font-mono text-lg font-semibold tabular-nums">
              {Math.round(resumo.taxaAcerto * 100)}%
            </span>{" "}
            <span className="text-muted">
              de acerto em {resumo.respostas}{" "}
              {resumo.respostas === 1 ? "resposta" : "respostas"}
            </span>
          </p>

          {fracosRank.length > 0 ? (
            <div className="mt-3.5 border-t border-card-border pt-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                Onde você mais erra
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {fracosRank.map((p) => {
                  const c = getConceito(p.slug);
                  if (!c) return null;
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/conceitos/${p.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cat-principio/40 bg-cat-principio/8 px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:border-cat-principio"
                      >
                        {c.titulo}
                        <span className="font-mono text-[11px] tabular-nums text-muted">
                          {p.erros}/{p.total}
                        </span>
                        <ArrowUpRight className="size-3.5 opacity-60" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {temPraticaFracos && (
                <button
                  type="button"
                  onClick={() => setEscolhido(topicoFracos)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <Target className="size-3.5" />
                  Praticar pontos fracos
                </button>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              Sem erros registrados ainda. Mandou bem.
            </p>
          )}
        </section>
      )}

      {/* ——— Ajustes, recolhidos ——— */}
      <div className="rounded-2xl border border-card-border bg-card">
        <button
          type="button"
          onClick={() => setAjustando((a) => !a)}
          aria-expanded={ajustando}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-medium transition-colors hover:text-primary"
        >
          <SlidersHorizontal className="size-4 shrink-0 text-muted" />
          <span>Ajustar a rodada</span>
          <span className="ml-auto text-[12px] font-normal text-muted">
            {escolhido.titulo} · {tamanho} perguntas ·{" "}
            {todosLigados
              ? "todos os formatos"
              : formatos.length === 1
                ? ROTULO_FORMATO[formatos[0]].toLowerCase()
                : `${formatos.length} formatos`}
          </span>
        </button>

        {ajustando && (
          <div className="space-y-5 border-t border-card-border p-4 sm:p-5">
            {/* formatos */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Formatos
              </p>
              <ul className="mt-2 space-y-1.5">
                {TODOS_OS_FORMATOS.map((f) => {
                  const ligado = formatos.includes(f);
                  const quantas =
                    f === "armadilha"
                      ? escolhido.perguntas || null
                      : disponivel[f];
                  const vazio = quantas === 0;
                  return (
                    <li key={f}>
                      <button
                        type="button"
                        onClick={() => alternarFormato(f)}
                        aria-pressed={ligado}
                        disabled={vazio}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
                          ligado && !vazio
                            ? "border-primary/45 bg-primary/8"
                            : "border-card-border hover:border-primary/30",
                          vazio && "opacity-40"
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                            ligado && !vazio
                              ? "border-transparent bg-primary text-primary-foreground"
                              : "border-card-border"
                          )}
                        >
                          {ligado && !vazio && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-baseline gap-1.5 text-[13px] font-semibold">
                            {ROTULO_FORMATO[f]}
                            {quantas !== null && (
                              <span className="tabular-nums font-normal text-muted">
                                {quantas}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                            {vazio
                              ? "nenhuma pergunta neste assunto"
                              : DESCRICAO_FORMATO[f]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* tamanho */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Perguntas por rodada
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAMANHOS.map((n) => (
                  <Pilula
                    key={n}
                    ativo={tamanho === n}
                    onClick={() => setTamanho(n)}
                  >
                    {n}
                  </Pilula>
                ))}
              </div>
            </div>

            {/* assunto */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Assunto
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  ...(temPraticaFracos ? [topicoFracos] : []),
                  TUDO,
                  ...topicos,
                ].map((t) => (
                  <Pilula
                    key={t.id}
                    ativo={escolhido.id === t.id}
                    onClick={() => setEscolhido(t)}
                    titulo={
                      t.id === "fracos"
                        ? "Os conceitos onde você mais erra"
                        : t.familia === "trilha"
                          ? "Trilha"
                          : "Categoria do catálogo"
                    }
                  >
                    {t.titulo}
                    {t.perguntas > 0 && (
                      <span className="ml-1.5 tabular-nums opacity-60">
                        {t.perguntas}
                      </span>
                    )}
                  </Pilula>
                ))}
              </div>
            </div>

            {!todosLigados || escolhido.id !== "tudo" || tamanho !== 5 ? (
              <button
                type="button"
                onClick={() => {
                  setFormatos([...TODOS_OS_FORMATOS]);
                  setEscolhido(TUDO);
                  setTamanho(5);
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Voltar ao padrão
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
