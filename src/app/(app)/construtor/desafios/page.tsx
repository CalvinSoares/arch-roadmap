import { Bug } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { DESAFIOS } from "@/content/construtor/desafios";
import { DesafioJogo } from "./_components/desafio-jogo";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Quebre isto",
  description:
    "O Construtor ao contrário: você recebe uma arquitetura pronta e tem que achar o defeito. O gabarito é o mesmo motor de regras que analisa o que você monta.",
  path: "/construtor/desafios",
});

export default function DesafiosPage() {
  return (
    <PageTemplate
      icon={Bug}
      title="Quebre isto"
      subtitle="O Construtor ao contrário: em vez de montar, você recebe um desenho pronto e aponta o que está errado. Quem corrige é o mesmo motor de regras."
      breadcrumb={[{ label: "Construtor", href: "/construtor" }, { label: "Quebre isto" }]}
    >
      <DesafioJogo desafios={DESAFIOS} />
    </PageTemplate>
  );
}
