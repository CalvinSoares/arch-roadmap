# Planejamento — Plataforma (contas, DB, gamificação)

> De **site estático de conteúdo** para **produto com contas, progresso persistente
> e gamificação** — sem perder o que faz o projeto ser bom: conteúdo curado,
> versionado e testado, e a filosofia "vazio na chegada" (o site funciona sem login).

---

## 1. Em que pé o sistema está hoje

Diagnóstico honesto do ponto de partida:

| Camada | Estado atual |
|---|---|
| **Backend** | **Nenhum.** Zero `route.ts`, zero `middleware.ts`, zero API. |
| **Banco de dados** | **Nenhum.** Conteúdo é registry estático em TypeScript (`src/content/**`). |
| **Autenticação** | **Nenhuma.** Não há usuários, sessão nem identidade. |
| **Estado do usuário** | Só `localStorage`, por dispositivo: progresso de roadmap, desempenho do quiz, agenda de estudo. Efêmero, não sincroniza, some ao trocar de navegador. |
| **Deploy** | Next 16 (App Router), essencialmente estático/SSR. `.env.local` só guarda a URL do site. |
| **Testes** | 1214 testes (vitest), fortíssimos em validação de conteúdo. Nenhum de integração/servidor. |

**Tradução:** a base de conteúdo é excelente e madura; a base de *produto* (contas,
retenção, social) não existe. O que você pede é construir essa segunda metade —
sem quebrar a primeira.

Um detalhe que joga a favor: você já está escrevendo o **conteúdo de auth/segurança**
(autenticação, JWT, OAuth2, MFA, autorização, CORS, cookie httpOnly). Ou seja, o app
vai **ensinar** exatamente os mecanismos que vai **usar**. Isso é ouro — dá pra
fazer o produto ser um exemplo vivo do que ele ensina (dogfooding).

---

## 2. A tese (5 princípios que decidem o resto)

Antes de escolher tecnologia, os princípios que evitam os erros caros:

1. **Conteúdo continua em Git; só dado de usuário vai pro banco.** O catálogo,
   roadmaps, comparações e entrevistas são *código* — curados, revisados, validados
   por teste, versionados. Migrá-los pro DB jogaria fora todo o pipeline de qualidade.
   O banco guarda **usuários e o que eles fazem** (progresso, XP, social). A
   gamificação **referencia** o conteúdo por `slug` estável (já há teste de
   estabilidade de slug — ele vira contrato).

2. **Login é acréscimo, não portão.** O anônimo continua usando tudo com
   `localStorage`; ao logar, o progresso local **migra/mescla** para a conta. A
   filosofia "vazio na chegada" se mantém: a conta enriquece, não bloqueia. Nada de
   muro de login na frente do conteúdo.

3. **Gamificação é autoritativa no servidor.** XP, nível, streak e ranking são
   calculados e validados **no servidor**. O cliente **nunca** reporta "ganhei 500
   XP" — ele reporta a *ação* ("acertei a pergunta X"), e o servidor concede o XP.
   É o erro nº 1 de gamificação (cliente confiável = trapaça trivial).

4. **Toda escrita de pontos é idempotente e com rate limit.** Cada "conceder XP" é
   idempotente (dedup por id de evento) — duplo clique, retry de rede e reprocessamento
   não inflam nada. Rate limit barra farm de XP e abuso de login. **São os próprios
   conceitos que o catálogo ensina** (idempotência, race condition, rate limiting): o
   produto vira a prova viva deles.

5. **O placar de XP é um ledger append-only; nível e stats são projeção.** Em vez de
   uma coluna `xp` mutável (que corre risco de race condition e perde auditoria),
   XP é um **log append-only de eventos** (`xp_events`), e `nível`/`total`/`streak`
   são uma **projeção** (read model) derivada dele. Isso é literalmente Ledger +
   Append-only + CQRS + Idempotência — os conceitos do próprio site. Além de elegante,
   dá auditoria, anti-cheat e reprocessamento de graça.

> **A grande sacada:** modelar a plataforma com os padrões que o site ensina. O
> `xp_events` é o Ledger; `user_stats` é a projeção CQRS; o award idempotente é a
> Idempotência; o rate limit é o token bucket; a corrida de dois XP simultâneos é a
> Race Condition resolvida com escrita atômica. O produto explica a si mesmo.

