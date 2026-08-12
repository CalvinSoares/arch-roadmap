import { LayoutGrid } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { listConceitos } from "@/shared/lib/content";
import { slugsNovos } from "@/shared/lib/novidades";
import { pageMetadata } from "@/shared/lib/seo";
import { CatalogoConceitos } from "./_components/catalogo-conceitos";

export const metadata = pageMetadata({
  title: "Conceitos",
  description:
    "Catálogo visual de design patterns, princípios SOLID e arquitetura — com diagramas, demos e código em TypeScript, Python e Java.",
  path: "/conceitos",
});

export default function ConceitosPage() {
  const conceitos = listConceitos();

  return (
    <PageTemplate
      icon={LayoutGrid}
      title="Conceitos"
      subtitle="Padrões de projeto, princípios e arquitetura — filtre e explore."
      breadcrumb={[{ label: "Conceitos" }]}
    >
      {/* o "novo" é resolvido no servidor: evita divergência de hidratação */}
      <CatalogoConceitos conceitos={conceitos} novos={slugsNovos("conceito")} />
    </PageTemplate>
  );
}
