# DevAtlas v3 — Reimaginação: Roadmap, Conceitos e Construtor de Projeto

> **Construtor v3:** auditoria e plano de expansão (fluxo visível, ordem,
> chaos, sugestões) em [PLANEJAMENTO-CONSTRUTOR.md](./PLANEJAMENTO-CONSTRUTOR.md).

> Plano das três frentes: (1) roadmap com conectores reais estilo roadmap.sh,
> (2) conceitos interativos com profundidade navegável, (3) **construtor de
> projeto drag-and-drop** com feedback didático em tempo real.
>
> Continua **front-only** (SSG na Vercel, sem backend). Interatividade toda
> client-side; persistência em localStorage/URL.

---

## 1. Roadmap v3 — conectores que seguem os cards (como no roadmap.sh)

### 1.1 Problema atual
A espinha é uma linha única reta vertical; os itens ficam em "wrap" abaixo de
cada tópico sem ligação visual individual. No roadmap.sh cada subtópico tem
**seu próprio conector** saindo do tópico — a linha "procura" o card.

### 1.2 Novo layout
Grid de 3 colunas no desktop:

```
[cards à esquerda]   [espinha central]   [cards à direita]
      ┌────────┐          ┌──────┐          ┌────────┐
      │ CQS    │╌╌╌╌╌╌╌╌╌╌│ 2. Princípios │╌╌│ SOLID  │
      └────────┘          └──┬───┘          └────────┘
                             │  (segmento sólido da espinha)
                          ┌──▼───┐          ┌────────┐
                          │ 3. Criacionais│╌╌│Factory │
                          └──────┘          └────────┘
```

- **Tópicos** (seções numeradas) ficam na coluna central, conectados entre si
  por segmentos **sólidos** verticais (a espinha).
- **Itens** distribuem-se alternando esquerda/direita (balanceados por
  quantidade), cada um ligado ao seu tópico por um **conector tracejado curvo**
  individual (bezier), como no sh.
- Itens `opcional` continuam com borda tracejada + conector mais claro.

### 1.3 Implementação dos conectores
- **Overlay SVG absoluto** cobrindo o container do roadmap.
- Hook `useConnectorLayout(containerRef, anchorsMap)`:
  - registra refs de cada nó (tópico e card);
  - mede posições com `getBoundingClientRect` relativo ao container;
  - recalcula em `ResizeObserver` + resize/scroll de fontes;
  - retorna paths `M x1 y1 C ...` (curva saindo da lateral do tópico até a
    lateral interna do card).
- Estilo: `stroke: var(--muted)`, `stroke-dasharray: 5 5`, espinha central
  sólida `var(--card-border)` mais grossa.
- **Client-only** (mount-gate, como os diagramas) — evita mismatch de SSR.
- Mobile (`< sm`): colunas colapsam para 1; conectores viram um "trilho"
  lateral simples (timeline) — sem SVG overlay, só CSS.

### 1.4 O que se mantém
Checkbox/progresso/legenda/"Zerar", drawer de detalhe ao clicar, persistência
por roadmap. Só muda a **geometria e os conectores**.

### 1.5 Componentes
| Componente | Mudança |
|---|---|
| `RoadmapFlow` | reescrito: grid 3 colunas + espinha + distribuição de lados |
| `RoadmapConnectors` (novo) | overlay SVG com os paths medidos |
| `useConnectorLayout` (novo hook) | medição + recálculo reativo |
| `roadmap-node-box` | mantém (checkbox/status) |

### 1.6 Riscos
- Medição em ambiente sem compositing (preview) → mesmos cuidados do React
  Flow: overlay é *enhancement*; sem medidas, cards continuam legíveis.
- Reflow com fontes → recalcular após `document.fonts.ready`.

---

## 2. Conceitos v3 — intuitivos, interativos, profundos

### 2.1 Princípios
1. **Progressive disclosure** — explicação curta sempre visível; profundidade
   por opt-in ("Aprofundar"). Ninguém encara muro de texto.
