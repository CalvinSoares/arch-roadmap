import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Sessao no servidor + cookie httpOnly. O browser guarda o id;
// o JS da pagina NAO le o cookie — XSS nao rouba a sessao assim.
app.post("/login", async (req, res) => {
  const user = await usuarios.autenticar(req.body.email, req.body.senha);
  if (!user) return res.status(401).json({ erro: "credenciais invalidas" });

  const sessao = await sessoes.criar(user.id); // id opaco no Redis/DB
  res.cookie("sid", sessao.id, {
    httpOnly: true,   // inacessivel a document.cookie
    secure: true,     // so HTTPS
    sameSite: "lax",  // mitiga CSRF em navegacao cross-site
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  res.json({ ok: true });
});

// Em cada request: le o cookie, resolve a sessao, anexa o user.
app.use(async (req, _res, next) => {
  const sid = req.cookies.sid;
  req.user = sid ? await sessoes.resolver(sid) : null;
  next();
});`,
  },
];

export const autenticacao: Conceito = {
  slug: "autenticacao",
  titulo: "Autenticação",
  categoria: "seguranca",
  resumo:
    "Autenticação responde *quem você é*: prova de identidade antes de qualquer permissão. Na web, o desenho padrão é sessão no servidor com cookie httpOnly, Secure e SameSite — o token opaco mora fora do alcance do JavaScript da página. Confundir autenticação com autorização, ou guardar a prova de identidade no localStorage, é o caminho mais curto para vazamento e abuso.",
  tags: ["seguranca", "sessao", "cookie", "httpOnly", "login", "identidade"],
  dificuldade: "iniciante",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 1990", ano: 1994, precisao: "aproximada" },
    fonte:
      "Cookies HTTP (Netscape, ~1994) e o modelo de sessão server-side tornaram-se o padrão de autenticação na web; RFC 6265 formalizou cookies depois",
    precursor:
      "Login e senha em mainframes e sistemas multiutilizador — a web só mudou o canal e o armazenamento da prova.",
  },
  ondeAparece: [
    {
      onde: "cookie de sessão httpOnly",
      explicacao:
        "O browser manda o id de sessão; o JS da página não consegue ler o cookie.",
    },
    {
      onde: "Passport / NextAuth / Auth.js",
      explicacao:
        "Bibliotecas que encapsulam estratégias de login e a emissão da sessão.",
    },
    {
      onde: "middleware que anexa req.user",
      explicacao:
        "Depois do login, cada request resolve a sessão e sabe quem está pedindo.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Prova de identidade: sessão + cookie que o JS não lê.
res.cookie("sid", id, { httpOnly: true, secure: true, sameSite: "lax" });`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Estado de sessão no servidor (ou store compartilhado) para cada usuário autenticado",
      "Cookies exigem cuidado com CSRF; tokens no cliente exigem cuidado com XSS — não há desenho de graça",
    ],
    naoValeSe:
      "o recurso é público de verdade e não há identidade a provar — autenticar aí só cria atrito e superfície de ataque.",
  },
  relacionados: ["jwt", "oauth2", "autorizacao", "mfa", "rate-limiting"],
  problema: [
    "Sem prova de identidade, qualquer um pode agir em nome de outro. Com prova mal guardada — token no localStorage, cookie sem flags — um XSS ou um request forjado rouba a conta.",
    "Misturar “está logado?” com “pode fazer X?” empurra regras de permissão para o lugar errado e deixa buracos onde o login passou mas a ação não deveria.",
  ],
  solucao: [
    "Separar autenticação (quem é) de autorização (o que pode). Provar identidade uma vez, emitir uma credencial de sessão curta e difícil de roubar.",
    "Preferir cookie httpOnly + Secure + SameSite com id opaco no servidor; se usar bearer token, tratar XSS e refresh como parte do desenho, não como detalhe.",
  ],
  quandoUsar: [
    "Qualquer superfície em que ações dependam de uma identidade confiável.",
    "APIs e apps web que precisam de login, logout e sessão revogável.",
  ],
  quandoEvitar: [
    "Endpoints públicos sem identidade (documentação, health check).",
    "Como substituto de autorização — login não é permissão.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Autenticação prova quem você é. Na web, o desenho seguro padrão é sessão no servidor com cookie httpOnly/Secure/SameSite — o JavaScript da página não lê a prova. Não confundir com autorização; não guardar a sessão onde XSS alcança.",
    },
    {
      tipo: "analogia",
      emoji: "🪪",
      titulo: "A carteira na portaria",
      texto:
        "A portaria confere o documento e te dá um crachá. O crachá não é a lista do que você pode abrir — só diz que a portaria já te reconheceu. Perder o crachá no bolso da calça (cookie httpOnly) é diferente de grudá-lo na testa (localStorage).",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Provar identidade sem entregar a chave",
      resumo: [
        "O atacante não precisa da senha se puder roubar ou forjar a prova de que o login já aconteceu.",
        "Cookie legível por JS, token eterno e ausência de logout real transformam um XSS pontual em sequestro de conta.",
      ],
      extensao: [
        "Sessão server-side com id opaco: o valor no cookie não carrega claims; revogar é apagar a linha no store. JWT e afins deslocam estado para o cliente — útil em escala, mas a revogação e o lugar de armazenamento passam a ser o problema central.",
        "SameSite mitiga CSRF em muitos fluxos; para cookies em APIs cross-site, anti-CSRF explícito ainda importa. Secure impede vazamento em HTTP claro.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "Login web clássico",
          cenario:
            "Um painel admin precisa de login com senha, logout imediato e sessão que expire ao fechar o expediente.",
          aplicacao:
            "Sessão no Redis, cookie httpOnly com maxAge de 8h, logout apaga a sessão no servidor.",
          tradeoff:
            "Réplicas da API precisam do mesmo store de sessão — um cookie sticky sozinho não escala.",
        },
        {
          titulo: "XSS que não rouba a sessão",
          cenario:
            "Uma biblioteca de analytics injeta script que lê document.cookie em páginas vulneráveis.",
          aplicacao:
            "Com httpOnly, o sid não aparece; o atacante ainda pode agir *pelo* browser da vítima, mas não extrai o cookie para outro dispositivo.",
          tradeoff:
            "httpOnly não substitui corrigir XSS — só reduz o que o roubo consegue levar embora.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Token no localStorage",
          texto:
            "Qualquer XSS lê localStorage. Cookie httpOnly não é lido por JS; é o default que a maior parte dos apps web deveria usar.",
        },
        {
          titulo: "Achar que login = permissão",
          texto:
            "Autenticado não significa admin. Autorização (roles, guards) é outro conceito — e outro lugar no código.",
        },
        {
          titulo: "Sessão eterna sem revogação",
          texto:
            "Sem expiração e sem logout de verdade (só apagar cookie no cliente), um notebook perdido continua autenticado para sempre.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Sessão com cookie httpOnly",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Apps e APIs que precisam saber quem está pedindo.",
        "Quando logout e revogação importam (painel, conta bancária, admin).",
      ],
      evitar: [
        "Recursos públicos sem identidade.",
        "Como único controle de acesso a ações privilegiadas.",
      ],
    },
  ],
};