---

## 3. Arquitetura-alvo (stack recomendada, com alternativas)

Recomendação primária em **negrito**; alternativa e porquê ao lado.

| Peça | Recomendo | Alternativa | Por quê |
|---|---|---|---|
| **Banco** | **Neon Postgres** | Supabase, PlanetScale | Serverless, escala a zero, *branching* (um DB por preview), casa com Vercel/Next. Você já pediu Neon — é a escolha certa. |
| **Acesso a dados** | **Drizzle ORM** | Prisma, Kysely | Type-safe, SQL-first, leve, migrações via `drizzle-kit`, ótimo com o driver serverless da Neon (`drizzle-orm/neon-http`). Prisma é mais pesado em serverless. |
| **Auth** | **Auth.js (NextAuth v5)** ✅ | Better Auth, Clerk | Ubíquo, ecossistema enorme, adapter Drizzle/Neon, sessão httpOnly. **Consequência:** admin/RBAC, 2FA e rate-limit **não vêm na caixa** — viram código nosso. |
| **Provedores de login** | **GitHub OAuth + magic link + email/senha** ✅ | só OAuth | Email/senha via provider `Credentials` — **passamos a ser donos** do hash (argon2id), reset, verificação de e-mail e lockout. Mais escolha pro usuário, mais responsabilidade de segurança. |
| **Rate limit** | **Upstash Redis** (`@upstash/ratelimit`) | Token bucket em Postgres; WAF da Vercel | Sliding window serverless, roda até no edge. Alternativa sem serviço novo: uma tabela `rate_limits` com token bucket (mais lento, mas dogfooda o conceito). |
| **Deploy** | **Vercel** | VPS (o conceito que vocês ensinam!) / Fly.io | Nativo do Next 16, cron embutido, preview por branch. **Atenção:** serverless + Postgres exige *connection pooling* (endpoint pooled da Neon / driver serverless), senão esgota conexão. |
| **Jobs/cron** | **Vercel Cron** | Upstash QStash | Reset de streak, virada de temporada/liga, snapshot de ranking, e-mail de resumo. |
| **E-mail** | **Resend** | Postmark, SES | Magic link + lembretes de streak + recap semanal. |
| **Observabilidade** | Logs estruturados + Sentry | Axiom, Betterstack | Erro no cliente e no servidor; métrica de XP/retention. |

**Regra de ouro do serverless:** funções serverless abrem conexão a cada invocação.
Use o **endpoint pooled da Neon** (ou `@neondatabase/serverless` sobre HTTP) para não
estourar o limite de conexões — é o primeiro bug que aparece em produção.

---

## 4. Modelo de dados (esboço do schema de gamificação)

Tabelas de **auth** (o adapter do Better Auth/Auth.js cria a maioria): `users`,
`sessions`, `accounts`, `verifications`. Sessão via cookie **httpOnly + Secure +
SameSite**.

Tabelas de **produto** (o que a gente desenha):

```
users            (id, handle único, display_name, avatar, role, criado_em,
                  perfil_publico bool, timezone)         -- role: user | admin | moderator

progresso        (user_id, no_id/slug, status, atualizado_em)   -- ex-localStorage do roadmap
quiz_tentativas  (id, user_id, pergunta_ref, conceito_slug, acertou, formato, criado_em)

xp_events        (id [chave de idempotência], user_id, tipo, quantia,
                  origem_ref, criado_em)                 -- LEDGER append-only. Nunca UPDATE.
user_stats       (user_id, xp_total, nivel, streak_dias, maior_streak,
                  ultimo_dia_ativo, atualizado_em)       -- PROJEÇÃO derivada de xp_events

streaks_freeze   (user_id, quantidade)                   -- "congelar" streak (item ganhável)

amizades         (user_id, amigo_id, status)             -- pending | accepted | blocked

temporadas       (id, inicio, fim, ativa)                -- ligas semanais (estilo Duolingo)
liga_membros     (temporada_id, user_id, liga_nivel, xp_na_temporada)  -- bronze→prata→ouro...

missoes          (id, escopo diario|semanal, regra, xp_recompensa)
missao_progresso (user_id, missao_id, progresso, concluida)

conquistas       (id, chave, titulo, criterio)           -- badges
user_conquistas  (user_id, conquista_id, ganho_em)

fases            (id, roadmap_slug, secao_id, ordem, regra_desbloqueio)  -- mapa de "fases"
fase_estado      (user_id, fase_id, desbloqueada, concluida)

notificacoes     (id, user_id, tipo, payload, lida, criado_em)
denuncias        (id, alvo_user_id, autor_id, motivo, status)  -- moderação
```

