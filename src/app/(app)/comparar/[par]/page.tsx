import { notFound } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import {
  getComparacao,
  getConceito,
  listComparacoes,
} from "@/shared/lib/content";
import { pageMetadata, breadcrumbJsonLd, articleJsonLd } from "@/shared/lib/seo";
import { JsonLd } from "@/shared/components/seo/json-ld";
import { ComparacaoView } from "./_components/comparacao-view";

export function generateStaticParams() {
  return listComparacoes().map((c) => ({ par: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/comparar/[par]">) {
  const { par } = await params;
  const c = getComparacao(par);
  if (!c) {
    return pageMetadata({
      title: "Comparação não encontrada",
      description: "Esta comparação não existe ou foi movida.",
      path: `/comparar/${par}`,
      noIndex: true,
    });
  }

  const a = getConceito(c.a);
  const b = getConceito(c.b);
  const titulo = `${a?.titulo ?? c.a} × ${b?.titulo ?? c.b}`;
  return pageMetadata({
    title: titulo,
    // sem markdown na meta description
    description: c.vereditoRapido.replace(/\*\*/g, ""),
    path: `/comparar/${c.slug}`,
    type: "article",
  });
}

export default async function CompararParPage({
  params,
}: PageProps<"/comparar/[par]">) {
  const { par } = await params;
  const comparacao = getComparacao(par);
  if (!comparacao) notFound();

  const a = getConceito(comparacao.a);
  const b = getConceito(comparacao.b);
  if (!a || !b) notFound();

  const titulo = `${a.titulo} × ${b.titulo}`;
  const description = comparacao.vereditoRapido.replace(/\*\*/g, "");

  return (
    <PageTemplate
      icon={GitCompareArrows}
      title={titulo}
      subtitle="Dois padrões que costumam ser trocados um pelo outro, e o que de fato os separa."
      breadcrumb={[
        { label: "Comparações", href: "/comparar" },
        { label: titulo },
      ]}
    >
      <JsonLd
        data={[
          articleJsonLd({
            title: titulo,
            description,
            path: `/comparar/${comparacao.slug}`,
          }),
          breadcrumbJsonLd([
            { name: "Início", path: "/" },
            { name: "Comparações", path: "/comparar" },
            { name: titulo, path: `/comparar/${comparacao.slug}` },
          ]),
        ]}
      />
      <ComparacaoView comparacao={comparacao} a={a} b={b} />
    </PageTemplate>
  );
}
