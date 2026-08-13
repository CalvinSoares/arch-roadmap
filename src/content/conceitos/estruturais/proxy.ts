import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class Imagem {
        <<interface>>
        +exibir()
    }
    class ImagemReal {
        -arquivo
        +exibir()
    }
    class ImagemProxy {
        -real
        -arquivo
        +exibir()
    }
    Imagem <|.. ImagemReal
    Imagem <|.. ImagemProxy
    ImagemProxy --> ImagemReal : cria sob demanda`;

const CAMADAS = [
  { id: "cliente", titulo: "Cliente", descricao: "Fala com a interface — não sabe se há proxy" },
  {
    id: "proxy",
    titulo: "Proxy",
    descricao: "Mesma interface do real; controla o acesso — coração do padrão",
    destaque: true,
  },
  { id: "real", titulo: "Objeto real", descricao: "O trabalho de verdade, criado ou chamado quando o proxy permitir" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `interface Imagem {
  exibir(): void;
}

// Objeto real: caro de criar (le o arquivo do disco no construtor)
class ImagemReal implements Imagem {
  constructor(private arquivo: string) {
    console.log("carregando do disco:", arquivo); // custo alto
  }
  exibir(): void {
    console.log("exibindo", this.arquivo);
  }
}

// Proxy virtual: mesma interface, adia a criacao ate o primeiro uso
class ImagemProxy implements Imagem {
  private real?: ImagemReal;
  constructor(private arquivo: string) {}

  exibir(): void {
    // so agora o objeto caro nasce — e uma vez so
    this.real ??= new ImagemReal(this.arquivo);
    this.real.exibir();
  }
}

// A galeria monta 100 itens sem tocar no disco
const galeria: Imagem[] = ["a.png", "b.png"].map((f) => new ImagemProxy(f));
galeria[0].exibir(); // carrega so a que o usuario abriu`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class Imagem(ABC):
    @abstractmethod
    def exibir(self): ...

# Objeto real: caro de criar
class ImagemReal(Imagem):
    def __init__(self, arquivo):
        self._arquivo = arquivo
        print("carregando do disco:", arquivo)  # custo alto

    def exibir(self):
        print("exibindo", self._arquivo)

# Proxy virtual: mesma interface, adia a criacao
class ImagemProxy(Imagem):
    def __init__(self, arquivo):
        self._arquivo = arquivo
        self._real = None

    def exibir(self):
        if self._real is None:      # so agora o objeto caro nasce
            self._real = ImagemReal(self._arquivo)
        self._real.exibir()

galeria = [ImagemProxy(f) for f in ("a.png", "b.png")]
galeria[0].exibir()  # carrega so a que o usuario abriu`,
  },
];

const ANTI_EXEMPLO = `interface Imagem { exibir(): void; }

class ImagemReal implements Imagem {
  constructor(private arquivo: string) {
    console.log("carregando do disco:", arquivo);
  }
  exibir() { console.log("exibindo", this.arquivo); }
}

// "Proxy virtual"... que carrega no construtor.
class ImagemProxy implements Imagem {
  private real: ImagemReal;
  constructor(arquivo: string) {
    this.real = new ImagemReal(arquivo); // <- paga o custo sempre
  }
  exibir() { this.real.exibir(); }       // so repassa
}

// A galeria de 100 itens volta a ler 100 arquivos no boot.
// Mesma interface, zero controle de acesso — casca vazia.`;

