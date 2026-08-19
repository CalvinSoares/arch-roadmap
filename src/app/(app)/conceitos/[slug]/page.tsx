import { notFound } from "next/navigation";
import { getConceito, listConceitos } from "@/shared/lib/content";
import { pageMetadata, breadcrumbJsonLd, learningResourceJsonLd } from "@/shared/lib/seo";
import { JsonLd } from "@/shared/components/seo/json-ld";
import { ConceitoView } from "./_components/conceito-view";

export function generateStaticParams() {
  return listConceitos().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/conceitos/[slug]">) {
  const { slug } = await params;
  const conceito = getConceito(slug);
  if (!conceito) {
    return pageMetadata({
      title: "Conceito não encontrado",
      description: "Este conceito não existe ou foi movido.",
      path: `/conceitos/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: conceito.titulo,
    description: conceito.resumo,
    path: `/conceitos/${conceito.slug}`,
    type: "article",
  });
}

export default async function ConceitoPage({
  params,
}: PageProps<"/conceitos/[slug]">) {
  const { slug } = await params;
  const conceito = getConceito(slug);
  if (!conceito) notFound();

  // A página do conceito tem cabeçalho próprio (ConceitoHero) e não usa o
  // PageTemplate: hero e trilha de leitura formam uma peça só.
  return (
    <div className="page-shell">
      <JsonLd
        data={[
          learningResourceJsonLd({
            title: conceito.titulo,
            description: conceito.resumo,
            path: `/conceitos/${conceito.slug}`,
            keywords: conceito.tags,
            timeRequiredMinutes: conceito.tempoLeitura,
          }),
          breadcrumbJsonLd([
            { name: "Início", path: "/" },
            { name: "Conceitos", path: "/conceitos" },
            { name: conceito.titulo, path: `/conceitos/${conceito.slug}` },
          ]),
        ]}
      />
      <ConceitoView conceito={conceito} />
    </div>
  );
}
