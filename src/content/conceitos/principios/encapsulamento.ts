import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// SEM encapsulamento: o estado é público e qualquer um mexe.
class ContaRuim {
  saldo = 0;
}
const c = new ContaRuim();
c.saldo = -999; // ninguém impede — invariante morta

// COM encapsulamento: o estado mora atrás de um contrato.
class Conta {
  #saldo = 0;
  depositar(v: number) {
    if (v <= 0) throw new Error("valor inválido");
    this.#saldo += v;
  }
  get saldo() { return this.#saldo; } // lê, não escreve à vontade
}
// Quem usa Conta não sabe — nem precisa saber — como o saldo é guardado.`,
  },
  {
    lang: "python" as const,
    code: `class Conta:
    def __init__(self):
        self._saldo = 0  # convenção: interno

    def depositar(self, v: float) -> None:
        if v <= 0:
            raise ValueError("valor inválido")
        self._saldo += v

    @property
    def saldo(self) -> float:
        return self._saldo
# O "_" sinaliza: não toque direto — use o contrato.`,
  },
  {
    lang: "java" as const,
    code: `public final class Conta {
  private int saldo;

  public void depositar(int v) {
    if (v <= 0) throw new IllegalArgumentException("valor");
    saldo += v;
  }

  public int getSaldo() { return saldo; }
}
// private + métodos públicos = contrato; o campo não vaza.`,
  },
];

