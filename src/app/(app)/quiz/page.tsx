import { CircleHelp } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { SeletorQuiz } from "./_components/seletor-quiz";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Quiz",
  description:
    "Seis formatos de pergunta tirados do catálogo: armadilha, onde aparece, duelo, jeito errado, incidente e explique o erro.",
  path: "/quiz",
});

export default function QuizPage() {
  return (
    <PageTemplate
      icon={CircleHelp}
      title="Quiz"
      subtitle="Seis formatos na mesma rodada: armadilha, biblioteca que você já usa, duelo, jeito errado, incidente real e código que viola um princípio."
      breadcrumb={[{ label: "Quiz" }]}
    >
      <SeletorQuiz />
    </PageTemplate>
  );
}
