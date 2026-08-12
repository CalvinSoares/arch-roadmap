import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// PRIMITIVE OBSESSION: dinheiro como number cru espalha regras e bugs.
function total(preco: number, moeda: string) { /* ... */ }
total(10.005, "BRL");   // arredondamento? centavos? e se somar USD + BRL?

// VALUE OBJECT: um tipo definido pelo VALOR, imutavel, com igualdade
// por conteudo e as regras do conceito la dentro.
class Dinheiro {
  private constructor(readonly centavos: number, readonly moeda: string) {}

  static de(reais: number, moeda: string) {
    return new Dinheiro(Math.round(reais * 100), moeda); // regra num lugar so
  }

  somar(outro: Dinheiro): Dinheiro {
    if (outro.moeda !== this.moeda) throw new Error("moedas diferentes");
    return new Dinheiro(this.centavos + outro.centavos, this.moeda); // NOVO objeto
  }

  igual(outro: Dinheiro) {                 // igualdade por VALOR, sem id
    return this.centavos === outro.centavos && this.moeda === outro.moeda;
  }
}
// Dinheiro.de(10, "BRL") e SEMPRE igual a Dinheiro.de(10, "BRL").
// Nao existe "este" dez reais e "aquele": dez reais e dez reais.`,
  },
];

