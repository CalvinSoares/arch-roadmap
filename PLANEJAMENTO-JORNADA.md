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
4. **P4 — Polimento:** estrelas no servidor (`jornada_estado`), nós "lendários",
   meta diária (anel), checkpoints de revisão, som/haptics leves.

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
