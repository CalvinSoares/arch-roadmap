import { notFound } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import {
  getComparacao,
  getConceito,
  listComparacoes,
} from "@/shared/lib/content";
import { ComparacaoView } from "./_components/comparacao-view";

export function generateStaticParams() {
  return listComparacoes().map((c) => ({ par: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/comparar/[par]">) {
  const { par } = await params;
  const c = getComparacao(par);
  if (!c) return { title: "Comparação não encontrada" };

  const a = getConceito(c.a);
  const b = getConceito(c.b);
  const titulo = `${a?.titulo ?? c.a} × ${b?.titulo ?? c.b}`;
  return {
    title: titulo,
    // sem markdown na meta description
    description: c.vereditoRapido.replace(/\*\*/g, ""),
  };
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

  return (
    <PageTemplate
      icon={GitCompareArrows}
      title={`${a.titulo} × ${b.titulo}`}
      subtitle="Dois padrões que costumam ser trocados um pelo outro — e o que de fato os separa."
      breadcrumb={[
        { label: "Comparações", href: "/comparar" },
        { label: `${a.titulo} × ${b.titulo}` },
      ]}
    >
      <ComparacaoView comparacao={comparacao} a={a} b={b} />
    </PageTemplate>
  );
}
