import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Schema do banco (Neon Postgres) — apenas **dado de usuário**.
 *
 * O conteúdo (conceitos, roadmaps, comparações) continua estático em Git; aqui
 * moram só usuários e o que eles fazem. A gamificação referencia o conteúdo por
 * slug/id estável (o teste de estabilidade de slug vira contrato).
 *
 * As quatro primeiras tabelas seguem o formato esperado pelo adapter Drizzle do
 * Auth.js (user/account/session/verificationToken). `hashed_password` e `role`
 * são acréscimos nossos: senha (provider Credentials) e RBAC.
 */

export const papelUsuario = pgEnum("papel_usuario", ["user", "moderator", "admin"]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // ——— acréscimos do produto ———
  /** Hash argon2id — só para login por email/senha; nulo em contas OAuth. */
  hashedPassword: text("hashed_password"),
  role: papelUsuario("role").notNull().default("user"),
  /** @-handle público, único quando definido. */
  handle: text("handle"),
  perfilPublico: boolean("perfil_publico").notNull().default(false),
  timezone: text("timezone"),
  // ——— moderação / operação (Fase 3) ———
  /** Banido: não loga e some dos rankings/perfil público. */
  banido: boolean("banido").notNull().default(false),
  /** Shadow-ban: usa o app normalmente, mas some do ranking dos outros. */
  shadowBan: boolean("shadow_ban").notNull().default(false),
  /** Opt-out de e-mails de lembrete (ética da retenção / LGPD). */
  lembretesEmail: boolean("lembretes_email").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("user_handle_uq").on(t.handle)]);

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

/* ——————————————————————— Produto ——————————————————————— */

/**
 * Progresso por nó de roadmap / conceito — substitui o `localStorage`.
 * `no_id` aponta para um id de nó de roadmap ("be-http") ou slug de conceito.
 */
export const progresso = pgTable(
  "progresso",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noId: text("no_id").notNull(),
    status: text("status").notNull(), // pending | done | in-progress | skipped
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.noId] })]
);

/**
 * Ledger de XP — **append-only**. Nunca se dá UPDATE aqui.
 *
 * `origem_ref` é a **chave de idempotência**: "quiz:<attemptId>",
 * "no:<roadmap>:<noId>", etc. O índice único nela mata a race condition de
 * dois awards simultâneos (o segundo INSERT falha em vez de pagar de novo).
 * É a Idempotência + o Ledger + a escrita atômica que o próprio catálogo ensina.
 */
export const xpEvents = pgTable(
  "xp_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // AcaoXP: quizAcerto | noConcluido | ...
    quantia: integer("quantia").notNull(),
    origemRef: text("origem_ref").notNull(),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("xp_events_origem_ref_uq").on(t.origemRef)]
);

/**
 * Projeção (read model) derivada de `xp_events` + atividade diária.
 * Reconstruível a partir do ledger — se der bug, reprocessa. É o CQRS na prática.
 */
export const userStats = pgTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  xpTotal: integer("xp_total").notNull().default(0),
  nivel: integer("nivel").notNull().default(1),
  streakDias: integer("streak_dias").notNull().default(0),
  maiorStreak: integer("maior_streak").notNull().default(0),
  /** ISO YYYY-MM-DD da última atividade. */
  ultimoDiaAtivo: text("ultimo_dia_ativo"),
  freezes: integer("freezes").notNull().default(0),
  atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
});

/**
 * Tentativas do quiz — o histórico de acerto/erro por conceito, agora na conta
 * (supera o `localStorage`-only). O `id` é gerado no cliente por resposta e
 * vira a **chave de idempotência** do award de XP (`quiz:<id>`): retry de rede
 * não paga duas vezes, mas respostas distintas contam cada uma.
 */
