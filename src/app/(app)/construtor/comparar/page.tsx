import { Scale } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { ComparadorProjetos } from "./_components/comparador-projetos";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Comparar arquiteturas",
  description:
    "Duas arquiteturas lado a lado, com o diff das cinco métricas, das peças e do que o motor de regras diz. A resposta para 'e se eu tirasse a fila?'.",
  path: "/construtor/comparar",
});

export default function CompararPage() {
  return (
    <PageTemplate
      icon={Scale}
      title="Comparar arquiteturas"
      subtitle="Duas pilhas lado a lado: o que muda nas cinco métricas, quais peças entram e saem, e quais alertas a variante resolve — ou introduz."
      breadcrumb={[
        { label: "Construtor", href: "/construtor" },
        { label: "Comparar" },
      ]}
    >
      <div className="space-y-6">
        <p className="max-w-[68ch] text-[15px] leading-relaxed text-muted">
          &quot;E se eu tirasse a fila?&quot; é a pergunta que o Construtor
          deixava em aberto — e ela não se responde de cabeça, porque as cinco
          métricas se movem juntas: o ganho de uma esconde a piora de outra.
          Quase nunca há um lado melhor.{" "}
          <span className="text-foreground">Há uma troca, e ela tem nome.</span>
        </p>

        <ComparadorProjetos />
      </div>
    </PageTemplate>
  );
}
