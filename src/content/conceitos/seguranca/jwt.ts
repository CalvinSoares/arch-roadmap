import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `import { SignJWT, jwtVerify } from "jose";

// Access curto + refresh longo. O access viaja no Authorization;
// o refresh mora em cookie httpOnly — nao no localStorage.
const access = await new SignJWT({ sub: userId, roles: ["user"] })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(chave);

// Verificar: rejeitar alg "none", checar exp, e NAO confiar em claims
// que o cliente inventou. A assinatura e a chave sao a prova.
async function autenticarBearer(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const { payload } = await jwtVerify(token, chave, { algorithms: ["HS256"] });
  return { id: String(payload.sub), roles: payload.roles as string[] };
}`,
  },
];

export const jwt: Conceito = {
  slug: "jwt",
  titulo: "JWT",
  categoria: "seguranca",
  resumo:
    "JSON Web Token é um formato de credencial assinada: o servidor (ou o IdP) embute claims e uma assinatura, e quem recebe verifica sem necessariamente consultar um store de sessão. Útil para APIs e SSO — perigoso quando vira “auth completo” com token eterno no localStorage, algoritmo `none`, ou sem plano de refresh e revogação.",
  tags: ["seguranca", "jwt", "token", "bearer", "claims", "oauth"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2015", ano: 2015, precisao: "exata" },
    fonte:
      "RFC 7519 (JSON Web Token) foi publicada em maio de 2015 pelo JWT Working Group da IETF",
    precursor:
      "Tickets assinados e cookies de sessão — o JWT desloca o estado para um payload verificável no cliente.",
  },
  ondeAparece: [
    {
      onde: "Authorization: Bearer …",
      explicacao:
        "O header padrão de APIs que carregam um access token JWT em cada chamada.",
    },
    {
      onde: "jwt.io / bibliotecas jose",
      explicacao:
        "Ferramentas e libs que assinam e verificam tokens — o playground não é o desenho de produção.",
    },
    {
      onde: "access + refresh do OAuth",
      explicacao:
        "Access JWT curto; refresh opaco ou JWT longo, de preferência em cookie httpOnly.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Claims assinadas, vida curta — verificar assinatura e exp.
const { payload } = await jwtVerify(token, chave);`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Revogação imediata é difícil: o token vale até expirar, a menos que haja denylist ou rotação de chave",
      "Claims grandes incham cada request; chaves e algoritmos mal configurados abrem buracos clássicos",
    ],
    naoValeSe:
      "você precisa de logout imediato e sessão centralizada simples — cookie de sessão opaca costuma ser mais honesto.",
  },
  relacionados: ["autenticacao", "oauth2", "autorizacao", "api-gateway"],
  problema: [
    "Sessão server-side escala mal entre muitos serviços se cada um precisa consultar o store a cada request. Quer-se uma prova verificável localmente.",
    "Sem disciplina, o JWT vira um saco de dados confidenciais no cliente, sem expiração útil e sem verificação correta da assinatura.",
  ],
  solucao: [
    "Emitir JWT com claims mínimas, assinatura forte, `exp` curto; refresh separado e bem guardado.",
    "Verificar sempre com allowlist de algoritmos; nunca confiar no header `alg` que o cliente manda sem restrição.",
  ],
  quandoUsar: [
    "APIs e microsserviços que precisam validar identidade sem round-trip ao store a cada hop.",
    "Fluxos OAuth/OIDC em que o IdP emite access tokens padrão.",
  ],
  quandoEvitar: [
    "Como único mecanismo com logout instantâneo obrigatório e sem infraestrutura de revogação.",
    "Para guardar segredos ou PII volumosa no payload — JWT não é cofre.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "JWT é credencial assinada com claims e prazo. Bom para APIs e SSO; ruim como desculpa para token eterno no localStorage. Access curto, verificação com algoritmos fixos, refresh fora do alcance do XSS.",
    },
    {
      tipo: "analogia",
      emoji: "🎟️",
      titulo: "O ingresso com holograma",
      texto:
        "O ingresso traz nome, setor e validade impressos, com um holograma difícil de forjar. A catraca olha o holograma e a data — não liga para a bilheteria a cada pessoa. Mas se alguém fotografa o ingresso (copia o token), usa até vencer; rasgar na saída (logout) não invalida a foto.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Estado no cliente, confiança na assinatura",
      resumo: [
        "O valor do JWT é verificar sem round-trip. O preço é carregar claims e aceitar a janela até o `exp`.",
        "Bibliotecas permissivas e `alg: none` já quebraram sistemas reais — a verificação é parte do produto.",
      ],
      extensao: [
        "Access de minutos + refresh rotativo é o padrão moderno. Refresh em cookie httpOnly reduz roubo via XSS; access em memória no SPA também ajuda.",
        "Não coloque permissões mutáveis e sensíveis só no JWT sem revalidar: um admin demovido continua admin até o token expirar.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "API entre serviços",
          cenario:
            "O gateway valida o JWT uma vez e passa identidade aos serviços internos.",
          aplicacao:
            "Access 15min, audience/issuer checados, roles lidas com cautela para decisões críticas.",
          tradeoff:
            "Revogar um token comprometido exige denylist ou esperar o exp — planeje o TTL.",
        },
        {
          titulo: "SPA que guardava JWT no localStorage",
          cenario:
            "Um XSS em um widget de chat exfiltra o access token e o atacante chama a API de outro país.",
          aplicacao:
            "Migrar refresh para cookie httpOnly; access só em memória; CSP e sanitização.",
          tradeoff:
            "Fluxo um pouco mais complexo (refresh silencioso) em troca de não entregar a chave ao XSS.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Confiar no alg do header",
          texto:
            "Atacante manda `alg: none` ou troca RS256 por HS256 com a chave pública. Fixe a allowlist de algoritmos na verificação.",
        },
        {
          titulo: "Access eterno",
          texto:
            "Token de 30 dias no localStorage é sessão roubável. TTL curto + refresh.",
        },
        {
          titulo: "JWT = autenticação completa",
          texto:
            "JWT é formato de credencial. Login, MFA, sessão e autorização continuam sendo problemas à parte.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Assinar e verificar com algoritmo fixo",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "APIs e federação onde verificação local importa.",
        "Access tokens de OAuth/OIDC com vida curta.",
      ],
      evitar: [
        "Logout imediato sem denylist e sem TTL curto.",
        "Payload com segredos ou dados que mudam a cada minuto.",
      ],
    },
  ],
};