export const quizTentativas = pgTable(
  "quiz_tentativas",
  {
    id: text("id").primaryKey(), // uuid gerado no cliente (chave idempotente)
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conceitoSlug: text("conceito_slug").notNull(),
    acertou: boolean("acertou").notNull(),
    formato: text("formato"), // formato da pergunta, quando disponível
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (t) => [index("quiz_tentativas_user_idx").on(t.userId)]
);

/**
 * Progresso de missões por dia — as missões em si são estáticas (definidas em
 * `shared/lib/gamificacao/missoes.ts`, referenciadas por chave). A projeção de
 * quanto o usuário avançou em cada uma, no dia, mora aqui. PK composta garante
 * uma linha por (usuário, missão, dia).
 */
export const missaoProgresso = pgTable(
  "missao_progresso",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    missaoId: text("missao_id").notNull(),
    /** ISO YYYY-MM-DD do dia da missão (missões diárias reiniciam por data). */
    dia: text("dia").notNull(),
    progresso: integer("progresso").notNull().default(0),
    concluida: boolean("concluida").notNull().default(false),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.missaoId, t.dia] })]
);

/* ————————————————————— Fase 2 — Social & competição ————————————————————— */

export const statusAmizade = pgEnum("status_amizade", [
  "pending",
  "accepted",
  "blocked",
]);

export const nivelLiga = pgEnum("nivel_liga", [
  "bronze",
  "prata",
  "ouro",
  "diamante",
  "mestre",
]);

export const statusDenuncia = pgEnum("status_denuncia", [
  "aberta",
  "resolvida",
  "descartada",
]);

/**
 * Amizades — **direcionadas**. `(userId → amigoId)` com um estado. Um convite de
 * A para B é `(A, B, pending)`; ao aceitar, viram duas linhas `accepted` (A→B e
 * B→A), o que torna "meus amigos" uma consulta simples por `userId`. `blocked`
 * mora do lado de quem bloqueou. Moderação (bloquear/denunciar) desde o dia 1.
 */
export const amizades = pgTable(
  "amizades",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amigoId: text("amigo_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: statusAmizade("status").notNull().default("pending"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.amigoId] }),
    index("amizades_amigo_idx").on(t.amigoId),
  ]
);

/**
 * Temporadas — ligas semanais (estilo Duolingo). Só uma fica `ativa`; a virada
 * (por cron) fecha a atual, promove/rebaixa e abre a próxima. O ranking global
 * eterno desmotiva; a temporada reinicia a corrida toda semana.
 */
export const temporadas = pgTable("temporadas", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  inicio: timestamp("inicio").notNull().defaultNow(),
  fim: timestamp("fim"),
  ativa: boolean("ativa").notNull().default(true),
});

/**
 * Membros de uma temporada e o XP acumulado **na temporada** (zera a cada
 * virada — separado do `xp_total` vitalício de `user_stats`). O tier
 * (bronze→mestre) sobe/desce conforme o ranking no fim da semana.
 */
export const ligaMembros = pgTable(
  "liga_membros",
  {
    temporadaId: text("temporada_id")
      .notNull()
      .references(() => temporadas.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nivel: nivelLiga("nivel").notNull().default("bronze"),
    xpNaTemporada: integer("xp_na_temporada").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.temporadaId, t.userId] }),
    index("liga_membros_rank_idx").on(t.temporadaId, t.nivel),
  ]
);

/**
 * Conquistas ganhas. As **definições** dos badges são estáticas
 * (`shared/lib/gamificacao/conquistas.ts`, referenciadas por `chave`); aqui só
 * mora o "fulano ganhou tal badge quando". PK composta = idempotência natural
 * (não ganha o mesmo badge duas vezes).
 */
export const userConquistas = pgTable(
  "user_conquistas",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conquistaChave: text("conquista_chave").notNull(),
    ganhoEm: timestamp("ganho_em").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.conquistaChave] })]
);

/**
 * Denúncias de moderação. Social sem moderação vira passivo — bloquear/denunciar
 * desde o início. O admin (Fase 3) resolve; aqui é só o registro.
 */
export const denuncias = pgTable("denuncias", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  alvoUserId: text("alvo_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  autorId: text("autor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  motivo: text("motivo").notNull(),
  status: statusDenuncia("status").notNull().default("aberta"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});
