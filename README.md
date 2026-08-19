# DevMappa

Plataforma de estudo de design patterns, princípios e arquitetura de software.
Hoje: **79 conceitos**, **5 trilhas**, **16 duelos**, **4 postmortems**, além de
jornada gamificada com XP, streak, ligas e ranking entre amigos.

## Frentes

- **`/conceitos`** — os 23 padrões GoF, SOLID, resiliência, mensageria, dados
  distribuídos, estilos de arquitetura e DDD tático. Cada página tem TL;DR,
  `ondeAparece`, `custo`, `emUmaLinha`, casos de uso e armadilhas. Vários têm
  anti-exemplo e refatoração passo a passo.
- **`/roadmaps`** — Padrões, Backend, Frontend, Arquitetura e *Sistemas que
  aguentam produção*. Trilhas em grafo com pré-requisitos e filtro
  "só o essencial".
- **`/jornada`** — cada roadmap vira uma trilha de fases com lições jogáveis,
  estrelas, baús e revisão. Funciona sem conta; com conta, o progresso
  sincroniza entre dispositivos.
- **`/construtor`** — monte a pilha do seu projeto; o motor critica as escolhas,
  explica por que não sugeriu X, simula a requisição e exporta ADR. Também:
  **`/construtor/desafios`**, **`/construtor/comparar`**,
  **`/construtor/escala`**, **`/construtor/entrevista`**.
- **`/quiz`** — seis formatos de pergunta (armadilha, onde aparece, duelo,
  jeito errado, incidente, explique o erro) com placar de desempenho.
- **`/comparar`** — duelos entre padrões que se confundem, critério a critério.
- **`/postmortems`** — incidentes públicos reais anotados com conceitos do
  catálogo.
- **`/liga`, `/amigos`, `/perfil`** — ligas semanais, ranking entre amigos e
  perfil público com conquistas.
- **`/novidades`** — histórico de entregas.

## Onde fica o quê

- **O que já entrou** — `/novidades` ← `content/novidades/registro.ts`.
- **O que vem depois** — [PLANEJAMENTO.md](./PLANEJAMENTO.md) (conteúdo),
  [PLANEJAMENTO-PLATAFORMA.md](./PLANEJAMENTO-PLATAFORMA.md) (contas e
  gamificação) e [PLANEJAMENTO-JORNADA.md](./PLANEJAMENTO-JORNADA.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Auth.js v5 ·
Drizzle + Neon Postgres · Upstash Redis · React Flow · Mermaid · Shiki ·
dnd-kit · framer-motion · next-themes · Sonner · Radix.

O conteúdo é TypeScript tipado no repo (sem MDX/CMS). O app funciona sem conta:
progresso fica em `localStorage` e compartilhamento é por URL (`?p=<base64>`).
Criar conta adiciona XP, streak, ligas e sincronização — a conta soma, não
bloqueia nada.

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local   # veja as variáveis necessárias no arquivo
pnpm dev                     # http://localhost:3000
pnpm build
pnpm test
```

Sem as variáveis de banco/auth o site estático funciona normalmente; login,
XP e ranking precisam de `DATABASE_URL`, `AUTH_SECRET` e afins (documentado
no `.env.example`).

`pnpm test` roda Vitest unitário (`node`) e de UI (`happy-dom` + Testing
Library).

### Testes

- **unit** (`*.spec.ts`) — motor do construtor, conteúdo, quiz, pré-requisitos,
  gamificação (XP, streak, missões, ligas)
- **ui** (`*.spec.tsx`) — smoke do Quiz

Barra de qualidade do conteúdo: TL;DR, casos, armadilhas, `ondeAparece`,
`custo`, `emUmaLinha`, links íntegros e slugs válidos no Construtor.

## Estrutura

```
src/
├── app/(app)/
│   ├── conceitos/ · roadmaps/ · jornada/ · construtor/
│   ├── quiz/ · comparar/ · postmortems/ · novidades/
│   └── liga/ · amigos/ · perfil/ · admin/
├── content/          # conteúdo tipado (conceitos, trilhas, quiz…)
├── server/           # server actions, auth, db, gamificação
└── shared/
    ├── components/ · context/ · hook/ · lib/ · config/ · types/ · utils/
```

Motor do construtor, simulador e toda a lógica de gamificação são funções
puras, testadas sem React nem banco.

## Deploy (Vercel)

Importar o repo e configurar as variáveis do `.env.example` no projeto.
`NEXT_PUBLIC_SITE_URL` define canônico e OG (sem barra no final). Os crons de
liga e lembretes estão em `vercel.json`.
