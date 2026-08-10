import { Blocks } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { ConstrutorApp } from "./_components/construtor-app";

export const metadata = { title: "Construtor de Projeto" };

export default function ConstrutorPage() {
  return (
    <PageTemplate
      icon={Blocks}
      title="Construtor de Projeto"
      subtitle="Monte sua arquitetura com camadas e padrões — e entenda, a cada escolha, o que ela muda."
      breadcrumb={[{ label: "Construtor" }]}
    >
      <ConstrutorApp />
    </PageTemplate>
  );
}
