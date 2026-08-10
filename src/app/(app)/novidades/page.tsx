import { Sparkles } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { listNovidades, formatarData } from "@/shared/lib/novidades";
import { LinhaDoTempo } from "./_components/linha-do-tempo";

export const metadata = {
  title: "Novidades",
  description:
    "Histórico de entregas do DevAtlas: conteúdo novo, melhorias e correções.",
};

export default function NovidadesPage() {
  const entradas = listNovidades();
  const ultima = entradas[0];

  return (
    <PageTemplate
      icon={Sparkles}
      title="Novidades"
      subtitle="Tudo que entrou no DevAtlas, da entrega mais recente para a mais antiga."
      breadcrumb={[{ label: "Novidades" }]}
      actions={
        ultima && (
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-primary">
              v{ultima.versao}
            </p>
            <p className="text-xs text-muted">{formatarData(ultima.data)}</p>
          </div>
        )
      }
    >
      <LinhaDoTempo entradas={entradas} />
    </PageTemplate>
  );
}