export const valueObject: Conceito = {
  slug: "value-object",
  titulo: "Value Object",
  categoria: "arquitetura",
  resumo:
    "Nem tudo no domínio tem identidade. Dez reais é dez reais; um CEP é um CEP — não existe 'este' e 'aquele', existe o valor. Um Value Object é um tipo definido só pelo seu conteúdo, imutável e com igualdade por valor, que carrega as regras daquele conceito em vez de deixá-las espalhadas sobre um number ou string cru. É o antídoto da obsessão por primitivos.",
  tags: ["ddd", "dominio", "imutabilidade", "tipo", "igualdade"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "2003", ano: 2003, precisao: "aproximada" },
    fonte:
      "Eric Evans, 'Domain-Driven Design', 2003, formalizou o Value Object como bloco tático; também catalogado por Martin Fowler (2002)",
    precursor:
      "A distinção entre coisas com identidade e coisas definidas só pelo valor (um número, uma cor) é anterior — tipos imutáveis existem desde a matemática.",
  },
  ondeAparece: [
    {
      onde: "record do Java / C#",
      explicacao:
        "Tipos imutáveis definidos pelos valores, com igualdade por conteúdo — a linguagem dando suporte de primeira classe ao Value Object.",
    },
    {
      onde: "Money, CPF, Email como tipo",
      explicacao:
        "Envelopar um valor num tipo próprio, em vez de usar number ou string cru, é criar um Value Object com as regras do conceito dentro.",
    },
    {
      onde: "igualdade por valor",
      explicacao:
        "Dois objetos são iguais se seus campos são iguais, sem id — é o que distingue um Value Object de uma entidade.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Igualdade por valor; imutável.
const a = Money.of(10, "BRL");
a.equals(Money.of(10, "BRL")); // true`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Cada valor vira um tipo a criar e manter, em vez de um primitivo usado direto",
      "A imutabilidade obriga a criar um novo objeto a cada mudança, em vez de alterar no lugar",
    ],
    naoValeSe:
      "o valor é um dado solto sem regras nem invariantes — envolver um número puro num tipo próprio só adiciona cerimônia sem proteger nada.",
  },
  relacionados: ["agregado", "srp", "maquina-de-estados"],
  problema: [
    "Conceitos do domínio viram primitivos por preguiça: dinheiro é um number, CEP é uma string, período é dois Date soltos. As regras desses conceitos — arredondamento de centavos, formato de CEP, início antes do fim — ficam espalhadas por toda função que os toca.",
    "É a 'obsessão por primitivos': o tipo não carrega significado nem regra, então cada lugar reimplementa (e às vezes esquece) a validação. Somar reais com dólares compila numa boa, porque para o compilador são só dois números.",
  ],
  solucao: [
    "Dar ao conceito um tipo próprio, definido pelo valor: Dinheiro, Cep, Periodo. Ele é imutável, tem igualdade por conteúdo e concentra as regras do conceito — a validação acontece uma vez, na criação.",
    "Deixar o tipo impedir o que não faz sentido: somar moedas diferentes vira erro, um CEP inválido não chega a existir. O domínio passa a falar em conceitos, não em números e strings anônimos.",
  ],
  quandoUsar: [
    "Quando um primitivo carrega regras (formato, validação, unidade) que vivem espalhadas.",
    "Para conceitos definidos pelo valor, sem identidade própria: dinheiro, datas, coordenadas, medidas.",
    "Ao notar a mesma validação de um campo repetida em vários lugares.",
  ],
  quandoEvitar: [
    "Para dados soltos e sem regra, onde o primitivo já diz tudo.",
    "Quando a entidade precisa de identidade e ciclo de vida — aí é entidade, não Value Object.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um Value Object é um tipo definido pelo seu conteúdo — imutável, com igualdade por valor — que carrega as regras de um conceito em vez de deixá-las soltas sobre um number ou string. Dez reais é sempre igual a dez reais; não há 'este' e 'aquele'. Ele mata a obsessão por primitivos: a validação e a unidade vivem no tipo, uma vez, e o domínio passa a impedir o que não faz sentido — como somar moedas diferentes.",
    },
    {
      tipo: "analogia",
      emoji: "💵",
      titulo: "Duas notas de dez idênticas",
      texto:
        "Se eu te empresto uma nota de dez e você me devolve outra nota de dez, ninguém reclama — mesmo não sendo 'a mesma' nota. Dez reais é dez reais; o valor é o que importa, não qual cédula específica. Mas se eu te empresto meu carro, você não pode devolver 'outro carro igual' — o carro tem identidade. Value Object é a nota de dez: definido pelo valor, intercambiável, sem 'qual'. Entidade é o carro: tem um id que o distingue de todos os outros iguais.",
    },
    {
      tipo: "secao",
      id: "valor-vs-identidade",
      titulo: "Valor × identidade",
      resumo: [
        "A pergunta que separa um Value Object de uma entidade é: dois deles com os mesmos campos são a mesma coisa? Se sim, é Value Object (dois 'dez reais' são iguais). Se não — se cada um tem um id que importa mesmo com campos idênticos —, é entidade (dois usuários chamados 'João Silva' são pessoas diferentes).",
        "Dessa distinção vêm as três propriedades: **igualdade por valor** (comparo os campos, não a referência), **imutabilidade** (mudar um valor é criar outro, como somar não altera o 3) e **sem identidade** (não há id, não há ciclo de vida próprio).",
      ],
      extensao: [
        "A imutabilidade não é purismo — é o que torna o Value Object seguro de compartilhar. Se `Dinheiro.somar` alterasse o objeto no lugar, dois pontos do código que apontam para o mesmo valor sofreriam efeitos colaterais um do outro (o clássico bug de 'alguém mudou meu objeto por baixo'). Como somar devolve um objeto **novo**, o original nunca muda, e o mesmo valor pode ser passado adiante sem medo. É a mesma segurança dos tipos imutáveis de uma linguagem funcional.",
        "O ganho maior é o domínio ficar **impossível de usar errado**. Com dinheiro como `number`, `precoBRL + precoUSD` compila e produz um número sem sentido; com um Value Object `Dinheiro`, `somar` checa a moeda e recusa. Com CEP como `string`, qualquer texto passa; com um tipo `Cep`, um valor inválido não chega a ser criado. Isso conversa direto com o **agregado**: os Value Objects são os blocos de construção de dentro dele — a raiz guarda invariantes entre objetos, e os Value Objects guardam as regras de cada valor.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O bug de centavos que sumiu",
          cenario:
            "Valores monetários trafegavam como number em ponto flutuante. Arredondamentos inconsistentes espalhados pelo código faziam totais fecharem com um centavo de diferença, e a conciliação financeira vivia acusando divergências.",
          aplicacao:
            "Um Value Object Dinheiro passou a guardar o valor em centavos inteiros e a concentrar o arredondamento num lugar só, na criação. Toda a aritmética passou por ele.",
          tradeoff:
            "Todo valor monetário passou a ser embrulhado e desembrulhado num tipo, em vez de um number direto. Em troca, o centavo fujão desapareceu, porque a regra de arredondamento deixou de estar em dezenas de lugares.",
        },
        {
          titulo: "A soma de moedas diferentes que virava erro",
          cenario:
            "Um relatório somava valores de pedidos internacionais tratando tudo como number. Ocasionalmente, valores em moedas diferentes eram somados sem conversão, produzindo totais silenciosamente errados.",
          aplicacao:
            "Com Dinheiro carregando a moeda, somar valores de moedas diferentes passou a lançar um erro explícito, forçando uma conversão consciente antes da soma.",
          tradeoff:
            "O código que antes 'só somava' passou a precisar tratar conversão de moeda de propósito. É exatamente o objetivo: o que era um erro silencioso virou um erro impossível de ignorar.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Deixar o Value Object mutável",
          texto:
            "Se dá para alterar um Value Object no lugar, dois pontos que compartilham a mesma instância se afetam sem querer. A imutabilidade é o que torna seguro passá-lo adiante: mudar deve criar um novo, nunca alterar o existente.",
        },
        {
          titulo: "Igualdade por referência em vez de por valor",
          texto:
            "Se dois 'dez reais' criados separadamente não são considerados iguais, o tipo não é um Value Object de verdade. A igualdade tem que comparar o conteúdo — é isso que define o conceito.",
        },
        {
          titulo: "Transformar tudo em Value Object",
          texto:
            "Nem todo primitivo merece um tipo. Um campo solto e sem regra envolvido num Value Object só adiciona cerimônia. O ganho aparece quando há validação, unidade ou invariante para proteger — não pela estética.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Do number cru ao tipo com regras",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Quando um primitivo carrega regras que vivem espalhadas.",
        "Para conceitos definidos pelo valor: dinheiro, datas, medidas.",
        "Ao ver a mesma validação de um campo repetida em vários lugares.",
      ],
      evitar: [
        "Para dados soltos e sem regra, onde o primitivo basta.",
        "Quando o conceito precisa de identidade e ciclo de vida (é entidade).",
      ],
    },
  ],
};