Notas de modelagem:
- **`xp_events` é append-only** (Ledger/Event Sourcing): `nível = f(soma do XP)`;
  `user_stats` é cache/projeção reconstruível — se der bug, reprocessa o log.
- **`origem_ref` + `id` idempotente:** conceder XP por "acertou pergunta 42 na
  tentativa T" usa uma chave determinística → o mesmo acerto nunca paga duas vezes.
- **Concorrência:** dois awards simultâneos do mesmo usuário → `INSERT` no ledger
  com restrição de unicidade na chave de idempotência (mata a race sem lock).
- **Conteúdo por `slug`:** `conceito_slug`, `roadmap_slug`, `secao_id` apontam para o
  registry estático. **Slug vira contrato** — o teste de estabilidade de slug que já
  existe passa a proteger dados de produção, não só links.

---

## 5. Design da gamificação (o que prende, informado pelo Duolingo)

O que faz gente voltar todo dia — e as armadilhas de cada mecânica:

- **XP por ação:** acertar quiz, concluir nó de roadmap, resolver um "quebre isto",
  bônus da primeira lição do dia. Servidor-autoritativo e idempotente.
- **Níveis:** curva de XP (`nível = threshold(total)`). Simples e previsível.
- **Streak (o motor de retenção):** dias consecutivos ativos, ciente de fuso horário.
  **Streak freeze** ganhável para não punir um dia perdido. É a mecânica que mais
  retém — e a que mais vira *dark pattern* se exagerar (ver §7).
- **Ligas/temporadas semanais (estilo Duolingo):** rankings em tiers
  (bronze→prata→ouro...) com promoção/rebaixamento, **resetados toda semana**.
  Resolve o problema do ranking global eterno (que desmotiva quem nunca alcança o
  topo) e cria re-engajamento semanal. Virada por cron.
- **Fases:** transformar as seções dos roadmaps num **mapa de fases** com desbloqueio
  (conclua X para abrir Y). Os roadmaps já têm ordem e pré-requisitos — a fase é a
  camada de jogo por cima. O *estado* de desbloqueio é por usuário, no DB; o mapa em
  si continua estático.
- **Missões diárias/semanais:** "acerte 5 perguntas", "conclua 1 fase". Objetivos
  curtos que dão direção.
- **Amigos & social:** seguir/adicionar, comparar streak/XP, ranking entre amigos.
  Perfil **opt-in** e público por handle; **bloquear e denunciar** desde o dia 1.
  Social traz moderação e LGPD junto (ver §7) — comece raso.
- **Conquistas/badges:** marcos ("100 acertos", "streak de 30").
- **Anti-cheat:** rate limit + XP idempotente + validação no servidor + detecção de
  anomalia (ex.: 1000 XP/min → flag pro admin). Sem isso, o ranking vira ficção.
- **Notificações/lembretes:** o lembrete de streak é a alavanca de retorno — por
  e-mail (Resend) e, depois, push. Dose com cuidado pra não virar spam.

---

## 6. Fases de entrega (o roadmap do trabalho)

Cada fase é entregável e testável sozinha. Nada de big-bang.

### Fase 0 — Fundações (sem gamificação visível ainda)
- [x] Neon + Drizzle + `drizzle-kit` (migrações) + `.env` e segredos (nunca no cliente).
- [x] Auth (Auth.js v5) com **GitHub OAuth** + email/senha + sessão httpOnly (JWT), rodando na Vercel.
- [x] Camada de API mínima (route handlers / server actions) com **idempotência** e guardas.
- [x] **Rate limiting** (Upstash) no login e nas escritas.
- [x] **Migração local→conta:** ao logar, mescla o `localStorage` (progresso) no DB; anônimo segue com localStorage.
- [x] Conexão pooled (Neon serverless driver) + logging básico.
- [x] **UI de conta no header** — entrar/sair + avatar refletindo a sessão real.

