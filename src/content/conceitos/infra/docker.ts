import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// O container não pede um framework — pede que seu app se comporte:
// config por ambiente, log em stdout e morte digna. O resto é Dockerfile.
import http from "node:http";

// 1. Config vem do ambiente — a MESMA imagem roda em dev, staging e prod
const porta = Number(process.env.PORT ?? 3000);
const urlBanco = process.env.DATABASE_URL; // nunca hardcoded na imagem

const servidor = http.createServer((req, res) => {
  // 2. Log em stdout: o runtime coleta; o app não gerencia arquivo de log
  console.log(JSON.stringify({ metodo: req.method, rota: req.url }));
  res.writeHead(200).end("ok");
});

servidor.listen(porta, () => console.log(\`ouvindo em :\${porta}\`));

// 3. Morte digna: o orquestrador manda SIGTERM antes de matar.
//    Quem ignora, derruba requests no meio a cada deploy.
process.on("SIGTERM", () => {
  console.log("SIGTERM: parando de aceitar conexões...");
  servidor.close(() => process.exit(0)); // termina as requests em voo e sai
});

/* O Dockerfile correspondente (multi-stage: build pesado, imagem final magra):
   FROM node:22 AS build
   COPY . . && RUN npm ci && npm run build
   FROM node:22-slim
   COPY --from=build /app/dist ./dist
   USER node                # nunca root
   CMD ["node", "dist/main.js"]
*/`,
  },
];

