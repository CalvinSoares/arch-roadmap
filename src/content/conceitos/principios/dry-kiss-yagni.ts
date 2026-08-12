import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// DRY diz: uma regra, um lugar. Mas cuidado com a FALSA duplicacao.

// Estes dois calculos SAO iguais hoje — e mudam pelo MESMO motivo:
function totalPedido(itens) { return itens.reduce((s, i) => s + i.preco, 0); }
// -> extrair para uma funcao unica e DRY legitimo.

// Estes dois PARECEM iguais, mas mudam por motivos DIFERENTES:
const descontoFuncionario = salario * 0.1;   // politica de RH
const impostoRetido       = salario * 0.1;   // regra fiscal
// -> unificar em "aplicar10Porcento" acopla RH a fiscal.
// Quando a aliquota fiscal mudar, o desconto de RH muda junto. Bug.

// A regra dos tres: so abstraia na TERCEIRA repeticao. Antes disso,
// voce ainda nao sabe se e a mesma regra ou uma coincidencia.`,
  },
];

export const dryKissYagni: Conceito = {
  slug: "dry-kiss-yagni",
  titulo: "DRY, KISS e YAGNI",
  categoria: "principio",
  resumo:
    "Três lembretes contra o excesso: DRY (não repita a mesma regra), KISS (não complique além do necessário) e YAGNI (não construa o que talvez nunca use). Parecem óbvios e são justamente por isso perigosos — DRY apressado acopla o que só parecia igual, e YAGNI mal lido vira desculpa para não pensar. O valor está em saber quando cada um se aplica.",
  tags: ["principio", "simplicidade", "duplicacao", "over-engineering"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "1999", ano: 1999, precisao: "aproximada" },
    fonte:
      "DRY foi cunhado por Andrew Hunt & David Thomas em 'The Pragmatic Programmer' (1999); YAGNI vem do Extreme Programming de Kent Beck na mesma época",
    precursor:
      "KISS ('keep it simple, stupid') é atribuído ao engenheiro aeronáutico Kelly Johnson nos anos 1960, muito antes de virar mantra de software.",
  },
  ondeAparece: [
    {
      onde: "a regra dos três",
      explicacao:
        "Só abstrair na terceira repetição: antes disso, duplicar é mais barato que a abstração errada que um DRY apressado cria.",
    },
    {
      onde: "a feature flag que nunca ligou",
      explicacao:
        "Código escrito 'para o futuro' que passou anos desligado é o YAGNI cobrando: não se paga hoje pelo que talvez não venha.",
    },
    {
      onde: "o MVP",
      explicacao:
        "Entregar a versão mínima que resolve o problema, sem os enfeites que ninguém pediu, é KISS e YAGNI virando estratégia de produto.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Três freios: não repita, não complique, não antecipe.
// Extraia quando a duplicação doer de verdade.`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "DRY apressado acopla coisas que só pareciam iguais, e desfazer isso depois é caro",
      "YAGNI mal lido vira desculpa para não desenhar nem o mínimo necessário",
    ],
    naoValeSe:
      "a duplicação é coincidência e as cópias evoluem por motivos diferentes — unificá-las cria um acoplamento que atrapalha mais do que ajuda.",
  },
  relacionados: ["srp", "ocp", "composicao-sobre-heranca"],
  problema: [
    "As três siglas são repetidas até virarem clichê, e é aí que ficam perigosas: aplicadas sem pensar, cada uma vira o oposto do que pregava. DRY apressado une duas regras que só coincidiam; KISS mal entendido esconde complexidade essencial embaixo do tapete; YAGNI vira preguiça de projetar.",
    "O erro comum é tratá-las como leis absolutas, quando são heurísticas com contexto: dizem 'na dúvida, para este lado', não 'sempre'.",
  ],
  solucao: [
    "DRY é sobre conhecimento, não sobre texto: unifique quando duas coisas representam a mesma regra e mudam pelo mesmo motivo; deixe duplicado quando só se parecem.",
    "KISS e YAGNI dosam a antecipação: resolva o problema de hoje da forma mais simples que funciona, e adicione flexibilidade quando a necessidade aparecer, não antes.",
  ],
  quandoUsar: [
    "DRY: quando o mesmo conhecimento de negócio está espalhado em vários lugares que precisam mudar juntos.",
    "KISS: sempre que houver uma solução mais simples que resolve o mesmo problema.",
    "YAGNI: diante da tentação de generalizar 'porque um dia vai precisar'.",
  ],
  quandoEvitar: [
    "DRY: quando a semelhança é coincidência e as cópias evoluem separadas.",
    "YAGNI: como desculpa para ignorar um requisito conhecido e iminente.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "DRY, KISS e YAGNI são heurísticas contra o excesso, não leis. DRY é sobre não duplicar conhecimento (a mesma regra em dois lugares), e não sobre não duplicar texto — unir código que só coincide acopla o que devia ser independente. KISS pede a solução mais simples que funciona; YAGNI pede não construir o que talvez nunca venha. Todas dizem 'na dúvida, para este lado', não 'sempre'.",
    },
    {
      tipo: "analogia",
      emoji: "🧰",
      titulo: "O canivete suíço que ninguém usa inteiro",
      texto:
        "Existe um canivete suíço com 87 ferramentas — e ninguém nunca usou o abridor de charuto embutido. Ele é pesado, caro e desconfortável justamente pelo que 'talvez um dia' seja útil. YAGNI é escolher o canivete de três lâminas que resolve 99% dos casos; KISS é preferir a faca simples quando você só vai cortar pão; e DRY é não ter três canivetes idênticos na mesma gaveta — mas também não fundir a chave de fenda com o saca-rolhas só porque os dois giram.",
    },
    {
      tipo: "secao",
      id: "dry-falso",
      titulo: "A duplicação que não era duplicação",
      resumo: [
        "O erro mais caro do DRY é unir código que só parecia igual. Dois trechos idênticos hoje podem representar regras diferentes que mudam por motivos diferentes — um desconto de RH e um imposto que por acaso são ambos 10%.",
        "Unificá-los cria um acoplamento invisível: quando a alíquota fiscal muda e alguém edita a função 'compartilhada', o desconto de RH muda junto, sem ninguém pedir. A abstração errada é mais cara que a duplicação que ela tentou eliminar.",
      ],
      extensao: [
        "A regra prática é olhar o **motivo da mudança**, não a aparência do código — é o SRP disfarçado. Se dois trechos sempre vão mudar juntos, são o mesmo conhecimento: unifique. Se podem mudar por motivos independentes, são coincidência: deixe separados, mesmo que o código fique igual por enquanto.",
        "Daí a **regra dos três**: espere a terceira repetição antes de abstrair. Com uma ocorrência não há duplicação; com duas, ainda não dá para saber qual parte é a regra e qual é o acidente; na terceira, o padrão real fica visível e a abstração acerta o recorte. Abstrair na primeira é adivinhar — e 'a abstração errada é muito mais cara que a duplicação', como resume Sandi Metz.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O framework interno que ninguém pediu",
          cenario:
            "Para 'evitar repetição no futuro', um time construiu um framework de configuração genérico antes do segundo caso de uso existir. Meses depois, o segundo caso não encaixava, e o framework foi contornado com gambiarras.",
          aplicacao:
            "O framework foi removido e o código voltou a resolver cada caso diretamente. A generalização só voltou a ser considerada quando surgiu o terceiro caso real, aí sim com o padrão claro.",
          tradeoff:
            "Houve retrabalho de desmontar o que já existia. Em troca, o código ficou legível de novo, e a abstração futura passou a ser guiada por casos reais, não por adivinhação.",
        },
        {
          titulo: "A função utilitária que acoplou dois mundos",
          cenario:
            "Um `formatarValor` compartilhado formatava tanto preços de produto quanto valores de relatório contábil. Um pedido do time contábil (casas decimais diferentes) quebrou a exibição de preços na loja.",
          aplicacao:
            "A função foi dividida em duas — `formatarPreco` e `formatarValorContabil` — apesar de o código ser quase idêntico, porque as duas mudam por motivos diferentes.",
          tradeoff:
            "Voltou a existir código parecido em dois lugares. Em troca, cada contexto passou a evoluir sozinho, sem que uma mudança fiscal quebrasse a vitrine.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Aplicar DRY a texto, não a conhecimento",
          texto:
            "Dois trechos iguais nem sempre são a mesma regra. Se eles mudam por motivos diferentes, unificá-los acopla o que devia ser independente, e uma mudança num contexto vaza para o outro sem aviso.",
        },
        {
          titulo: "Usar KISS para justificar o simplista",
          texto:
            "Simples não é o mesmo que fácil. Espremer complexidade essencial (concorrência, falha, consistência) para 'ficar simples' só empurra o problema para produção, onde ele volta mais caro.",
        },
        {
          titulo: "Usar YAGNI contra requisito conhecido",
          texto:
            "YAGNI vale para o que talvez venha, não para o que já se sabe que vem. Ignorar um requisito iminente em nome de 'você não vai precisar' é confundir simplicidade com míopia.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Duplicação legítima × falsa",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "DRY quando o mesmo conhecimento se espalha e muda junto.",
        "KISS quando há solução mais simples para o mesmo problema.",
        "YAGNI diante da vontade de generalizar sem caso real.",
      ],
      evitar: [
        "DRY quando a semelhança é coincidência.",
        "YAGNI como desculpa contra requisito conhecido e iminente.",
      ],
    },
  ],
};
