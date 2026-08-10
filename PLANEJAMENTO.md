# DevAtlas — Planejamento

> **⚠ Direção atual:** a reimaginação do roadmap (conectores estilo sh),
> conceitos v3 (profundidade navegável) e o **Construtor de Projeto
> (drag & drop)** estão planejados em [PLANEJAMENTO-V3.md](./PLANEJAMENTO-V3.md).

> Sistema de estudo e visualização: um **roadmap.sh mais enxuto** + um **catálogo visual de conceitos** (design patterns, arquitetura, SOLID) com diagramas, camadas e exemplos de código.
>
> **Front-only.** Sem backend, sem banco, sem login. Todo conteúdo mora no repositório e é buildado estaticamente. Deploy na Vercel.

---

## 1. Objetivo

Uma ferramenta de **consulta e aprendizado**, não de produção de conteúdo pelo usuário. O foco é:

1. **Roadmaps** — trilhas de aprendizado visuais e navegáveis (versão simplificada do roadmap.sh: nós, dependências, "o que estudar antes/depois").
2. **Catálogo de conceitos** — cada padrão/conceito com:
   - Explicação em prosa (o problema que resolve).
   - **Diagrama** (UML de classes, sequência, ou grafo de camadas).
   - **Visualização em camadas** (como a peça se encaixa numa arquitetura).
   - Exemplos de código (idealmente em >1 linguagem).
   - Quando usar / quando **não** usar, prós e contras.

Fora de escopo por agora: contas de usuário, progresso salvo em servidor, criação de conteúdo pela UI, comentários, qualquer fluxo com backend.

---

## 2. Stack escolhida

Escolhi o que dá o melhor equilíbrio entre DX, deploy trivial na Vercel e qualidade de visualização.

| Camada | Escolha | Porquê |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Deploy 1-clique na Vercel, SSG nativo, roteamento por arquivos, ótimo para conteúdo estático. |
| Linguagem | **TypeScript** | Segurança de tipos no conteúdo (frontmatter tipado) e nos componentes de diagrama. |
| Estilo | **Tailwind CSS v4** + **shadcn/ui** | Design system rápido, acessível, sem CSS espalhado. |
| Conteúdo | **MDX** (via `@next/mdx` ou **Fumadocs**) | Conteúdo é código versionado; permite embutir componentes de diagrama dentro do texto. |
| Diagramas de nós | **React Flow** (`@xyflow/react`) | Roadmap navegável + diagramas de camadas interativos (zoom, pan, destaque). |
| Diagramas UML | **Mermaid** | Classes/sequência/fluxo direto do markdown, barato de manter. |
| Animação | **Framer Motion** | Revelar camadas, transições entre estados de um diagrama. |
| Busca | **cmdk** + **FlexSearch** (índice local) | Command palette (Ctrl/Cmd+K) 100% client-side. |
| Tema | **next-themes** | Dark/light. |
| Ícones | **lucide-react** | Consistente com shadcn. |
| Syntax highlight | **Shiki** | Highlight em build time, mesmo engine do VS Code. |
| Qualidade | **ESLint + Prettier + Biome (opcional)** | Padronização. |

> **Alternativa considerada:** Vite + React puro. Descartada porque Next.js dá SSG/roteamento/SEO de graça e é o caminho mais liso na Vercel. **Fumadocs** (framework de docs em cima do Next) é forte candidato se quisermos sidebar/busca/TOC prontos — decisão na Fase 1.

---

## 3. Arquitetura da informação

Dois grandes eixos, ligados entre si:

```
DevAtlas
├── Roadmaps            (o "mapa" — por onde começar, o que vem depois)
│   ├── Frontend
│   ├── Backend
│   ├── Padrões de Projeto  ──┐
│   └── Arquitetura de SW   ──┤ nós do roadmap linkam para...
│
└── Conceitos           (o "verbete" — explicação profunda de UMA coisa)  <──┘
    ├── Design Patterns
    │   ├── Criacionais   (Factory, Singleton, Builder, ...)
    │   ├── Estruturais   (Adapter, Decorator, Facade, ...)
    │   └── Comportamentais (Observer, Strategy, State, ...)
    ├── Princípios        (SOLID, DRY, KISS, YAGNI)
    └── Arquitetura       (Camadas, Hexagonal, Clean, MVC, CQRS)
```