export const encapsulamento: Conceito = {
  slug: "encapsulamento",
  titulo: "Encapsulamento",
  categoria: "principio",
  resumo:
    "Esconder o estado atrás de um contrato: quem usa o objeto não sabe — nem depende de — como ele guarda dados por dentro. Sem isso, cada mudança de representação vaza para quem consome; com isso, o objeto protege suas invariantes e pode mudar a implementação sem quebrar o resto.",
  tags: ["principio", "oop", "contrato", "invariante", "abstracao"],
  dificuldade: "iniciante",
  tempoLeitura: 5,
  nasceu: {
    quando: { rotulo: "1967–1972", ano: 1967, precisao: "aproximada" },
    fonte:
      "A ideia de esconder representação aparece com Simula e se consolida em Smalltalk e nos textos de Parnas sobre módulos (1972)",
    precursor:
      "Information hiding de Parnas: o módulo deve ocultar decisões de projeto que possam mudar.",
  },
  ondeAparece: [
    {
      onde: "campos private / #privado",
      explicacao:
        "A linguagem força o acesso pelo método — o estado deixa de ser propriedade pública do chamador.",
    },
    {
      onde: "getters sem setter cego",
      explicacao:
        "Ler o saldo é ok; escrever à vontade não. O contrato decide o que pode mudar e como.",
    },
    {
      onde: "módulo ES que não exporta",
      explicacao:
        "O que não sai do arquivo é interno: o importador só vê a API exportada — encapsulamento de módulo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `class Conta { #saldo = 0; depositar(v: number) { this.#saldo += v; } }`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Mais métodos (e nomes) do que expor o campo direto",
      "Contrato mal desenhado vira getter/setter que só empacota o vazamento",
    ],
    naoValeSe:
      "o dado é realmente um DTO sem invariante — aí um record/objeto plano é o contrato, não um teatro de private.",
  },
  relacionados: [
    "polimorfismo",
    "composicao-sobre-heranca",
    "srp",
    "value-object",
  ],
  problema: [
    "Quando o estado é público, qualquer tela, job ou teste mexe nele. A invariante (saldo ≥ 0, pedido não volta de pago para rascunho) deixa de ser responsabilidade do objeto e vira torcida coletiva.",
    "Mudar a representação — de número para centavos, de lista para mapa — quebra todos os pontos que liam o campo direto. O custo da mudança explode porque o detalhe interno virou API.",
  ],
  solucao: [
    "Guardar o estado como detalhe privado e publicar só operações que preservam as regras do domínio.",
    "Abstração aqui não é ‘esconder por esconder’: é decidir o contrato mínimo que o resto do sistema pode depender — e deixar o resto livre para mudar.",
  ],
  quandoUsar: [
    "Sempre que existir invariante a proteger (saldo, status, ciclo de vida).",
    "Quando a representação interna pode mudar sem o consumidor precisar saber.",
    "Em fronteiras de módulo: exportar API, não structs internas.",
  ],
  quandoEvitar: [
    "DTOs e payloads de transporte sem regra — o contrato já é o formato.",
    "Quando o ‘encapsulamento’ vira só getter/setter 1:1 do campo, sem regra.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Encapsulamento é esconder o estado atrás de um contrato. Quem usa não depende de como o dado é guardado; o objeto protege suas regras. Sem isso, todo consumidor vira cúmplice da representação — e mudar o interno vira mudança em cascata.",
    },
    {
      tipo: "analogia",
      emoji: "🏧",
      titulo: "O caixa eletrônico, não o cofre aberto",
      texto:
        "Você não mete a mão no cofre do banco: deposita, saca, consulta. O banco muda o layout do cofre sem te avisar. Encapsulamento é isso — operações públicas, estado fora do alcance. Abrir o campo `saldo` é deixar o cofre na rua.",
    },
    {
      tipo: "secao",
      id: "contrato",
      titulo: "Contrato, não paredes",
      resumo: [
        "O ponto não é ‘tornar private’. É decidir o que o resto do sistema pode assumir. Se o único método é `setSaldo`, você encapsulou o nome do campo e vazou a liberdade de corromper o valor.",
        "Abstração caminha junto: o consumidor pensa em ‘depositar’, não em ‘somar no array de lançamentos’. Quando a implementação muda e o contrato aguenta, o encapsulamento pagou a conta.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Estado exposto",
        itens: [
          "Campo público — qualquer um escreve",
          "Invariante espalhada em ifs pelo código",
          "Mudar representação quebra consumidores",
        ],
        nota: "Barato no dia 1; caro em toda mudança seguinte.",
      },
      depois: {
        titulo: "Estado atrás do contrato",
        itens: [
          "Campos privados / internos ao módulo",
          "Operações que validam e preservam regras",
          "Representação livre para evoluir",
        ],
        nota: "Um pouco mais de API — em troca de um objeto que ainda faz sentido daqui a um ano.",
      },
      legenda:
        "Encapsular é escolher o contrato; o ‘private’ é só o mecanismo.",
    },
    {
      tipo: "passos",
      titulo: "Do vazamento ao contrato",
      passos: [
        { titulo: "Esconder o estado", texto: "Campos viram privados / internos ao módulo — o consumidor não escreve direto." },
        { titulo: "Publicar operações", texto: "Métodos com nomes de domínio (`depositar`, `pagar`) validam e preservam invariantes." },
        { titulo: "Expor só o necessário", texto: "Leitura via getter ou cópia; nunca a coleção mutável interna." },
        { titulo: "Evoluir por dentro", texto: "Com o contrato estável, a representação pode mudar sem quebrar quem consome." },
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "Pedido com status público",
          cenario:
            "Um `pedido.status = 'pago'` aparecia em três services. Alguém setou `'cancelado'` depois do pagamento sem estornar.",
          aplicacao:
            "O status virou transição por métodos (`pagar`, `cancelar`) que checam o estado atual antes de mudar.",
          tradeoff:
            "Mais métodos no agregado. Em troca, transição ilegal deixa de ser possível por atribuição direta.",
        },
        {
          titulo: "Config espalhada em objeto mutável",
          cenario:
            "Um singleton de config era mutado em testes e em runtime — um teste ‘consertava’ o valor e o próximo falhava.",
          aplicacao:
            "Config virou imutável na borda; mudanças passam por rebuild ou por um serviço com API explícita.",
          tradeoff:
            "Menos atalho nos testes. Em troca, o estado global parou de vazar entre casos.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Getter/setter que só espelha o campo",
          texto:
            "Se `setX` aceita qualquer valor e `getX` devolve o campo, você não encapsulou — só mudou a sintaxe do vazamento.",
        },
        {
          titulo: "Expor a coleção interna",
          texto:
            "`getItens()` que devolve a lista mutável interna permite `pedido.getItens().clear()` por trás das costas do objeto.",
        },
        {
          titulo: "Encapsular demais e virar god object",
          texto:
            "Esconder estado não autoriza um único objeto a saber de tudo. SRP continua valendo — encapsule por responsabilidade, não por tamanho.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      comoSeParece:
        "Campo público (ou getter que devolve a lista interna) e a invariante espalhada em quem usa.",
      codigo: {
        lang: "typescript",
        code: `class Pedido {
  status: "rascunho" | "pago" | "cancelado" = "rascunho";
  itens: string[] = [];
}
// Em qualquer lugar do sistema:
pedido.status = "pago";
pedido.itens.push("x"); // ou .clear() — sem regra`,
      },
      sintomas: [
        {
          quando: "alguém seta status ilegal",
          efeito: "o domínio aceita estados que o negócio não existe",
        },
        {
          quando: "a lista interna vaza",
          efeito: "mutação silenciosa sem passar pelo agregado",
        },
      ],
      correcao:
        "Transições por método (`pagar`, `adicionarItem`) e coleções expostas só como cópia ou leitura.",
    },
    {
      tipo: "codigo",
      titulo: "Do campo público ao contrato",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Há invariante a proteger.",
        "A representação interna pode mudar.",
        "Fronteira de módulo: API pública × detalhe privado.",
      ],
      evitar: [
        "DTO sem regra — o formato já é o contrato.",
        "Getter/setter 1:1 sem validação (teatro de encapsulamento).",
      ],
    },
  ],
};
