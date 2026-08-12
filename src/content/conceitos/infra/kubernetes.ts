import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// O contrato que o Kubernetes espera do seu app: dois endpoints honestos
// e uma morte digna. Sem isso, rollout sem downtime é sorte, não garantia.
import http from "node:http";

let pronto = false;   // readiness: "posso receber tráfego?"
let vivo = true;      // liveness:  "estou funcional ou preciso reiniciar?"

const servidor = http.createServer(async (req, res) => {
  // LIVENESS: só responde "estou travado?" — nunca cheque dependências aqui.
  // Se o banco cair e o liveness falhar por isso, o k8s reinicia TODOS os
  // pods em loop... e o banco continua fora do ar.
  if (req.url === "/healthz") {
    return res.writeHead(vivo ? 200 : 500).end();
  }

  // READINESS: "consigo atender AGORA?" — aqui sim, cheque o que importa.
  // Falhou? O k8s apenas tira o pod do balanceador até melhorar.
  if (req.url === "/readyz") {
    return res.writeHead(pronto ? 200 : 503).end();
  }

  res.writeHead(200).end("ok");
});

servidor.listen(3000, async () => {
  await aquecerConexoes();      // pool de banco, caches...
  pronto = true;                // só então o tráfego começa a chegar
});

// No rollout, o k8s manda SIGTERM, espera o pod drenar, e só então mata.
process.on("SIGTERM", () => {
  pronto = false;                        // sai do balanceador primeiro
  servidor.close(() => process.exit(0)); // termina as requests em voo
});