2. **Padrão visual único** — toda ilustração segue o mesmo sistema (tokens por
   categoria, mesmos shapes/strokes); nada de estilos aleatórios.
3. **Zero quebra de layout** — tudo em containers com `overflow` controlado,
   alturas animadas com clamp, grid responsivo testado em 360px.
4. **Interação com propósito** — cada interação ensina algo (navegar camadas,
   rodar demo, comparar antes/depois), nunca enfeite.

### 2.2 Anatomia da página (nova)
```
┌───────────────────────────────────────────────┐
│ HERO: título · categoria · TL;DR (10 segundos)│
│ meta: dificuldade · tempo · tags              │
├──────────────┬────────────────────────────────┤
│ SUBNAV       │ 1. Visão geral (curta+extensa) │
│ (scroll-spy, │ 2. Como funciona (passos+ilus.)│
│  sticky)     │ 3. Camadas ▸ navegáveis        │
│              │ 4. Veja funcionando (demo)     │
│              │ 5. Código                      │
│              │ 6. Casos de uso reais          │
│              │ 7. Armadilhas comuns           │
│              │ 8. Relacionados (com "porquê") │
└──────────────┴────────────────────────────────┘
```
- **SUBNAV scroll-spy** fixa à esquerda (desktop) / chips horizontais no topo
  (mobile): o usuário sempre sabe onde está e pula direto.
- **TL;DR** no hero: 1–2 frases, "se você só ler isso, já leva algo".

### 2.3 Curto × extenso — componente `Aprofundar`
Cada seção tem `resumo` (2–4 linhas, sempre visível) e `extensao` (colapsável
com animação de altura + "Ler mais / Recolher"). Estado por seção, sem quebrar
o scroll-spy (recalcula âncoras ao expandir).

### 2.4 Ilustrações padronizadas — sistema `Ilustracao`
Biblioteca própria de SVG inline theme-aware em
`shared/components/conteudo/ilustracoes/`:
- **Tokens fixos**: cores da categoria (`--cat-*`), stroke 1.5, cantos 8px,
  fonte do sistema, setas e "atores" idênticos em todas.
- **3 arquétipos** reutilizáveis (cobrem 90% dos padrões):
  1. `FluxoAtores` — caixas + setas rotuladas (mensagens/chamadas);
  2. `EstruturaBlocos` — blocos aninhados/empilhados (composição/camadas);
  3. `AntesDepois` — dois painéis lado a lado com toggle (sem padrão × com).
- Cada conceito **parametriza** os arquétipos (dados, não desenho novo) —
  garante o "seguindo um padrão" pedido.

### 2.5 Camadas navegáveis — `CamadasInterativas` (substitui o diagrama estático)
Interação:
- Camadas renderizadas como cards empilhados (mesma metáfora atual), mas
  **clicáveis**: clicar (ou ←/→, ↑/↓) foca uma camada.
- A camada focada **expande** no lugar (animação de altura): descrição do
  papel, o que entra/sai (contratos), mini-exemplo de código daquela camada,
  e "o que acontece se remover/violar esta camada".
- Breadcrumb de profundidade (ex.: `Hexagonal ▸ Portas de saída`) + botões
  anterior/próxima. As demais camadas ficam esmaecidas.
- A11y: `role="tablist"` vertical, foco visível, navegação por teclado.
- Aplicável a: hexagonal, cqrs, saga (passos como "camadas" temporais),
  factory, adapter, observer, strategy (cliente→contexto→estratégias).

### 2.6 Casos de uso e armadilhas (novos blocos)
```ts
| { tipo: "casos"; casos: { titulo: string; cenario: string;   // contexto real
      aplicacao: string;                                       // como o padrão entra
      tradeoff: string }[] }                                   // o custo/limite
| { tipo: "armadilhas"; itens: { titulo: string; texto: string }[] }
| { tipo: "tldr"; texto: string }
| { tipo: "secao"; id: string; titulo: string; resumo: string[];
    extensao?: string[] }                                      // curto+extenso
| { tipo: "camadas-nav"; camadas: CamadaNav[] }                // §2.5
| { tipo: "ilustracao"; arquetipo: "fluxo"|"estrutura"|"antes-depois";
    dados: ... ; legenda: string }
```
Cada conceito passa a exigir (barra de qualidade v3): TL;DR + ≥2 casos de uso
reais + ≥2 armadilhas + camadas navegáveis (quando aplicável) + demo (quando
aplicável) + curto/extenso em toda seção textual.

