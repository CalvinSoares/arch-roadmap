# Planejamento — Jornada (aba estilo Duolingo)

> Uma **aba de jogo** por cima do que já existe: um caminho sinuoso de lições
> (fases + perguntas), com desbloqueio, estrelas e path animado. Mockup interativo:
> ver o artifact publicado. Este doc é o plano técnico pra decidir antes de construir.

---

## 1. A ideia em uma frase

Transformar cada **roadmap** numa **jornada**: as **seções** viram **unidades**, e
cada **item/conceito** vira um **nó de lição** que você joga (um punhado de perguntas
do quiz sobre aquele conceito). Concluir um nó desbloqueia o próximo. É a mesma
mecânica que prende no Duolingo — trilha visual, progresso, streak, recompensa.

Não é substituir o roadmap analítico atual (o grafo/flow) — é uma **segunda lente**,
mais lúdica, sobre o mesmo conteúdo.

## 2. Princípio: reaproveitar, não recriar

O ponto forte do projeto é o conteúdo curado + o quiz. A jornada **não cria
conteúdo novo** — ela orquestra o que já existe:

| Peça da jornada | De onde vem (já existe) |
|---|---|
| Unidades | `RoadmapSection` (seções do roadmap) |
| Nós de lição | `RoadmapItem` + seu `conceito` (slug) |
| Perguntas da lição | O banco de quiz, filtrado pelo `conceito` do nó |
| Pré-requisitos / ordem | `RoadmapItem.prerequisitos` + ordem das seções |
| XP / streak / nível | Fase 1 (ledger `xp_events`, projeção, streak) |
| Desbloqueio | Função pura sobre o progresso (já temos `montarMapaDeFases`) |

Nós de item **sem** conceito (só recurso externo) viram **checkpoints de leitura**
(marcar como visto), não lição de quiz.

## 3. Estados de um nó (por usuário)

- **bloqueado** — anterior não concluído.
- **atual** — o próximo a fazer (pulsa, mostra "COMEÇAR").
- **concluído** — com **estrelas** (1–3) pela precisão da melhor tentativa.

Derivados do progresso que já guardamos: `progresso` (nó = `done`) + agregação de
`quiz_tentativas` (precisão → estrelas). Começa **sem tabela nova**; se quisermos
guardar estrelas/tentativas explicitamente, entra uma tabela enxuta `jornada_estado`
(user_id, no_id, estrelas, concluido_em) — mas dá pra derivar primeiro.

## 4. O fluxo da lição (a parte interativa)

1. Toca no nó **atual** → abre a lição em tela cheia.
2. Barra de progresso + **vidas (corações)** opcionais no topo.
3. N perguntas (reusa o componente de quiz), com feedback imediato certo/errado.
4. Tela final "Lição concluída" → **+XP** (servidor-autoritativo) + estrelas.
5. Marca o nó `done` (reusa `definirProgresso`) e o próximo vira **atual**.

Tudo servidor-autoritativo e idempotente, como na Fase 1: cada resposta reporta a
**ação** (`registrarAcertoQuiz` com `tentativaId`), o servidor concede o XP. Repetir
a lição não infla XP (chaves idempotentes).

## 5. O path animado (o visual)

- Caminho **sinuoso vertical** (SVG) ligando os nós em zigue-zague.
- Nós circulares com ícone por estado (★ concluído / ▶ atual / 🔒 bloqueado).
- Banners de **unidade** coloridos (usando as cores de categoria do tema).
- Animações (com `framer-motion`, já instalado): path desenhando na entrada, nós
  fazendo *pop* escalonado, nó atual pulsando, burst de XP ao concluir.
- Respeita `prefers-reduced-motion`. Tema claro/escuro pelos tokens do app.

## 6. Modelo de dados

Mínimo, na filosofia "conteúdo em Git, só estado no banco":

- **Sem tabela nova no começo**: estado do nó = `progresso` (done) + `quiz_tentativas`
  (precisão). Desbloqueio = função pura.
- **Se precisar** (estrelas persistidas, "perfeito", data de conclusão):
  `jornada_estado (user_id, no_id, estrelas, tentativas, concluido_em)` — PK
  composta, upsert idempotente. Reconstruível do ledger/tentativas.

## 7. Fases de entrega

