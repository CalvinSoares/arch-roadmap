# DevAtlas — Plano das próximas quatro features

> Modo estudo, Comparador de conceitos, Quiz das armadilhas e Export ADR.
> Os quatro exploram conteúdo e estado que **já existem** — nenhum exige
> escrever conceito novo, e nenhum exige backend.
>
> **O que já foi entregue não está aqui**: mora em `/novidades`
> (`content/novidades/registro.ts`), que é a fonte única do histórico. O mesmo
> arquivo publica este backlog para o usuário, em `A_SEGUIR` — quando uma
> feature sai, ela migra de `A_SEGUIR` para a entrega, e há teste garantindo
> que as duas listas nunca a contenham ao mesmo tempo.

---

## 0. O que já está no lugar (o que torna isto barato)

| Ativo | Onde | Serve a |
|---|---|---|
| Progresso por nó, em localStorage | `use-roadmap-progress.ts` | Modo estudo |
| `useArmazenamentoLocal` (SSR-safe, multi-aba) | `shared/hook/` | Estudo, Quiz |
| 70 itens de roadmap com `conceito` | `content/roadmaps/*` | Estudo |
| 99 armadilhas tituladas | 33 conceitos | Quiz |
| 99 casos de uso com trade-off | 33 conceitos | Comparador |
| Arquétipo `antes-depois` | `ilustracao-antes-depois.tsx` | Comparador |
| `revisarProjeto()` + `calcularScore()` | `content/construtor/` | ADR |
| `codificarEstado()` (share por URL) | `construtor.hook.ts` | ADR |
| Barra de qualidade automatizada | `content/conceitos.spec.ts` | Todos |

**Restrição herdada:** front-only, SSG, sem backend. Tudo que for progresso do
usuário mora em `localStorage`; tudo que for conteúdo é TypeScript tipado e
validado por spec.

---

## 1. Export ADR — Construtor → Markdown

> **Primeira a fazer.** É a de menor superfície (uma função pura + um botão),
> não cria rota nem modelo de dados, e entrega valor imediato a quem já usa o
> Construtor.

### O que é
Um botão no rodapé do painel que transforma o projeto montado num **Architecture
Decision Record** em Markdown — o formato que times usam para registrar decisão
de arquitetura. O painel já calcula tudo; falta só serializar.

### Modelo
```ts
// app/(app)/construtor/utils/adr.ts  — função pura, testável sem UI
export interface DadosADR {
  titulo: string;              // "ADR — Arquitetura do projeto"
  data: string;                // injetada, nunca new Date() interno
  estado: EstadoProjeto;
  score: ScoreProjeto;
  revisao: RevisaoProjeto;
  insights: Insight[];
  linkCompartilhavel: string;  // ?p=<base64>, permite reabrir no Construtor
}

export function gerarADR(d: DadosADR): string;
```

### Estrutura do documento
1. **Contexto** — as camadas na ordem, com padrões e tecnologias de cada uma.
2. **Decisão** — o veredito de `revisarProjeto()` + as sinergias como
   justificativa ("CQRS porque leitura e escrita divergem").
3. **Consequências** — as 5 métricas em tabela, e os alertas como riscos
   assumidos.
4. **Próximos passos** — a lista numerada que a revisão já produz.
5. **Rodapé** — link para reabrir o projeto no Construtor.

### Entrega
- Copiar para a área de transferência (mesmo caminho do "Compartilhar", que já
  funciona) **e** baixar `.md` via `Blob` + `URL.createObjectURL`.
- Botão no rodapé fixo do painel, ao lado de Compartilhar/Limpar.

### Testes
- `adr.spec.ts`: para os 6 templates, o Markdown gerado contém todas as camadas,
  todas as métricas e o veredito; o link do rodapé decodifica de volta para o
  mesmo estado (ida e volta).
- Projeto vazio não gera documento — o botão fica desabilitado.

