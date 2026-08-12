import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Quiz } from "@/shared/components/conteudo/quiz";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Quiz (UI)", () => {
  it("mostra alternativas e registra um acerto ou erro", async () => {
    const user = userEvent.setup();
    const onResponder = vi.fn();

    render(
      <Quiz
        hoje="2026-08-11"
        quantidade={1}
        formatos={["explique-erro"]}
        onResponder={onResponder}
      />
    );

    // o formato rotula a pergunta
    expect(screen.getByText("Explique o erro")).toBeInTheDocument();

    const botoes = screen.getAllByRole("button");
    // alternativas (até 4) — pega o primeiro que não é "Próxima"/resultado
    const alternativa = botoes.find(
      (b) =>
        b.getAttribute("aria-pressed") !== null ||
        (!b.textContent?.includes("Outra") &&
          !b.textContent?.includes("Próxima") &&
          !b.textContent?.includes("Ver resultado"))
    );
    expect(alternativa).toBeTruthy();
    await user.click(alternativa!);

    expect(onResponder).toHaveBeenCalledTimes(1);
    expect(onResponder.mock.calls[0][0]).toEqual(expect.any(String));
    expect(typeof onResponder.mock.calls[0][1]).toBe("boolean");

    // feedback + avanço
    expect(
      screen.getByRole("button", { name: /ver resultado|próxima/i })
    ).toBeInTheDocument();
  });

  it("estado vazio quando o escopo não gera perguntas", () => {
    render(
      <Quiz
        hoje="2026-08-11"
        escopo={["slug-que-nao-existe"]}
        formatos={["explique-erro"]}
        vazio="Nada por aqui."
      />
    );
    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
  });
});
