# DevAtlas

Sistema de **estudo e visualização** (front-only) de design patterns, princípios
e arquitetura. Três frentes:

- **`/conceitos`** — 33 conceitos: os **23 padrões GoF completos**, os 5
  princípios **SOLID**, CQS e 4 de arquitetura (Hexagonal, CQRS, Saga, Event
  Sourcing). Todos com TL;DR, seções curto/extenso, ilustração, camadas
  navegáveis, casos de uso reais e armadilhas; alguns com demo interativa.
- **`/roadmaps`** — 4 trilhas marcáveis (Padrões de Projeto, Backend,
  Frontend, Arquitetura) com conectores bezier medidos, estilo roadmap.sh.
- **`/construtor`** — playground de arquitetura: monte a pilha arrastando
  camadas, padrões e tecnologias; o motor explica o que cada escolha muda,
  sugere o próximo passo, **simula a requisição** (incluindo cenários de falha)
  e exporta o resultado como **ADR em Markdown**.
- **`/estudar`** — modo estudo sobre o progresso das trilhas: continue de onde
  parou, próximos conceitos sugeridos e **revisão espaçada**.
- **`/quiz`** — as armadilhas viram perguntas com o nome do padrão mascarado,
  filtráveis **por categoria ou por trilha**. Cada conceito também tem o quiz
  das próprias armadilhas no fim da página.
- **`/comparar`** — os duelos que mais confundem, critério a critério.

## Onde fica o quê

- **O que já entrou** — a página `/novidades`, alimentada por
  `content/novidades/registro.ts`. É a fonte única: dela saem o histórico de
  entregas, o badge "novo" no catálogo e a seção "A seguir".
- **O que vem depois** — [PLANEJAMENTO-PRODUTOS.md](./PLANEJAMENTO-PRODUTOS.md):
  plano das próximas quatro features (export ADR, comparador de conceitos,
  modo estudo e quiz), com modelo de dados, testes e ordem recomendada.

## Stack

Next.js 16 (App Router, SSG) · TypeScript · Tailwind v4 · React Flow ·
Mermaid · Shiki · dnd-kit · next-themes · Sonner · Radix.

Sem backend — todo conteúdo é **TypeScript tipado** no repositório (sem MDX, sem
CMS), validado pelo compilador. Persistência do usuário em `localStorage` e
compartilhamento por URL (`?p=<base64>`).

## Desenvolvimento

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm build
```

```bash
pnpm test
```

`pnpm dev` sobe em http://localhost:3000. `pnpm build` gera o site 100%
estático (81 rotas). `pnpm test` roda a suíte com Vitest.

### Testes

350 testes em ambiente `node`, sem jsdom — o motor do construtor e o conteúdo
são funções puras e dados tipados, nada importa React. A suíte cobre:

- **motor do construtor** — que toda regra é alcançável e nenhuma dispara
  sempre, limites e monotonicidade do score, os cenários de falha do
  simulador, convergência das sugestões;
- **regressão dos templates** — os 6 modelos curados precisam nascer sem
  nenhum alerta (falha que já reapareceu três vezes);
- **barra de qualidade do conteúdo** — todo conceito com TL;DR, ≥2 casos de
  uso, ≥2 armadilhas, ilustração estruturalmente válida, e nenhum link
  quebrado entre conceitos, regras e roadmaps.

## Estrutura

```
src/
├── app/(app)/            # rotas — page.tsx = só composição
│   ├── conceitos/        # catálogo + [slug]
│   ├── roadmaps/         # catálogo + [slug]
│   └── construtor/       # _components/ · hook/ · utils/ (simulador)
├── content/              # conteúdo tipado (+ specs ao lado)
│   ├── conceitos/        # 33 conceitos agrupados por categoria
│   ├── roadmaps/         # padroes · backend · frontend · arquitetura
│   └── construtor/       # blocos · tecnologias · regras · sugestoes
└── shared/
    ├── components/       # global/ui (shadcn), templates, diagramas, conteudo
    ├── context/          # providers, modal-context, theme
    ├── hook/ · lib/ · config/ · types/ · utils/
```

O motor do construtor (`content/construtor/`) é composto de **funções puras** —
`avaliarRegras`, `calcularScore`, `sugerir`, `revisarProjeto` — e o simulador
(`construtor/utils/simulador.ts`) também. Nenhum deles importa React.

## Deploy (Vercel)

Push para o GitHub e importar na Vercel. Sem env vars, sem serviços externos —
`next build` gera tudo estático.