### Riscos
- **Data**: `gerarADR` não pode chamar `new Date()` (quebra determinismo do
  teste). A data entra por parâmetro, como já se faz no simulador.
- **Tamanho do link**: projetos grandes viram base64 longo. Medir com o
  template maior; se passar de ~2000 caracteres, omitir o link e explicar.

### Esforço
~1 sessão. Sem rota nova, sem estado novo, sem risco de regressão.

---

## 2. Comparador de conceitos

> **Segunda.** Conteúdo novo quase de graça, forte para busca orgânica, e
> reaproveita o arquétipo `antes-depois` recém-construído.

### O que é
Páginas dedicadas aos duelos que os textos já travam nas seções de extensão:
Proxy × Decorator, Strategy × Template Method, Mediator × Observer, Adapter ×
Facade, Composite × Decorator, Bridge × Strategy, State × Strategy.

Rota: `/comparar/[par]` — ex. `/comparar/proxy-vs-decorator`.

### Modelo
```ts
// content/comparacoes/registro.ts
export interface Comparacao {
  /** slug derivado: `${a}-vs-${b}`, com a e b em ordem alfabética. */
  a: string;                    // slug de conceito
  b: string;                    // slug de conceito
  /** a frase que resolve a dúvida em uma linha. */
  vereditoRapido: string;
  /** eixos de comparação — a tabela é o coração da página. */
  criterios: {
    pergunta: string;           // "O que muda na interface?"
    ladoA: string;
    ladoB: string;
  }[];
  /** quando escolher cada um, em uma frase por lado. */
  escolhaA: string;
  escolhaB: string;
  /** o erro que faz as pessoas confundirem os dois. */
  confusaoComum: string;
}
```

### Página
1. Hero com os dois títulos e o **veredito rápido** (o que 90% dos visitantes
   vieram buscar — entrega logo).
2. Tabela de critérios, uma linha por eixo, responsiva (vira cards no mobile).
3. Bloco `antes-depois` reaproveitando o componente existente, com os dois
   lados sendo os dois padrões — não "com/sem".
4. "A confusão comum" — parágrafo curto.
5. Links para os dois conceitos completos.

### Descoberta
- Índice em `/comparar`.
- Bloco "Costuma ser confundido com" na página do conceito, derivado do
  registro (mesmo padrão do `roadmapsDoConceito`: **derivado, nunca
  armazenado no conceito**).
- Entradas no Ctrl+K.

### Testes
- Slugs `a` e `b` existem e são diferentes.
- Slug da rota é determinístico (ordem alfabética) — sem duas URLs para o mesmo
  par.
- `criterios.length >= 3`, textos com tamanho mínimo (mesma barra de qualidade
  dos conceitos).
- Toda comparação é alcançável a partir das páginas dos dois conceitos.

### Riscos
- **Duplicação de conteúdo**: o texto do comparador não pode ser recorte do
  conceito, senão canibaliza a própria busca. A tabela de critérios é formato
  novo, não repetição — manter essa disciplina na revisão.
- **Combinações demais**: 33 conceitos dão 528 pares possíveis. Só entram os
  duelos que já aparecem escritos nas extensões (~7). Crescer por demanda.

### Esforço
~1 sessão para a infraestrutura + 7 comparações (o conteúdo é curto: tabela e
frases, não ensaio).

---

## 3. Modo estudo

> **Terceira.** É a de maior valor recorrente, e a única que precisa de um
> modelo de dados novo. Depende de decisões de produto que valem discutir antes.

### O que é
Três capacidades sobre o progresso que já existe:

**(a) Continue de onde parou** — a home e a página do roadmap mostram o próximo
item pendente da trilha em que você mais avançou.

**(b) Trilha sugerida** — ordena os pendentes por pré-requisito implícito
(ordem na trilha) e dificuldade do conceito, propondo os 3 próximos.

**(c) Revisão espaçada** — conceitos marcados como concluídos voltam para
revisão em intervalos crescentes.

