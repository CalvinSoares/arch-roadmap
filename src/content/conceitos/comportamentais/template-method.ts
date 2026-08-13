import type { Conceito } from "@/shared/types/conceito";
import { gof } from "@/content/conceitos/_nascimento";

const MERMAID = `classDiagram
    class ImportadorRelatorio {
        <<abstract>>
        +importar() final
        #ler()*
        #validar(linhas)
        #gravar(linhas)*
    }
    class ImportadorCSV {
        #ler()
        #gravar(linhas)
    }
    class ImportadorXML {
        #ler()
        #validar(linhas)
        #gravar(linhas)
    }
    ImportadorRelatorio <|-- ImportadorCSV
    ImportadorRelatorio <|-- ImportadorXML`;

const CAMADAS = [
  {
    id: "abstrata",
    titulo: "Classe abstrata",
    descricao: "Define o esqueleto do algoritmo e trava a ordem — coração do padrão",
    destaque: true,
  },
  { id: "ganchos", titulo: "Passos abstratos e ganchos", descricao: "Os buracos que as subclasses preenchem" },
  { id: "concretas", titulo: "Subclasses", descricao: "Preenchem os passos, sem mexer na ordem" },
];

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `abstract class ImportadorRelatorio {
  // O template method: a ordem e final, ninguem sobrescreve
  importar(caminho: string): number {
    const linhas = this.ler(caminho);
    const validas = this.validar(linhas);
    this.gravar(validas);
    this.aoTerminar(validas.length); // gancho opcional
    return validas.length;
  }

  // passos obrigatorios: cada formato le e grava do seu jeito
  protected abstract ler(caminho: string): string[];
  protected abstract gravar(linhas: string[]): void;

  // passo com padrao razoavel: a subclasse sobrescreve se quiser
  protected validar(linhas: string[]): string[] {
    return linhas.filter((l) => l.trim().length > 0);
  }

  // gancho: nao faz nada por padrao
  protected aoTerminar(_total: number): void {}
}

class ImportadorCSV extends ImportadorRelatorio {
  protected ler(caminho: string): string[] {
    return ["a,1", "b,2"]; // leria o arquivo
  }
  protected gravar(linhas: string[]): void {
    console.log("gravando", linhas.length, "linhas");
  }
}

new ImportadorCSV().importar("vendas.csv");`,
  },
  {
    lang: "python" as const,
    code: `from abc import ABC, abstractmethod

class ImportadorRelatorio(ABC):
    # O template method: a ordem e fixa
    def importar(self, caminho):
        linhas = self.ler(caminho)
        validas = self.validar(linhas)
        self.gravar(validas)
        self.ao_terminar(len(validas))  # gancho opcional
        return len(validas)

    # passos obrigatorios
    @abstractmethod
    def ler(self, caminho): ...
    @abstractmethod
    def gravar(self, linhas): ...

    # passo com padrao razoavel
    def validar(self, linhas):
        return [l for l in linhas if l.strip()]

    # gancho: nao faz nada por padrao
    def ao_terminar(self, total):
        pass

class ImportadorCSV(ImportadorRelatorio):
    def ler(self, caminho):
        return ["a,1", "b,2"]

    def gravar(self, linhas):
        print("gravando", len(linhas), "linhas")

ImportadorCSV().importar("vendas.csv")`,
  },
];

const ANTI_EXEMPLO = `abstract class ImportadorRelatorio {
  // O "template" deixou de ser final — cada subclasse reescreve a ordem.
  importar(caminho: string): number {
    return this.rodar(caminho);
  }

  protected abstract rodar(caminho: string): number;
}

class ImportadorCSV extends ImportadorRelatorio {
  protected rodar(caminho: string): number {
    const linhas = this.ler(caminho);
    this.gravar(linhas);          // <- validar sumiu
    return linhas.length;
  }
  protected ler(c: string) { return ["a,1"]; }
  protected gravar(_l: string[]) {}
}

// A ordem unica morreu. Cada formato tem a sua sequencia —
// e o bug "esquecemos de validar" volta a ser possivel.`;

