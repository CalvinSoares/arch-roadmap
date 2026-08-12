# DevMappa

Sistema de **estudo e visualização** (front-only) de design patterns, princípios
e arquitetura. Hoje: **79 conceitos**, **5 trilhas**, **16 duelos**, **4
postmortems**.

## Frentes

- **`/conceitos`** — os **23 GoF**, **SOLID**, resiliência, mensageria, dados
  distribuídos, estilos de arquitetura e DDD tático. Em **todos**: TL;DR,
  `ondeAparece`, `custo`, `emUmaLinha`, casos e armadilhas. Vários têm
  anti-exemplo e refatoração passo a passo.
- **`/roadmaps`** — Padrões, Backend, Frontend, Arquitetura e *Sistemas que
  aguentam produção*, com conectores, **pré-requisitos** (grafo) e filtro
  **só o essencial**.
- **`/construtor`** — monte a pilha; o motor critica, explica por que não
  sugeriu X, simula a requisição e exporta ADR. Também:
  **`/construtor/desafios`**, **`/construtor/comparar`**,
  **`/construtor/escala`**, **`/construtor/entrevista`**.
- **`/quiz`** — seis formatos (armadilha, onde aparece, duelo, jeito errado,
  incidente, explique o erro) + placar de desempenho.
- **`/comparar`** — duelos critério a critério.
- **`/postmortems`** — incidentes públicos anotados com conceitos do catálogo.
- **`/novidades`** — histórico de entregas e “A seguir”.

## Onde fica o quê

- **O que já entrou** — `/novidades` ← `content/novidades/registro.ts`
  (histórico, badge “novo”, A seguir).
- **O que vem depois** — [PLANEJAMENTO.md](./PLANEJAMENTO.md). Tese: crescer
  **por dentro**. O plano de conteúdo está em grande parte entregue; o resto é
  expansão sob demanda (mais duelos, mais explique-erro).

## Stack

Next.js 16 (App Router, SSG) · TypeScript · Tailwind v4 · React Flow ·
Mermaid · Shiki · dnd-kit · next-themes · Sonner · Radix.

Sem backend — conteúdo **TypeScript tipado** no repo (sem MDX/CMS). Persistência
do usuário em `localStorage`; compartilhamento por URL (`?p=<base64>`).

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local   # opcional — ajuste NEXT_PUBLIC_SITE_URL
pnpm dev                     # http://localhost:3000
pnpm build
pnpm test
```

`pnpm test` = Vitest unitário (`node`) + UI (`happy-dom` + Testing Library).

### Testes

- **unit** (`*.spec.ts`) — motor do construtor, conteúdo, quiz, pré-requisitos
- **ui** (`*.spec.tsx`) — smoke do Quiz

Barra de qualidade: TL;DR, casos, armadilhas, `ondeAparece`, `custo`,
`emUmaLinha`, links íntegros, tecnologias do Construtor com slugs válidos.

## Estrutura

```
src/
├── app/(app)/
│   ├── conceitos/ · roadmaps/ · construtor/
│   ├── quiz/ · comparar/ · postmortems/ · novidades/
├── content/
│   ├── conceitos/ · roadmaps/ · construtor/
│   ├── comparacoes/ · postmortems/ · quiz/ · entrevistas/ · novidades/
└── shared/
    ├── components/ · context/ · hook/ · lib/ · config/ · types/ · utils/
```

Motor do construtor e simulador são **funções puras** (não importam React).

## Deploy (Vercel)

Importar o repo. Copie `.env.example` → variáveis do projeto se quiser canônico
/ OG corretos (`NEXT_PUBLIC_SITE_URL`, sem barra no final). `next build` gera
tudo estático.