async function aquecerConexoes() {/* ... */}`,
  },
];

export const kubernetes: Conceito = {
  slug: "kubernetes",
  titulo: "Kubernetes & pods",
  categoria: "infra",
  resumo:
    "Você declara o estado desejado — '3 réplicas desta imagem, com este tanto de memória' — e o cluster trabalha continuamente para a realidade convergir. Pod é a menor unidade: um ou mais containers que vivem e morrem juntos.",
  tags: ["orquestracao", "pods", "k8s", "deploy", "escala"],
  dificuldade: "avancado",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2014", ano: 2014, precisao: "exata" },
    fonte: "Google — anúncio público do Kubernetes, junho de 2014",
    precursor:
      "O Borg, escalonador interno do Google desde ~2003, é o avô direto: " +
      "o Kubernetes é a terceira tentativa de contar o que o Borg aprendeu.",
  },
  ondeAparece: [
    {
      onde: "GKE, EKS, AKS",
      explicacao:
        "Os Kubernetes gerenciados de Google, AWS e Azure: você declara o estado desejado e o cluster cuida de manter os contêineres de pé.",
    },
    {
      onde: "kubectl apply",
      explicacao:
        "Você entrega um manifesto do que quer e o controlador reconcilia a realidade até bater com ele, reiniciando o que cair pelo caminho.",
    },
    {
      onde: "Deployments que reescalam sozinhos",
      explicacao:
        "Sob carga, o autoscaler sobe réplicas novas e as distribui pelos nós; quando a carga cai, ele as remove sem intervenção manual.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Declara o desejado; o control loop converge.
// replicas: 3  →  o cluster mantém 3 pods`,
  },
  custo: {
    indirecoes: 3,
    cobra: [
      "Um plano de controle inteiro a operar, atualizar e entender antes de rodar qualquer coisa",
      "A curva e a superfície de configuração são enormes, e o custo fixo não compensa em escala pequena",
    ],
    naoValeSe:
      "você tem poucos serviços e um tráfego que um par de máquinas aguenta — a complexidade do orquestrador supera o que ela resolve.",
  },
  relacionados: ["docker", "vps"],
  problema: [
    "Containers resolvem o pacote, não a operação: com 30 serviços em 5 máquinas, quem reinicia o que caiu às 3h? Quem espalha as réplicas para uma máquina não levar tudo junto? Quem troca a versão sem derrubar tráfego? Scripts artesanais viram um orquestrador caseiro pior.",
  ],
  solucao: [
    "Declare o estado desejado em manifestos versionados e deixe o loop de reconciliação trabalhar: o Kubernetes compara desejado × real o tempo todo e corrige a diferença — pod caiu, sobe outro; node morreu, realoca; versão mudou, faz o rollout gradual e volta sozinho se as probes reprovarem.",
  ],
  quandoUsar: [
    "Dezenas de serviços, várias equipes, deploys frequentes.",
    "Necessidade real de escala automática e rollout sem downtime.",
  ],
  quandoEvitar: [
    "Dois serviços e três devs — o custo operacional supera o benefício.",
    "Sem ninguém para operar o cluster (e sem verba para um gerenciado).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um termostato para infraestrutura: você declara o estado desejado (3 réplicas, versão X, tanto de CPU) e o loop de reconciliação corrige a realidade sem parar. Pod = a menor unidade agendável: containers que compartilham IP e destino.",
    },
    {
      tipo: "analogia",
      emoji: "🌡️",
      titulo: "O termostato, não o interruptor",
      texto:
        "Um aquecedor de interruptor obedece comandos: liga, desliga. O termostato recebe uma intenção — 'quero 22°C' — e trabalha sozinho: mede, compara, liga, desliga, o dia inteiro. O Kubernetes é o termostato da sua infraestrutura: você não manda 'suba um container na máquina 4'; declara 'existam 3 réplicas saudáveis' e ele faz o que for preciso — inclusive às 3h da manhã, quando a máquina 4 morrer.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "O problema: containers demais para mãos humanas",
      resumo: [
        "Um container numa máquina é trivial. Trinta serviços, três réplicas cada, cinco máquinas: agora existe um problema de alocação (o que roda onde), um de saúde (quem vigia e reinicia), um de rede (como o serviço A acha o B se os IPs mudam a cada restart) e um de mudança (como trocar a versão sem janela de manutenção).",
        "A resposta artesanal — scripts de deploy, systemd, um humano de plantão — funciona e para de funcionar num ponto previsível: quando a frequência de mudanças vezes o número de serviços ultrapassa o que cabe na cabeça de quem opera.",
      ],
      extensao: [
        "O vocabulário mínimo que destrava o resto: Pod — um ou mais containers agendados juntos, com IP compartilhado (o app e seu sidecar de proxy, por exemplo); pods são efêmeros e substituíveis, nunca consertados. Deployment — 'quero N réplicas desta imagem', com estratégia de rollout e rollback. Service — o endereço estável na frente de pods que nascem e morrem; quem chama o serviço nunca conhece um pod específico.",
        "O insight profundo não é a escala — é o modelo declarativo. Manifestos em YAML no git descrevem o sistema inteiro; o cluster converge para eles. Auditar é ler o git; recuperar um desastre é aplicar os manifestos de novo; o 'como chegar lá' deixou de ser problema seu. É o mesmo salto do imperativo para o declarativo que o SQL deu sobre percorrer índices na mão.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "estrutura",
      blocos: [
        {
          id: "cluster",
          label: "Cluster",
          filhos: [
            {
              id: "node-a",
              label: "Node A",
              filhos: [
                { id: "pod-1", label: "Pod: app + sidecar", destaque: true },
                { id: "pod-2", label: "Pod: app" },
              ],
            },
            {
              id: "node-b",
              label: "Node B",
              filhos: [{ id: "pod-3", label: "Pod: app" }],
            },
          ],
        },
      ],
      legenda:
        "Cluster contém nodes; nodes rodam pods; o pod agrupa containers inseparáveis. As réplicas se espalham entre nodes — um node morto leva um pod, nunca o serviço.",
    },
    {
      tipo: "camadas-nav",
      titulo: "As três camadas do modelo",
      camadas: [
        {
          id: "manifestos",
          titulo: "Estado desejado (manifestos)",
          curto: "YAML no git descrevendo o que deve existir",
          detalhe:
            "Deployments, Services, ConfigMaps: a descrição completa e versionada do sistema. O git vira a fonte da verdade da infraestrutura — revisar mudança de produção é revisar um diff.",
          exemplo: "replicas: 3\nimage: registro/app:1.42.0",
          seViolar:
            "mudanças aplicadas na mão com kubectl e nunca commitadas criam a deriva clássica: o cluster real não bate com o git, e a próxima aplicação dos manifestos desfaz um ajuste que alguém achava permanente.",
        },
        {
          id: "controle",
          titulo: "Plano de controle",
          curto: "o loop que compara desejado × real, sem parar",
          detalhe:
            "Scheduler decide onde cada pod cabe (pelos requests de CPU/memória); controllers vigiam a diferença entre o declarado e o observado e agem: pod morto é substituído, node perdido tem os pods realocados, rollout avança réplica a réplica conforme as probes aprovam.",
          seViolar:
            "sem requests/limits declarados, o scheduler aloca no escuro — um pod guloso esfomeia os vizinhos e derruba o node inteiro.",
        },
        {
          id: "nodes",
          titulo: "Nodes e pods",
          curto: "onde os processos de fato rodam",
          detalhe:
            "Cada node roda um agente (kubelet) que materializa os pods designados e reporta saúde. Pods são gado, não bicho de estimação: têm nome aleatório, IP efêmero e substituição sumária — todo estado importante mora fora, e o Service dá o endereço estável.",
          seViolar:
            "tratar pod como servidor (nome fixo, estado local, SSH para 'consertar') briga com o modelo — o pod consertado à mão morre no próximo rollout.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Rollout que se cancela sozinho",
          cenario:
            "Um serviço de pagamento com 6 réplicas precisa de deploys diários sem derrubar transação — e a versão nova às vezes tem bug que só aparece com tráfego real.",
          aplicacao:
            "O Deployment troca uma réplica por vez: sobe o pod novo, espera o readiness aprovar, só então drena um antigo. Se a versão nova reprova nas probes, o rollout congela com 5 réplicas velhas atendendo — e um comando volta tudo. O deploy vira não-evento.",
          tradeoff:
            "A garantia é tão boa quanto as probes: readiness superficial aprova versão quebrada e o rollout 'bem-sucedido' derruba produção. Escrever probes honestas é parte do deploy, não acessório.",
        },
        {
          titulo: "Black Friday sem provisionar para o pico o ano todo",
          cenario:
            "O tráfego normal pede 4 réplicas; o pico de promoção pede 40. Manter 40 o ano inteiro custa dez vezes mais; subir na mão durante o pico é apostar que alguém estará acordado.",
          aplicacao:
            "O autoscaler (HPA) observa CPU e fila e ajusta as réplicas entre 4 e 40 sozinho — sobe conforme a demanda chega, desce quando passa. O cluster agenda os pods novos onde há espaço; se os nodes acabam, o autoscaler de nodes pede mais máquinas ao provedor.",
          tradeoff:
            "Autoscaling mal calibrado oscila (sobe-desce em loop) ou reage tarde demais para picos em degrau — e o teto de custo agora é dinâmico, o que o financeiro vai querer entender.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "Kubernetes para três serviços",
          texto:
            "Um cluster é um sistema distribuído complexo que você passa a operar: upgrades, certificados, rede, RBAC. Para meia dúzia de containers com tráfego modesto, um PaaS ou um Docker Compose num VPS entrega o mesmo resultado por uma fração do custo cognitivo. O k8s se paga em escala de serviços e de equipe — não antes.",
        },
        {
          titulo: "Liveness probe que mente",
          texto:
            "Liveness que checa o banco transforma indisponibilidade de dependência em massacre de pods: o banco cai, todos os livenesses falham, o k8s reinicia tudo em loop — e o banco continua fora. Liveness responde 'estou travado?'; readiness responde 'posso atender agora?'. Confundir os dois é o incidente clássico.",
        },
        {
          titulo: "Pods sem requests e limits",
          texto:
            "Sem declarar quanto de CPU e memória o pod precisa, o scheduler aloca no escuro e o runtime não protege os vizinhos: um vazamento de memória num serviço derruba o node e leva os inocentes junto. Requests e limits são o contrato mínimo de convivência.",
        },
        {
          titulo: "Mudança de produção via kubectl e memória",
          texto:
            "O ajuste aplicado na mão ('só aumentei as réplicas') e nunca commitado vive até a próxima aplicação dos manifestos — que o desfaz silenciosamente. Se o git não é a fonte da verdade, ninguém sabe mais o que produção deveria ser.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Muitos serviços, muitas equipes, deploys frequentes — o caso que justifica orquestração.",
        "Necessidade real de autoscaling e rollout gradual com rollback automático.",
        "Preferencialmente gerenciado (EKS/GKE/AKS) — operar o plano de controle é trabalho de time de plataforma.",
      ],
      evitar: [
        "Projetos pequenos — PaaS ou VPS com Compose resolvem por uma fração da complexidade.",
        "Times sem apetite operacional: o cluster não se administra sozinho.",
        "Workloads com estado pesado sem experiência — bancos em k8s são um capítulo avançado à parte.",
      ],
    },
  ],
};
