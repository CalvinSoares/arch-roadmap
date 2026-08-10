# DevAtlas

Sistema de **estudo e visualização** (front-only): um roadmap.sh enxuto + catálogo
visual de design patterns, princípios e arquitetura, com diagramas, camadas e código.

Ver [PLANEJAMENTO.md](./PLANEJAMENTO.md) para a visão completa.

## Stack

Next.js 16 (App Router, SSG) · TypeScript · Tailwind v4 · React Flow · Mermaid ·
next-themes · Sonner · Radix. Sem backend — todo conteúdo é estático no repositório.

## Desenvolvimento

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # gera site 100% estático (SSG)
```

## Estrutura (convenções herdadas do front-nextjs-paas)

```
src/
├── app/(app)/            # rotas (home, /conceitos, /roadmaps) — page = só composição
│   └── conceitos/        # _components/ · hook/ · utils/  (padrão por página)
├── content/              # conteúdo tipado: conceitos/*.ts, roadmaps/*.ts
└── shared/
    ├── components/       # global/ui (shadcn), templates, diagramas, conteudo
    ├── context/          # providers, modal-context, theme
    ├── hook/ · lib/ · config/ · types/ · utils/
```

## Deploy (Vercel)

Push para o GitHub e importar na Vercel. Sem env vars, sem serviços externos —
`next build` gera tudo estático.
