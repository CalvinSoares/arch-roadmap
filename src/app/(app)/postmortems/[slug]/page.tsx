import { notFound } from "next/navigation";
import { Siren, Zap, Wrench } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";
import { PostmortemJogavel } from "@/shared/components/conteudo/postmortem-jogavel";
import { POSTMORTEMS } from "@/content/postmortems/registro";
import { distratoresDePostmortem } from "@/shared/lib/cheiros";
import { cn } from "@/shared/utils/cn";
import { pageMetadata, breadcrumbJsonLd, articleJsonLd } from "@/shared/lib/seo";
import { JsonLd } from "@/shared/components/seo/json-ld";

export function generateStaticParams() {
  return POSTMORTEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/postmortems/[slug]">
) {
  const { slug } = await props.params;
  const pm = POSTMORTEMS.find((p) => p.slug === slug);
  if (!pm) {
    return pageMetadata({
      title: "Postmortem não encontrado",
      description: "Este postmortem não existe ou foi movido.",
      path: `/postmortems/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: `${pm.titulo} — ${pm.organizacao}`,
    description: pm.impacto,
    path: `/postmortems/${pm.slug}`,
    type: "article",
  });
}

export default async function PostmortemPage(
  props: PageProps<"/postmortems/[slug]">
) {
  const { slug } = await props.params;
  const pm = POSTMORTEMS.find((p) => p.slug === slug);
  if (!pm) notFound();

  return (
    <PageTemplate
      icon={Siren}
      title={pm.titulo}
      subtitle={`${pm.organizacao} · ${pm.quando.rotulo}`}
      breadcrumb={[
        { label: "Postmortems", href: "/postmortems" },
        { label: pm.organizacao },
      ]}
    >
      <JsonLd
        data={[
          articleJsonLd({
            title: `${pm.titulo} — ${pm.organizacao}`,
            description: pm.impacto,
            path: `/postmortems/${pm.slug}`,
            datePublished: `${pm.quando.ano}-01-01`,
          }),
          breadcrumbJsonLd([
            { name: "Início", path: "/" },
            { name: "Postmortems", path: "/postmortems" },
            { name: pm.titulo, path: `/postmortems/${pm.slug}` },
          ]),
        ]}
      />
      <div className="max-w-[72ch] space-y-8">
        {/* o estrago, em destaque */}
        <p
          className="rounded-2xl border p-4 text-[15px] leading-relaxed sm:p-5"
          style={{
            borderColor: "color-mix(in srgb, var(--perigo) 30%, transparent)",
            background: "color-mix(in srgb, var(--perigo) 5%, transparent)",
          }}
        >
          <span className="font-semibold">Impacto: </span>
          <TextoRico>{pm.impacto}</TextoRico>
        </p>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            O que aconteceu
          </h2>
          <div className="prose-doc mt-3">
            {pm.oQueAconteceu.map((p, i) => (
              <p key={i}>
                <TextoRico>{p}</TextoRico>
              </p>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            A linha do tempo
          </h2>
          <ol className="mt-4 space-y-0">
            {pm.linhaDoTempo.map((m, i) => (
              <li key={i} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4">
                <span
                  className={cn(
                    "py-1.5 text-right font-mono text-[12px]",
                    m.virada ? "font-bold" : "text-muted"
                  )}
                  style={m.virada ? { color: "var(--perigo)" } : undefined}
                >
                  {m.quando}
                </span>
                <div className="relative flex gap-4 pb-4">
                  <span aria-hidden className="relative flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-2 size-2 shrink-0 rounded-full",
                        m.virada ? "ring-4" : ""
                      )}
                      style={{
                        background: m.virada ? "var(--perigo)" : "var(--card-border)",
                        ...(m.virada
                          ? {
                              boxShadow:
                                "0 0 0 4px color-mix(in srgb, var(--perigo) 18%, transparent)",
                            }
                          : {}),
                      }}
                    />
                    {i < pm.linhaDoTempo.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-card-border" />
                    )}
                  </span>
                  <p className="py-1 text-[14px] leading-relaxed text-foreground">
                    <TextoRico>{m.texto}</TextoRico>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--alerta) 15%, transparent)",
                color: "var(--alerta)",
              }}
            >
              <Zap className="size-4" />
            </span>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              A causa raiz
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground">
            <TextoRico>{pm.causaRaiz}</TextoRico>
          </p>
        </section>

        <PostmortemJogavel
          conceitos={pm.conceitos}
          distratores={distratoresDePostmortem(
            pm.slug,
            pm.conceitos.map((c) => c.slug)
          )}
        />

        <section>
          <div className="flex items-center gap-2.5">
            <Wrench aria-hidden className="size-5 text-muted" />
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              O que mudou depois
            </h2>
          </div>
          <ul className="mt-3 space-y-2">
            {pm.oQueMudou.map((m, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
                <span aria-hidden style={{ color: "var(--ok)" }}>
                  →
                </span>
                <span>
                  <TextoRico>{m}</TextoRico>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="border-t border-card-border pt-4 text-[13px] text-muted">
          <span className="font-semibold">Fonte: </span>
          <TextoRico>{pm.fonte}</TextoRico>
        </p>
      </div>
    </PageTemplate>
  );
}
