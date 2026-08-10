import { GraduationCap } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { PainelEstudo } from "./_components/painel-estudo";

export const metadata = {
  title: "Estudar",
  description:
    "Continue de onde parou, receba os próximos conceitos da sua trilha e revise o que já estudou em intervalos espaçados.",
};

export default function EstudarPage() {
  return (
    <PageTemplate
      icon={GraduationCap}
      title="Estudar"
      subtitle="O que revisar hoje, o que vem a seguir e quanto falta em cada trilha."
      breadcrumb={[{ label: "Estudar" }]}
    >
      <PainelEstudo />
    </PageTemplate>
  );
}
