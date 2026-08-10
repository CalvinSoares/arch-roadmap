import { LayoutGrid } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { listConceitos } from "@/shared/lib/content";
import { CatalogoConceitos } from "./_components/catalogo-conceitos";

export const metadata = { title: "Conceitos" };

export default function ConceitosPage() {
  const conceitos = listConceitos();

  return (
    <PageTemplate
      icon={LayoutGrid}
      title="Conceitos"
      subtitle="Padrões de projeto, princípios e arquitetura — filtre e explore."
      breadcrumb={[{ label: "Conceitos" }]}
    >
      <CatalogoConceitos conceitos={conceitos} />
    </PageTemplate>
  );
}