### Modelo
O progresso atual (`Record<idDoNo, ProgressoNo>`) **não guarda quando** algo foi
concluído — e a revisão espaçada precisa disso. Duas opções:

| Opção | Custo | Consequência |
|---|---|---|
| Migrar para `{ status, em }` | migração de dados | Histórico correto desde o começo |
| Store separada `devatlas:estudo:v1` | nenhuma | Quem já marcou tudo não tem data de conclusão |

**Recomendação: store separada.** O progresso do roadmap é uma coisa (mapa de
estudo); a agenda de revisão é outra (memória). Misturar os dois obriga a
migrar dados de quem já usa, e a chave `:v2` que já tivemos que criar na
sidebar mostrou que migração silenciosa custa caro.

```ts
// shared/types/estudo.ts
export interface RevisaoConceito {
  slug: string;
  /** quantas revisões corretas seguidas — define o próximo intervalo. */
  nivel: number;             // 0..5
  /** ISO date da última revisão. */
  revisadoEm: string;
  /** ISO date calculado: revisadoEm + INTERVALOS[nivel]. */
  proximaEm: string;
}

/** Dias entre revisões por nível. Curva simples, sem SM-2. */
export const INTERVALOS = [1, 3, 7, 16, 35, 90];
```

Uma revisão "acertei" sobe o nível; "não lembrei" volta para 0. Sem
autoavaliação de 0 a 5 — duas opções bastam e a fricção despenca.

### Rota
`/estudar` — painel único com: o que revisar hoje, os 3 próximos da trilha, e
o resumo de progresso por roadmap.

### Testes
- `estudo.spec.ts` (funções puras, com data injetada):
  - `proximosDaTrilha()` respeita a ordem da seção e ignora itens sem conceito
    (72 dos 142 itens não têm conceito — não são estudáveis);
  - `devidosHoje()` com data fixa devolve exatamente os vencidos;
  - acertar sobe um nível, errar zera, o nível satura em 5;
  - conceito nunca revisado não aparece como devido (só entra na fila depois
    de marcado como concluído no roadmap).

### Riscos
- **Data de hoje**: todo cálculo recebe `agora: Date` por parâmetro. Nunca
  `new Date()` dentro de função pura — a suíte já segue essa regra.
- **SSG + estado local**: `/estudar` renderiza estático e hidrata do
  localStorage; o esqueleto precisa ser um estado vazio honesto, não um flash
  de "nada para revisar".
- **Escopo**: revisão espaçada sem cartões é revisão de *conceito inteiro*. A
  pergunta "você lembra do Proxy?" é vaga. **Casa com o Quiz** — daí a ordem
  sugerida colocar o Quiz depois: ele vira o conteúdo da revisão.

### Esforço
~2 sessões: (a) e (b) numa, (c) na outra.

---

## 4. Quiz das armadilhas

> **Quarta.** Depende do Modo estudo para brilhar (vira o conteúdo da revisão),
> mas funciona sozinho como página avulsa.

### O que é
As **99 armadilhas** já escritas viram perguntas. Cada uma tem `titulo` (o erro,
em forma de rótulo) e `texto` (a explicação) — material pronto para dois
formatos:

**Formato A — "de qual padrão é esta armadilha?"** Mostra o `texto` de uma
armadilha com os nomes dos padrões removidos, e oferece 4 conceitos como
alternativas. Distratores vêm dos `relacionados` do conceito certo, que são
justamente os mais confundíveis.

**Formato B — verdadeiro ou falso.** Mostra o `titulo` da armadilha afirmado
sobre um conceito (certo ou errado) e pergunta se procede.

**O Formato A é melhor** e não exige escrever nada: o texto já existe, os
distratores são derivados. O B exige gerar afirmações falsas plausíveis, o que
na prática vira redação nova.

