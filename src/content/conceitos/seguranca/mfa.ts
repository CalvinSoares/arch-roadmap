import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// TOTP (RFC 6238): segredo compartilhado + relogio. O app authenticator
// gera 6 digitos; o servidor verifica com janela de 1 passo (±30s).
import { verifySync } from "otplib";

function checarTotp(secret: string, codigo: string, agora = Date.now()) {
  const ok = verifySync({ token: codigo, secret, epoch: agora }).valid;
  if (!ok) throw new Error("codigo MFA invalido");
}

// Fluxo: senha OK -> desafio MFA -> so entao emite sessao.
// Backup codes de uso unico para quando o telefone morre.
async function login(email: string, senha: string, totp?: string) {
  const user = await usuarios.verificarSenha(email, senha);
  if (!user) return { status: 401 as const };
  if (user.mfaAtivo) {
    if (!totp) return { status: 401 as const, mfaRequired: true };
    checarTotp(user.mfaSecret, totp);
  }
  return { status: 200 as const, sessao: await sessoes.criar(user.id) };
}`,
  },
];

export const mfa: Conceito = {
  slug: "mfa",
  titulo: "MFA / 2FA",
  categoria: "seguranca",
  resumo:
    "Autenticação multifator exige mais de uma prova independente — tipicamente algo que você sabe (senha) e algo que você tem (TOTP, chave de segurança). MFA reduz conta tomada por senha vazada; não impede XSS em sessão já aberta, phishing bem feito contra códigos, nem falhas de autorização. Backup codes e recuperação são parte do desenho, não um pós-escrito.",
  tags: ["seguranca", "mfa", "2fa", "totp", "segundo-fator"],
  dificuldade: "intermediario",
  tempoLeitura: 7,
  nasceu: {
    quando: { rotulo: "anos 2010", ano: 2011, precisao: "aproximada" },
    fonte:
      "TOTP (RFC 6238, 2011) popularizou 2FA em apps; chaves FIDO2/WebAuthn consolidaram o segundo fator resistente a phishing depois",
    precursor:
      "Tokens RSA SecurID e cartões de coordenadas bancários — a ideia de “senha + objeto” é anterior à web.",
  },
  ondeAparece: [
    {
      onde: "Google Authenticator / Aegis",
      explicacao:
        "Apps TOTP que geram o código de 6 dígitos a partir do segredo compartilhado.",
    },
    {
      onde: "WebAuthn / passkeys",
      explicacao:
        "Segundo fator (ou fator único) baseado em criptografia no dispositivo, resistente a phishing clássico.",
    },
    {
      onde: "prompt MFA do IdP",
      explicacao:
        "No OAuth/OIDC, o IdP exige o segundo fator antes de devolver o code.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Senha ok não basta: falta o segundo fator.
if (user.mfaAtivo && !totpOk) return { mfaRequired: true };`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Fricção no login e suporte a “perdi o telefone” (backup codes, reset seguro)",
      "SMS como fator é frágil (SIM swap); TOTP/WebAuthn exigem onboarding cuidadoso",
    ],
    naoValeSe:
      "a conta não tem valor a proteger e o custo de suporte supera o risco — MFA em ferramenta interna descartável pode ser teatro.",
  },
  relacionados: ["autenticacao", "oauth2", "autorizacao", "rate-limiting"],
  problema: [
    "Senhas vazam: dumps, phishing, reuso. Um único fator derruba a conta.",
    "Sem recuperação planejada, MFA vira lockout em massa quando o dispositivo some.",
  ],
  solucao: [
    "Exigir segundo fator independente após a senha (ou passkey). Preferir TOTP/WebAuthn a SMS.",
    "Emitir backup codes de uso único; rate-limitar tentativas de MFA; não pular MFA em “dispositivos confiáveis” sem prazo e vínculo forte.",
  ],
  quandoUsar: [
    "Contas com dados sensíveis, admin, pagamento, ou e-mail que reseta outras contas.",
    "Quando o IdP já oferece MFA — ligue e não reimplemente.",
  ],
  quandoEvitar: [
    "Como substituto de correção de XSS/CSRF — MFA não protege sessão já autenticada no browser.",
    "SMS obrigatório como único segundo fator em ambientes com alto risco de SIM swap.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "MFA pede um segundo fator depois da senha (TOTP, chave, passkey). Reduz conta tomada por vazamento de senha; não substitui autorização nem corrige XSS. Planeje backup codes e rate limit no desafio.",
    },
    {
      tipo: "analogia",
      emoji: "🔐",
      titulo: "Porta e cadeado do portão",
      texto:
        "A senha é a chave da porta. O TOTP é o cadeado do portão da frente: quem só tem a chave da porta ainda fica na rua. Mas se alguém já está dentro da casa (sessão roubada no browser), o cadeado do portão não ajuda.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Um fator não basta",
      resumo: [
        "Vazamento de senha é comum; o segundo fator muda a equação para o atacante remoto.",
        "O desenho falha se o “segundo fator” for o mesmo canal (e-mail) que já reseta a senha.",
      ],
      extensao: [
        "Fatores devem ser *independentes*. E-mail OTP quando a conta de e-mail é o alvo não adiciona muita defesa. SMS falha sob SIM swap. WebAuthn amarra ao dispositivo e ao origin.",
        "MFA fatigue: bombardear push até a vítima aceitar. Prefira número de matching ou TOTP/WebAuthn.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "Admin do painel",
          cenario:
            "Contas admin com senha reutilizada de outro site vazado.",
          aplicacao:
            "TOTP obrigatório para role admin; backup codes impressos no onboarding.",
          tradeoff:
            "Mais tickets de “não consigo entrar” — o reset MFA precisa de verificação humana ou identidade forte.",
        },
        {
          titulo: "SSO corporativo",
          cenario:
            "A empresa já exige MFA no IdP; apps internos não devem pedir outro TOTP.",
          aplicacao:
            "Confiar no `amr`/`acr` do OIDC ou na sessão do IdP; não empilhar MFA duplicado.",
          tradeoff:
            "Dependência da política do IdP — se alguém enfraquece lá, todos os apps herdam.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "SMS como único 2FA",
          texto:
            "SIM swap e interceptação de SMS são ataques reais. Use SMS só como fallback, não como padrão.",
        },
        {
          titulo: "Sem rate limit no código",
          texto:
            "Seis dígitos sem bloqueio após N erros viram força bruta. Limite tentativas e a sessão de desafio.",
        },
        {
          titulo: "Achar que MFA fecha o produto",
          texto:
            "IDOR, guards fracos e XSS continuam. MFA protege o login, não a lógica da aplicação.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Login com desafio TOTP",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Contas de alto valor e painéis admin.",
        "Quando o IdP já oferece MFA — ative.",
      ],
      evitar: [
        "Como remendo único de segurança da aplicação.",
        "SMS obrigatório sem alternativa mais forte.",
      ],
    },
  ],
};
