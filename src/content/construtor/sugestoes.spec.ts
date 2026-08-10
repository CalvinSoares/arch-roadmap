import { describe, it, expect } from "vitest";
import type { EstadoProjeto } from "@/shared/types/construtor";
import { sugerir, revisarProjeto, type Sugestao } from "./sugestoes";
import { avaliarRegras, TEMPLATES } from "./regras";
import { camadaDef, padraoDef, posicaoCanonica } from "./blocos";
import { tecnologiaDef, TECNOLOGIAS_DEF } from "./tecnologias";
import { listConceitos } from "@/shared/lib/content";

const VAZIO: EstadoProjeto = { camadas: [] };

/** Espelha `aplicarSugestao` do hook, sem React. */
function aplicar(p: EstadoProjeto, s: Sugestao): EstadoProjeto {
  const camadas = p.camadas.map((c) => ({ ...c, padroes: [...c.padroes], tecnologias: [...c.tecnologias] }));
  // const local: o narrowing do switch sobrevive dentro dos callbacks abaixo.
  const acao = s.acao;
  switch (acao.tipo) {
    case "camada": {
      if (camadas.some((c) => c.camadaId === acao.camadaId)) return { camadas };
      camadas.push({ camadaId: acao.camadaId, padroes: [], tecnologias: [] });
      return { camadas };
    }
    case "padrao": {
      const alvo = camadas.find((c) => c.camadaId === acao.camadaId);
      if (alvo && !alvo.padroes.includes(acao.padraoId)) alvo.padroes.push(acao.padraoId);
      return { camadas };
    }
    case "tech": {
      const alvo = camadas.find((c) => c.camadaId === acao.camadaId);
      if (alvo && !alvo.tecnologias.includes(acao.techId)) alvo.tecnologias.push(acao.techId);
      return { camadas };
    }
    case "ordem":
      return {
        camadas: [...camadas].sort(
          (a, b) => posicaoCanonica(a.camadaId) - posicaoCanonica(b.camadaId)
        ),
      };
  }
}

describe("motor de sugestões", () => {
  it("projeto vazio recebe exatamente uma sugestão: comece pelo domínio", () => {
    const s = sugerir(VAZIO);
    expect(s).toHaveLength(1);
    expect(s[0].id).toBe("comece-dominio");
    expect(s[0].acao).toEqual({ tipo: "camada", camadaId: "dominio" });
  });

  it("toda sugestão tem id único, porquê e rótulo de ação", () => {
    const vistos = new Set<string>();
    const estados = [VAZIO, ...TEMPLATES.map((t) => t.estado)];
    for (const e of estados) {
      for (const s of sugerir(e)) {
        expect(s.porQue.length, s.id).toBeGreaterThan(40);
        expect(s.rotulo.trim().length, s.id).toBeGreaterThan(3);
        vistos.add(s.id);
      }
      const ids = sugerir(e).map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(vistos.size).toBeGreaterThan(0);
  });

  it("toda sugestão aponta para camada, padrão ou tech que existe", () => {
    const estados = [VAZIO, ...TEMPLATES.map((t) => t.estado)];
    for (const e of estados) {
      for (const s of sugerir(e)) {
        if (s.acao.tipo === "camada") expect(camadaDef(s.acao.camadaId), s.id).toBeDefined();
        if (s.acao.tipo === "padrao") {
          expect(padraoDef(s.acao.padraoId), s.id).toBeDefined();
          expect(camadaDef(s.acao.camadaId), s.id).toBeDefined();
        }
        if (s.acao.tipo === "tech") {
          expect(tecnologiaDef(s.acao.techId), s.id).toBeDefined();
          expect(camadaDef(s.acao.camadaId), s.id).toBeDefined();
        }
      }
    }
  });

  /** Aplicar a sugestão tem de mudar o estado — senão o botão é um no-op. */
  it("aplicar a primeira sugestão sempre altera o projeto", () => {
    let estado = VAZIO;
    for (let i = 0; i < 12; i++) {
      const [primeira] = sugerir(estado);
      if (!primeira) break;
      const depois = aplicar(estado, primeira);
      expect(JSON.stringify(depois), `sugestão ${primeira.id} foi no-op`).not.toBe(
        JSON.stringify(estado)
      );
      estado = depois;
    }
  });

  /** O motor tem de convergir: seguir as sugestões não pode ser infinito. */
  it("seguir as sugestões converge e zera as lacunas de fundação", () => {
    let estado = VAZIO;
    let voltas = 0;
    const fundacao = ["comece-dominio", "add-dominio", "arrumar-ordem", "add-banco"];
    while (voltas < 40) {
      const pendente = sugerir(estado).find((s) => fundacao.includes(s.id));
      if (!pendente) break;
      estado = aplicar(estado, pendente);
      voltas++;
    }
    expect(voltas).toBeLessThan(40);
    expect(sugerir(estado).map((s) => s.id).filter((id) => fundacao.includes(id))).toEqual([]);
    expect(estado.camadas.some((c) => c.camadaId === "dominio")).toBe(true);
  });

  it("uma sugestão satisfeita não é sugerida de novo", () => {
    let estado: EstadoProjeto = { camadas: [{ camadaId: "dominio", padroes: [], tecnologias: [] }] };
    const hexagonal = sugerir(estado).find((s) => s.id === "add-hexagonal");
    expect(hexagonal).toBeDefined();
    estado = aplicar(estado, hexagonal!);
    expect(sugerir(estado).map((s) => s.id)).not.toContain("add-hexagonal");
  });
});

describe("revisão sob demanda", () => {
  it("projeto vazio tem veredito próprio", () => {
    expect(revisarProjeto(VAZIO).veredito).toMatch(/vazio/i);
  });

  it.each(TEMPLATES.map((t) => [t.id, t.estado] as const))(
    "%s é revisado sem riscos e com pontos fortes",
    (_id, estado) => {
      const r = revisarProjeto(estado);
      expect(r.riscos).toEqual([]);
      expect(r.fortes.length).toBeGreaterThan(0);
      expect(r.veredito.length).toBeGreaterThan(30);
    }
  );

  it("riscos da revisão espelham exatamente os alertas do motor", () => {
    const torto: EstadoProjeto = {
      camadas: [
        { camadaId: "infra", padroes: [], tecnologias: ["postgres"] },
        { camadaId: "ui", padroes: [], tecnologias: [] },
      ],
    };
    const alertas = avaliarRegras(torto)
      .filter((i) => i.nivel === "alerta")
      .map((i) => i.titulo);
    expect(revisarProjeto(torto).riscos).toEqual(alertas);
    expect(alertas.length).toBeGreaterThan(0);
  });
});

describe("integridade do catálogo do construtor", () => {
  it("todo slug de conceito citado por uma tecnologia existe", () => {
    const validos = new Set(listConceitos().map((c) => c.slug));
    const quebrados: string[] = [];
    for (const tech of TECNOLOGIAS_DEF) {
      for (const slug of tech.conceitos ?? []) {
        if (!validos.has(slug)) quebrados.push(`${tech.id} → ${slug}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("toda tecnologia vive em pelo menos uma camada existente", () => {
    for (const tech of TECNOLOGIAS_DEF) {
      expect(tech.viveEm.length, tech.id).toBeGreaterThan(0);
      for (const c of tech.viveEm) expect(camadaDef(c), `${tech.id} → ${c}`).toBeDefined();
    }
  });
});
