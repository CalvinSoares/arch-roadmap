import { CircleHelp } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { SeletorQuiz } from "./_components/seletor-quiz";

export const metadata = {
  title: "Quiz",
  description:
    "Leia uma armadilha real de arquitetura, com o nome do padrão escondido, e descubra se sabe de quem ela é. Escolha por categoria ou por trilha.",
};

export default function QuizPage() {
  return (
    <PageTemplate
      icon={CircleHelp}
      title="Quiz das armadilhas"
      subtitle="Um erro clássico por vez, com o nome do padrão escondido. Escolha o assunto e veja se reconhece de quem é."
      breadcrumb={[{ label: "Quiz" }]}
    >
      <SeletorQuiz />
    </PageTemplate>
  );
}
