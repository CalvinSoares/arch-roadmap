import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { getConceito, listConceitos } from "@/shared/lib/content";
import { CATEGORIAS, DIFICULDADES } from "@/shared/config/categorias";
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

  const cat = CATEGORIAS[conceito.categoria];

  return (
    <PageTemplate
      icon={BookOpen}
      title={conceito.titulo}
      subtitle={conceito.resumo}
      breadcrumb={[
        { label: "Conceitos", href: "/conceitos" },
        { label: cat.label },
        { label: conceito.titulo },
      ]}
      actions={
        <span className="text-sm text-muted">
          {DIFICULDADES[conceito.dificuldade]} · {conceito.tempoLeitura} min
        </span>
      }
    >
      <ConceitoView conceito={conceito} />
    </PageTemplate>
  );
}
