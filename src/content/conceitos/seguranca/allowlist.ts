import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Allowlist: so o que esta na lista passa. Blocklist: tudo passa,
// exceto o que esta na lista — e a lista nunca esta completa.

const ORIGENS_OK = new Set([
  "https://app.exemplo.com",
  "https://admin.exemplo.com",
]);

function corsAllowlist(origin: string | undefined): string | null {
  if (origin && ORIGENS_OK.has(origin)) return origin;
  return null; // nao refletir Origin arbitrario
}

// IP allowlist na borda (admin, webhooks de parceiro conhecido).
const IPS_ADMIN = new Set(["203.0.113.10", "198.51.100.7"]);

function soIpsConhecidos(ip: string): boolean {
  return IPS_ADMIN.has(ip);
}

// Redirect URI no OAuth: allowlist EXATA — nunca prefixo aberto.
function redirectPermitido(uri: string, cadastrados: string[]) {
  return cadastrados.includes(uri);
}`,
  },
];

export const allowlist: Conceito = {
  slug: "allowlist",
  titulo: "Allowlist",
  categoria: "seguranca",
  resumo:
    "Allowlist (lista de permissão) só deixa passar o que foi explicitamente aprovado — origens CORS, IPs de admin, redirect URIs, hosts de webhook. É o oposto da blocklist, que tenta enumerar o mal e sempre atrasa. Não substitui autenticação nem rate limiting: é um corte cedo por identidade de rede ou de origem, não por volume nem por papel de usuário.",
  tags: ["seguranca", "allowlist", "whitelist", "cors", "borda", "waf"],
  dificuldade: "iniciante",
  tempoLeitura: 6,
  nasceu: {
    quando: { rotulo: "anos 1990+", ano: 1990, precisao: "aproximada" },
    fonte:
      "O princípio default-deny / allowlist é clássico em firewalls e controle de acesso; a web o reencontrou em CORS, CSP e OAuth redirect URIs",
    precursor:
      "Firewalls default-deny: negar tudo e abrir só o necessário.",
  },
  ondeAparece: [
    {
      onde: "CORS Access-Control-Allow-Origin",
      explicacao:
        "Só origens cadastradas — refletir qualquer Origin é open redirect de CORS.",
    },
    {
      onde: "redirect_uri do OAuth",
      explicacao:
        "O IdP só devolve o code para URIs exatamente registradas no client.",
    },
    {
      onde: "IP allowlist de admin / VPC",
      explicacao:
        "Painéis e bancos só aceitam tráfego de redes conhecidas.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Default deny: só o que está na lista.
if (!ORIGENS_OK.has(origin)) return res.status(403).end();`,
  },
  custo: {
    indirecoes: 0,
    cobra: [
      "Manter a lista atualizada (novos frontends, VPNs, parceiros)",
      "NAT e IPs dinâmicos quebram allowlist de IP cedo demais",
    ],
    naoValeSe:
      "o público é a internet inteira autenticada — allowlist de IP não escala; use auth e rate limit.",
  },
  relacionados: ["rate-limiting", "oauth2", "api-gateway", "autenticacao"],
  problema: [
    "Blocklists nunca cobrem o próximo atacante. Refletir Origin ou redirect aberto entrega o canal ao adversário.",
    "Superfícies administrativas expostas à internet inteira dependem só de senha — um corte de rede reduz a superfície.",
  ],
  solucao: [
    "Default deny: enumerar o permitido (origens, IPs, URIs, hosts) e rejeitar o resto cedo na borda.",
    "Combinar com autenticação e rate limiting — allowlist é camada, não produto de segurança completo.",
  ],
  quandoUsar: [
    "CORS, OAuth redirects, webhooks de parceiro com IP fixo, painéis admin internos.",
    "CSP e allowlists de hosts em integrações server-side (SSRF).",
  ],
  quandoEvitar: [
    "Como único controle em API pública global.",
    "Blocklist disfarçada de segurança (“bloqueamos os IPs ruins”).",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Allowlist = default deny + lista do que pode. Use em CORS, redirects OAuth e IPs de admin. Não confunda com rate limiting (volume) nem com RBAC (papel). Blocklist quase sempre atrasa o atacante, não o impede.",
    },
    {
      tipo: "analogia",
      emoji: "📋",
      titulo: "Lista do casamento",
      texto:
        "Na festa fechada, só entra quem está na lista. Tentar listar “todas as pessoas indesejadas do mundo” (blocklist) é absurdo: a lista cresce e o próximo desconhecido passa. Allowlist é curta e explícita.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Negar o resto",
      resumo: [
        "O erro clássico é `Access-Control-Allow-Origin: *` ou ecoar o Origin do request.",
        "Allowlist de IP falha atrás de NAT corporativo e com clientes móveis — escolha a dimensão certa (origem web ≠ IP).",
      ],
      extensao: [
        "Rate limiting corta por volume; allowlist corta por identidade de origem. Os dois se complementam no login e na borda.",
        "Em SSRF, allowlist de hosts/esquemas que o servidor pode buscar é tão crítica quanto auth na API pública.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "CORS do SPA",
          cenario:
            "API aceitava qualquer Origin e o cookie de sessão vazava para um site malicioso via XHR.",
          aplicacao:
            "Allowlist das origens do produto; credenciais só nessas.",
          tradeoff:
            "Preview deploys (URL dinâmica) precisam de padrão controlado ou auth sem cookie cross-site.",
        },
        {
          titulo: "Webhook do parceiro",
          cenario:
            "Qualquer um podia POST no endpoint de webhook se descobrisse a URL.",
          aplicacao:
            "Allowlist de IPs do parceiro + assinatura HMAC (defesa em profundidade).",
          tradeoff:
            "Parceiro mudou de IP sem avisar — monitoramento e canal de atualização da lista.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Refletir Origin",
          texto:
            "`Allow-Origin: <o que veio no request>` é allowlist falsa. Compare com um Set fixo.",
        },
        {
          titulo: "Prefixo aberto em redirect",
          texto:
            "`https://exemplo.com` permitindo `https://exemplo.com.evil.com` — compare string exata ou parse de URL rigoroso.",
        },
        {
          titulo: "Achar que allowlist = auth",
          texto:
            "IP na lista não prova o usuário. Continua precisando de autenticação e autorização.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Origens e redirects fechados",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "CORS, OAuth redirect, admin por rede, SSRF egress.",
        "Webhooks com origem de rede conhecida.",
      ],
      evitar: [
        "API pública global como único controle.",
        "Blocklist como estratégia principal.",
      ],
    },
  ],
};
