import { Blocks } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { ConstrutorApp } from "./_components/construtor-app";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Construtor de Projeto",
  description:
    "Monte sua arquitetura com camadas e padrões, simule a requisição e exporte um ADR em Markdown — sem cadastro.",
  path: "/construtor",
});

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
