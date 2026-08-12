import { Bug } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { ClinicaSessao } from "@/shared/components/conteudo/clinica-sessao";
import { casosDoDia } from "@/shared/lib/clinica";
import { highlightCode } from "@/shared/lib/highlight";
import { sementeDoDia } from "@/shared/lib/quiz";
import { paraISO } from "@/shared/lib/estudo";
import { pageMetadata, breadcrumbJsonLd } from "@/shared/lib/seo";
import { JsonLd } from "@/shared/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Código errado",
  description:
    "Trechos que quebram. Adivinha qual conceito foi mal aplicado, vê o estrago e como arrumar.",
  path: "/clinica",
});

export default async function ClinicaPage() {
  const hoje = paraISO(new Date());
  const semente = sementeDoDia(hoje);
  const casos = casosDoDia(semente);
  const comHtml = await Promise.all(
    casos.map(async (c) => ({
      ...c,
      html: await highlightCode(c.codigo.code, c.codigo.lang),
    }))
  );

  return (
    <PageTemplate
      icon={Bug}
      title="Código errado"
      subtitle="O padrão existe, mas alguém aplicou torto. Descobre qual e como consertar."
      breadcrumb={[{ label: "Código errado" }]}
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Código errado", path: "/clinica" },
        ])}
      />
      <div className="w-full max-w-5xl space-y-6">
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-muted">
          São os anti-exemplos do catálogo. Você lê o trecho, escolhe o conceito
          e depois vê o que quebra na prática e a correção.
        </p>
        <ClinicaSessao casos={comHtml} semente={semente} />
      </div>
    </PageTemplate>
  );
}
