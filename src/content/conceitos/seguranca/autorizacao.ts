import type { Conceito } from "@/shared/types/conceito";

const EXEMPLOS = [
  {
    lang: "typescript" as const,
    code: `// Autenticacao coloca req.user. Autorizacao decide a acao.
// Guard/middleware: role ou permissao explicita — nao so "tem user".

type Role = "user" | "editor" | "admin";

function requireRoles(...roles: Role[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ erro: "nao autenticado" });
    if (!roles.some((r) => req.user.roles.includes(r))) {
      return res.status(403).json({ erro: "proibido" });
    }
    next();
  };
}

// Rota sensivel: precisa ser editor OU admin.
app.delete("/posts/:id", requireRoles("editor", "admin"), apagarPost);

// IDOR: alem do role, o recurso precisa pertencer ao user (ou admin).
async function apagarPost(req: any, res: any) {
  const post = await posts.byId(req.params.id);
  if (!post) return res.status(404).end();
  const dono = post.authorId === req.user.id;
  const admin = req.user.roles.includes("admin");
  if (!dono && !admin) return res.status(403).end();
  await posts.apagar(post.id);
  res.status(204).end();
}`,
  },
];

export const autorizacao: Conceito = {
  slug: "autorizacao",
  titulo: "Autorização (RBAC e guards)",
  categoria: "seguranca",
  resumo:
    "Autorização responde *o que você pode fazer* depois de autenticado. RBAC (roles) e guards/middleware — Nest guards, Next middleware, Express — concentram a decisão perto da rota ou do caso de uso. “Tem `req.user`” não é autorização; IDOR e checagem só no front são as falhas clássicas.",
  tags: ["seguranca", "rbac", "roles", "guard", "middleware", "403"],
  dificuldade: "intermediario",
  tempoLeitura: 8,
  nasceu: {
    quando: { rotulo: "anos 1990–2000", ano: 1996, precisao: "aproximada" },
    fonte:
      "RBAC foi formalizado em pesquisas NIST/Ferraiolo nos anos 1990; frameworks web popularizaram guards/filters em seguida",
    precursor:
      "Listas de controle de acesso (ACL) em sistemas de arquivos e mainframes.",
  },
  ondeAparece: [
    {
      onde: "Guards do NestJS",
      explicacao:
        "CanActivate que roda antes do handler e decide 401/403 por role ou policy.",
    },
    {
      onde: "middleware do Express / Next",
      explicacao:
        "Cadeia que inspeciona a sessão e barra a rota antes da lógica de negócio.",
    },
    {
      onde: "IAM roles / policies",
      explicacao:
        "A mesma ideia na nuvem: identidade autenticada + permissões explícitas por ação.",
    },
  ],
  emUmaLinha: {
    lang: "typescript",
    code: `// Autenticado ≠ autorizado. Role (ou policy) na porta.
if (!req.user.roles.includes("admin")) return res.status(403).end();`,
  },
  custo: {
    indirecoes: 1,
    cobra: [
      "Modelar roles/permissões e mantê-las alinhadas ao produto",
      "Guards demais espalhados sem política central viram inconsistência",
    ],
    naoValeSe:
      "todo usuário autenticado pode tudo da mesma forma — aí autenticação basta e roles são teatro.",
  },
  relacionados: [
    "autenticacao",
    "jwt",
    "chain-of-responsibility",
    "proxy",
    "api-gateway",
  ],
  problema: [
    "Depois do login, endpoints sensíveis ficam abertos a qualquer identidade autenticada.",
    "Checar permissão só no UI esconde o buraco: a API continua aceitando a chamada direta.",
  ],
  solucao: [
    "Declarar quem pode cada ação (RBAC, ABAC, ACL) e enforcement no servidor — guard/middleware perto da rota ou policy no domínio.",
    "Separar 401 (não autenticado) de 403 (autenticado sem permissão). Validar dono do recurso além do role quando houver dados por usuário.",
  ],
  quandoUsar: [
    "Sempre que ações ou dados diferem por papel (admin, editor, dono).",
    "APIs multi-tenant e painéis com privilégios.",
  ],
  quandoEvitar: [
    "Como substituto de autenticação — sem identidade, role não cola.",
    "Roles inventadas no cliente sem enforcement no servidor.",
  ],
  exemplos: EXEMPLOS,
  blocos: [
    {
      tipo: "tldr",
      texto:
        "Autorização decide o que a identidade autenticada pode fazer. RBAC + guards no servidor; 401 ≠ 403; nunca confiar só no front. IDOR é falha de autorização, não de login.",
    },
    {
      tipo: "analogia",
      emoji: "🚪",
      titulo: "Crachá e salas",
      texto:
        "O crachá na entrada (autenticação) não abre o cofre. Cada porta tem uma lista de quem entra (autorização). Olhar pela janela se a porta “parece” trancada (UI) não tranca a porta.",
    },
    {
      tipo: "secao",
      id: "problema",
      titulo: "Quem pode, de verdade",
      resumo: [
        "A pergunta certa é por ação e por recurso: este user pode apagar *este* post?",
        "Guards são Chain of Responsibility na borda da rota: cada elo pode barrar.",
      ],
      extensao: [
        "RBAC escala bem com poucos papéis estáveis. Quando a regra depende de atributo (horário, tenant, valor), ABAC/policies evitam explosão de roles.",
        "JWT com `roles` no claim acelera a checagem, mas roles revogadas no banco só somem no próximo token — para admin demovido, revalide ou use TTL curto.",
      ],
    },
    {
      tipo: "casos",
      titulo: "Como isso aparece na prática",
      casos: [
        {
          titulo: "Painel com admin e suporte",
          cenario:
            "Suporte pode ler tickets; só admin apaga usuários.",
          aplicacao:
            "Roles no user; `requireRoles('admin')` nas rotas destrutivas; auditoria append-only nas ações admin.",
          tradeoff:
            "Suporte pressiona por mais poder — resista a virar tudo admin; crie permissões finas.",
        },
        {
          titulo: "IDOR na API de pedidos",
          cenario:
            "`GET /pedidos/123` devolvia qualquer pedido se o user estivesse logado.",
          aplicacao:
            "Além do guard de autenticação, filtrar `where userId = req.user.id` (ou admin).",
          tradeoff:
            "Queries um pouco mais verbosas; testes de autorização passam a ser obrigatórios.",
        },
      ],
    },
    {
      tipo: "armadilhas",
      titulo: "Onde isto dá errado",
      itens: [
        {
          titulo: "Guard que só checa `user != null`",
          texto:
            "Isso é autenticação disfarçada. Qualquer conta válida passa — inclusive a do atacante recém-criada.",
        },
        {
          titulo: "Autorização só no frontend",
          texto:
            "Esconder o botão não esconde o endpoint. O enforcement é no servidor.",
        },
        {
          titulo: "403 e 401 trocados",
          texto:
            "401 = autentique-se; 403 = você não pode. Clientes e caches se comportam diferente — não misture.",
        },
      ],
    },
    {
      tipo: "codigo",
      titulo: "Roles + dono do recurso",
      exemplos: EXEMPLOS,
    },
    {
      tipo: "quando",
      usar: [
        "Ações e dados que diferem por papel ou dono.",
        "APIs expostas a mais de um tipo de usuário.",
      ],
      evitar: [
        "Antes de haver autenticação sólida.",
        "Só no cliente, sem a mesma regra no servidor.",
      ],
    },
  ],
};