Um **nó do roadmap** aponta para um ou mais **conceitos**. Um conceito pode aparecer em vários roadmaps. Essa é a cola do sistema.

---

## 4. Modelo de conteúdo

Todo conteúdo é arquivo no repo — sem CMS.

### 4.1 Conceito (MDX)

```
content/
  conceitos/
    padroes/
      criacionais/
        factory-method.mdx
        singleton.mdx
      estruturais/
        adapter.mdx
      comportamentais/
        observer.mdx
    principios/
      solid.mdx
    arquitetura/
      clean-architecture.mdx
```

Frontmatter tipado (validado com **Zod** no build):

```yaml
---
titulo: "Factory Method"
categoria: "criacional"          # criacional | estrutural | comportamental | principio | arquitetura
resumo: "Cria objetos sem acoplar o cliente à classe concreta."
tags: ["polimorfismo", "gof", "desacoplamento"]
dificuldade: "intermediario"     # iniciante | intermediario | avancado
tempoLeitura: 6                  # minutos
relacionados: ["abstract-factory", "builder"]
roadmapNodes: ["padroes/criacionais"]  # de onde é referenciado
diagramas:
  - tipo: "classe"               # classe | sequencia | camadas
    fonte: "./factory-method.mmd" # ou inline
---
```

Corpo em MDX com componentes embutidos:

```mdx
## O problema
...prosa...

<DiagramaClasse src="./factory-method.mmd" />

## Em camadas
<DiagramaCamadas nodes={...} />   {/* React Flow */}

## Código
<CodeTabs>
  <Tab lang="typescript">...</Tab>
  <Tab lang="python">...</Tab>
</CodeTabs>

<QuandoUsar prós={[...]} contras={[...]} />
```

### 4.2 Roadmap (JSON/TS tipado)

Grafo declarativo consumido pelo React Flow:

```ts
// content/roadmaps/padroes.ts
export const roadmapPadroes: Roadmap = {
  id: "padroes-de-projeto",
  titulo: "Padrões de Projeto",
  nodes: [
    { id: "oop-base", titulo: "Fundamentos OOP", status: "recomendado" },
    { id: "criacionais", titulo: "Padrões Criacionais", conceito: "padroes/criacionais" },
    // ...
  ],
  edges: [
    { from: "oop-base", to: "criacionais" },
  ],
};
```

---

## 5. Componentes-chave (o coração da visualização)

| Componente | O que faz |
|---|---|
| `<RoadmapCanvas>` | React Flow: renderiza nós + arestas, clique abre o conceito, destaca caminho até um nó. |
| `<DiagramaClasse>` | Renderiza Mermaid (class diagram) com tema sincronizado ao dark/light. |
| `<DiagramaSequencia>` | Mermaid sequence diagram para padrões comportamentais. |
| `<DiagramaCamadas>` | React Flow em modo "camadas": caixas empilhadas (UI → Domínio → Infra) com a peça em destaque e animação de entrada. |
| `<CodeTabs>` | Abas por linguagem, highlight via Shiki, botão copiar. |
| `<QuandoUsar>` | Grid prós/contras + "use quando / evite quando". |
| `<CommandPalette>` | Ctrl+K, busca full-text (FlexSearch) sobre título/resumo/tags. |
| `<ConceitoLayout>` | TOC lateral, breadcrumb (roadmap → categoria → conceito), "relacionados". |

---

## 6. Rotas (App Router)

```
/                          Home: destaques + entrada pros roadmaps
/roadmaps                  Lista de roadmaps
/roadmaps/[slug]           Canvas interativo do roadmap
/conceitos                 Catálogo (grid filtrável por categoria/dificuldade/tag)
/conceitos/[...slug]       Página do conceito (MDX renderizado)
/sobre                     O que é / como navegar
```

Tudo **SSG** (`generateStaticParams`) — zero runtime de servidor. `output` estático viável.

---

## 7. Design / UX