### 2.7 Migração
- O trabalho de conversão em blocos já feito (8 conceitos) **é a base**: os
  blocos atuais viram as seções `secao`/`casos`/`armadilhas` (conteúdo
  reaproveitado, formato evolui).
- Ordem: Hexagonal e CQRS primeiro (maior ganho com camadas navegáveis),
  depois Observer/Strategy (já têm demo), depois os demais.

---

## 3. Construtor de Projeto — drag & drop didático (novo módulo)

### 3.1 Objetivo
O usuário **monta a arquitetura de um projeto** arrastando camadas e aplicando
padrões — e o sistema explica, a cada mudança, **o que aquela escolha muda**
(benefícios, custos, sinergias e conflitos). É o "playground de arquitetura":
aprender fazendo, sem certo/errado binário.

### 3.2 Rota e layout
`/construtor` — 3 painéis:
```
┌──────────┬──────────────────────┬───────────────┐
│ PALETA   │ CANVAS (o projeto)   │ ANÁLISE       │
│          │                      │               │
│ Camadas  │  ┌─ UI ────────────┐ │ Ao vivo:      │
│ ▸ UI     │  ├─ API [Adapter]──┤ │ • sinergias   │
│ ▸ API    │  ├─ Domínio ───────┤ │ • alertas     │
│ ▸ Domínio│  │   [Strategy]    │ │ • explicação  │
│ ▸ Infra  │  ├─ Infra [CQRS]───┤ │   da última   │
│ Padrões  │  └─────────────────┘ │   mudança     │
│ ▸ Factory│  (slots ordenáveis)  │ • score       │
│ ▸ CQRS…  │                      │   didático    │
└──────────┴──────────────────────┴───────────────┘
```
- **Paleta**: blocos arrastáveis em dois grupos — **Camadas** (UI, API/
  Gateway, Domínio, Aplicação, Infra/DB, Read store, Write store, Fila de
  eventos) e **Padrões** (os 8 conceitos + próximos).
- **Canvas**: pilha vertical de camadas (sortable). Padrões são **aplicados
  soltando sobre uma camada** (viram badges no slot). Cada padrão declara em
  quais camadas pode viver (`aplicaEm`).
- **Análise**: painel reativo — a cada drop/remoção/reordenação, gera cartões
  de explicação (o "professor" do lado direito).

### 3.3 Biblioteca DnD
**`@dnd-kit/core` + `@dnd-kit/sortable`** — leve, acessível (keyboard sensor
nativo), touch ok, mantida, sem HTML5-DnD (ruim em mobile). Fallback sem drag:
botão “+ adicionar” em cada bloco da paleta (tap-to-add) e reordenação por
botões ↑/↓ — o construtor funciona 100% sem arrastar.

### 3.4 Motor de regras (o coração didático)
Regras **declarativas** avaliadas sobre o estado do projeto; cada mudança
dispara reavaliação e o painel explica *o delta*:

```ts
interface EstadoProjeto {
  camadas: { id: CamadaId; padroes: PadraoId[] }[];   // ordenadas
}
interface Regra {
  id: string;
  quando: (p: EstadoProjeto) => boolean;
  nivel: "sinergia" | "alerta" | "info";
  titulo: string;
  explicacao: string;          // o que muda, por quê, custo/benefício
  conceitos?: string[];        // links p/ páginas de conceito
}
```
Exemplos (conteúdo inicial, ~20 regras):
- `cqrs + saga` → **sinergia**: "consistência eventual entre stores casa com
  compensações da Saga…".
- `cqrs` sem `fila-eventos` → **alerta**: "como o read model será projetado?
  Adicione uma fila/evento ou aceite projeção síncrona…".
