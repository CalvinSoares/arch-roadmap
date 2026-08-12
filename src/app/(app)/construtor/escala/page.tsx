import Link from "next/link";
import { Ruler, ArrowUpRight } from "lucide-react";
import { PageTemplate } from "@/shared/components/templates/page-template";
import { EscalaPlayground } from "@/shared/components/conteudo/demos/escala-playground";

import { pageMetadata } from "@/shared/lib/seo";

export const metadata = pageMetadata({
  title: "Escala de latência",
  description:
    "Compara dois tempos e vê a proporção: RAM contra outra região, cache contra full scan, disjuntor contra espera sem prazo. Os mesmos números do Construtor.",
  path: "/construtor/escala",
});

export default function EscalaPage() {
  return (
    <PageTemplate
      icon={Ruler}
      title="Escala de latência"
      subtitle="Troca o par e olha a ordem de grandeza. Em latência a intuição erra fácil por fatores de um milhão."
      breadcrumb={[
        { label: "Construtor", href: "/construtor" },
        { label: "Escala" },
      ]}
    >
      <div className="space-y-8">
        <p className="max-w-[68ch] text-[15px] leading-relaxed text-muted">
          Ler da memória e chamar um serviço em outra região parecem a mesma
          &quot;só uma leitura a mais&quot;, mas uma delas custa{" "}
          <span className="text-foreground">
            mais de um milhão de vezes
          </span>
          . Escolhe um preset ou dois pontos na régua. Em escala real, a
          metade rápida some num pixel.
        </p>

        <EscalaPlayground />

        <section
          aria-labelledby="entao"
          className="max-w-[68ch] space-y-3 border-t border-card-border pt-6"
        >
          <h2 id="entao" className="text-sm font-semibold tracking-tight">
            Então o que muda?
          </h2>
          <p className="text-[14px] leading-relaxed text-muted">
            Se a rede é um milhão de vezes mais lenta que a memória,{" "}
            <span className="text-foreground">todo pedido precisa de prazo</span>
            . O custo de uma falha muda conforme o que protege a borda. Estes
            números são os mesmos que o simulador usa ao narrar uma requisição.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
            <li>
              <Link
                href="/conceitos/timeout"
                className="group/l inline-flex items-center gap-1 font-medium text-foreground underline decoration-card-border underline-offset-2 hover:decoration-primary"
              >
                Timeout: por que todo pedido tem prazo
                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" />
              </Link>
            </li>
            <li>
              <Link
                href="/construtor"
                className="group/l inline-flex items-center gap-1 font-medium text-foreground underline decoration-card-border underline-offset-2 hover:decoration-primary"
              >
                Ver estes números narrando uma requisição
                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" />
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </PageTemplate>
  );
}