1. **P1 — Path estático** ✅ trilha sinuosa com estados vindos do progresso;
   `/jornada` (seletor) + `/jornada/[slug]`; nó levava ao conceito.
2. **P2 — Lição embutida** ✅ `LicaoModal` reusa `gerarRodada`: barra de progresso,
   **vidas soft**, feedback por pergunta, tela final com XP/estrelas; concluir marca
   o nó (`definir`→servidor idempotente). Nó de leitura (sem conceito) vira
   checkpoint. Verificado ao vivo ponta a ponta.
3. **P3 — Estrelas + animações** ✅ estrelas (precisão) persistidas em localStorage
   e exibidas nos nós; framer-motion: path desenhando (pathLength), pop dos nós em
   cascata, burst de estrelas ao concluir; respeita `prefers-reduced-motion`.
4. **P4 — Polimento** ✅: estrelas no servidor (`jornada_estado`, híbrido
   local+conta), nós **lendários** (3★ → coroa + glow), **meta diária** (anel de XP,
   só logado), **haptics** leves (navigator.vibrate), **checkpoints de revisão**
   (decoração por unidade → `modo="revisao"`) e **som** Web Audio com mute.
5. **P5 — Interatividade & revisão de erros** ✅: **erro volta no fim da lição**
   (fila de repetição estilo Duolingo — só fecha com tudo certo; selo "Erro
   anterior"); estrelas pela *limpeza* (0 erros = 3★); **replay** de nós concluídos
   (bolha "Praticar" no hover) + **Refazer trilha** (reset local com confirmação;
   XP do ledger fica); transições animadas entre perguntas, shake no erro,
   estrelas em cascata, count-up de XP, "Praticar de novo" na tela final; layout
   consertado (bolha × banner medido no browser, rótulos responsivos,
   overflow-x-clip). Guard de clique-duplo no "Continuar" (bug real achado no smoke).

## 7.1 Próximas fases — redesign do path (análise Duolingo)

O que faz o path do Duolingo funcionar (e o nosso parecer genérico): nós são
**botões 3D** (disco chapado + borda de espessura escura embaixo, que afunda ao
apertar), futuro é **cinza neutro** (estrela apagada — cadeado só no tooltip),
só o ativo tem cor + bolha START **balançando continuamente**, decorações com
propósito (baú de recompensa, troféu de fim de unidade) quebram a monotonia, e o
header da seção fica **fixo** enquanto se rola a unidade.

- **P6 — Redesign 3D do path** ✅: nós-botão com espessura e press físico
  (box-shadow rim + `group-active:translate-y`); estados repensados (ativo
  colorido + START com bob contínuo, futuro cinza com estrela apagada — sem
  cadeado, concluído dourado com check, lendário coroa); banner de unidade
  **sticky** em fluxo (verificado pinando em 64px); baú no meio e troféu no fim
  de cada unidade (acendem quando alcançados; recompensa real fica pra P8).
  **Polish pós-feedback**: **linhas removidas** de vez (Duolingo não tem — o SVG
  inteiro saiu); nós **ancorados pelo topo do disco** (a âncora no botão inteiro
  deixava a altura variável do rótulo empurrar a bolha COMEÇAR pra cima do
  banner — causa-raiz das sobreposições); entrada por **scroll** (`whileInView`)
  em vez de cascata no load; banner virou **cartão tingido** pela cor da unidade
  (legível nos 2 temas, sem branco sobre pastel); rótulos 13px semibold com
  hierarquia por estado (atual aceso, futuro apagado). Medido no browser: 110px
  de folga bolha×banner, 0 colisões rótulo×disco, 0 linhas, pops disparando no
  scroll (opacity 0→1), console limpo.
- **P6.2 — Identidade DevMappa** ✅ (pós-feedback "está igual demais ao
  Duolingo"): nós viraram **squircles** (rounded-22px — a forma da marca: logo e
  medalhão de nível), **marco numerado** em mono no canto de cada nó (jeito mapa
  de engenharia), ícone **semântico** (checkpoint de leitura = BookOpen; lição =
  estrela), **glow ambiente** no nó atual (a linguagem de brilho do site),
  contador `x/y` no banner de cada unidade. Cursor: regra global em
  `@layer base` devolve o pointer aos botões (Tailwind v4 tirou), sem atropelar
  `cursor-not-allowed` (aprendizado: CSS sem layer vence utilities por ordem de
  camada — a regra TEM que viver em `@layer base`).
- **P7 — Rail lateral de jogo (desktop)** ✅: grid
  `lg:grid-cols-[minmax(0,1fr)_320px]` com `aside` sticky (top-20): meta diária,
  **missões do dia** com barras (action enxuta `missoesDeHoje` em status.ts),
  atalhos Liga/Amigos/Perfil; anônimo vê convite de conta no lugar
  ("login é acréscimo"). Mobile: meta diária no topo (lg:hidden), rail some.
- **P8 — Recompensas de verdade** ✅: baú concede recompensa **servidor-autoritativa
  e idempotente** — `abrirBau(slug, seção)` confere no `progresso` da conta que o
  nó do meio foi concluído, credita via ledger (`bau:<slug>:<seção>` → +25 XP) e
  **+1 freeze** pega carona na idempotência do evento (só incrementa quando o
  INSERT acontece); reabrir nunca paga de novo. `bausAbertos` lê o ledger p/ o
  estado "coletado ✓". Troféu vira botão com **confete** (14 partículas) ao
  fechar a unidade e no clique. Anônimo: baú/troféu clicáveis com toast de
  convite (servidor nem é chamado). Rótulo "bau" no histórico do perfil.
  Verificado no browser: troféu 14 partículas + toast, baú ativo → guard
  anônimo "Entre para coletar", **0 sobreposições** entre 49 elementos, sem
  scroll horizontal, console limpo. Correção de layout junto: decorações usam
  `ladoOposto` (o espelho 100−x caía sobre o nó perto do centro) e ROW_H 128→150
  + AMP/FASE ajustados — some a sobreposição de discos do print.

## 7.2 Qualidade da pergunta (pós-path)

O path/baú/rail já está “pronto de produto”. O que falta — e o que mais afeta
confiança — é **a pergunta valer a pena**.

- **P0 — Confiança no XP/desempenho** ✅: replay (“praticar de novo” / nó já
  feito) **não credita** XP de quiz; toasts `+XP` mid-lição silenciados na
  jornada (nível ainda celebra); chaves `checkpoint:…` **fora** do mapa de
  desempenho / pontos fracos.
- **P1 — Anti-hollow nas lições de conceito** ✅: `gerarDesafiosLicao` +
  `desafioOco` barram VF-de-resumo, lacuna-de-título e “se chama”; preferem
  dois-códigos / ordenar / MCQ do quiz.
- **P2 — Profundidade de checkpoint** ✅: ≥3 desafios curados por nó; recursos
  externos na UI da lição; `descricao` nos nós FE/BE magros.
- **P3 — Polimento** ✅ (esta leva): bolha “Praticar” também em checkpoint;
  estrelas mais rígidas em lição curta; parear/ordenar com progresso, limpar e
  feedback visual mais claro.
- **P4 leftover — Revisão + som** ✅: decoração de revisão por unidade (abre
  `modo="revisao"` com `slugsFracos`); som Web Audio (acerto/erro/conclusão) com
  mute persistente e acorde curto sob `prefers-reduced-motion`.

Regra permanente: pergunta testa **ideia**, não o rótulo do nó. Specs em
`desafios.spec.ts` / `checkpoints.spec.ts` / `desempenho.spec.ts` guardam isso.

## 8. Decisões em aberto (o que preciso de você)

1. **Escopo da jornada:** uma por roadmap (com seletor) **ou** uma jornada única
   unificando tudo? → *Recomendo: uma por roadmap* (reusa a estrutura, começa simples).
2. **Vidas/corações:** incluir (pressão estilo Duolingo) ou pular (menos punitivo)?
   → *Recomendo: soft* — mostrar corações mas **sem travar** progresso, fiel ao
   "reter com respeito" do §7 do plano-mãe.
3. **Convivência com o roadmap atual:** aba **nova** `/jornada` ao lado do flow, ou
   substituir a visão do roadmap? → *Recomendo: aba nova* (mantém o grafo analítico
   E o path lúdico).
4. **Lições sem conceito:** checkpoints de leitura para itens só-recurso? → *Recomendo: sim.*

Assim que você decidir 1–4, começo pela **P1** (path + estados, reusando o quiz).
