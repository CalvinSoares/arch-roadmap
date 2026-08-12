import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Ruim: segredo no repo e no log.
const dbUrl = "postgres://app:S3nhaNoGit@db/prod"; // nunca

// Melhor: injetado no runtime a partir de um cofre / secret store.
// A app pede o segredo por nome; o cofre autentica a identidade da carga
// (role IAM, service account) e devolve o valor — com rotacao.
async function segredo(nome: string): Promise<string> {
  const r = await fetch(\`\${VAULT_ADDR}/v1/secret/data/\${nome}\`, {
    headers: { "X-Vault-Token": await identidadeDaCarga() },
  });
  if (!r.ok) throw new Error(\`cofre: \${r.status}\`);
  const body = await r.json();
  return body.data.data.value as string;
}

// Rotacao: o cofre gera nova senha do banco; a app recarrega sem rebuild.
// Auditoria: quem leu qual segredo fica no log append-only do cofre.`,
  },
];

export const gestaoDeSegredos: Conceito = {
  slug: "gestao-de-segredos",
  titulo: "Gestão de segredos",
  categoria: "seguranca",
  resumo:
    "Senhas de banco, chaves de API e tokens de assinatura não pertencem ao Git nem a `.env` commitado. Gestão de segredos é guardar, injetar, rotacionar e auditar essas credenciais — cofres (Vault, Secrets Manager, Doppler) e identidade da carga no lugar de senhas eternas em variáveis soltas. Sem isso, um leak do repositório ou de um dump de env compromete produção inteira.",
  tags: ["seguranca", "segredos", "vault", "credenciais", "rotacao"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2015, precisao: "aproximada" },
    fonte:
      "HashiCorp Vault (2015) e serviços gerenciados (AWS Secrets Manager, GCP Secret Manager) popularizaram cofre + rotação em cloud-native",
    precursor:
      "Cofres físicos, HSM e o princípio de não embutir senha no código-fonte.",
  },
  ondeAparece: [
    {
      onde: "HashiCorp Vault / AWS Secrets Manager",
      explicacao:
        "Cofres que entregam segredos sob identidade e registram quem leu.",
    },
    {
      onde: "secrets do Kubernetes",
      explicacao:
        "Injeção de credenciais no pod — ainda precisa de RBAC e, de preferência, backend externo.",
    },
    {
      onde: "OIDC da CI para a cloud",
      explicacao:
        "Pipeline troca identidade federada por credenciais de curta duração, sem access key no repo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Segredo por nome, identidade da carga — não hardcoded.
const dbUrl = await segredo("prod/db/url");`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Operar ou pagar um cofre; boot da app passa a depender dele (cache local ajuda)",
      "Rotação exige clientes que recarreguem credencial sem downtime",
    ],
    naoValeSe:
      "é um protótipo local sem dado real — aí `.env` gitignored basta; o problema começa quando há produção e time.",
  },
  relacionados: ["append-only", "api-gateway", "autorizacao", "autenticacao"],
  problema: [
    "Segredos no Git, em issues, em logs e em imagens Docker vazam e não expiram sozinhos.",
    "A mesma senha de banco por anos sobrevive a demissões e forks do repositório.",
  ],
  solucao: [
    "Centralizar segredos num cofre; apps e CI autenticam por identidade e leem sob demanda.",
    "Rotacionar com prazo; auditar leituras; nunca logar valores; escopo mínimo por serviço.",
  ],
  quandoUsar: [
    "Qualquer ambiente compartilhado ou produção com credenciais reais.",
    "Quando há várias tecnologias e várias chaves circulando na pilha.",
  ],
  quandoEvitar: [
    "Como teatro: copiar o segredo do cofre para um `.env` no servidor e esquecer rotação.",
    "Protótipo single-dev sem dado sensível — complexidade sem benefício.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Segredos fora do Git: cofre, identidade da carga, rotação e auditoria. `.env` commitado e chaves eternas são o incidente esperando o clone. Kubernetes Secret sem RBAC e sem backend externo ainda é frágil.",
    },
    {
      tipo: "analogia",
      emoji: "🗄️",
      titulo: "O cofre do hotel",
      texto:
        "Ninguém cola a senha do cofre no elevador (repo). O hóspede prova quem é na recepção (identidade da carga) e só então abre o compartimento. Trocar a senha do cofre (rotação) não exige reformar o prédio.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Credenciais que vazam e não envelhecem",
      resumo: [
        "O repositório é o maior canal de vazamento interno. Logs e crash dumps vêm em segundo.",
        "Sem rotação, o vazamento de ontem continua válido amanhã.",
      ],
      extensao: [
        "Prefira credenciais de curta duração (IAM roles, tokens OIDC da CI) a access keys estáticas. O cofre emite senha de banco com TTL e renova.",
        "Append-only no audit log do cofre responde “quem leu o segredo X?” — essencial em incidente.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "Chave de Stripe no GitHub",
          cenario:
            "Um `.env.example` virou `.env` commitado com a chave live.",
          aplicacao:
            "Revogar na hora; secret scanning no CI; segredo só no cofre/plataforma.",
          tradeoff:
            "Onboarding um pouco mais lento (acesso ao cofre) em troca de não repetir o incidente.",
        },
        {
          titulo: "Dez serviços, dez senhas no mesmo `.env`",
          cenario:
            "Monólito virou microsserviços; todos ainda leem o mesmo arquivo de ambiente do host.",
          aplicacao:
            "Um segredo por serviço no cofre; policy por identidade; rotação independente.",
          tradeoff:
            "Mais policies para manter — o preço de não compartilhar a chave-mestra.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Segredo no log",
          texto:
            "Logar headers `Authorization` ou o body do cofre anula o isolamento. Redacte.",
        },
        {
          titulo: "Rotação sem o cliente acompanhar",
          texto:
            "Trocar a senha no banco e esquecer as apps em cache eterno gera outage. Planeje reload.",
        },
        {
          titulo: "Um token de cofre para todos",
          texto:
            "Se todas as apps usam o mesmo token root, o cofre é só um `.env` remoto. Identidade e policy por serviço.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Ler segredo por identidade",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Produção e qualquer credencial real.",
        "Pilhas com várias techs e várias chaves.",
      ],
      evitar: [
        "Teatro sem rotação nem identidade.",
        "Protótipo local sem dado sensível.",
      ],
    },
  ],
};