export const proxy: Conceito = {
  slug: "proxy",
  titulo: "Proxy",
  categoria: "estrutural",
  resumo:
    "Coloca um substituto com a mesma interface na frente de um objeto para controlar o acesso a ele — adiando a criação, cacheando resultados, checando permissão ou falando com um objeto remoto.",
  tags: ["acesso", "lazy", "cache", "gof"],
  dificuldade: "intermediario",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "O objeto Proxy do JS",
      explicacao:
        "O padrão virou palavra-chave: você intercepta leitura, escrita e chamada sem tocar no alvo.",
    },
    {
      onde: "Reatividade do Vue 3",
      explicacao:
        "O objeto reativo é um Proxy que avisa o framework a cada acesso e a cada escrita.",
    },
    {
      onde: "Lazy loading de ORM",
      explicacao:
        "`pedido.cliente` parece um objeto e só vai ao banco quando alguém realmente lê um campo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Controla o acesso ao real (lazy, cache, auth).
const imagem = new ProxyImagem("foto.png");
imagem.desenhar(); // carrega sob demanda`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma indireção a mais entre o cliente e o objeto real, que o leitor precisa atravessar",
      "Comportamento escondido no proxy (cache, lazy, log) surpreende quem espera a chamada direta",
    ],
    naoValeSe:
      "não há nada a interceptar — sem controle de acesso, cache ou carga tardia, o proxy é só uma casca vazia.",
  },
  relacionados: ["decorator", "adapter", "facade"],
  problema: [
    "Um objeto é caro (lê disco, abre conexão, ocupa memória) ou sensível (exige permissão, precisa de auditoria), mas o cliente só quer chamar seus métodos sem se preocupar com nada disso.",
    "Encher o cliente de `if (jaCarregou)`, `if (temPermissao)` ou `if (estaNoCache)` espalha responsabilidade de infraestrutura por todo lugar que usa o objeto.",
  ],
  solucao: [
    "O Proxy implementa a mesma interface do objeto real e fica no lugar dele. Como o contrato é idêntico, o cliente não muda — ele nem sabe que existe um intermediário.",
    "Dentro do proxy mora a política de acesso: criar sob demanda (virtual), guardar o resultado (cache), verificar permissão (proteção) ou serializar a chamada pela rede (remoto).",
  ],
  quandoUsar: [
    "O objeto real é caro de criar e nem sempre será usado (imagens, relatórios, conexões).",
    "O acesso precisa de uma política transversal: permissão, log de auditoria, rate limit, cache.",
    "O objeto vive em outro processo ou máquina e você quer que a chamada pareça local.",
  ],
  quandoEvitar: [
    "O objeto é barato — o proxy só adiciona indireção e uma classe a mais para depurar.",
    "A política que você quer aplicar muda a interface ou o resultado: aí não é proxy, é adapter ou decorator.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um substituto com a mesma interface do objeto real fica na frente dele e decide quando (ou se) a chamada chega ao destino: cria sob demanda, devolve do cache, exige permissão ou vai pela rede — tudo sem o cliente saber.",
    },
    {
      tipo: "analogia",
      emoji: "💳",
      titulo: "O cartão de crédito",
      texto:
        "O cartão tem a mesma 'interface' do dinheiro: você paga com ele em qualquer lugar que aceite dinheiro. Mas ele não é o dinheiro — é um substituto que controla o acesso à sua conta. Ele verifica limite antes de deixar passar, registra cada compra num extrato e evita que você carregue a quantia toda no bolso. O lojista não muda nada no que faz; para ele, pagamento é pagamento.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Alguns objetos custam caro para existir: uma imagem em alta resolução, uma conexão de banco, um relatório de milhões de linhas. Criar todos antecipadamente desperdiça memória e tempo com o que talvez nem seja usado.",
        "Outros exigem cerimônia no acesso: checar permissão, registrar auditoria, respeitar rate limit. Espalhar essas checagens por todo chamador é repetição garantida — e uma delas vai ser esquecida.",
      ],
      extensao: [
        "A tentação é resolver dentro do próprio objeto real: um `if (!carregado) carregar()` no começo de cada método. Isso mistura a responsabilidade do objeto (exibir a imagem) com a de infraestrutura (gerenciar o carregamento), e o objeto deixa de ser testável sem o disco.",
        "Proxy, Decorator e Adapter são estruturalmente parecidos — todos embrulham um objeto — e a diferença está na intenção, não no desenho. **Adapter** muda a interface (contratos incompatíveis). **Decorator** mantém a interface e ADICIONA comportamento, normalmente empilhável. **Proxy** mantém a interface e CONTROLA o acesso, normalmente sozinho e com a responsabilidade de decidir se a chamada chega.",
        "Um sinal prático: no Decorator, quem monta a pilha é o cliente, e cada camada agrega valor visível ao resultado. No Proxy, o cliente costuma nem saber que existe, e o valor é invisível — mesma resposta, obtida de forma mais barata ou mais segura.",
      ],
    },
    {
      tipo: "secao",
      id: "sabores",
      titulo: "Os quatro sabores",
      resumo: [
        "Proxy é um padrão com quatro usos clássicos, todos com a mesma estrutura: virtual (adia a criação), de proteção (checa permissão), remoto (esconde a rede) e cache/smart (memoriza e conta referências).",
      ],
      extensao: [
        "**Virtual** é o mais comum: o objeto caro só nasce no primeiro uso. É o que ORMs fazem com lazy loading — `pedido.cliente` devolve um proxy, e só quando você lê um campo dele é que sai o SELECT.",
        "**De proteção** filtra por permissão antes de delegar. É a base de muito middleware de autorização: a interface é a mesma, mas a chamada só passa se o chamador puder.",
        "**Remoto** faz uma chamada de rede parecer local (o 'stub' de RPC/gRPC). Aqui mora a maior armadilha do padrão: a falácia de que a rede é confiável — mais sobre isso nas armadilhas.",
        "**Cache/smart** guarda o resultado, conta referências ou libera recursos. Um memoizador é, no fundo, um proxy de cache sobre uma função.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        { id: "cliente", label: "Cliente", nota: "chama exibir() — vê só a interface Imagem" },
        {
          id: "proxy",
          label: "ImagemProxy",
          nota: "mesma interface; decide se a chamada passa",
          destaque: true,
          filhos: [
            {
              id: "real",
              label: "ImagemReal",
              nota: "só nasce no primeiro exibir()",
              opcional: true,
            },
          ],
        },
      ],
      legenda:
        "O objeto real aparece tracejado porque pode nem existir: enquanto ninguém chamar exibir(), o proxy segura a criação. A borda do cliente termina na interface — ele não distingue um do outro.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Proxy: a galeria carrega tudo",
        itens: [
          "100 miniaturas viram 100 leituras de disco no construtor",
          "a tela trava antes de mostrar a primeira imagem",
          "memória proporcional ao catálogo, não ao que se vê",
          "testar a galeria exige os arquivos no disco",
        ],
        nota: "O custo é pago sempre e inteiro, mesmo quando o usuário abre uma imagem só e vai embora.",
      },
      depois: {
        titulo: "Com Proxy: paga quem usa",
        itens: [
          "a galeria monta 100 proxies baratos, sem tocar no disco",
          "o carregamento acontece no primeiro exibir()",
          "memória proporcional ao que foi realmente aberto",
          "nos testes, um proxy falso substitui o real",
        ],
        nota: "O custo vira uma indireção a mais e uma latência que aparece no meio da interação, não no início — o usuário vê a lista rápido, mas espera ao abrir.",
      },
      legenda:
        "O proxy não elimina o custo: ele o move no tempo e o cobra só de quem usa. Quando todos os itens acabam sendo abertos, o total é o mesmo — com uma classe a mais.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "cliente",
          titulo: "Cliente",
          curto: "programa contra a interface",
          detalhe:
            "Depende só do contrato (`Imagem`), nunca da classe concreta. É essa disciplina que permite trocar o real pelo proxy sem tocar em uma linha do chamador.",
          exemplo: "const img: Imagem = fabrica.criar('a.png');\nimg.exibir();",
          seViolar:
            "se o cliente declara `ImagemReal` em vez de `Imagem`, o proxy não encaixa e o padrão morre no tipo.",
        },
        {
          id: "proxy",
          titulo: "Proxy",
          curto: "mesma interface, política de acesso",
          detalhe:
            "Implementa a interface e guarda uma referência (talvez ainda vazia) ao real. Aqui mora a decisão: criar agora, devolver do cache, negar por permissão ou ir pela rede. Deve ser fino — política, não regra de negócio.",
          exemplo: "exibir() { this.real ??= new ImagemReal(this.arq); this.real.exibir(); }",
          seViolar:
            "proxy que calcula ou transforma o resultado deixou de controlar acesso e virou decorator disfarçado.",
        },
        {
          id: "real",
          titulo: "Objeto real",
          curto: "faz o trabalho, ignora o proxy",
          detalhe:
            "Continua simples e focado na sua responsabilidade. Não sabe que está sendo intermediado — e por isso segue utilizável diretamente por quem não precisa da política.",
          exemplo: "class ImagemReal implements Imagem { exibir() { /* desenha */ } }",
          seViolar:
            "se o real precisa consultar o proxy (para saber se pode agir), nasce um ciclo e a inversão se perde.",
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
          titulo: "Lazy loading em ORM",
          cenario:
            "Ao carregar um pedido, o ORM poderia trazer cliente, itens, pagamentos e histórico — dezenas de joins que quase nenhuma tela usa por completo.",
          aplicacao:
            "O ORM devolve proxies nas associações: `pedido.cliente` é um objeto vazio com a interface de Cliente. O SELECT só dispara quando algum campo é lido de fato. Hibernate, Doctrine e o Prisma fazem variações disso.",
          tradeoff:
            "É a origem clássica do problema N+1: um laço sobre 200 pedidos lendo `p.cliente.nome` dispara 200 queries. E acessar um proxy fora da sessão/transação estoura erro de lazy initialization — o custo escondido reaparece no pior momento.",
        },
        {
          titulo: "Autorização em API interna",
          cenario:
            "Um serviço de RH expõe operações sobre folha de pagamento; cada uma exige um papel diferente, e a checagem precisa acontecer sempre, sem exceção.",
          aplicacao:
            "Um FolhaProxy implementa a mesma interface do serviço e, antes de delegar, valida o papel do chamador e registra a tentativa na auditoria. A regra de acesso fica num lugar só, e o serviço real continua sem saber o que é um usuário.",
          tradeoff:
            "Se a decisão de permissão depender de dados do próprio resultado ('só pode ver salários da sua equipe'), o proxy precisa executar a chamada para então filtrar — e a economia de não executar desaparece.",
        },
        {
          titulo: "Stub de gRPC",
          cenario:
            "Um serviço de catálogo precisa consultar preços em outro serviço, que roda em outra máquina, com serialização e rede no meio.",
          aplicacao:
            "O stub gerado pelo gRPC é um proxy remoto: expõe `precos.consultar(sku)` como se fosse um objeto local e esconde serialização, conexão e desserialização.",
          tradeoff:
            "A conveniência mente sobre a física: a chamada parece local mas pode levar 200ms, falhar por timeout ou por partição de rede. Código escrito como se fosse local (num laço, sem timeout, sem retry) vira incidente em produção.",
        },
      ],
    },
    {
      tipo: "passos",
      titulo: "Como colocar o substituto na frente",
      passos: [
        {
          titulo: "Compartilhar a interface",
          texto:
            "Proxy e objeto real implementam o mesmo contrato. Sem isso, o cliente distingue os dois e o padrão morre no tipo.",
        },
        {
          titulo: "Guardar a política no proxy",
          texto:
            "Lazy, cache, permissão ou rede moram aqui — finos, sem regra de negócio. O real continua fazendo só o trabalho dele.",
        },
        {
          titulo: "Adiar o custo real",
          texto:
            "No virtual: o caro só nasce no primeiro uso. Criar o real no construtor do proxy anula o ganho inteiro.",
        },
        {
          titulo: "Entregar o proxy ao cliente",
          texto:
            "Quem consome programa contra a interface e não precisa saber que existe intermediário.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O Proxy que carrega no construtor",
      comoSeParece:
        "A classe se chama Proxy, implementa a interface certa e até aparece no diagrama — mas instancia o objeto caro no construtor. É um repasse com nome sofisticado; o lazy loading nunca aconteceu.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        {
          quando: "No boot da galeria",
          efeito: "Cem arquivos são lidos antes de qualquer clique — exatamente o custo que o proxy prometia adiar.",
        },
        {
          quando: "Na memória",
          efeito: "O consumo fica proporcional ao catálogo inteiro, não ao que o usuário abriu.",
        },
        {
          quando: "No teste",
          efeito: "Montar a lista já exige disco/rede; o falso barato que o proxy deveria permitir não existe.",
        },
      ],
      correcao:
        "Guarde só o caminho (ou a factory) no proxy. O `ImagemReal` nasce no primeiro `exibir()` — `this.real ??= new ImagemReal(...)` — e uma vez só.",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Fingir que a rede não existe",
          texto:
            "O proxy remoto é o padrão mais perigoso da lista justamente porque funciona bem demais: a chamada parece local. Mas latência, falha parcial e timeout continuam lá. Um proxy remoto sem timeout explícito, retry com backoff e circuit breaker transforma a lentidão do vizinho na sua indisponibilidade.",
        },
        {
          titulo: "Confundir com Decorator",
          texto:
            "Os dois embrulham mantendo a interface, então a escolha é de intenção. Se você está adicionando comportamento que o cliente pediu e quer empilhar (log + retry + cache), é Decorator. Se está controlando SE e QUANDO a chamada chega ao objeto, invisivelmente, é Proxy. Chamar tudo de proxy faz o nome perder o poder de comunicar.",
        },
        {
          titulo: "Cache sem invalidação",
          texto:
            "Um proxy de cache é trivial de escrever e traiçoeiro de manter: sem política de expiração ou invalidação, ele serve dado velho para sempre — e o bug aparece longe, como 'o sistema mostra o preço antigo'. Quem coloca cache assume a dívida de decidir quando ele mente.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "O objeto real é caro de criar e nem sempre será usado.",
        "O acesso precisa de política transversal: permissão, auditoria, rate limit, cache.",
        "O objeto vive em outro processo e você quer isolar a rede num ponto só.",
      ],
      evitar: [
        "O objeto é barato — sobra indireção e falta ganho.",
        "Você quer mudar a interface (é Adapter) ou somar comportamento empilhável (é Decorator).",
        "A política depende do resultado da chamada, o que anula o ganho de interceptá-la.",
      ],
    },
  ],
};
