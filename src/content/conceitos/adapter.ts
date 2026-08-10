import type { Conceito } from "@/shared/types/conceito";

const MERMAID = `classDiagram
    class Cliente
    class Alvo {
      <<interface>>
      +requisicao()
    }
    class Adaptador {
      +requisicao()
    }
    class Adaptado {
      +metodoEspecifico()
    }
    Cliente --> Alvo
    Alvo <|.. Adaptador
    Adaptador --> Adaptado : delega`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Fala só a interface Alvo" },
  { id: "alvo", titulo: "Interface Alvo", descricao: "Contrato esperado pelo domínio" },
  {
    id: "adaptador",
    titulo: "Adaptador",
    descricao: "Traduz chamadas — onde o padrão atua",
    destaque: true,
  },
  { id: "externo", titulo: "SDK / API externa", descricao: "Interface incompatível adaptada" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Interface que o domínio espera
interface Notificador {
  enviar(mensagem: string): void;
}

// SDK externo com outra assinatura
class SdkEmail {
  dispatch(payload: { body: string }) { /* ... */ }
}

// Adapter
class EmailAdapter implements Notificador {
  constructor(private sdk: SdkEmail) {}
  enviar(mensagem: string) {
    this.sdk.dispatch({ body: mensagem });   // traduz
  }
}

const n: Notificador = new EmailAdapter(new SdkEmail());
n.enviar("Olá");`,
  },
  {
    lang: "java" as const,
    code: `interface Notificador {
    void enviar(String mensagem);
}

class SdkEmail {
    void dispatch(String body) { /* ... */ }
}

class EmailAdapter implements Notificador {
    private final SdkEmail sdk;
    EmailAdapter(SdkEmail sdk) { this.sdk = sdk; }
    public void enviar(String mensagem) {
        sdk.dispatch(mensagem);   // traduz
    }
}`,
  },
];

export const adapter: Conceito = {
  slug: "adapter",
  titulo: "Adapter",
  categoria: "estrutural",
  resumo:
    "Converte a interface de uma classe em outra que o cliente espera, permitindo que classes incompatíveis trabalhem juntas.",
  tags: ["gof", "integracao", "wrapper", "compatibilidade"],
  dificuldade: "iniciante",
  tempoLeitura: 5,
  relacionados: ["factory-method", "hexagonal"],
  roadmapNodes: ["estruturais"],
  problema: [
    "Você tem uma classe/biblioteca útil, mas a interface dela não bate com a que o seu código espera.",
    "Não dá (ou não vale a pena) reescrever a biblioteca de terceiros nem mudar todo o cliente.",
  ],
  solucao: [
    "Cria-se um 'adaptador' que implementa a interface esperada pelo cliente e, internamente, delega para o objeto adaptado traduzindo as chamadas.",
    "O cliente conversa só com a interface alvo; o adaptador esconde a incompatibilidade.",
  ],
  quandoUsar: [
    "Integrar uma biblioteca de terceiros com contrato diferente do seu domínio.",
    "Isolar o resto do sistema de detalhes de um SDK/API externa (camada anticorrupção).",
    "Reaproveitar uma classe existente cuja interface você não controla.",
  ],
  quandoEvitar: [
    "Você controla ambos os lados e pode simplesmente alinhar as interfaces.",
    "Muitas camadas de adaptação empilhadas viram indireção que ninguém entende.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Quando uma classe útil fala uma 'língua' diferente da que seu código espera, o Adapter é o tradutor: implementa a interface que o cliente conhece e, por dentro, converte cada chamada para o objeto incompatível.",
    },
    {
      tipo: "analogia",
      emoji: "🔌",
      titulo: "O adaptador de tomada de viagem",
      texto:
        "Seu notebook tem plug brasileiro; a tomada do hotel em Londres tem três pinos retangulares. Você não refaz o cabo do notebook nem a parede do hotel — encaixa um adaptador de viagem entre os dois. O notebook continua 'achando' que está numa tomada normal, a parede continua recebendo o plug que espera, e a energia passa. O Adapter faz exatamente isso com interfaces de código: ninguém muda, alguém traduz.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Você encontrou a classe perfeita — um SDK de e-mail, um client de pagamento, uma lib de datas — mas a assinatura dela não bate com a interface que o seu domínio já usa. O compilador não aceita, e o encaixe direto não existe.",
        "Reescrever a biblioteca não é opção (é de terceiros); mudar todos os pontos do seu código que dependem da interface atual é caro e arriscado.",
      ],
      extensao: [
        "A raiz do problema é que interfaces são contratos rígidos por design: é justamente essa rigidez que dá segurança de tipos. O preço aparece na fronteira entre códigos que evoluíram separados — seu domínio modelou 'enviar(mensagem)' pensando no negócio, o SDK expôs 'dispatch(payload)' pensando na generalidade dele. Nenhum dos dois está errado; eles só nunca se conheceram.",
        "A tentação ingênua é 'deixar o SDK vazar': fazer o domínio inteiro passar a falar dispatch/payload. Funciona hoje, mas acopla todas as camadas ao vocabulário de um fornecedor — e quando o fornecedor mudar (ou você trocar de fornecedor), a mudança se espalha por todo lugar. O Adapter inverte isso: o vocabulário do domínio manda, e a tradução fica concentrada em um único arquivo.",
        "Vale distinguir do Facade e do Decorator, que também 'embrulham' objetos: o Facade simplifica um subsistema inteiro criando uma interface nova; o Decorator mantém a mesma interface e adiciona comportamento. O Adapter não simplifica nem adiciona — converte uma interface existente em outra existente, sem mudar a semântica.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "cliente", label: "Cliente" },
        { id: "alvo", label: "Interface Alvo" },
        { id: "adaptador", label: "Adaptador", destaque: true },
        { id: "sdk", label: "SDK incompatível" },
      ],
      setas: [
        { label: "chama enviar()" },
        { label: "implementa" },
        { label: "traduz p/ dispatch()", tracejada: true },
      ],
      legenda:
        "O cliente só conhece a interface alvo; a tradução para o mundo incompatível acontece em um único ponto — o adaptador.",
    },
    {
      tipo: "demo",
      titulo: "Ligue o adaptador e veja a tradução",
      demo: "adapter",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "usa o contrato do domínio, sem saber quem o cumpre",
          detalhe:
            "É qualquer código seu que precisa do serviço — um caso de uso, um controller. Ele depende apenas da interface alvo e recebe a implementação de fora (injeção). Nunca importa nem menciona o SDK.",
          exemplo: 'const n: Notificador = new EmailAdapter(new SdkEmail());\nn.enviar("Olá");',
          seViolar:
            "se o cliente importar o SDK direto, o acoplamento se espalha: trocar de fornecedor passa a exigir mudanças em todos os pontos de uso.",
        },
        {
          id: "alvo",
          titulo: "Interface Alvo",
          curto: "o contrato escrito no vocabulário do seu domínio",
          detalhe:
            "Define o que o domínio precisa, nos termos do domínio ('enviar mensagem'), não nos termos do fornecedor ('dispatch payload'). É o ponto estável do desenho: clientes e adaptadores dependem dela, nunca o contrário.",
          exemplo: "interface Notificador {\n  enviar(mensagem: string): void;\n}",
          seViolar:
            "se a interface copiar a assinatura do SDK 'para facilitar', o adaptador vira repasse inútil e o vocabulário do fornecedor contamina o domínio do mesmo jeito.",
        },
        {
          id: "adaptador",
          titulo: "Adaptador",
          curto: "traduz chamadas — é onde o padrão atua",
          detalhe:
            "Implementa a interface alvo e delega para o objeto adaptado, convertendo nomes, formatos e tipos (string vira payload, erro do SDK vira erro do domínio). Deve ser fino: só tradução, sem regra de negócio.",
          exemplo:
            "class EmailAdapter implements Notificador {\n  enviar(msg: string) { this.sdk.dispatch({ body: msg }); }\n}",
          seViolar:
            "adaptador com regra de negócio dentro vira um lugar invisível onde decisões importantes se escondem — e a regra se perde quando o fornecedor é trocado.",
        },
        {
          id: "adaptado",
          titulo: "Adaptado (SDK / API externa)",
          curto: "o código útil de interface incompatível",
          detalhe:
            "A biblioteca de terceiros, o client gerado, o sistema legado. Você não controla a interface dele e não deveria tentar: ele continua intocado, recebendo exatamente as chamadas que sempre esperou.",
          exemplo: "class SdkEmail {\n  dispatch(payload: { body: string }) { /* ... */ }\n}",
          seViolar:
            "tentar fazer fork ou monkey-patch do SDK para 'encaixar' cria uma manutenção paralela que quebra a cada atualização do fornecedor.",
        },
      ],
    },
    {
      tipo: "diagrama",
      titulo: "Estrutura",
      mermaid: MERMAID,
    },
    {
      tipo: "codigo",
      titulo: "Código",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Gateway de pagamento múltiplo",
          cenario:
            "Um e-commerce precisa aceitar Stripe, PagSeguro e Pix — cada um com SDK, nomes e formatos de resposta completamente diferentes.",
          aplicacao:
            "O domínio define uma interface única (cobrar, estornar, consultar) e cada provedor ganha seu adaptador. O checkout não sabe qual gateway está ativo; adicionar um quarto provedor é escrever mais um adaptador, sem tocar no fluxo.",
          tradeoff:
            "A interface comum tende ao mínimo denominador: recursos exclusivos de um provedor (parcelamento especial, antifraude próprio) ficam difíceis de expor sem vazar detalhes.",
        },
        {
          titulo: "Migração de SDK sem big-bang",
          cenario:
            "O fornecedor descontinuou a v1 do SDK e a v2 mudou todas as assinaturas. Há dezenas de pontos de uso no sistema e ninguém quer uma migração de semanas em uma branch gigante.",
          aplicacao:
            "Escreve-se um adaptador que expõe a interface antiga por cima do SDK novo. O sistema inteiro migra em um commit (troca a implementação injetada) e os pontos de uso são modernizados aos poucos, com o adaptador encolhendo até sumir.",
          tradeoff:
            "O adaptador é código temporário que vira permanente se ninguém terminar a migração — precisa de dono e prazo, senão vira camada fóssil.",
        },
        {
          titulo: "Camada anticorrupção contra API legada",
          cenario:
            "Um sistema novo precisa consumir um ERP legado cheio de nomes crípticos, códigos mágicos e campos reaproveitados (o clássico 'campo observação que guarda três coisas').",
          aplicacao:
            "Adaptadores formam a fronteira anticorrupção (DDD): traduzem os conceitos tortos do legado para o modelo limpo do sistema novo. A sujeira fica confinada na borda; o domínio novo nunca vê um código mágico.",
          tradeoff:
            "A tradução tem custo real de manutenção — cada mudança do legado exige atualizar o adaptador — e mapeamentos semânticos errados na borda corrompem silenciosamente o modelo novo.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Deixar o tipo do SDK vazar pela interface",
          texto:
            "Se enviar() recebe ou retorna um tipo do fornecedor (SdkPayload, StripeCharge), o adaptador não isolou nada: todo cliente continua acoplado ao SDK. A interface alvo deve usar apenas tipos do seu domínio — a conversão completa é o trabalho do adaptador.",
        },
        {
          titulo: "Regra de negócio escondida no adaptador",
          texto:
            "Um 'if valor > 10000, dividir em duas cobranças' dentro do adaptador é uma decisão de negócio morando em uma camada de tradução. Quando o fornecedor for trocado, a regra some junto. Adaptador traduz; quem decide é o domínio.",
        },
        {
          titulo: "Adaptador sobre adaptador sobre adaptador",
          texto:
            "Cada camada de adaptação extra é uma indireção que o leitor precisa atravessar para descobrir o que realmente acontece. Se você controla os dois lados, alinhe as interfaces e apague o adaptador — o padrão existe para fronteiras que você não controla.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Integrar uma biblioteca de terceiros com contrato diferente do seu domínio.",
        "Isolar o resto do sistema de detalhes de um SDK/API externa (camada anticorrupção).",
        "Reaproveitar uma classe existente cuja interface você não controla.",
      ],
      evitar: [
        "Você controla ambos os lados e pode simplesmente alinhar as interfaces.",
        "Muitas camadas de adaptação empilhadas viram indireção que ninguém entende.",
      ],
    },
  ],
};