- **Estética:** limpa, técnica, tipografia legível (Geist ou Inter + mono para código). Muito respiro.
- **Dark mode** como padrão (público dev), com toggle.
- **Diagramas theme-aware:** paletas separadas p/ light/dark; nunca cor fixa que some no tema oposto.
- **Cores por categoria:** criacional / estrutural / comportamental / princípio / arquitetura têm cores consistentes (badge, borda do nó no roadmap, filtro).
- **Acessibilidade:** contraste AA, foco visível, navegação por teclado no canvas, `prefers-reduced-motion` respeitado nas animações.
- **Responsivo:** roadmap com pan/zoom no mobile; diagramas com scroll-x próprio (nunca estourar a página).

---

## 8. Fases de entrega

### Fase 0 — Setup (fundação)
- [ ] `create-next-app` (TS, App Router, Tailwind).
- [ ] shadcn/ui, next-themes, lucide, fontes.
- [ ] Pipeline MDX + Zod (validação de frontmatter no build).
- [ ] Layout base, header, dark/light, deploy inicial na Vercel (CI verde antes de ter conteúdo).

### Fase 1 — Conceitos (o miolo)
- [ ] `<ConceitoLayout>` + renderização MDX + Shiki + `<CodeTabs>`.
- [ ] `<DiagramaClasse>`/`<DiagramaSequencia>` (Mermaid theme-aware).
- [ ] `/conceitos` catálogo filtrável.
- [ ] **3–5 padrões-piloto** completos (ex.: Factory Method, Singleton, Adapter, Observer, Strategy) para validar o modelo end-to-end.

### Fase 2 — Camadas & Roadmap
- [ ] `<DiagramaCamadas>` (React Flow) com animação de revelação.
- [ ] `<RoadmapCanvas>` + 1 roadmap completo ("Padrões de Projeto") linkando aos conceitos.
- [ ] Ligação bidirecional roadmap ↔ conceito.

### Fase 3 — Busca & polimento
- [ ] `<CommandPalette>` (FlexSearch) + página de busca.
- [ ] SEO (metadata, OG images, sitemap), 404, loading states.
- [ ] Auditoria a11y + Lighthouse.

### Fase 4 — Escala de conteúdo
- [ ] Completar os 23 GoF, SOLID, e roadmaps de Frontend/Backend/Arquitetura.
- [ ] (Futuro) Progresso local via `localStorage` (marcar nó como "estudado") — ainda front-only.

---

## 9. Estrutura de pastas (alvo)

```
roadmap/
├── app/
│   ├── page.tsx
│   ├── roadmaps/[slug]/page.tsx
│   └── conceitos/[...slug]/page.tsx
├── components/
│   ├── diagramas/        (RoadmapCanvas, DiagramaClasse, DiagramaCamadas...)
│   ├── conteudo/         (CodeTabs, QuandoUsar, ConceitoLayout...)
│   └── ui/               (shadcn)
├── content/
│   ├── conceitos/**.mdx
│   └── roadmaps/*.ts
├── lib/                  (mdx, schema Zod, busca, temas de diagrama)
├── PLANEJAMENTO.md
└── ...configs
```

---

## 10. Deploy (Vercel)

- Repo no GitHub → import na Vercel → deploy automático por push.
- Build: `next build` (SSG). Sem env vars, sem serviços externos.
- Preview deploys por PR já vêm de graça.

---

## 11. Riscos & decisões em aberto

| Item | Decisão a tomar |
|---|---|
| **Fumadocs vs. MDX cru** | Fumadocs acelera muito (sidebar/busca/TOC prontos) mas é mais opinativo. Decidir na Fase 1. |
| **Mermaid em SSG** | Renderizar no cliente (hydration) ou pré-renderizar SVG no build. Preferir pré-render p/ performance/SEO. |
| **Peso do React Flow** | Carregar via `dynamic import` só nas rotas de diagrama. |
| **Idioma do conteúdo** | Começar em PT-BR; deixar arquitetura pronta p/ i18n futuro (não implementar agora). |

---

## 11.5. Convenções herdadas do `front-nextjs-paas`

Adotamos os padrões já estabelecidos no projeto Mutual (`docs/base-de-conhecimentos/`), **adaptando** a camada de dados: onde o PaaS usa **tRPC**, aqui usamos uma **camada de conteúdo estática** (MDX + loaders tipados). O resto do padrão é mantido 1:1.