### Fase 1 — Gamificação single-player
- [x] `xp_events` (ledger) + `user_stats` (projeção) + concessão idempotente de XP.
- [x] XP ao acertar quiz e concluir nó; **nível**; **streak** + freeze; **missão diária**.
- [x] Progresso de roadmap e desempenho do quiz passam a ser **da conta** (write-through quando logado; leitura híbrida local+conta).
- [x] Página de perfil (privada) com XP, nível, streak, histórico, missões e conquistas.
- [x] Testes: funções puras (XP/nível/streak/missões/merge) — 1433 testes passando. Idempotência garantida pelo índice único do ledger.

### Fase 2 — Social & competição
- [x] Handles + perfil público **opt-in** (LGPD). Seguir/amizade. Ranking entre amigos.
- [x] **Ligas/temporadas** semanais + cron de virada (`/api/cron` protegido por `CRON_SECRET`) + ranking da liga.
- [x] Conquistas/badges (concessão idempotente). Bloquear/denunciar.

### Fase 3 — Admin & operação
- [x] `/admin` com **RBAC** (`requireAdmin`): gerenciar usuários (papéis, banir), moderar denúncias, controlar temporada (virada manual), dashboard de métricas. (Ajuste da curva de XP fica config-driven em fase futura.)
- [x] Anti-abuso: relatório de anomalia de XP, shadow-ban, integridade de ranking (banido/shadow somem dos rankings e do perfil público).
- [x] E-mails: lembrete de streak (Resend + cron diário, opt-out no perfil). Recap semanal fica para depois.

### Fase 4 — Polimento & escala
- [x] **UI do mapa de fases** (seções viram fases com desbloqueio derivado do progresso — zero tabela nova).
- [x] **Expansão de missões** (pool maior + rotação diária determinística por data).
- [x] **Cosméticos**: feedback visível de XP (toast de ganho + "subiu de nível") quando logado.
- [~] A/B na curva de XP: curva já **config-driven** (`COEF_CURVA` em `xp.ts`, `coef` por parâmetro). Falta atribuição de variante por usuário + sink de analytics (adiado — prematuro sem usuários).
- [x] **backup/DR e testes de carga**: runbook em `docs/operacao.md` + script k6 em `scripts/load-test.js` (procedimentos/artefatos; você roda quando quiser).
- [ ] Push notifications (precisa de VAPID + service worker) e i18n (app é pt-BR, baixo valor) — não construídos.

---

## 7. Preocupações transversais (não são fase — atravessam tudo)

- **Segurança (OWASP):** o conteúdo de auth que você está escrevendo é o checklist do
  próprio produto. Cookie httpOnly/Secure/SameSite, CSRF, rate limit, guards de RBAC,
  segredos só no servidor, nada de token no localStorage.
- **LGPD (usuário no Brasil):** consentimento, exportar/apagar dados, PII mínima,
  perfil público opt-in. Ranking expõe handle → precisa de opt-out. Isto **não** é
  opcional para um produto com contas no Brasil.
- **Fronteira conteúdo × dado:** repita como mantra — conteúdo no Git, usuário na Neon.
  A ligação é por slug estável.
- **Ética da retenção:** você disse "prender as pessoas". O streak e os lembretes
  retêm — mas viram *dark pattern* fácil (ansiedade de streak, notificação abusiva).
  Vale reter com respeito: freeze de streak, lembrete opt-out, sem culpa manipuladora.
  Engajamento saudável dura mais que o predatório.
- **Custo:** Neon, Upstash, Resend e Vercel têm free tier generoso — começa barato.
  O custo cresce com usuários ativos e e-mail; monitore cedo.
- **Testes:** os de conteúdo continuam. Adicione integração para idempotência de XP,
  rate limit e fluxo de auth. Mantenha a lógica de XP/nível/streak em **funções puras**
  (como `desempenho.ts` e `estudo.ts` já são) — testáveis sem DB.

---

## 8. Riscos & armadilhas (o que costuma dar errado)

