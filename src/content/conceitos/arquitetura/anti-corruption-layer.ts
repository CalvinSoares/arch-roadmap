import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// O ERP legado fala uma lingua torta: codigos magicos, campos
// reaproveitados, "obs" que guarda tres coisas. Sem defesa, essa
// sujeira vaza para o dominio novo e o contamina inteiro.

// ANTI-CORRUPTION LAYER: uma fronteira que TRADUZ o modelo do outro
// para o seu, e nao deixa o vocabulario dele entrar.
class ClienteACL {
  constructor(private erp: ErpLegado) {}

  async buscar(id: string): Promise<Cliente> {
    const raw = await this.erp.getCli(id);   // { TP: "01", STA: "A", OBS: "..." }
    return new Cliente({                       // traduz para o modelo LIMPO:
      tipo: raw.TP === "01" ? "pessoa-fisica" : "pessoa-juridica",
      ativo: raw.STA === "A",
      // a sujeira do "OBS que guarda tres coisas" e desfeita AQUI, na borda.
      observacoes: parseObs(raw.OBS),
    });
  }
}
// O dominio novo recebe um Cliente limpo e NUNCA ve "TP", "STA", "OBS".
// Toda a sujeira do legado fica confinada nesta camada de fronteira.`,
  },
];

export const antiCorruptionLayer: Conceito = {
  slug: "anti-corruption-layer",
  titulo: "Anti-corruption layer",
  categoria: "arquitetura",
  resumo:
    "Todo sistema novo acaba tendo que conversar com um velho — um ERP legado, uma API de terceiro, um modelo que não se controla. A camada anticorrupção é a fronteira que traduz o modelo do outro para o seu e impede que o vocabulário torto dele entre no seu domínio. É o Adapter elevado à escala de um modelo inteiro: a sujeira fica confinada na borda, e o domínio novo nunca a vê.",
  tags: ["ddd", "integracao", "fronteira", "legado", "traducao"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "2003", ano: 2003, precisao: "aproximada" },
    fonte:
      "Eric Evans, 'Domain-Driven Design', 2003 — a camada anticorrupção é um dos padrões de relação entre contextos delimitados",
    precursor:
      "É o Adapter elevado à fronteira entre modelos inteiros: em vez de traduzir uma interface, protege um domínio inteiro do vocabulário de outro.",
  },
  ondeAparece: [
    {
      onde: "camada sobre um ERP legado",
      explicacao:
        "A fina camada que traduz os códigos crípticos e campos reaproveitados de um sistema legado para o modelo limpo do novo.",
    },
    {
      onde: "adaptador de API de terceiro",
      explicacao:
        "Isolar o vocabulário de uma API externa atrás de uma tradução, para que o domínio nunca veja os termos e formatos dela.",
    },
    {
      onde: "o pacote 'legacy' isolado",
      explicacao:
        "Confinar toda a sujeira de integração num módulo de fronteira, para que ela não vaze para o resto do sistema.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Traduz o legado no limite — o domínio não vê o DTO velho.
const cliente = acl.paraDominio(legado.obterCliente(id));`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Uma camada inteira de tradução a manter, que muda sempre que qualquer um dos dois lados muda",
      "Mapeamento semântico errado na fronteira corrompe o modelo novo em silêncio, sem erro visível",
    ],
    naoValeSe:
      "você controla os dois modelos e pode alinhá-los — a camada protege de um sistema que você não controla, não de um que você pode mudar.",
  },
  relacionados: ["adapter", "hexagonal", "repository"],
  problema: [
    "Um sistema novo precisa consumir um legado cheio de vícios: códigos mágicos ('TP = 01'), campos reaproveitados ('o campo observação guarda três coisas'), nomes crípticos. Se o domínio novo falar direto com ele, esses vícios se espalham por todo o código.",
    "O risco não é só feiúra: é contaminação semântica. O modelo limpo do sistema novo começa a se moldar ao modelo torto do legado, e a distinção entre os dois se perde — a corrupção entra pela integração e não sai mais.",
  ],
  solucao: [
    "Colocar uma camada de fronteira que traduz o modelo do outro para o seu: recebe os dados no formato do legado e devolve objetos limpos do seu domínio. O vocabulário do outro para na borda.",
    "Confinar toda a sujeira de integração nessa camada. O domínio novo conversa só com o modelo limpo; quem lida com códigos mágicos e campos reaproveitados é a camada anticorrupção, e só ela.",
  ],
  quandoUsar: [
    "Ao integrar com um sistema legado cujo modelo você não controla e não quer imitar.",
    "Ao consumir uma API de terceiro cujo vocabulário não deve vazar para o seu domínio.",
    "Ao migrar aos poucos de um sistema antigo, isolando o novo do velho durante a transição.",
  ],
  quandoEvitar: [
    "Quando você controla os dois lados e pode simplesmente alinhar os modelos.",
    "Para uma integração trivial e estável, onde a camada custaria mais do que o acoplamento que evita.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "A camada anticorrupção é a fronteira que traduz o modelo de um sistema que você não controla (um legado, uma API de terceiro) para o seu, impedindo o vocabulário torto dele de entrar no seu domínio. É o Adapter na escala de um modelo inteiro: os códigos mágicos e campos reaproveitados param na borda, e o domínio novo só vê objetos limpos. Protege contra contaminação semântica — o modelo novo se moldar ao velho.",
    },
    {
      tipo: "analogia",
      emoji: "🛃",
      titulo: "A aduana na fronteira",
      texto:
        "Na fronteira entre dois países, a aduana traduz documentos, converte moeda e verifica o que entra, para que o de fora chegue ao país adaptado às regras locais. Você não anda pelo país estrangeiro com as regras dele na mala — passa pela aduana, e o que entra já vem no formato de casa. A camada anticorrupção é essa aduana entre dois modelos de software: nada do vocabulário do outro sistema circula do lado de dentro sem antes ser traduzido na fronteira.",
    },
    {
      tipo: "secao",
      id: "contaminacao",
      titulo: "A corrupção que a camada evita",
      resumo: [
        "O perigo de integrar sem fronteira não é o código ficar feio — é o modelo novo ser contaminado pelo velho. Sem tradução, os conceitos tortos do legado ('TP = 01', o campo que guarda três coisas) vão sendo copiados para o domínio novo, que aos poucos deixa de ter um modelo próprio.",
        "A camada anticorrupção corta isso na borda: ela é o único lugar que conhece o vocabulário do outro. Tudo que atravessa é traduzido para o modelo limpo, e o domínio novo nunca precisa saber que 'TP' existe.",
      ],
      extensao: [
        "É o **Adapter** levado de escala: onde o Adapter traduz uma interface (uma classe fala 'dispatch', seu código espera 'enviar'), a camada anticorrupção traduz um **modelo inteiro** — conceitos, códigos, invariantes — entre dois contextos delimitados. Por isso ela costuma ser mais que uma classe: é um conjunto de tradutores, muitas vezes um módulo próprio, com o nome explícito de fronteira ('legacy', 'acl', 'integration'), para que fique claro que a sujeira mora ali de propósito e não deve vazar.",
        "O ponto sensível é que a tradução tem **custo e risco reais**. Custo: cada mudança do legado exige atualizar a camada, e ela nunca some (o legado raramente morre). Risco: um mapeamento semântico errado na borda — interpretar 'STA = A' como ativo quando às vezes significa outra coisa — corrompe o modelo novo em silêncio, sem estourar erro. A camada anticorrupção não elimina o problema de ter um legado; ela o **confina**, trocando corrupção espalhada por uma fronteira concentrada, visível e testável. Quando você controla os dois lados, o certo é alinhar os modelos e apagar a camada — ela existe para fronteiras que você não manda.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "O ERP cujos códigos mágicos vazaram pelo sistema",
          cenario:
            "Um sistema novo consumia um ERP direto, e os códigos dele ('TP', 'STA', 'OBS') foram se espalhando pelo domínio. Quando o ERP mudou o significado de um código, dezenas de pontos do sistema novo quebraram de uma vez.",
          aplicacao:
            "Uma camada anticorrupção passou a traduzir o modelo do ERP para o modelo limpo na fronteira. O domínio novo passou a receber objetos próprios, sem nunca ver os códigos do ERP.",
          tradeoff:
            "Surgiu uma camada de tradução a manter, que muda quando o ERP muda. Em troca, uma mudança do ERP passou a impactar um lugar só — a fronteira — em vez de dezenas espalhados.",
        },
        {
          titulo: "A migração protegida pela fronteira",
          cenario:
            "Durante a substituição gradual de um sistema antigo, o novo precisava conviver com o velho por meses, lendo e escrevendo nos dois. Sem isolamento, o novo corria o risco de nascer já moldado pelo modelo que ia substituir.",
          aplicacao:
            "Uma camada anticorrupção isolou o modelo novo do antigo durante a transição. O novo evoluiu com seu próprio modelo, e a camada foi encolhendo à medida que o legado era desligado.",
          tradeoff:
            "A camada é código temporário que exige um dono e um prazo, senão vira fóssil permanente. Em troca, o sistema novo não herdou os vícios do que estava substituindo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Deixar o vocabulário do outro vazar",
          texto:
            "Se um objeto de domínio expõe um campo com o nome ou o código do legado ('tp', 'sta'), a camada não isolou nada — a corrupção passou. O modelo limpo só pode conter conceitos do seu domínio; a tradução tem que ser completa.",
        },
        {
          titulo: "Mapeamento semântico errado na borda",
          texto:
            "Traduzir um código mágico pelo significado errado corrompe o modelo novo sem estourar erro. É o risco mais traiçoeiro da camada: ela concentra a tradução, mas se a tradução está errada, ela concentra o engano.",
        },
        {
          titulo: "Manter a camada onde você controla os dois lados",
          texto:
            "A camada anticorrupção existe para fronteiras que você não manda. Se você controla os dois modelos, o certo é alinhá-los e apagar a camada — mantê-la vira uma indireção que só custa manutenção.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "A tradução que confina a sujeira na borda",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ao integrar com um legado cujo modelo você não controla nem quer imitar.",
        "Ao consumir uma API de terceiro cujo vocabulário não deve vazar.",
        "Ao migrar aos poucos, isolando o novo do velho na transição.",
      ],
      evitar: [
        "Quando você controla os dois lados e pode alinhar os modelos.",
        "Para uma integração trivial e estável, onde a camada custa mais que o acoplamento.",
      ],
    },
  ],
};