### Estrutura por página (obrigatória)
Toda rota em `src/app/**` segue:
```
(rota)/
├── _components/        # componentes exclusivos da rota (privados)
├── utils/*.utils.ts    # funções puras, colunas, constantes locais
├── hook/*.hook.ts      # leitura de conteúdo, estado, efeitos  (era: queries tRPC)
├── hook/*.action.ts    # interações client (localStorage, busca, share)  (era: mutations)
└── page.tsx            # composição — SEM lógica direta
```

### `page.tsx` = só composição
Sem `useState`/`useEffect`/fetch direto. Orquestra componentes e delega para `hook/`. Recebe `params`/`searchParams` e repassa.

### Templates (`src/shared/components/templates/`)
| Template | Uso |
|---|---|
| `PageTemplate` | Toda página: `icon` + `title` + `subtitle` + `breadcrumb` + `children` |
| `SectionTemplate` | Blocos de conteúdo dentro do conceito |
| `ModalTemplate` / `ModalShell` | Modais novos (Header + Body + Footer) |

### Modais — sistema central `useModal`
Igual ao PaaS: `ModalManager` (pub/sub) + `openModal(id, Component, props, { size, closeOnEscape, ... })`. Tamanhos `sm|md|lg|xl|full`. Importar `useModal` do contexto, **não** do barrel. Modais desta app: preview de diagrama em tela cheia, seletor de linguagem de código, atalhos de teclado.

### Padrão de erros (adaptado)
Sem backend, o análogo é **falha ao carregar/renderizar conteúdo**:
| Módulo | Papel |
|---|---|
| `resolve-content-error.ts` | Categoriza (conteúdo-não-encontrado, MDX-inválido, diagrama-falhou) → `{ title, description }` |
| `use-content-error.ts` | Hook: `resolve`, `showToast`, `log` (via Sonner) |
| `ContentErrorState` | UI inline para seção que falhou (com retry quando aplicável) |

Regra mantida: **nunca** vazar mensagem técnica (stack/erro de parse) para a UI; detalhe técnico só em log.

### Camada `shared/` (espelha o PaaS)
```
src/shared/
├── components/
│   ├── global/ui/      # shadcn/ui (Button, Badge, Dialog...)
│   ├── templates/      # PageTemplate, ModalShell...
│   ├── diagramas/      # RoadmapCanvas, DiagramaClasse, DiagramaCamadas
│   └── conteudo/       # CodeTabs, QuandoUsar, ConceitoLayout
├── context/            # modal-context, theme, search-context
├── hook/               # use-copy, use-data-table equiv., use-local-store...
├── config/             # i18n (futuro), icons, categorias
├── constants/          # cores por categoria, mensagens
├── lib/                # mdx, content-loader, schema Zod, temas de diagrama
├── styles/             # globals.css (CSS vars, tema)
├── types/              # conceito.ts, roadmap.ts, diagrama.ts
└── utils/              # formatters, slug, search-index
```

### Convenções de código (checklist pré-commit)
Herdadas de Nival/Jacson:
- **Zero `console.log`**, zero imports não usados, zero `@ts-ignore`.
- Lógica pesada em `.action.ts`, nunca no componente.
- `<Button>` shadcn em vez de `<button>` nativo.
- Componente **< 300 linhas**; uma responsabilidade por componente.
- Props sempre tipadas (nunca `any`).
- Sempre tratar **loading / empty / error** em quem carrega dados.
- Reutilizar `shared/` antes de criar; constantes repetidas → nomeadas.
- Naming: `PascalCase.tsx` (componente), `use-nome.ts` (hook shared), `nome.hook.ts`/`nome.action.ts` (feature), `nome.utils.ts` (kebab), `nome.schema.ts` (Zod).

### Alias de import
`@/*` → `./src/*` (ex.: `@/shared/components/...`). Ordem de import: externos → `@/shared` → relativos locais.

### Providers raiz
Um único `src/shared/context/providers.tsx` na ordem correta (`ThemeProvider → ModalProvider → SearchProvider → children`). Nunca espalhar providers soltos.

---

## 11.9. Estado atual (Fase 0 + fatia da Fase 1 — concluído)