export const docker: Conceito = {
  slug: "docker",
  titulo: "Docker & containers",
  categoria: "infra",
  resumo:
    "Empacota o app com tudo que ele precisa numa imagem imutável que roda igual em qualquer máquina. Container é essa imagem em execução — um processo isolado pelo kernel, não uma máquina virtual.",
  tags: ["containers", "imagens", "deploy", "isolamento", "dockerfile"],
  dificuldade: "iniciante",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "2013", ano: 2013, precisao: "exata" },
    fonte:
      "Solomon Hykes — demo pública do Docker na PyCon US, março de 2013; " +
      "código aberto no mesmo mês",
    precursor:
      "Os `cgroups` e `namespaces` do Linux já existiam há anos, e o LXC " +
      "empacotava os dois. O Docker não inventou o isolamento — inventou a " +
      "imagem em camadas e o jeito de compartilhá-la.",
  },
  ondeAparece: [
    {
      onde: "Dockerfile e Docker Hub",
      explicacao:
        "A receita da imagem e o registro de onde ela é baixada: você empacota app e dependências uma vez e roda igual em qualquer máquina.",
    },
    {
      onde: "runners de CI",
      explicacao:
        "Cada job do GitHub Actions ou GitLab CI roda dentro de um contêiner limpo, garantindo o mesmo ambiente a cada execução do pipeline.",
    },
    {
      onde: "docker compose no dev local",
      explicacao:
        "Subir banco, cache e app juntos com um comando dá a todo o time o mesmo ambiente, sem instalar serviço por serviço na máquina.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Mesma imagem do laptop ao cluster.
// docker build -t api:1 . && docker run api:1`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Uma imagem a construir, versionar e manter, mais um registro de onde ela vive",
      "A camada de contêiner adiciona um degrau entre o processo e a máquina para depurar",
    ],
    naoValeSe:
      "o ambiente é único, estável e já reproduzível sem esforço — empacotar aí adiciona um passo de build sem ganho de portabilidade.",
  },
  relacionados: ["kubernetes", "vps"],
  problema: [
    "'Na minha máquina funciona' é a versão do Node, a lib do sistema, a variável que só existe no notebook de quem configurou. Cada servidor é um ambiente ligeiramente diferente, e o deploy é a arte de descobrir a diferença em produção.",
  ],
  solucao: [
    "Congele o ambiente junto com o código: a imagem carrega o SO base, as dependências e o app, versionada num registry. O que passou no CI é bit a bit o que roda em produção — a máquina hospedeira só precisa saber rodar containers.",
  ],
  quandoUsar: [
    "Praticamente qualquer serviço de rede que vá para produção.",
    "Padronizar ambiente de desenvolvimento e CI.",
  ],
  quandoEvitar: [
    "Um script simples numa máquina só — a padronização não paga o overhead.",
    "Apps que exigem kernel/hardware específicos (drivers, GUI).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Imagem = app + dependências + SO base, congelados num artefato imutável e versionado. Container = essa imagem rodando como processo isolado pelo kernel. O 'funciona na minha máquina' morre porque a máquina inteira (menos o kernel) viaja junto.",
    },
    {
      tipo: "analogia",
      emoji: "📦",
      titulo: "O contêiner de navio",
      texto:
        "Antes do contêiner padronizado, cada carga era um problema: sacas, barris, caixotes — cada navio estivava de um jeito. O contêiner inverteu a lógica: a carga se adapta à caixa, e navio, guindaste e caminhão só precisam saber mover a caixa. Docker fez isso com software: o servidor não sabe se dentro roda Node, Python ou Java — só sabe rodar containers.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: o ambiente que não viaja com o código",
      resumo: [
        "O código vai para produção, mas o ambiente fica para trás: a versão do runtime, as bibliotecas do sistema, as variáveis, o fuso do servidor. Cada máquina acumula diferenças invisíveis — e o bug que só acontece lá é quase sempre uma dessas diferenças.",
        "VMs resolvem o isolamento, mas carregam um SO inteiro por app: gigabytes, minutos de boot. Container isola com namespaces e cgroups do próprio kernel — megabytes, milissegundos — porque não virtualiza hardware, só separa processos.",
      ],
      extensao: [
        "A imagem é feita de camadas: cada instrução do Dockerfile gera uma, e camadas são cacheadas e compartilhadas — dez serviços sobre a mesma base de Node compartilham essa base no disco e no registry. É por isso que a ordem do Dockerfile importa: dependências (que mudam pouco) antes do código (que muda sempre), para o cache aproveitar.",
        "Container é descartável por design: o filesystem dele morre com ele. Estado que importa (banco, uploads) vive fora — em volumes ou serviços gerenciados. Essa é a inversão mental que dói no começo e sustenta todo o resto: você para de tratar servidor como lugar e passa a tratar como processo.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "imagem",
          label: "Imagem (imutável, no registry)",
          filhos: [
            { id: "base", label: "camada base: SO mínimo" },
            { id: "deps", label: "camada: dependências" },
            { id: "app", label: "camada: seu código", destaque: true },
          ],
        },
        {
          id: "container",
          label: "Container (processo em execução)",
          filhos: [
            { id: "fs", label: "filesystem descartável" },
            { id: "env", label: "env + rede próprias" },
          ],
        },
      ],
      legenda:
        "A imagem é o artefato — camadas empilhadas, cacheáveis, versionadas. O container é uma execução dela: nasce, roda, morre — e nada do que gravou dentro sobrevive.",
    },
    {
      tipo: "camadas-nav",
      titulo: "Da receita ao processo",
      camadas: [
        {
          id: "dockerfile",
          titulo: "Dockerfile",
          curto: "a receita, versionada junto do código",
          detalhe:
            "Declara base, dependências, build e comando de início. Multi-stage separa o estágio de build (compiladores, devDependencies) da imagem final (só o necessário para rodar) — a diferença entre 1,2 GB e 150 MB.",
          exemplo: "FROM node:22 AS build\n...\nFROM node:22-slim  # imagem final magra",
          seViolar:
            "imagem única com toolchain de build inteira = imagem gorda, deploy lento e superfície de ataque cheia de ferramentas que produção nunca usa.",
        },
        {
          id: "imagem",
          titulo: "Imagem",
          curto: "o artefato imutável no registry",
          detalhe:
            "Construída uma vez no CI, etiquetada com a versão (tag imutável, digest), promovida entre ambientes sem rebuild. A imagem que passou nos testes é a que vai para produção — não uma 'igual'.",
          seViolar:
            "rebuildar por ambiente reintroduz o problema que o Docker resolve: staging e produção voltam a rodar artefatos diferentes.",
        },
        {
          id: "container",
          titulo: "Container",
          curto: "um processo descartável — estado mora fora",
          detalhe:
            "Recebe config por env, loga em stdout, atende SIGTERM e morre limpo. Qualquer coisa gravada no filesystem dele evapora no próximo deploy — banco, uploads e sessão vivem em volumes ou serviços externos.",
          seViolar:
            "estado dentro do container funciona até o primeiro restart — e o primeiro restart é sempre no pior momento.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Onboarding que era uma semana, virou um comando",
          cenario:
            "O sistema tem API, worker, Postgres, Redis e um gateway — e o guia de setup do novo dev tinha 40 passos desatualizados. Cada notebook era um ambiente diferente, com bugs próprios.",
          aplicacao:
            "Um docker-compose.yml declara os cinco serviços com versões pinadas. O novo dev roda 'docker compose up' e tem o sistema inteiro, idêntico ao dos colegas, em minutos — e o guia de 40 passos vira um arquivo versionado que o CI também usa.",
          tradeoff:
            "O time precisa de fluência mínima em Docker para depurar (logs, exec, volumes), e em máquinas modestas os cinco containers pesam mais que os serviços nativos.",
        },
        {
          titulo: "A imagem testada é a imagem implantada",
          cenario:
            "O deploy antigo era 'git pull + npm install' no servidor: o install de produção às vezes resolvia versões diferentes das testadas, e o rollback era um exercício de arqueologia.",
          aplicacao:
            "O CI builda a imagem uma vez, roda os testes contra ela e a publica com tag imutável. Produção só troca a tag em execução; rollback é apontar para a tag anterior — o artefato antigo continua no registry, intacto.",
          tradeoff:
            "Surge uma peça nova para operar (o registry) e uma disciplina nova: limpar imagens velhas, escanear vulnerabilidades da base, renovar a base quando o SO ganha CVE.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Estado dentro do container",
          texto:
            "SQLite no filesystem do container, uploads em ./uploads, sessão em memória: tudo isso morre no próximo deploy. Container é processo, não lugar — estado que importa vive em volume, banco ou storage externo, decidido antes do primeiro restart doer.",
        },
        {
          titulo: "Rodar como root",
          texto:
            "O padrão das imagens é root, e um escape de container com root dentro é um problema de verdade. USER node (ou equivalente) no final do Dockerfile custa uma linha e corta a classe inteira de risco.",
        },
        {
          titulo: ":latest em produção",
          texto:
            "Deploy com :latest é deploy de conteúdo desconhecido: o que sobe hoje não é o que subiu ontem, e rollback vira adivinhação. Tags imutáveis (versão ou SHA do commit) tornam cada deploy nomeável, auditável e reversível.",
        },
        {
          titulo: "Ignorar o SIGTERM",
          texto:
            "No deploy, o orquestrador manda SIGTERM e espera; quem não trata é morto com as requests em voo — erros 502 a cada release. Fechar o servidor com graça são cinco linhas, e é a diferença entre deploy invisível e deploy que derruba usuários.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Serviços de rede em produção — o caso padrão hoje.",
        "Ambiente de desenvolvimento e CI reprodutíveis.",
        "Sistemas com serviços em linguagens e runtimes diferentes.",
      ],
      evitar: [
        "Script pontual numa máquina só — o empacotamento não se paga.",
        "Apps que dependem de kernel, driver ou GUI específicos.",
        "Times sem ninguém para operar registry e ciclo de imagens — um PaaS esconde isso por você.",
      ],
    },
  ],
};
