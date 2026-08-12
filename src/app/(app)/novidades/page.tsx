import { Sparkles } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { listNovidades, formatarData } from "@/shared/lib/novidades";
import { LinhaDoTempo } from "./_components/linha-do-tempo";
import { ASeguir } from "./_components/a-seguir";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Novidades",
  description:
    "Histórico de entregas do DevMappa: conteúdo novo, melhorias e correções.",
  path: "/novidades",
});

export default function NovidadesPage() {
  const entradas = listNovidades();
  const ultima = entradas[0];

  return (
    <PageTemplate
      icon={Sparkles}
      title="Novidades"
      subtitle="Tudo que entrou no DevMappa, da entrega mais recente para a mais antiga."
      breadcrumb={[{ label: "Novidades" }]}
      actions={
        ultima && (
          <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0 sm:text-right">
            <p className="font-mono text-sm font-semibold text-primary">
              v{ultima.versao}
            </p>
            <p className="text-xs text-muted">{formatarData(ultima.data)}</p>
          </div>
        )
      }
    >
      <ASeguir />
      <LinhaDoTempo entradas={entradas} />
    </PageTemplate>
  );
}
