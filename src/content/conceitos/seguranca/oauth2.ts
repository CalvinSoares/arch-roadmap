import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Authorization Code + PKCE (SPA / mobile). Nunca o fluxo implícito.
// 1) App gera code_verifier e code_challenge (S256).
// 2) Redireciona o usuario ao IdP com client_id, redirect_uri, challenge.
// 3) IdP autentica (e MFA) e devolve ?code=...
// 4) App troca code + verifier por tokens no token endpoint (back-channel).

async function trocarCodigo(code: string, verifier: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch(TOKEN_URL, { method: "POST", body });
  if (!res.ok) throw new Error("token exchange falhou");
  return res.json(); // access_token, refresh_token?, id_token?
}`,
  },
];

export const oauth2: Conceito = {
  slug: "oauth2",
  titulo: "OAuth 2.0",
  categoria: "seguranca",
  resumo:
    "OAuth 2.0 é delegação de acesso: um cliente obtém autorização para agir em nome do usuário sem ver a senha dele. O fluxo moderno é Authorization Code com PKCE; o implícito morreu. OIDC acrescenta identidade (id_token) em cima. Inventar “OAuth caseiro” com senha no body de um SPA costuma ser pior que sessão clássica bem feita.",
  tags: ["seguranca", "oauth", "oidc", "idp", "pkce", "delegacao"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "2012", ano: 2012, precisao: "exata" },
    fonte:
      "RFC 6749 (OAuth 2.0) foi publicada em outubro de 2012; PKCE (RFC 7636) em 2015; OIDC Core em 2014",
    precursor:
      "OAuth 1.0a e o problema de “dar a senha do Twitter ao app de terceiros”.",
  },
  ondeAparece: [
    {
      onde: "Login with Google / GitHub",
      explicacao:
        "O botão de SSO que redireciona ao IdP e volta com autorização — sem a senha no seu form.",
    },
    {
      onde: "Auth0, Keycloak, Cognito",
      explicacao:
        "Identity providers que implementam OAuth/OIDC para você não operar o protocolo na mão.",
    },
    {
      onde: "escopos read:email / offline_access",
      explicacao:
        "O pedido explícito do que o cliente poderá fazer em nome do usuário.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Código no front, tokens no back-channel — com PKCE.
grant_type=authorization_code&code=…&code_verifier=…`,
  },
  custo: {
    indirecoes: 2,
    cobra: [
      "Operar ou integrar um IdP, redirect URIs, rotação de secrets de client confidential",
      "Debugging de redirect, state/nonce e escopos é mais caro que um login local bem feito",
    ],
    naoValeSe:
      "só há um app seu, sem terceiros nem SSO — sessão própria com autenticação sólida costuma bastar.",
  },
  relacionados: ["autenticacao", "jwt", "mfa", "api-gateway"],
  problema: [
    "Apps de terceiros não devem receber a senha do usuário. APIs não devem espalhar credenciais entre clientes.",
    "SPAs e mobile não guardam client secret com segurança — o protocolo precisa de PKCE.",
  ],
  solucao: [
    "Authorization Code (+ PKCE para clientes públicos): o usuário autentica no IdP; o cliente troca um código de curta duração por tokens.",
    "Escopos mínimos; state/nonce contra CSRF/replay; OIDC quando a pergunta é “quem é” além de “pode chamar a API”.",
  ],
  quandoUsar: [
    "SSO, login social, ou APIs que apps de terceiros consomem em nome do usuário.",
    "Quando vários produtos da empresa compartilham a mesma identidade.",
  ],
  quandoEvitar: [
    "Como maquiagem para mandar senha do form direto a um endpoint “oauth” inventado.",
    "Fluxo implícito ou password grant em cliente público.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "OAuth 2 delega acesso sem compartilhar senha. Use Authorization Code + PKCE; trate OIDC quando precisar de identidade. Não reinvente o protocolo nem use fluxo implícito.",
    },
    {
      tipo: "analogia",
      emoji: "🔑",
      titulo: "A chave do hotel, não a do apartamento",
      texto:
        "Você não entrega a chave de casa ao estacionamento — pede um cartão temporário só para o hall. OAuth é o cartão com escopo e prazo; a senha continua só com o hotel (IdP).",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Delegar sem vazar a senha",
      resumo: [
        "Terceiros e SPAs não são lugar para senha nem para client secret.",
        "O código de autorização é de uso único e curto; tokens vêm no canal que o browser menos expõe.",
      ],
      extensao: [
        "OIDC = OAuth + id_token e UserInfo. Para “Login with X”, você quer OIDC; para “app acessa minha planilha”, OAuth com escopos basta.",
        "Client confidential (backend) usa secret; client público (SPA/mobile) usa PKCE. Misturar os dois é a origem de muitos bugs de segurança.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "SSO da empresa",
          cenario:
            "Três produtos internos precisam do mesmo login corporativo e MFA do IdP.",
          aplicacao:
            "Keycloak/Entra como IdP; cada app é client OIDC com redirect allowlisted.",
          tradeoff:
            "Dependência do IdP: se ele cai, o login cai — prepare status e cache de sessão já estabelecida.",
        },
        {
          titulo: "App mobile acessando API",
          cenario:
            "O app não pode embutir client secret; deep link recebe o code.",
          aplicacao:
            "PKCE + claim de redirect; refresh com rotação; access curto.",
          tradeoff:
            "Interception de custom URL schemes exige cuidado (app links / verified links).",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Password grant / senha no SPA",
          texto:
            "O cliente pede usuário e senha e chama o token endpoint. Isso não é OAuth moderno — é phishing caseiro com branding OAuth.",
        },
        {
          titulo: "Redirect URI aberta",
          texto:
            "Permitir `*` ou redirects não registrados entrega o code ao atacante. Allowlist exata.",
        },
        {
          titulo: "Ignorar state e nonce",
          texto:
            "Sem state, CSRF no callback; sem nonce no OIDC, replay do id_token.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Troca do code com PKCE",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "SSO, login social, APIs para terceiros.",
        "Identidade centralizada entre produtos.",
      ],
      evitar: [
        "App único sem IdP e sem terceiros — sessão local bem feita.",
        "Fluxos depreciados (implícito, password).",
      ],
    },
  ],
};
