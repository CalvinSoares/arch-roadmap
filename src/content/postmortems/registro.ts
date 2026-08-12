import type { Postmortem } from "@/shared/types/postmortem";

/**
 * Incidentes públicos anotados com os conceitos do catálogo.
 *
 * Critério de entrada: relatório público, causa raiz **estrutural** (não "o
 * fulano errou"), e pelo menos dois conceitos do catálogo que o incidente
 * comprove. Sem os três, é anedota.
 */
export const POSTMORTEMS: Postmortem[] = [
  {
    slug: "aws-s3-2017",
    titulo: "Um comando digitado errado tira metade da internet do ar",
    organizacao: "Amazon Web Services",
    quando: { rotulo: "28 de fevereiro de 2017", ano: 2017, precisao: "exata" },
    fonte:
      "AWS — *Summary of the Amazon S3 Service Disruption in the Northern Virginia (US-EAST-1) Region*, março de 2017",
    impacto:
      "Quase 4 horas de indisponibilidade do S3 em US-EAST-1, derrubando junto uma fração enorme da web que dependia dele.",
    oQueAconteceu: [
      "Um engenheiro autorizado executava um procedimento de rotina para investigar uma lentidão no sistema de cobrança do S3. O comando removia um pequeno número de servidores de um subsistema.",
      "Um parâmetro foi digitado errado, e o comando removeu muito mais servidores do que a intenção — incluindo servidores de dois subsistemas essenciais: o de índice, que guarda os metadados e a localização de todos os objetos, e o de posicionamento, que aloca armazenamento novo.",
      "Sem o subsistema de índice, o S3 não conseguia atender requisições de leitura, escrita ou listagem. E aí veio a parte que transformou o erro em desastre: aqueles subsistemas não eram reiniciados por completo havia anos. O processo de partida precisou rodar do zero, validar a integridade dos metadados, e isso levou horas.",
      "O efeito cascateou de um jeito quase cômico: o próprio painel de status da AWS dependia do S3 na mesma região, e por isso não conseguia mostrar que o S3 estava fora.",
    ],
    linhaDoTempo: [
      { quando: "T+0", texto: "Comando de manutenção executado com o parâmetro errado." },
      {
        quando: "T+~1min",
        texto:
          "Servidores demais são removidos; os subsistemas de índice e de posicionamento perdem capacidade abaixo do mínimo.",
        virada: true,
      },
      { quando: "T+~5min", texto: "S3 passa a recusar requisições em US-EAST-1." },
      { quando: "T+~30min", texto: "Serviços dependentes começam a cair em efeito dominó pela web." },
      { quando: "T+2h48", texto: "Subsistema de índice volta a operar após reinício completo." },
      { quando: "T+3h58", texto: "Operação normal restabelecida." },
    ],
    causaRaiz:
      "A causa raiz não é o typo — é que existia um comando capaz de remover capacidade sem limite, num sistema cujo tempo de recuperação ninguém conhecia porque nunca fora exercitado. O erro humano foi o gatilho; o raio de alcance ilimitado e o reinício não testado foram o incidente.",
    conceitos: [
      {
        slug: "bulkhead",
        porque:
          "Não havia compartimento: um único comando alcançou capacidade suficiente para derrubar o subsistema inteiro. Um teto por operação teria contido o estrago ao tamanho da intenção.",
      },
      {
        slug: "circuit-breaker",
        porque:
          "Os serviços que dependiam do S3 continuaram insistindo durante horas, gastando o próprio prazo em chamadas garantidamente perdidas — e amplificando a carga sobre quem tentava se levantar.",
      },
      {
        slug: "timeout",
        porque:
          "Boa parte dos serviços afetados não caiu por erro do S3, e sim por esgotar pool esperando resposta que não vinha. Lento é pior que morto.",
      },
    ],
    oQueMudou: [
      "A ferramenta de manutenção passou a impedir que a capacidade caia abaixo de um mínimo de segurança, e a remover servidores mais devagar.",
      "Os subsistemas foram particionados em células menores, para que o tempo de recuperação de qualquer uma seja conhecido e curto.",
      "O painel de status foi movido para não depender da região que ele monitora.",
    ],
  },
  {
    slug: "cloudflare-regex-2019",
    titulo: "Uma expressão regular consome 100% da CPU global",
    organizacao: "Cloudflare",
    quando: { rotulo: "2 de julho de 2019", ano: 2019, precisao: "exata" },
    fonte:
      "Cloudflare — *Details of the Cloudflare outage on July 2, 2019*, por John Graham-Cumming",
    impacto:
      "27 minutos de queda global. Todo o tráfego HTTP/HTTPS da rede passou a responder erro 502.",
    oQueAconteceu: [
      "Uma regra nova do firewall de aplicação foi publicada para toda a rede. Ela continha uma expressão regular destinada a detectar scripts maliciosos em requisições.",
      "A expressão tinha um padrão com aninhamento de quantificadores — do tipo `.*.*=.*` — que, diante de certas entradas, faz o motor de regex explorar um número exponencial de caminhos antes de desistir. É o que se chama de retrocesso catastrófico.",
      "Como o firewall roda em cada máquina da borda e a regra foi distribuída globalmente em segundos, todos os núcleos de todos os servidores da rede foram para 100% de CPU quase ao mesmo tempo. Sem CPU sobrando, nada era servido.",
      "A recuperação exigiu desativar globalmente o módulo do firewall — o que só foi possível porque existia um interruptor global para isso.",
    ],
    linhaDoTempo: [
      { quando: "T+0", texto: "Regra nova de firewall publicada globalmente, em poucos segundos." },
      {
        quando: "T+~1min",
        texto:
          "O retrocesso catastrófico leva a CPU a 100% em toda a rede de borda simultaneamente.",
        virada: true,
      },
      { quando: "T+3min", texto: "Tráfego global começa a responder 502." },
      { quando: "T+~14min", texto: "Causa identificada como o módulo de firewall." },
      { quando: "T+27min", texto: "Módulo desativado globalmente; tráfego volta." },
    ],
    causaRaiz:
      "A causa imediata foi a regex. A causa raiz foi o processo de publicação: uma mudança de regra ia de zero a cem por cento da rede em segundos, sem estágio intermediário e sem teto de consumo de CPU por regra. Uma mudança que atinge tudo ao mesmo tempo não tem como falhar pequeno.",
    conceitos: [
      {
        slug: "timeout",
        porque:
          "Não havia prazo para a execução de uma regra. Um limite de tempo por avaliação teria transformado a regex ruim num erro contido, em vez de um consumo ilimitado de CPU.",
      },
      {
        slug: "bulkhead",
        porque:
          "O firewall dividia CPU com o serviço de proxy. Sem teto para o módulo, ele consumiu a capacidade de que todo o resto dependia.",
      },
      {
        slug: "rate-limiting",
        porque:
          "É o mesmo raciocínio aplicado a recurso interno: capacidade é finita, e quem não escolhe o teto deixa a sobrecarga escolher.",
      },
    ],
    oQueMudou: [
      "A publicação de regras passou a ser progressiva, com estágios e observação entre eles.",
      "Foi adicionado limite de CPU por regra, para que uma regra ruim falhe sozinha.",
      "Regexes passaram a ser analisadas em busca de padrões com risco de retrocesso exponencial antes da publicação.",
    ],
  },
  {
    slug: "gitlab-2017",
    titulo: "O `rm -rf` no primário — e os cinco backups que não funcionavam",
    organizacao: "GitLab",
    quando: { rotulo: "31 de janeiro de 2017", ano: 2017, precisao: "exata" },
    fonte:
      "GitLab — *Postmortem of database outage of January 31 2017*, publicado no blog da empresa",
    impacto:
      "Cerca de 6 horas de dados perdidos e 18 horas de indisponibilidade do GitLab.com.",
    oQueAconteceu: [
      "Um pico de carga causado por um raspador levou a réplica do banco a ficar para trás do primário. Um engenheiro trabalhava, de madrugada, para restabelecer a replicação.",
      "Para recriar a réplica do zero, era preciso limpar o diretório de dados dela. O comando foi executado — mas no terminal conectado ao **primário**, não à réplica. Ao perceber, o engenheiro interrompeu em cerca de um segundo; boa parte dos dados já tinha ido.",
      "Aí começou a parte que ficou famosa. Havia cinco mecanismos de recuperação previstos, e nenhum funcionou como esperado: os backups por `pg_dump` falhavam em silêncio por incompatibilidade de versão; os snapshots de disco não estavam habilitados para aquele servidor; o backup para o armazenamento de objetos estava vazio; e assim por diante.",
      "O que salvou foi um snapshot feito por acaso, seis horas antes, por causa de um teste não relacionado. A restauração a partir dele levou a maior parte das 18 horas.",
    ],
    linhaDoTempo: [
      { quando: "T+0", texto: "Pico de carga; a réplica fica para trás do primário." },
      { quando: "T+~2h", texto: "Engenheiro trabalha para recriar a réplica." },
      {
        quando: "T+~2h30",
        texto:
          "O comando de limpeza é executado no terminal do primário. Interrompido em ~1 segundo, tarde demais.",
        virada: true,
      },
      { quando: "T+~3h", texto: "Descobre-se, um a um, que os cinco caminhos de recuperação não servem." },
      { quando: "T+~4h", texto: "Um snapshot acidental de 6 horas antes é localizado." },
      { quando: "T+18h", texto: "Serviço restabelecido, com ~6 horas de dados perdidos." },
    ],
    causaRaiz:
      "O comando errado é o gatilho e é o detalhe menos importante. A causa raiz é que **nenhum dos cinco mecanismos de backup era verificado** — todos falhavam em silêncio havia tempo, e a organização acreditava estar protegida por cinco camadas que não existiam. Backup que não é restaurado periodicamente não é backup: é uma crença.",
    conceitos: [
      {
        slug: "append-only",
        porque:
          "Um log em que nada é sobrescrito é o oposto do que aconteceu: aqui, o estado atual era a única fonte da verdade, e apagá-lo apagou a história junto.",
      },
      {
        slug: "event-sourcing",
        porque:
          "Reconstruir o estado a partir dos eventos é uma estratégia de recuperação por construção — não um processo separado que pode estar quebrado sem ninguém notar.",
      },
      {
        slug: "ledger",
        porque:
          "A disciplina contábil de nunca apagar uma linha, só lançar a contrária, existe justamente porque a destruição de registro é irreversível e a correção precisa ser rastreável.",
      },
    ],
    oQueMudou: [
      "Restaurações passaram a ser testadas de forma automática e periódica — a única prova de que um backup existe.",
      "Alertas foram criados para falha silenciosa dos processos de backup.",
      "Terminais em produção ganharam identificação visual clara do servidor conectado.",
    ],
  },
  {
    slug: "knight-capital-2012",
    titulo: "US$ 440 milhões em 45 minutos por uma flag de código morto",
    organizacao: "Knight Capital Group",
    quando: { rotulo: "1º de agosto de 2012", ano: 2012, precisao: "exata" },
    fonte:
      "SEC — *Administrative Proceeding File No. 3-15570, In the Matter of Knight Capital Americas LLC*, 2013",
    impacto:
      "Cerca de US$ 440 milhões perdidos em 45 minutos. A empresa, líder do setor, foi vendida meses depois.",
    oQueAconteceu: [
      "A Knight ia ativar um sistema novo de roteamento de ordens. O código foi implantado em oito servidores de produção — mas um deles não recebeu a atualização.",
      "O novo código reaproveitava uma flag de configuração que, anos antes, ativava uma funcionalidade chamada Power Peg — um código antigo, morto, que nunca fora removido. Nos sete servidores atualizados, a flag ativava a lógica nova. No oitavo, que continuava com o binário antigo, ela ativava o Power Peg.",
      "Quando o mercado abriu, o servidor desatualizado começou a executar o código morto, comprando e vendendo em volume enorme e sem os limites que a versão nova impunha. Em 45 minutos foram milhões de ordens em 154 papéis.",
      "Durante o incidente, a equipe reverteu a implantação nos servidores — o que espalhou o binário antigo para os outros sete, ampliando o problema em vez de contê-lo.",
    ],
    linhaDoTempo: [
      { quando: "T-7 dias", texto: "Novo código implantado em 7 dos 8 servidores; o oitavo é esquecido." },
      { quando: "T+0", texto: "Mercado abre; a flag é ativada." },
      {
        quando: "T+1min",
        texto:
          "No servidor desatualizado, a flag ativa o Power Peg — código morto sem limites de posição.",
        virada: true,
      },
      { quando: "T+~20min", texto: "A reversão da implantação espalha o binário antigo e piora o quadro." },
      { quando: "T+45min", texto: "Sistemas desligados. Prejuízo de ~US$ 440 milhões." },
    ],
    causaRaiz:
      "Três decisões estruturais se encontraram: código morto mantido no repositório por anos, uma flag de configuração reaproveitada para outro significado, e uma implantação sem verificação de que todos os nós receberam a mesma versão. Nenhuma delas isolada derrubaria a empresa.",
    conceitos: [
      {
        slug: "maquina-de-estados",
        porque:
          "Uma flag que significa coisas diferentes conforme a versão do binário é um estado implícito e ambíguo. Estados nomeados e transições declaradas tornam esse tipo de ambiguidade impossível de expressar.",
      },
      {
        slug: "circuit-breaker",
        porque:
          "Não havia nada observando o comportamento anômalo para interromper automaticamente. Quarenta e cinco minutos é muito tempo para um sistema perceber que está fazendo algo absurdo.",
      },
      {
        slug: "idempotencia",
        porque:
          "A reversão foi tratada como operação segura e não era: aplicá-la espalhou o estado antigo. Operações de recuperação precisam ter efeito previsível quando executadas sob pânico.",
      },
    ],
    oQueMudou: [
      "A SEC usou o caso para reforçar exigências de controle de risco pré-operacional no setor.",
      "Virou o exemplo canônico do custo de código morto e de flags reaproveitadas.",
      "Implantação com verificação de versão em todos os nós passou a ser prática padrão na indústria.",
    ],
  },
];
