import { notFound } from "next/navigation";
import { getConceito, listConceitos } from "@/shared/lib/content";
import { ConceitoView } from "./_components/conceito-view";

export function generateStaticParams() {
  return listConceitos().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/conceitos/[slug]">) {
  const { slug } = await params;
  const conceito = getConceito(slug);
  if (!conceito) return { title: "Conceito não encontrado" };
  return { title: conceito.titulo, description: conceito.resumo };
}

export default async function ConceitoPage({
  params,
}: PageProps<"/conceitos/[slug]">) {
  const { slug } = await params;
  const conceito = getConceito(slug);
  if (!conceito) notFound();

  // A página do conceito tem cabeçalho próprio (ConceitoHero) — não usa o
  // PageTemplate, porque hero e trilha de leitura formam uma peça só.
  return (
    <div className="page-shell">
      <ConceitoView conceito={conceito} />
    </div>
  );
}