export const templateMethod: Conceito = {
  slug: "template-method",
  titulo: "Template Method",
  categoria: "comportamental",
  resumo:
    "Define o esqueleto de um algoritmo numa classe base e deixa que as subclasses preencham passos específicos, sem poder alterar a ordem em que eles acontecem.",
  tags: ["heranca", "esqueleto", "ganchos", "gof"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: gof(),
  ondeAparece: [
    {
      onde: "beforeEach / it / afterEach",
      explicacao:
        "O framework de teste define o esqueleto da execução; você preenche os passos.",
    },
    {
      onde: "Hooks de ciclo de vida",
      explicacao:
        "O framework decide quando montar, atualizar e desmontar; você diz o que acontece em cada etapa.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Esqueleto na base; passos nas subclasses.
class Teste { run() { this.setup(); this.test(); this.teardown(); } }`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "A herança amarra a subclasse ao esqueleto do pai, que não muda sem impacto abaixo",
      "O fluxo se lê pela metade na superclasse e pela metade nas subclasses",
    ],
    naoValeSe:
      "os passos variáveis não compartilham um esqueleto comum — aí compor com Strategy acopla menos que herdar.",
  },
  relacionados: ["strategy", "factory-method"],
  problema: [
    "Vários processos seguem a mesma sequência e diferem em poucos pontos: importar CSV e importar XML leem e gravam diferente, mas ambos leem, validam, gravam e notificam — nessa ordem.",
    "Copiar a sequência em cada classe funciona até alguém corrigir um passo em uma e esquecer nas outras. A ordem correta vira conhecimento tribal, repetido e divergente.",
  ],
  solucao: [
    "A classe base implementa o algoritmo completo num método que chama passos declarados como abstratos ou com implementação padrão. Esse método concentra a ordem e não deve ser sobrescrito.",
    "Cada subclasse preenche só o que lhe é próprio. A sequência existe num lugar só: corrigi-la corrige todo mundo de uma vez.",
  ],
  quandoUsar: [
    "Várias implementações compartilham a mesma sequência de passos e variam em pontos localizados.",
    "A ordem dos passos é uma invariante que não deveria ficar a cargo de quem estende.",
    "Você quer oferecer pontos de extensão explícitos numa biblioteca ou framework.",
  ],
  quandoEvitar: [
    "As variações são muitas e combinatórias — a hierarquia explode e Strategy por composição serve melhor.",
    "As subclasses precisam mudar a ordem, e não só o conteúdo dos passos.",
    "A linguagem/equipe evita herança por bons motivos: funções de ordem superior resolvem o mesmo com menos amarras.",
  ],
  mermaid: MERMAID,
  camadas: CAMADAS,
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "A classe base escreve o roteiro — ler, validar, gravar, notificar — e deixa buracos para as subclasses preencherem. Quem estende decide o COMO de cada passo, nunca a ORDEM: essa fica trancada num lugar só.",
    },
    {
      tipo: "analogia",
      emoji: "🍞",
      titulo: "A receita-base do pão",
      texto:
        "Toda receita de pão segue a mesma sequência: misturar, sovar, fermentar, assar. O que muda entre o pão francês e a focaccia é o recheio de cada etapa — a farinha, o tempo de fermentação, a temperatura. Nenhum padeiro assa antes de fermentar. A sequência é a receita-base; as variações preenchem os espaços.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema",
      resumo: [
        "Processos irmãos costumam compartilhar mais do que aparentam: a ordem das etapas é igual, e só o miolo de cada uma muda conforme o formato, o cliente ou o canal.",
        "Duplicar a sequência espalha uma decisão que deveria ser única. Quando um passo novo entra (uma checagem de segurança, por exemplo), é preciso lembrar de todas as cópias.",
      ],
      extensao: [
        "O padrão aplica o princípio de Hollywood — 'não nos chame, nós chamamos você'. A inversão é o ponto: a base controla o fluxo e chama a subclasse nos momentos certos, em vez de a subclasse orquestrar a base. É o mesmo mecanismo que faz um framework ser framework, e não biblioteca.",
        "A comparação com **Strategy** é o eixo da decisão. Template Method varia por **herança**, em tempo de compilação: uma subclasse por variação, e o objeto não muda de comportamento depois de criado. Strategy varia por **composição**, em tempo de execução: você injeta o algoritmo e pode trocá-lo. Template Method economiza cerimônia quando as variações são poucas e estáveis; Strategy paga essa cerimônia para ganhar flexibilidade.",
        "Vale notar o parentesco com **Factory Method**: ele é, na prática, um Template Method cujo passo variável é 'qual objeto criar'. Reconhecer isso evita tratá-los como coisas totalmente distintas.",
      ],
    },
    {
      tipo: "secao",
      id: "ganchos",
      titulo: "Passos obrigatórios, padrões e ganchos",
      resumo: [
        "Nem todo buraco é igual. Um passo pode ser abstrato (a subclasse é obrigada), ter implementação padrão (sobrescrever é opcional) ou ser um gancho vazio (existe só para quem quiser se pendurar).",
      ],
      extensao: [
        "**Abstrato** comunica 'sem isto o algoritmo não existe' — ler e gravar, no exemplo. O compilador cobra, o que é bom: a subclasse não nasce pela metade.",
        "**Padrão razoável** cobre o caso comum e permite especializar. `validar` filtrando linhas vazias serve para quase todos; quem tem regra própria sobrescreve. Reduz o atrito de criar uma variação nova.",
        "**Gancho vazio** (`aoTerminar`) não faz nada e existe para observação ou ajuste fino. É o mais barato de oferecer e o mais fácil de abusar: cada gancho é API pública que você promete manter.",
        "A regra prática é ser econômico. Cada ponto de extensão amplia o contrato com quem estende, e reduzir ganchos depois é quebra de compatibilidade.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "base",
          label: "ImportadorRelatorio.importar()",
          nota: "a ordem mora aqui e não é sobrescrita",
          destaque: true,
          filhos: [
            { id: "ler", label: "1. ler()", nota: "abstrato — cada formato lê do seu jeito" },
            { id: "validar", label: "2. validar()", nota: "padrão razoável — sobrescrever é opcional", opcional: true },
            { id: "gravar", label: "3. gravar()", nota: "abstrato — obrigatório" },
            { id: "fim", label: "4. aoTerminar()", nota: "gancho vazio — só para quem quiser", opcional: true },
          ],
        },
      ],
      legenda:
        "Os passos estão dentro do método-template, não ao lado dele: é isso que impede uma subclasse de trocar a ordem. Tracejado marca o que é opcional preencher.",
    },
    {
      tipo: "ilustracao",
      arquetipo: "antes-depois",
      antes: {
        titulo: "Sem Template Method: a ordem duplicada",
        itens: [
          "cada importador reescreve ler → validar → gravar → notificar",
          "um passo novo exige editar todas as classes",
          "uma delas esquece de validar e ninguém percebe",
          "a sequência correta vira conhecimento tribal",
        ],
        nota: "A duplicação não é do código, é da decisão: a ordem certa está afirmada em vários lugares e vai divergir.",
      },
      depois: {
        titulo: "Com Template Method: a ordem é única",
        itens: [
          "a base declara a sequência uma vez",
          "subclasses preenchem só o que lhes é próprio",
          "passo novo entra na base e vale para todos",
          "o compilador cobra os passos obrigatórios",
        ],
        nota: "O custo é herança: a variação fica presa em tempo de compilação e a base vira contrato difícil de mudar depois que muita gente estendeu.",
      },
      legenda:
        "O padrão troca duplicação por acoplamento hierárquico. Compensa quando a ordem é estável e as variações são poucas — se as duas coisas mudam, Strategy envelhece melhor.",
    },
    {
      tipo: "passos",
      titulo: "O fluxo, passo a passo",
      passos: [
        { titulo: "Escrever o esqueleto", texto: "Na base, o método-template chama os passos na ordem certa e não deve ser sobrescrito." },
        { titulo: "Abrir os buracos", texto: "Declare passos abstratos (obrigatórios), com padrão razoável ou ganchos vazios." },
        { titulo: "Preencher nas subclasses", texto: "Cada variação implementa só o que lhe é próprio — sem reordenar o fluxo." },
        { titulo: "Chamar o template", texto: "O cliente invoca importar(); a base orquestra e chama os passos no momento certo." },
      ],
    },
    {
      tipo: "camadas-nav",
      titulo: "Navegue pelas camadas",
      camadas: [
        {
          id: "template",
          titulo: "O método-template",
          curto: "o roteiro, fechado para alteração",
          detalhe:
            "Implementa o algoritmo chamando os passos na ordem. Deve ser marcado como final (ou documentado como não-sobrescrevível): permitir que alguém o substitua devolve a ordem ao caos que o padrão veio resolver.",
          exemplo: "importar() { ler(); validar(); gravar(); aoTerminar(); }",
          seViolar:
            "subclasse que sobrescreve o próprio template method esvazia o padrão — cada uma volta a ter a sua ordem.",
        },
        {
          id: "passos",
          titulo: "Passos e ganchos",
          curto: "os buracos, com contratos diferentes",
          detalhe:
            "Abstratos são obrigação; com implementação padrão são conveniência; ganchos vazios são convite. Todos devem ser protegidos, não públicos: quem chama de fora deveria usar o template method.",
          exemplo: "protected abstract ler(c: string): string[];",
          seViolar:
            "passo público permite que um cliente chame `gravar()` sem passar por `validar()` — a invariante da ordem some.",
        },
        {
          id: "subclasse",
          titulo: "Subclasse",
          curto: "preenche, não reordena",
          detalhe:
            "Implementa os passos abstratos e sobrescreve o que precisar. Não deveria conhecer a sequência nem depender de ser chamada em determinado momento além do que o contrato diz.",
          exemplo: "class ImportadorCSV extends ImportadorRelatorio { ... }",
          seViolar:
            "subclasse que guarda estado entre passos assumindo a ordem exata quebra quando a base insere uma etapa no meio.",
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
          titulo: "Ciclo de vida em framework de UI",
          cenario:
            "Um componente precisa ser montado, renderizado, atualizado e destruído sempre na mesma ordem, e o autor do componente só quer dizer o que fazer em cada momento.",
          aplicacao:
            "O framework implementa o ciclo e chama métodos de ciclo de vida do componente nos pontos certos. É Template Method em escala: o fluxo pertence ao framework, o conteúdo ao desenvolvedor.",
          tradeoff:
            "Os ganchos viram API pública e quase imutável — mudar quando um deles é chamado quebra todo o ecossistema, o que empurra frameworks a acumular métodos legados por anos.",
        },
        {
          titulo: "Pipeline de importação de arquivos",
          cenario:
            "Um ERP importa planilhas de vendas em CSV, XML e um formato posicional legado; todos passam por leitura, validação, deduplicação e gravação transacional.",
          aplicacao:
            "A base implementa a sequência e a transação; cada formato só implementa o parser e o mapeamento. Adicionar um formato novo é uma classe pequena, sem risco de esquecer a deduplicação.",
          tradeoff:
            "Quando um formato precisa de um passo extra fora da sequência (o legado exige reconciliação antes de validar), a tentação é adicionar mais um gancho — e a base incha até virar o problema.",
        },
        {
          titulo: "Casos de teste com preparação comum",
          cenario:
            "Uma suíte de integração precisa subir banco, aplicar migrações, rodar o teste e limpar tudo, sempre nessa ordem, para dezenas de cenários.",
          aplicacao:
            "A classe-base de teste implementa setup e teardown ao redor de um método abstrato com o corpo do caso. É o padrão por trás de praticamente todo framework de teste xUnit.",
          tradeoff:
            "Hierarquias de classes-base de teste tendem a crescer em profundidade, e depois de três níveis fica difícil saber qual setup rodou — a herança que economizava passa a esconder.",
        },
      ],
    },
    {
      tipo: "anti-exemplo",
      titulo: "O template que a subclasse reescreve",
      comoSeParece:
        "A classe base existe, mas o método-template virou hook aberto: cada subclasse redefine a ordem inteira. O padrão vira herança comum sem a invariante que justificava o esqueleto.",
      codigo: { lang: "typescript", code: ANTI_EXEMPLO },
      sintomas: [
        { quando: "Ao corrigir um passo", efeito: "A correção na base não alcança quem sobrescreveu o fluxo — as cópias divergem de novo." },
        { quando: "Na auditoria", efeito: "Um formato 'esquece' validar e ninguém percebe, porque a ordem não é única." },
        { quando: "Na leitura", efeito: "Para entender o algoritmo, é preciso abrir cada subclasse — o esqueleto sumiu." },
      ],
      correcao:
        "Marque o template como final (ou documente como não-sobrescrevível). Subclasse preenche passos e ganchos — nunca a ordem. Se a ordem precisa variar, o padrão certo é outro (Strategy).",
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Base que vira depósito",
          texto:
            "Cada necessidade nova de uma subclasse vira um gancho a mais na base. Depois de um tempo, a classe abstrata tem quinze métodos protegidos, metade deles usada por uma única subclasse. O sinal de alerta é um gancho com um só implementador: aquilo provavelmente não pertence à base.",
        },
        {
          titulo: "Herança onde cabia composição",
          texto:
            "Template Method consome a única herança disponível em linguagens sem herança múltipla e amarra a variação em tempo de compilação. Se as variações se combinam (formato × destino × política de erro), a hierarquia explode em classes cruzadas. Aí o padrão certo é Strategy: injetar as partes em vez de herdá-las.",
        },
        {
          titulo: "Chamar métodos sobrescrevíveis no construtor",
          texto:
            "Se o construtor da base chama um passo que a subclasse implementa, ele executa antes de os campos da subclasse serem inicializados — e lê `undefined`/`null` sem erro aparente. É um bug clássico de herança, e o Template Method o convida ao juntar fluxo e hierarquia.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "A sequência é estável e as variações são pontuais.",
        "A ordem é uma invariante que não deve ficar a cargo de quem estende.",
        "Você está oferecendo pontos de extensão explícitos num framework.",
      ],
      evitar: [
        "As variações se combinam e a hierarquia explodiria — prefira Strategy.",
        "As subclasses precisam mudar a ordem, não só o conteúdo.",
        "A base já acumula ganchos usados por um implementador só.",
      ],
    },
  ],
};