1. **Transformar conteúdo em linhas de DB.** Perde versionamento e os testes. Não faça.
2. **XP no cliente.** Trapaça trivial. Sempre servidor-autoritativo.
3. **Só ranking global eterno.** Desmotiva. Use temporadas/ligas semanais.
4. **Esgotar conexão do Postgres em serverless.** Use pooling/driver serverless da Neon.
5. **Social sem moderação/LGPD.** Vira passivo jurídico e tóxico. Comece raso, com bloquear/denunciar desde o início.
6. **Scope creep.** Gamificação é um produto inteiro. Faseie sem dó — Fase 1 já entrega valor.
7. **Dark patterns de retenção.** Retção agressiva queima o público. Meça retenção *saudável*.

---

## 9. Decisões travadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Biblioteca de auth | **Auth.js (NextAuth v5)** |
| 2 | ORM | **Drizzle** |
| 3 | Rate limit | **Upstash Redis** |
| 4 | Deploy | **Vercel** |
| 5 | Progresso | **Dual** — local p/ anônimo + servidor p/ logado, merge no login |
| 6 | Social | **Raso** — seguir + ranking de amigos |
| 7 | Login | **GitHub OAuth + magic link + email/senha** |

**Consequência de 1 + 7 (Auth.js com email/senha):** o Auth.js é "só auth" (sessão +
provedores). Entram no **nosso** escopo, como código do produto:
- **Senha:** hash **argon2id**, **reset**, **verificação de e-mail** e **lockout** no
  login — o provider `Credentials` do Auth.js não faz nada disso por você.
- **RBAC/admin:** coluna `role` + guards próprios (não há plugin de admin pronto).
- **2FA/MFA:** adicionar depois (Fase 3+), com TOTP próprio.

Nada disso é bloqueante — só sai da caixa e entra no escopo. E, convenientemente, é
o **conteúdo de auth que vocês já estão escrevendo** (autenticação, JWT, OAuth2, MFA,
autorização): o produto vira o exemplo vivo do que ensina.

---

## 10. Fase 0 detalhada — o que provisionar × o que eu construo

**Você provisiona** (contas externas — só você pode criar; eu não devo digitar
credenciais nem criar contas):

- [ ] Projeto no **Neon** → `DATABASE_URL` (endpoint **pooled**) + `DIRECT_URL` (migrações).
- [ ] **Upstash Redis** → `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- [ ] **GitHub OAuth App** → `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` (callback `/api/auth/callback/github`).
- [ ] **Resend** (magic link + reset) → `RESEND_API_KEY`.
- [ ] `AUTH_SECRET` (gerar: `openssl rand -base64 32`).
- [ ] Projeto na **Vercel** ligado ao repo, com esses env vars.

**Eu construo** (código, sem precisar dos segredos vivos — compila e fica pronto pra
rodar quando o `.env` estiver preenchido):

1. `.env.example` com todas as chaves acima documentadas.
2. Deps: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `next-auth@beta`,
   `@auth/drizzle-adapter`, `@upstash/ratelimit`, `@upstash/redis`, `argon2`.
3. `drizzle.config.ts` + `src/server/db/` (client Neon serverless + schema Drizzle:
   tabelas de auth do adapter + `users.role` + `progresso`).
4. Auth.js v5: `auth.ts` (config), provider **GitHub** + **Email (magic link)** +
   **Credentials** (email/senha com argon2id), adapter Drizzle, sessão httpOnly,
   `middleware.ts` de sessão, rotas `/api/auth/[...nextauth]`.
5. Helper de **rate limit** (Upstash) + wrapper de **idempotência** para escritas.
6. **Migração local→conta:** ao logar, mescla `localStorage` (progresso/desempenho) no DB.
7. Guards de **RBAC** (`requireUser`, `requireAdmin`) para preparar o `/admin`.
8. Funções **puras** de XP/nível/streak (sem DB, testáveis) — no padrão de
   `desempenho.ts`/`estudo.ts` — como base já pronta pra Fase 1.

**Sem bloqueio (posso começar já):** os itens **1** e **8** não dependem de conta
nenhuma. As funções puras de XP/nível/streak e o `.env.example` podem nascer agora,
com testes, enquanto você provisiona o resto.