### Modelo
```ts
// shared/lib/quiz.ts — puro, sem estado
export interface Pergunta {
  id: string;                  // `${slug}:${indice}` — estável
  enunciado: string;           // texto da armadilha, com o nome do padrão mascarado
  correta: string;             // slug
  alternativas: string[];      // 4 slugs, embaralhados de forma determinística
  explicacao: string;          // titulo da armadilha + link para o conceito
}

export function gerarPerguntas(semente: number, quantas: number): Pergunta[];
```

Embaralhamento **determinístico por semente** (nada de `Math.random()` —
mesma regra dos workflows e dos testes). A semente pode vir do dia, para um
"quiz do dia" estável.

### O problema real: mascarar o nome
Muitas armadilhas citam o padrão no texto ("Proxy remoto sem timeout..."). A
resposta vazaria. Duas saídas:
1. **Substituição por marcador** — trocar ocorrências do título do conceito por
   "este padrão". Automático, mas produz frases estranhas em alguns casos.
2. **Campo opcional `enunciadoQuiz`** na armadilha, preenchido só onde a
   substituição falhar.

**Fazer as duas**: substituição automática como padrão, campo de escape para os
casos ruins. Um teste lista quais armadilhas ainda vazam o nome depois da
substituição — e essa lista vira a fila de trabalho.

### Testes
- Nenhum enunciado contém o título do conceito correto (o teste que gera a fila
  de trabalho acima).
- Toda pergunta tem exatamente 4 alternativas, sem repetição, com a correta
  entre elas.
- Mesma semente → mesmas perguntas na mesma ordem.
- Todo slug de alternativa existe.

### Riscos
- **Qualidade dos distratores**: `relacionados` tem 48 de 82 ligações em mão
  única. Para o quiz, usar a união bidirecional (se A→B, B também serve de
  distrator de A) — senão alguns conceitos ficam sem distratores bons.
- **Sensação de pegadinha**: se o enunciado mascarado ficar ambíguo, o usuário
  erra por má redação, não por desconhecimento. O teste de vazamento ajuda,
  mas exige revisão humana da amostra.

### Esforço
~1 sessão para o motor + página, mais o tempo de revisar os enunciados que a
substituição automática estragar.

---

## 5. Ordem recomendada e por quê

```
ADR  →  Comparador  →  Modo estudo  →  Quiz
 │          │              │            │
 │          │              │            └─ vira o conteúdo da revisão espaçada
 │          │              └─ precisa de modelo de dados novo; decidir antes
 │          └─ conteúdo novo, sem estado, ótimo para busca
 └─ menor superfície, valor imediato, zero risco de regressão
```

1. **ADR** primeiro por ser autocontido: uma função pura, um botão, nenhum
   modelo novo. Fecha um ciclo que o Construtor deixa em aberto (você monta,
   analisa… e daí?).
2. **Comparador** por ser o melhor retorno de conteúdo por esforço, e por já
   ter o componente visual pronto.
3. **Modo estudo** depois, porque é o único que pede decisão de modelagem
   (store separada × migração) e merece a discussão antes do código.
4. **Quiz** por último para nascer já acoplado à revisão espaçada — sozinho é
   um brinquedo; dentro do modo estudo, é o mecanismo.

### Regras que valem para as quatro
- **Nada de `new Date()` ou `Math.random()` dentro de função pura** — data e
  semente entram por parâmetro. É o que mantém a suíte determinística.
- **Nada armazenado que possa ser derivado.** O campo `roadmapNodes` já nos
  ensinou: duas fontes de verdade viram uma fonte errada em silêncio.
- **Chave de localStorage nova nasce versionada** (`:v1`), para migração futura
  não precisar adivinhar formato.
- **Toda feature entra com spec.** A barra de qualidade automatizada é o que
  permitiu dobrar o catálogo sem medo.
- **Registrar na entrega** (`NOVIDADES`) e remover de `A_SEGUIR` — os dois
  nunca coexistem, e há teste garantindo isso.
