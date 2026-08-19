import Link from "next/link";
import { ArrowUpRight, Lightbulb, TriangleAlert } from "lucide-react";
import { CATEGORIAS } from "@/shared/config/categorias";
import type { Comparacao } from "@/shared/types/comparacao";
import type { Conceito } from "@/shared/types/conceito";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";

/**
 * Ênfase leve: `**assim**` vira negrito. O conteúdo das comparações precisa
 * destacar a palavra que decide o duelo, e trazer um renderizador de Markdown
 * inteiro para isso seria desproporcional.
 */
function Cabecalho({ c, lado }: { c: Conceito; lado: "A" | "B" }) {
  const cat = CATEGORIAS[c.categoria];
  return (
    <Link
      href={`/conceitos/${c.slug}`}
      className="group/lado flex items-center gap-2 rounded-lg px-1 py-0.5 font-semibold tracking-tight transition-colors hover:text-primary"
      style={{ ["--acento" as string]: cat.cssVar }}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ background: cat.cssVar }}
      />
      {c.titulo}
      <span className="sr-only">{lado === "A" ? " (lado A)" : " (lado B)"}</span>
      <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/lado:opacity-70" />
    </Link>
  );
}

export function ComparacaoView({
  comparacao,
  a,
  b,
}: {
  comparacao: Comparacao;
  a: Conceito;
  b: Conceito;
}) {
  return (
    <div className="space-y-10">
      {/* Veredito: o que quem chegou veio buscar, entregue primeiro */}
      <section className="rounded-2xl border border-primary/35 bg-primary/[0.06] p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Lightbulb className="size-3.5" />
          Em uma frase
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          <TextoRico>{comparacao.vereditoRapido}</TextoRico>
        </p>
      </section>

      {/* Tabela de critérios, a parte principal da página */}
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Critério a critério
        </h2>

        {/* Desktop: tabela real, com os dois lados nas colunas */}
        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-card-border sm:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card">
                <th scope="col" className="w-[28%] p-3.5 text-left text-muted">
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    Pergunta
                  </span>
                </th>
                <th scope="col" className="p-3.5 text-left">
                  <Cabecalho c={a} lado="A" />
                </th>
                <th scope="col" className="p-3.5 text-left">
                  <Cabecalho c={b} lado="B" />
                </th>
              </tr>
            </thead>
            <tbody>
              {comparacao.criterios.map((cr) => (
                <tr
                  key={cr.pergunta}
                  className="border-b border-card-border last:border-0"
                >
                  <th
                    scope="row"
                    className="p-3.5 text-left align-top text-[13px] font-medium leading-snug"
                  >
                    {cr.pergunta}
                  </th>
                  <td className="p-3.5 align-top leading-relaxed text-muted">
                    <TextoRico>{cr.ladoA}</TextoRico>
                  </td>
                  <td className="p-3.5 align-top leading-relaxed text-muted">
                    <TextoRico>{cr.ladoB}</TextoRico>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: a mesma informação empilhada; tabela de 3 colunas é ilegível */}
        <ul className="mt-4 space-y-3 sm:hidden">
          {comparacao.criterios.map((cr) => (
            <li
              key={cr.pergunta}
              className="rounded-xl border border-card-border bg-card p-4"
            >
              <p className="text-[13px] font-semibold leading-snug">
                {cr.pergunta}
              </p>
              <dl className="mt-2.5 space-y-2.5">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {a.titulo}
                  </dt>
                  <dd className="mt-0.5 text-[13px] leading-relaxed">
                    <TextoRico>{cr.ladoA}</TextoRico>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {b.titulo}
                  </dt>
                  <dd className="mt-0.5 text-[13px] leading-relaxed">
                    <TextoRico>{cr.ladoB}</TextoRico>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      {/* Quando escolher cada um */}
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Quando escolher cada um
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              [a, comparacao.escolhaA],
              [b, comparacao.escolhaB],
            ] as const
          ).map(([conceito, texto]) => (
            <div
              key={conceito.slug}
              className="rounded-2xl border border-card-border bg-card p-5"
              style={{
                ["--acento" as string]: CATEGORIAS[conceito.categoria].cssVar,
              }}
            >
              <p className="font-semibold tracking-tight text-[var(--acento)]">
                {conceito.titulo}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {texto}
              </p>
              <Link
                href={`/conceitos/${conceito.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
              >
                Ver o conceito completo
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Por que confundem */}
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <TriangleAlert className="size-3.5" />
          Por que confundem
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed">
          <TextoRico>{comparacao.confusaoComum}</TextoRico>
        </p>
      </section>
    </div>
  );
}