Scaffold rodando e **build 100% estático (SSG)** verde. Implementado:
- Next.js **16** (o `create-next-app@latest` trouxe 16, não 15) + React 19 + Tailwind v4.
- Estrutura `shared/` + padrão por página (catálogo usa `_components/`+`hook/`+`utils/`).
- Templates (`PageTemplate`), UI kit (Button/Badge/Card/Dialog/Tabs), tema dark/light.
- Sistema de modais central (`useModal`), padrão de erros de conteúdo, providers raiz.
- Diagramas: **Mermaid** (classe) + **React Flow** (camadas e roadmap navegável).
- 3 conceitos-piloto (Factory Method, Adapter, Observer) + 1 roadmap, ponta a ponta.

**Aprendizado técnico (React Flow v12):** para diagramas **estáticos**, os nós devem
trazer `measured: {width,height}` e `handles` explícitos (topo=target/base=source).
Sem isso, o cálculo de arestas depende do `ResizeObserver`, que não roda em ambientes
sem compositing (SSR/preview headless) → arestas somem. Diagramas também usam um
mount-gate (só renderizam no cliente) para evitar mismatch de `colorMode` no SSR.

## 11.95. Incremento (roadmap.sh + conceitos + polish)

Baseado na análise do roadmap.sh (caixas arredondadas, tópico primário/subtópico,
conectores tracejados, estados de progresso marcáveis):

- **Conceitos novos (detalhados):** Strategy, Arquitetura Hexagonal, CQS, CQRS, Saga
  — total de **8 conceitos**, cada um com diagrama, camadas e código multi-linguagem.
- **Código colorido (Shiki):** highlight real dual-theme gerado no build (SSG); claro/
  escuro via CSS var, sem custo em runtime. `CodeTabs` renderiza o HTML destacado.
- **Roadmap estilo roadmap.sh:** nó customizado (`TopicNode`) com **checkbox de
  validação**, variantes topic/subtopic, cores por status (concluído/em progresso/
  pulado/pendente), conectores tracejados, **barra de progresso + legenda + "Zerar"**.
  Progresso persistido em `localStorage` (`use-roadmap-progress`).
- **Header colapsável:** `AppHeader` sticky que recolhe ao rolar para baixo e reaparece
  ao subir (transição fluida).
- **Troca de tema animada:** reveal circular com a **View Transitions API** partindo do
  botão e cobrindo a tela (fallback para troca direta sem suporte / reduced-motion).

## 11.97. Incremento (busca, sidebar, roadmap estilo-sh) — concluído

- **Busca global (Ctrl/⌘+K):** command palette com `cmdk`, busca fuzzy sobre conceitos
  e roadmaps, navegação por teclado. Aberta por atalho, pelo botão no header e na sidebar.
  Providers: `SearchProvider`.
- **Sidebar colapsável:** rail de 64px ↔ 240px (persistido em localStorage), rótulos
  somem no modo estreito; **drawer off-canvas no mobile** com overlay. `SidebarProvider`.
  (Fix técnico: `overflow-hidden` no `<aside>` para o `min-width:auto` do flex não
  travar a largura.)
- **Roadmap redesenhado estilo roadmap.sh (sem React Flow):** layout HTML/CSS em
  espinha vertical de seções numeradas + itens (subtópicos), conectores tracejados,
  itens opcionais com borda tracejada. Modelo de dados agora **hierárquico**
  (`RoadmapSection` → `RoadmapItem`).
- **Checklist funcionando:** checkbox por nó (ciclo concluído → pulado → pendente),
  barra de progresso, legenda e "Zerar". Persistido por roadmap em localStorage.
- **Área de entendimento interativa:** clicar num nó abre um **drawer** com contexto
  (seção), resumo do conceito, dificuldade/tempo, "Marcar como concluído" e
  "Abrir conceito completo".

---

## 11.98. PLANO — Conceitos ricos (imagens/figuras/interação) e roadmap didático

> Objetivo: sair do "muro de texto" para conceitos **demonstrados** visualmente e
> interativos. Como é front-only e sem hospedagem de imagens, "imagens/figuras" =
> **SVG inline** e **componentes visuais**, theme-aware e acessíveis (não raster).

### A. Novo modelo de conteúdo — blocos compostos
Migrar `Conceito` de campos soltos (prosa em arrays) para uma **lista ordenada de
blocos** (union discriminada), permitindo intercalar texto, figura e interação:

```ts
type Bloco =
  | { tipo: "texto"; titulo?: string; paragrafos: string[] }
  | { tipo: "analogia"; icone: string; titulo: string; texto: string }
  | { tipo: "figura"; legenda: string; svg: FiguraId }        // SVG anotado
  | { tipo: "passos"; titulo: string; passos: { titulo; texto; svg? }[] }
  | { tipo: "antes-depois"; antes: Snippet; depois: Snippet }
  | { tipo: "diagrama"; kind: "classe" | "sequencia"; mermaid: string }
  | { tipo: "camadas"; camadas: Camada[] }
  | { tipo: "demo"; demo: DemoId }                            // widget interativo
  | { tipo: "codigo"; exemplos: ExemploCodigo[] }
  | { tipo: "quando-usar"; usar: string[]; evitar: string[] };
```
Na Fase 1, o corpo migra para **MDX** com esses blocos como componentes — o autor
escreve markdown e insere `<Figura/>`, `<Passos/>`, `<Demo/>` no fluxo.

### B. Biblioteca de figuras/interação (SVG-first)
Componentes reutilizáveis em `shared/components/conteudo/figuras/`:
- `AnatomiaAnotada` — diagrama SVG com **callouts** numerados apontando partes.
- `PassoAPasso` — stepper visual: avança e a figura muda/realça a cada passo.
- `AntesDepois` — comparação lado a lado (código/estrutura) com slider ou toggle.
- `Analogia` — cartão com ícone + metáfora do mundo real (ex.: Adapter = adaptador
  de tomada; Observer = inscrição em newsletter).
- `FluxoInterativo` — mini-fluxo clicável (clicar num passo destaca o efeito).
- `Playground` — **demo executável** por conceito, ex.:
  - Observer → botão "publicar" dispara e vê N observadores reagindo ao vivo.
  - Strategy → dropdown troca a estratégia e recalcula o resultado na hora.
  - Adapter → "encaixe" animado entre interface incompatível e alvo.
  - CQRS → dois caminhos (command/query) animando escrita→projeção→leitura.

### C. Meta por conceito (barra de qualidade)
Cada conceito deve ter, no mínimo: **1 analogia + 1 figura anotada + 1 diagrama +
1 demo interativa + código multi-linguagem + quando usar/evitar**. Menos que isso
= incompleto.

### D. Roadmap ainda mais didático (evolução do que já existe)
- **Destacar caminho/pré-requisitos:** ao abrir um nó, realçar de onde ele depende.
- **"Próximo recomendado":** sugerir o próximo item pendente na trilha.
- **Filtro por progresso** (mostrar só pendentes) e **estimativa de tempo** por seção.
- **Mini-mapa/índice** lateral das seções (scroll-spy).

### STATUS — infra + 2 conceitos-piloto concluídos
- ✅ Modelo `Bloco` (union) + campo opcional `blocos` no `Conceito` (retrocompatível:
  quem não tem `blocos` usa o layout clássico).
- ✅ `BlocoRenderer` (server, com highlight Shiki) + componentes `Analogia`, `Passos`,
  e reuso de `DiagramaClasse`/`DiagramaCamadas`/`CodeTabs`/`QuandoUsar`.
- ✅ **Demos interativas** (`framer-motion`): `ObserverPlayground` (publica → 3
  observadores reagem ao vivo) e `StrategyPlayground` (troca de estratégia recalcula
  o frete na hora).
- ✅ **Observer** e **Strategy** reescritos no formato rico (analogia + problema +
  demo + passos + diagrama + camadas + código + quando).
- ⏳ Faltam converter: Factory, Adapter, CQS, CQRS, Saga, Hexagonal (usam o layout
  clássico até lá). Adapter/CQRS ganham demos dedicadas (encaixe / command↔query).

### E. Ordem sugerida de execução
1. Refatorar `Conceito` → `blocos` + renderer de blocos (mantém SSG + Shiki).
2. Construir `AnatomiaAnotada`, `Analogia`, `PassoAPasso` (SVG puro).
3. `Playground` (Observer e Strategy primeiro — maior valor didático).
4. Reescrever os 8 conceitos no novo formato, começando por Factory/Observer/Adapter.
5. Enriquecer o roadmap (caminho, próximo, filtro, scroll-spy).

---

## 12. Próximo passo imediato

Rodar a **Fase 0**: scaffold do Next.js + Tailwind + shadcn + pipeline MDX, e subir um deploy vazio na Vercel para garantir o pipeline antes de escrever conteúdo.
