import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Num VPS, quem mantém seu app vivo é o systemd — e o app precisa cooperar:
// porta por env, log em stdout (o journald coleta) e SIGTERM tratado.
import http from "node:http";

const porta = Number(process.env.PORT ?? 3000);

const servidor = http.createServer((req, res) => {
  console.log(JSON.stringify({ rota: req.url, em: Date.now() })); // -> journalctl
  res.writeHead(200).end("ok");
});

// Só na interface local: quem fala com a internet é o Nginx (proxy reverso),
// que cuida de TLS e esconde a porta interna atrás do firewall.
servidor.listen(porta, "127.0.0.1", () =>
  console.log(\`app interno em 127.0.0.1:\${porta}\`)
);

process.on("SIGTERM", () => servidor.close(() => process.exit(0)));

/* A unidade do systemd que segura tudo (/etc/systemd/system/app.service):
   [Service]
   ExecStart=/usr/bin/node /srv/app/dist/main.js
   Environment=PORT=3000
   Restart=always          # caiu -> volta, inclusive às 3h da manhã
   User=app                # nunca root
   [Install]
   WantedBy=multi-user.target

   E o Nginx na frente:
   server {
     listen 443 ssl;
     location / { proxy_pass http://127.0.0.1:3000; }
   }
*/`,
  },
];

