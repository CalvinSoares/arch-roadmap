import { PencilRuler } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { ENTREVISTAS } from "@/content/entrevistas/registro";
import { EntrevistaHub } from "./_components/entrevista-hub";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Modo entrevista",
  description:
    "System design com rubrica, ou dez minutos de código com explique-erro e duelos. No final, o que vale reler.",
  path: "/construtor/entrevista",
});

export default function EntrevistaPage() {
  return (
    <PageTemplate
      icon={PencilRuler}
      title="Modo entrevista"
      subtitle="Dois formatos: desenhar a arquitetura e conferir a rubrica, ou responder código no relógio."
      breadcrumb={[
        { label: "Construtor", href: "/construtor" },
        { label: "Modo entrevista" },
      ]}
    >
      <EntrevistaHub entrevistas={ENTREVISTAS} />
    </PageTemplate>
  );
}