- `adapter` na camada Domínio → **alerta**: "Adapter pertence à borda (API/
  Infra); domínio deve ficar livre de detalhes externos (ver Hexagonal)".
- `hexagonal` aplicado → **info**: reordena a leitura do canvas (Domínio ao
  centro) e explica portas/adaptadores nas bordas.
- Domínio ausente → **alerta**: "toda arquitetura aqui parte de um domínio".
- `strategy` em Domínio → **sinergia**: "regras voláteis isoladas…".
- Score didático (0–100 com rótulos): desacoplamento, testabilidade,
  complexidade — heurísticas simples e transparentes ("+15 por portas entre
  domínio e infra; −10 por padrão sem propósito declarado…").

### 3.5 Persistência e compartilhamento
- Estado em `localStorage` (`devatlas:construtor:v1`).
- Fase 2: serializar na URL (`?p=...` base64) p/ compartilhar montagens.
- Templates prontos: "CRUD simples", "E-commerce com CQRS", "Hexagonal puro"
  — um clique carrega e o painel narra as escolhas.

### 3.6 Modelo de dados de conteúdo
```ts
// content/construtor/blocos.ts
interface BlocoConstrutor {
  id: string; tipo: "camada" | "padrao";
  nome: string; descricao: string;        // tooltip/painel
  conceito?: string;                       // link p/ /conceitos/[slug]
  aplicaEm?: CamadaId[];                   // padrões: onde podem ser soltos
}
// content/construtor/regras.ts  → Regra[] (com testes unitários puros)
```

---

## 4. Fases de entrega

### F1 — Roadmap v3 (conectores) ✅ CONCLUÍDO
- [x] `useConnectorLayout` (hook de medição; overlay SVG renderizado no próprio `RoadmapFlow`)
- [x] `RoadmapFlow` em grid 3 colunas, itens alternando lados (esq/dir)
- [x] Mobile: trilho lateral tracejado simples (overlay `hidden` abaixo de `lg`)
- [x] Progresso/checkbox/drawer mantidos e validados (1/25 + drawer ok)
- Verificado: 24 paths (5 espinha sólida + 19 ramos bezier tracejados);
  endpoints casam com as bordas de tópico/card (fan-out estilo sh).
- Nota: recálculo em `resize`/`ResizeObserver`/`fonts.ready` — em browser real
  dispara nativamente (o preview emulado não emite resize; validado com
  dispatch manual).

### F2 — Conceitos v3 (estrutura) ✅ CONCLUÍDO (pilotos)
- [x] Blocos novos: `tldr`, `secao` (resumo+extensão), `casos`, `armadilhas`,
      `camadas-nav`, `ilustracao` (arquétipo `fluxo`)
- [x] `ConceitoSubnav` (scroll-spy IntersectionObserver; chips no mobile) +
      `Aprofundar` (grid-rows, sem medição) + `CamadasInterativas` (foco/expansão,
      breadcrumb de profundidade, ←/→, "se violar")
- [x] `IlustracaoFluxo` (cadeia linear de atores com setas rotuladas) —
      arquétipos `estrutura`/`antes-depois` ficam para F4
- [x] Pilotos: **Hexagonal** (5 camadas navegáveis + 3 casos + 3 armadilhas +
      extensão) e **CQRS** (3 lados navegáveis + demo de consistência eventual +
      distinção CQS na extensão) no formato v3
- [x] Convivência dos 3 layouts: v3 (subnav), v1-blocos (Observer/Strategy/
      Factory) e clássico (Adapter/CQS/Saga) — sem regressão
- Verificado no browser: subnav 7 seções, TL;DR, Aprofundar abre extensão,
  camada expande com detalhe+se-violar, breadcrumb 3/5→4/5, demo CQRS roda.

### F3 — Construtor MVP ✅ CONCLUÍDO
- [x] `/construtor` com 3 painéis (paleta | canvas | análise), `@dnd-kit`
      (Pointer+Keyboard sensors, DragOverlay) + **tap-to-add** (+ na paleta,
      ↑/↓ para reordenar, X para remover) — funciona 100% sem arrastar
- [x] 8 camadas + 8 padrões (com `aplicaEm` recomendado; soltar fora é
      permitido e gera alerta didático)
- [x] **22 regras** declarativas (sinergias/alertas/observações) + score
      didático transparente (desacoplamento/testabilidade/complexidade com
      fatores listados) + cartão "última ação"
- [x] Persistência em localStorage + **3 templates** (CRUD simples,
      Hexagonal puro, E-commerce com CQRS) + limpar
- [x] Entradas na sidebar e na busca (Ctrl+K → Ferramentas)
- Verificado no browser: add Domínio/UI/Infra dispara "UI a um passo do
  banco"; Hexagonal via + aplica no Domínio e dispara "Núcleo protegido";
  template carrega 7 camadas com sinergias Saga+CQRS; reordenar/remover
  badge persiste. Fix: `id` estável no DndContext (hydration do dnd-kit).

### F4 — Conteúdo em escala ✅ CONCLUÍDO
- [x] Todos os 8 conceitos originais migrados ao v3 (tldr + secao com extensão +
      ilustração + camadas-nav + casos ×3 + armadilhas ×3; demos preservadas)
- [x] 7 conceitos novos no v3: Abstract Factory, Builder, Singleton (tratamento
      honesto como padrão controverso), Decorator, Facade, State, Event Sourcing
      — catálogo total: **15 conceitos**
- [x] Roadmap: 7 itens ganharam link de conceito + item novo Event Sourcing
      (26 nós marcáveis)
- [x] Construtor: paleta 8→**12 padrões** (+Decorator, Facade, Singleton,
      Event Sourcing), **29 regras** (+7: ES±CQRS, Facade≠Adapter, Singleton
      infra/núcleo, decorator/facade na borda) e 4º template
      ("Plataforma de eventos")
- Verificado no browser: Singleton v3 completo (analogia banco central,
  camadas-nav, tratamento honesto), roadmap 26 nós + drawer do Event Sourcing,
  construtor com template novo disparando as 3 regras novas. Build: 23 páginas
  SSG verdes.
- Nota operacional: dois subagentes caíram por limite de sessão no meio;
  relançado 1 agente para os 4 arquivos restantes — recuperado sem retrabalho.

### F5 — Polimento ✅ CONCLUÍDO
- [x] **Share por URL no construtor**: `?p=<base64>` com sanitização (só ids
      conhecidos), URL tem precedência sobre localStorage, query limpa após
      carga, botão "Compartilhar projeto" copia o link
- [x] **SEO/OG**: `metadataBase` + OG/twitter defaults, `sitemap.xml`,
      `robots.txt`, 404 customizada, **OG images dinâmicas** (next/og) — 1 por
      conceito com cor da categoria + 1 do site (pré-renderizadas no build)
- [x] **Auditoria a11y (axe-core)** nas 4 páginas-chave → **zero violações**.
      Corrigido: contraste do primary dark (#7c7bff→#918fff, AA sobre
      primary/12), temas Shiki → variantes high-contrast, `<aside>` rotulados
      (landmark-unique), regiões roláveis focáveis (tabindex em pre/ilustração/
      diagrama), **nested-interactive no roadmap** (26 nós: card deixou de ser
      botão-dentro-de-botão → padrão overlay com checkbox em z-10),
      heading-order na home
- Build final: **41 rotas estáticas** (23 páginas + 15 OG images + sitemap/
  robots/OG raiz). Checkbox e drawer do roadmap revalidados após o refactor.

---

## 4.5. Construtor v2 — arquitetura real com tecnologias (decisão: Opção D, híbrido faseado)

> Decidido com o usuário: evoluir o construtor de "camadas+padrões" para
> **arquitetura de projeto real**, em duas fases.

### Fase 1 — Catálogo de tecnologias na pilha ✅ CONCLUÍDA
- **Catálogo** (`content/construtor/tecnologias.ts`): 10 fichas — Redis,
  Memcached, PostgreSQL, MongoDB, Kafka, RabbitMQ, Elasticsearch, Nginx, CDN,
  S3, Prometheus+Grafana. Cada ficha: categoria, `viveEm` (camadas típicas),
  usos, especificações (modelo/persistência/consistência/latência),
  **"a diferença que faz"** (custo/benefício honesto), alternativas e links
  para conceitos.
- **Slots na pilha**: tecnologias são arrastadas para camadas (chips com
  ícone/acento por categoria); soltar fora do `viveEm` gera **alerta didático
  automático**; camadas recomendadas acendem durante o drag (padrões E techs).
- **Ficha em drawer**: clicar no chip abre specs completas.
- **+11 regras tech×padrão×camada**: Redis+CQRS (read model µs), Redis sem
  banco durável, Kafka+Saga, Kafka+ES, Elastic como projeção/never-verdade,
  dois caches, Kafka×RabbitMQ (papéis), fila sem broker, sem observabilidade,
  CDN na UI. Score: cache na leitura, observabilidade, complexidade por tech.
- **Templates com stack real** (e-commerce: CDN+Nginx+Postgres+Redis+Elastic+
  Kafka; plataforma de eventos: Kafka+Mongo+Prometheus).
- Share por URL sanitiza tecnologias; estados antigos migram (campo vazio).
- Verificado no browser: template carrega stack, sinergias disparam, ficha do
  Redis completa, axe zero violações.

### Fase 2 — Canvas de fluxo com trilhas + simulação de requisição ✅ CONCLUÍDA
- **Visão "Fluxo"** (toggle Montar/Fluxo no construtor): trilhas Cliente →
  Borda → Aplicação → Dados & Infra, com o nó Usuário à esquerda; nós derivados
  automaticamente da pilha (fonte única de verdade). Conectores via
  `useConnectorLayout`: estrutura em cinza tracejado + **caminho da requisição
  em destaque** (async em tracejado).
- **Simulador** (`utils/simulador.ts`, função pura): monta o caminho passo a
  passo com narração e latências ilustrativas. Leitura×Escrita + toggle
  **cache quente/frio**. Comportamentos didáticos: CQRS pula o domínio na
  leitura; MISS desce ao banco e **popula o cache** ("a próxima vira HIT");
  HIT responde em µs sem tocar o banco; escrita grava ACID (ou evento no log
  com ES), responde ao usuário e os passos **assíncronos** (Kafka → projeção,
  consistência eventual) continuam depois da resposta.
- **Runner**: nós acendem em sequência (~850ms/passo), log narrado passo a
  passo com badge de latência/async e **total percebido** ao final.
- Verificado no browser: leitura MISS ~28ms (CDN→Nginx→CQRS→Redis MISS→
  Postgres→popula cache), HIT ~17.5ms sem tocar o banco, escrita ~30ms com
  Kafka+projeção async. Axe: zero violações (corrigidos nav/link da sidebar
  colapsada e contraste de itens desabilitados da paleta).

## 5. Decisões técnicas
| Decisão | Escolha | Porquê |
|---|---|---|
| DnD | `@dnd-kit` | acessível, touch, leve; HTML5-DnD descartado |
| Conectores | SVG overlay medido | fidelidade ao sh; CSS puro não segue cards |
| Camadas navegáveis | componente próprio (sem React Flow) | interação de foco/expansão não é grafo |
| Ilustrações | SVG inline parametrizado | theme-aware, zero peso de imagem, padrão único |
| Motor de regras | funções puras + conteúdo declarativo | testável sem UI; regras viram conteúdo |

## 6. Riscos
- **Escopo do construtor** — mitigar: MVP com pilha vertical (sem grafo livre);
  grafo 2D só se o MVP validar.
- **Âncoras do scroll-spy com seções colapsáveis** — recalcular observers ao
  expandir/recolher (`ResizeObserver` no article).
- **Conteúdo v3 é o maior custo** — usar subagentes para redigir casos/
  armadilhas/extensões seguindo template rígido, como nas rodadas anteriores.