export const vps: Conceito = {
  slug: "vps",
  titulo: "VPS — o servidor na sua mão",
  categoria: "infra",
  resumo:
    "Uma fatia virtual de um servidor físico, com root, IP público e nenhuma opinião: você instala, configura, protege e opera tudo. É o chão que explica os andares de cima — container, orquestrador e PaaS são abstrações disto aqui.",
  tags: ["servidor", "deploy", "linux", "ssh", "hospedagem"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  relacionados: ["docker", "kubernetes"],
  problema: [
    "Em PaaS e serverless, o servidor existe mas é invisível — até o dia em que o preço, um limite da plataforma ou um requisito de rede te encurrala. Sem entender o que a plataforma faz por você, não dá para decidir quando vale pagar por ela nem operar o que vive fora dela.",
  ],
  solucao: [
    "Alugue a máquina crua e monte o essencial uma vez na vida: processo sob systemd, Nginx como proxy reverso com TLS, firewall fechado, backup testado. O checklist é curto, o aprendizado é permanente — e o custo é uma fração fixa e previsível.",
  ],
  quandoUsar: [
    "Projetos com custo fixo baixo e controle total — side projects, MVPs, ferramentas internas.",
    "Quando requisitos de rede/software não cabem nas opiniões de um PaaS.",
  ],
  quandoEvitar: [
    "Times sem ninguém para fazer o papel de operador — atualização e plantão são seus.",
    "Cargas com picos violentos que pedem escala automática.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Um pedaço virtual de servidor com root e IP público: liberdade total, responsabilidade total. Deploy, TLS, firewall, backup e plantão são seus. É o modelo mais barato e mais educativo de rodar software — e a base conceitual de todos os outros.",
    },
    {
      tipo: "analogia",
      emoji: "🏠",
      titulo: "Casa alugada, não quarto de hotel",
      texto:
        "PaaS é quarto de hotel: arrumadeira, recepção, manutenção — tudo incluso na diária, tudo nas regras do hotel. VPS é casa alugada vazia: você escolhe cada móvel e ninguém reclama da furadeira às 23h — mas fechadura, vazamento e conta de luz são problema seu. O aluguel é mais barato; o seu tempo é a diferença.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Por que ainda começar por aqui",
      resumo: [
        "Tudo que roda 'na nuvem' roda num servidor de verdade em algum lugar — um processo, atrás de um proxy, num Linux com firewall. PaaS, container e serverless empilham abstrações sobre exatamente isso. Quem nunca montou o de baixo opera os de cima no escuro: não sabe o que a plataforma cobra para esconder, nem consertar quando a abstração vaza.",
        "E há o caso pragmático: para um side project, um bot, um app interno de baixo tráfego, o VPS de R$ 30–50/mês com tudo dentro (app, banco, cache) bate qualquer conta de PaaS — desde que alguém pague o custo real, que é atenção.",
      ],
      extensao: [
        "A anatomia mínima de produção num VPS: o app como serviço do systemd (reinicia sozinho, loga no journald), Nginx na frente fazendo TLS e proxy reverso para a porta interna, firewall liberando só 22/80/443, SSH por chave com senha desabilitada, atualizações de segurança automáticas e backup — do que dói perder — testado com restauração de verdade.",
        "O passo seguinte natural é rodar containers no VPS: o Docker Compose vira seu 'orquestrador de uma máquina só', e o servidor deixa de acumular instalações artesanais. É meio caminho honesto entre o metal e o Kubernetes — e para uma máquina, costuma ser o ponto final ideal.",
      ],
    },
    {
      tipo: "ilustracao",
      arquetipo: "fluxo",
      atores: [
        { id: "usuario", label: "Usuário" },
        { id: "nginx", label: "Nginx (TLS)" },
        { id: "app", label: "App (systemd)", destaque: true },
        { id: "banco", label: "Postgres local" },
      ],
      setas: [
        { label: "HTTPS :443" },
        { label: "proxy_pass 127.0.0.1:3000" },
        { label: "socket local", tracejada: true },
      ],
      legenda:
        "O caminho de uma request no VPS clássico: só o Nginx encara a internet; app e banco vivem em portas internas que o firewall nem expõe.",
    },
    {
      tipo: "camadas-nav",
      titulo: "As três responsabilidades da máquina",
      camadas: [
        {
          id: "borda",
          titulo: "Borda",
          curto: "Nginx, TLS e firewall — a única porta para a rua",
          detalhe:
            "O proxy reverso termina o TLS (certificado gratuito, renovação automática), comprime, e repassa para a porta interna. O firewall nega tudo por padrão e abre só 22, 80 e 443. SSH por chave, senha desabilitada, e de preferência fail2ban vigiando a porta 22 — os bots chegam em minutos, não em dias.",
          seViolar:
            "app exposto direto na porta pública = sem TLS decente, sem limite de conexão, e cada CVE do seu runtime vira porta de entrada.",
        },
        {
          id: "processo",
          titulo: "Processo",
          curto: "systemd mantém o app de pé — não um terminal aberto",
          detalhe:
            "Uma unidade de serviço declara o comando, o usuário (nunca root), as variáveis e Restart=always. O journald coleta os logs sem você gerenciar arquivo. App que roda 'num screen que o estagiário abriu' morre no primeiro reboot do provedor.",
          exemplo: "Restart=always\nUser=app\nEnvironment=PORT=3000",
          seViolar:
            "sem supervisor, todo crash exige um humano notar e reconectar — e o reboot de manutenção do provedor vira downtime até alguém acordar.",
        },
        {
          id: "disco",
          titulo: "Disco e backup",
          curto: "o que dói perder, testado de verdade",
          detalhe:
            "Banco com dump diário para fora da máquina (o backup que mora no mesmo disco morre junto), uploads sincronizados para um object storage, e — crucial — restauração ensaiada: backup não testado é uma esperança, não um plano.",
          seViolar:
            "descobrir que o dump estava corrompido no dia em que o disco morreu é o modo mais caro de aprender esta camada.",
        },
      ],
    },
    { tipo: "codigo", exemplos: EXEMPLOS },
    {
      tipo: "casos",
      casos: [
        {
          titulo: "Side project a custo de pizza",
          cenario:
            "Um SaaS de nicho com 200 usuários: API em Node, Postgres, Redis e um cron de relatórios. No PaaS, cada peça é uma linha na fatura; o total passa de R$ 400/mês antes do primeiro cliente pagar.",
          aplicacao:
            "Um VPS de 4 GB roda tudo via Docker Compose por R$ 60/mês: Nginx com TLS na frente, deploy por git pull + compose up, dump do banco toda madrugada para um bucket. O projeto sobrevive ao vale da validação sem sangrar caixa.",
          tradeoff:
            "Sem redundância: a máquina é um ponto único de falha, e o 'time de infra' é você no domingo. O upgrade de porte envolve migração planejada, não um slider.",
        },
        {
          titulo: "Ferramenta interna atrás de IP fixo",
          cenario:
            "Um painel interno precisa consumir a API de um parceiro que só libera acesso por allowlist de IP — e o PaaS da empresa troca de IP de saída sem avisar.",
          aplicacao:
            "O painel vai para um VPS com IP fixo, que entra na allowlist do parceiro uma única vez. O firewall restringe o acesso de entrada à VPN da empresa, e o systemd + Nginx cuidam do resto — infraestrutura estável, previsível e barata para um problema que era de rede, não de escala.",
          tradeoff:
            "Nasce mais uma máquina fora do guarda-chuva da plataforma oficial: patches, monitoração e inventário agora incluem esse servidor — o 'servidor esquecido' é um clássico de auditoria de segurança.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      itens: [
        {
          titulo: "O servidor floco de neve",
          texto:
            "Três anos de ajustes por SSH sem registro e a máquina vira única no universo: ninguém sabe reproduzi-la, e migrar é arqueologia. Anote cada passo num script ou README versionado — ou use containers e deixe o Dockerfile ser a memória.",
        },
        {
          titulo: "Segurança adiada para depois do MVP",
          texto:
            "Um IP público novo recebe scans em minutos. Senha de SSH habilitada, Postgres escutando em 0.0.0.0, painel sem TLS: cada um é um convite. A higiene mínima — chave SSH, firewall negando por padrão, atualizações automáticas — leva uma hora e não é opcional.",
        },
        {
          titulo: "Backup no mesmo disco (ou nunca testado)",
          texto:
            "Dump diário gravado na própria máquina protege contra DELETE errado, não contra disco morto, ransomware ou conta suspensa. Backup de verdade mora em outro lugar e é restaurado de tempos em tempos como ensaio — a restauração é o produto; o dump é só o meio.",
        },
        {
          titulo: "Esquecer que o plantão é seu",
          texto:
            "Sem SLA de plataforma, o uptime é uma função da sua atenção: kernel sem patch, disco enchendo, certificado vencendo em silêncio. Monitoração externa simples (um ping de fora + alerta de disco) transforma surpresas de sábado em tarefas de terça.",
        },
      ],
    },
    {
      tipo: "quando",
      usar: [
        "Side projects, MVPs e ferramentas internas onde custo fixo baixo importa.",
        "Requisitos que PaaS não atende: IP fixo, software exótico, rede peculiar.",
        "Como aprendizado — operar uma máquina ensina o que as abstrações escondem.",
      ],
      evitar: [
        "Produto com SLA sério e time sem operador — a economia do VPS evapora no primeiro incidente.",
        "Cargas elásticas com picos de 10× — escala manual não chega a tempo.",
        "Dados sensíveis sob compliance pesado sem maturidade de segurança — o gerenciado herda certificações que você teria que construir.",
      ],
    },
  ],
};
