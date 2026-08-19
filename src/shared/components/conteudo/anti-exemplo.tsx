import { TriangleAlert, ArrowRight } from "lucide-react";
import { CodeTabs } from "@/shared/components/conteudo/code-tabs";
import type { Bloco } from "@/shared/types/bloco";
import type { LinguagemCodigo } from "@/shared/types/conceito";
import { TextoRico } from "@/shared/components/conteudo/texto-rico";

type Props = Omit<Extract<Bloco, { tipo: "anti-exemplo" }>, "codigo"> & {
  /** Já destacado pelo Shiki; o highlight roda no servidor, como nos demais. */
  exemplos: { lang: LinguagemCodigo; code: string; html: string }[];
};

/**
 * O padrão mal implementado, anotado.
 *
 * Usa o vermelho semântico (`--perigo`) em vez do acento da categoria: aqui a
 * cor precisa dizer "isto está errado", e não "isto é um conceito estrutural".
 * É o único bloco da página que foge do acento, e foge de propósito.
 */
export function AntiExemplo({
  titulo,
  comoSeParece,
  exemplos,
  sintomas,
  correcao,
}: Props) {
  return (
    <section
      // O id fica na seção, não no título: é ele que a trilha observa para
      // marcar a posição de leitura, e observar só o cabeçalho erra o alvo.
      id="anti-exemplo"
      aria-labelledby="anti-exemplo-titulo"
      className="scroll-mt-24 rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: "color-mix(in srgb, var(--perigo) 30%, transparent)",
        background: "color-mix(in srgb, var(--perigo) 5%, transparent)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--perigo) 15%, transparent)",
            color: "var(--perigo)",
          }}
        >
          <TriangleAlert className="size-4" />
        </span>
        <div className="min-w-0">
          <h2
            id="anti-exemplo-titulo"
            className="text-lg font-semibold tracking-[-0.02em]"
          >
            {titulo ?? "O jeito errado"}
          </h2>
          <p className="text-[13px] text-muted">
            Compila, roda, passa no code review. E quebra depois.
          </p>
        </div>
      </div>

      <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-foreground">
        <TextoRico>{comoSeParece}</TextoRico>
      </p>

      <div className="mt-4">
        <CodeTabs exemplos={exemplos} />
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          O que quebra
        </p>
        <ul className="mt-2.5 space-y-2">
          {sintomas.map((s) => (
            <li key={s.quando} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <span
                className="shrink-0 font-mono text-[12px] font-semibold sm:w-48"
                style={{ color: "var(--perigo)" }}
              >
                {s.quando}
              </span>
              <span className="text-[14px] leading-relaxed text-foreground">
                <TextoRico>{s.efeito}</TextoRico>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 flex items-start gap-2 border-t pt-4 text-[14px] leading-relaxed text-foreground">
        <ArrowRight
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
          style={{ color: "var(--ok)" }}
        />
        <span>
          <span className="font-semibold">A saída: </span>
          <TextoRico>{correcao}</TextoRico>
        </span>
      </p>
    </section>
  );
}
