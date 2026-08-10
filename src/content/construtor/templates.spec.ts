import { describe, it, expect } from "vitest";
import { TEMPLATES, avaliarRegras, calcularScore } from "./regras";
import { sugerir } from "./sugestoes";
import { camadaDef, padraoDef, ORDEM_CANONICA } from "./blocos";
import { tecnologiaDef } from "./tecnologias";

/**
 * Regressão histórica: templates curados nascendo com alerta.
 * Aconteceu duas vezes (Fase A no e-commerce sem observabilidade; Fase F nos
 * dois templates novos) e nas duas foi o próprio motor que denunciou, por
 * acaso. Estes testes tornam o acaso desnecessário.
 */
describe("templates curados", () => {
  it("existem 7 templates com ids únicos", () => {
    expect(TEMPLATES).toHaveLength(7);
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s nasce sem nenhum alerta",
    (_id, template) => {
      const alertas = avaliarRegras(template.estado)
        .filter((i) => i.nivel === "alerta")
        .map((i) => `${i.id}: ${i.titulo}`);
      expect(alertas).toEqual([]);
    }
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s está na ordem canônica",
    (_id, template) => {
      const posicoes = template.estado.camadas.map((c) =>
        ORDEM_CANONICA.indexOf(c.camadaId)
      );
      const ordenado = [...posicoes].sort((a, b) => a - b);
      expect(posicoes).toEqual(ordenado);
    }
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s só referencia camadas, padrões e tecnologias que existem",
    (_id, template) => {
      for (const camada of template.estado.camadas) {
        expect(camadaDef(camada.camadaId), `camada ${camada.camadaId}`).toBeDefined();
        for (const p of camada.padroes) {
          expect(padraoDef(p), `padrão ${p}`).toBeDefined();
        }
        for (const t of camada.tecnologias) {
          expect(tecnologiaDef(t), `tech ${t}`).toBeDefined();
        }
      }
    }
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s não repete camada e traz 3 bullets de porquê",
    (_id, template) => {
      const ids = template.estado.camadas.map((c) => c.camadaId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(template.porQue.length).toBeGreaterThanOrEqual(3);
      for (const b of template.porQue) expect(b.trim().length).toBeGreaterThan(20);
    }
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s produz sinergias (não é só ausência de alerta)",
    (_id, template) => {
      const sinergias = avaliarRegras(template.estado).filter(
        (i) => i.nivel === "sinergia"
      );
      expect(sinergias.length).toBeGreaterThan(0);
    }
  );

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s tem score dentro dos limites e com fatores explicados",
    (_id, template) => {
      const s = calcularScore(template.estado);
      for (const [chave, valor] of Object.entries(s)) {
        if (chave === "fatores") continue;
        expect(valor, chave).toBeGreaterThanOrEqual(0);
        expect(valor, chave).toBeLessThanOrEqual(100);
      }
      expect(s.fatores.length).toBeGreaterThan(0);
    }
  );

  /**
   * Um template curado é, por definição, um bom ponto de partida — não deveria
   * ter lacunas de fundação (domínio ausente, banco ausente, pilha torta).
   * Sugestões de refinamento são aceitáveis; as de fundação, não.
   */
  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    "%s não nasce com lacuna de fundação",
    (_id, template) => {
      const fundacao = ["add-dominio", "arrumar-ordem", "add-banco"];
      const pendentes = sugerir(template.estado)
        .map((s) => s.id)
        .filter((id) => fundacao.includes(id));
      expect(pendentes).toEqual([]);
    }
  );
});
