# DevAtlas ÔÇö Plano das pr├│ximas quatro features

> Modo estudo, Comparador de conceitos, Quiz das armadilhas e Export ADR.
> Os quatro exploram conte├║do e estado que **j├í existem** ÔÇö nenhum exige
> escrever conceito novo, e nenhum exige backend.
>
> **O que j├í foi entregue n├úo est├í aqui**: mora em `/novidades`
> (`content/novidades/registro.ts`), que ├® a fonte ├║nica do hist├│rico. O mesmo
> arquivo publica este backlog para o usu├írio, em `A_SEGUIR` ÔÇö quando uma
> feature sai, ela migra de `A_SEGUIR` para a entrega, e h├í teste garantindo
> que as duas listas nunca a contenham ao mesmo tempo.

---

## 0. O que j├í est├í no lugar (o que torna isto barato)

| Ativo | Onde | Serve a |
|---|---|---|
| Progresso por n├│, em localStorage | `use-roadmap-progress.ts` | Modo estudo |
| `useArmazenamentoLocal` (SSR-safe, multi-aba) | `shared/hook/` | Estudo, Quiz |
| 70 itens de roadmap com `conceito` | `content/roadmaps/*` | Estudo |
| 99 armadilhas tituladas | 33 conceitos | Quiz |
| 99 casos de uso com trade-off | 33 conceitos | Comparador |
| Arqu├®tipo `antes-depois` | `ilustracao-antes-depois.tsx` | Comparador |
| `revisarProjeto()` + `calcularScore()` | `content/construtor/` | ADR |
| `codificarEstado()` (share por URL) | `construtor.hook.ts` | ADR |
| Barra de qualidade automatizada | `content/conceitos.spec.ts` | Todos |

**Restri├º├úo herdada:** front-only, SSG, sem backend. Tudo que for progresso do
usu├írio mora em `localStorage`; tudo que for conte├║do ├® TypeScript tipado e
validado por spec.

---

## 1. Export ADR ÔÇö Construtor ÔåÆ Markdown

> **Primeira a fazer.** ├ë a de menor superf├¡cie (uma fun├º├úo pura + um bot├úo),
> n├úo cria rota nem modelo de dados, e entrega valor imediato a quem j├í usa o
> Construtor.

### O que ├®
Um bot├úo no rodap├® do painel que transforma o projeto montado num **Architecture
Decision Record** em Markdown ÔÇö o formato que times usam para registrar decis├úo
de arquitetura. O painel j├í calcula tudo; falta s├│ serializar.

### Modelo
```ts
// app/(app)/construtor/utils/adr.ts  ÔÇö fun├º├úo pura, test├ível sem UI
export interface DadosADR {
  titulo: string;              // "ADR ÔÇö Arquitetura do projeto"
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
1. **Contexto** ÔÇö as camadas na ordem, com padr├Áes e tecnologias de cada uma.
2. **Decis├úo** ÔÇö o veredito de `revisarProjeto()` + as sinergias como
   justificativa ("CQRS porque leitura e escrita divergem").
3. **Consequ├¬ncias** ÔÇö as 5 m├®tricas em tabela, e os alertas como riscos
   assumidos.
4. **Pr├│ximos passos** ÔÇö a lista numerada que a revis├úo j├í produz.
5. **Rodap├®** ÔÇö link para reabrir o projeto no Construtor.

### Entrega
- Copiar para a ├írea de transfer├¬ncia (mesmo caminho do "Compartilhar", que j├í
  funciona) **e** baixar `.md` via `Blob` + `URL.createObjectURL`.
- Bot├úo no rodap├® fixo do painel, ao lado de Compartilhar/Limpar.

### Testes
- `adr.spec.ts`: para os 6 templates, o Markdown gerado cont├®m todas as camadas,
  todas as m├®tricas e o veredito; o link do rodap├® decodifica de volta para o
  mesmo estado (ida e volta).
- Projeto vazio n├úo gera documento ÔÇö o bot├úo fica desabilitado.

### Riscos
- **Data**: `gerarADR` n├úo pode chamar `new Date()` (quebra determinismo do
  teste). A data entra por par├ómetro, como j├í se faz no simulador.
- **Tamanho do link**: projetos grandes viram base64 longo. Medir com o
  template maior; se passar de ~2000 caracteres, omitir o link e explicar.

### Esfor├ºo
~1 sess├úo. Sem rota nova, sem estado novo, sem risco de regress├úo.

---

## 2. Comparador de conceitos

> **Segunda.** Conte├║do novo quase de gra├ºa, forte para busca org├ónica, e
> reaproveita o arqu├®tipo `antes-depois` rec├®m-constru├¡do.

### O que ├®
P├íginas dedicadas aos duelos que os textos j├í travam nas se├º├Áes de extens├úo:
Proxy ├ù Decorator, Strategy ├ù Template Method, Mediator ├ù Observer, Adapter ├ù
Facade, Composite ├ù Decorator, Bridge ├ù Strategy, State ├ù Strategy.

Rota: `/comparar/[par]` ÔÇö ex. `/comparar/proxy-vs-decorator`.

### Modelo
```ts
// content/comparacoes/registro.ts
export interface Comparacao {
  /** slug derivado: `${a}-vs-${b}`, com a e b em ordem alfab├®tica. */
  a: string;                    // slug de conceito
  b: string;                    // slug de conceito
  /** a frase que resolve a d├║vida em uma linha. */
  vereditoRapido: string;
  /** eixos de compara├º├úo ÔÇö a tabela ├® o cora├º├úo da p├ígina. */
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

### P├ígina
1. Hero com os dois t├¡tulos e o **veredito r├ípido** (o que 90% dos visitantes
   vieram buscar ÔÇö entrega logo).
2. Tabela de crit├®rios, uma linha por eixo, responsiva (vira cards no mobile).
3. Bloco `antes-depois` reaproveitando o componente existente, com os dois
   lados sendo os dois padr├Áes ÔÇö n├úo "com/sem".
4. "A confus├úo comum" ÔÇö par├ígrafo curto.
5. Links para os dois conceitos completos.

### Descoberta
- ├ìndice em `/comparar`.
- Bloco "Costuma ser confundido com" na p├ígina do conceito, derivado do
  registro (mesmo padr├úo do `roadmapsDoConceito`: **derivado, nunca
  armazenado no conceito**).
- Entradas no Ctrl+K.

### Testes
- Slugs `a` e `b` existem e s├úo diferentes.
- Slug da rota ├® determin├¡stico (ordem alfab├®tica) ÔÇö sem duas URLs para o mesmo
  par.
- `criterios.length >= 3`, textos com tamanho m├¡nimo (mesma barra de qualidade
  dos conceitos).
- Toda compara├º├úo ├® alcan├º├ível a partir das p├íginas dos dois conceitos.

### Riscos
- **Duplica├º├úo de conte├║do**: o texto do comparador n├úo pode ser recorte do
  conceito, sen├úo canibaliza a pr├│pria busca. A tabela de crit├®rios ├® formato
  novo, n├úo repeti├º├úo ÔÇö manter essa disciplina na revis├úo.
- **Combina├º├Áes demais**: 33 conceitos d├úo 528 pares poss├¡veis. S├│ entram os
  duelos que j├í aparecem escritos nas extens├Áes (~7). Crescer por demanda.

### Esfor├ºo
~1 sess├úo para a infraestrutura + 7 compara├º├Áes (o conte├║do ├® curto: tabela e
frases, n├úo ensaio).

---

## 3. Modo estudo

> **Terceira.** ├ë a de maior valor recorrente, e a ├║nica que precisa de um
> modelo de dados novo. Depende de decis├Áes de produto que valem discutir antes.

### O que ├®
Tr├¬s capacidades sobre o progresso que j├í existe:

**(a) Continue de onde parou** ÔÇö a home e a p├ígina do roadmap mostram o pr├│ximo
item pendente da trilha em que voc├¬ mais avan├ºou.

**(b) Trilha sugerida** ÔÇö ordena os pendentes por pr├®-requisito impl├¡cito
(ordem na trilha) e dificuldade do conceito, propondo os 3 pr├│ximos.

**(c) Revis├úo espa├ºada** ÔÇö conceitos marcados como conclu├¡dos voltam para
revis├úo em intervalos crescentes.

### Modelo
O progresso atual (`Record<idDoNo, ProgressoNo>`) **n├úo guarda quando** algo foi
conclu├¡do ÔÇö e a revis├úo espa├ºada precisa disso. Duas op├º├Áes:

| Op├º├úo | Custo | Consequ├¬ncia |
|---|---|---|
| Migrar para `{ status, em }` | migra├º├úo de dados | Hist├│rico correto desde o come├ºo |
| Store separada `devatlas:estudo:v1` | nenhuma | Quem j├í marcou tudo n├úo tem data de conclus├úo |

**Recomenda├º├úo: store separada.** O progresso do roadmap ├® uma coisa (mapa de
estudo); a agenda de revis├úo ├® outra (mem├│ria). Misturar os dois obriga a
migrar dados de quem j├í usa, e a chave `:v2` que j├í tivemos que criar na
sidebar mostrou que migra├º├úo silenciosa custa caro.

```ts
// shared/types/estudo.ts
export interface RevisaoConceito {
  slug: string;
  /** quantas revis├Áes corretas seguidas ÔÇö define o pr├│ximo intervalo. */
  nivel: number;             // 0..5
  /** ISO date da ├║ltima revis├úo. */
  revisadoEm: string;
  /** ISO date calculado: revisadoEm + INTERVALOS[nivel]. */
  proximaEm: string;
}

/** Dias entre revis├Áes por n├¡vel. Curva simples, sem SM-2. */
export const INTERVALOS = [1, 3, 7, 16, 35, 90];
```

Uma revis├úo "acertei" sobe o n├¡vel; "n├úo lembrei" volta para 0. Sem
autoavalia├º├úo de 0 a 5 ÔÇö duas op├º├Áes bastam e a fric├º├úo despenca.

### Rota
`/estudar` ÔÇö painel ├║nico com: o que revisar hoje, os 3 pr├│ximos da trilha, e
o resumo de progresso por roadmap.

### Testes
- `estudo.spec.ts` (fun├º├Áes puras, com data injetada):
  - `proximosDaTrilha()` respeita a ordem da se├º├úo e ignora itens sem conceito
    (72 dos 142 itens n├úo t├¬m conceito ÔÇö n├úo s├úo estud├íveis);
  - `devidosHoje()` com data fixa devolve exatamente os vencidos;
  - acertar sobe um n├¡vel, errar zera, o n├¡vel satura em 5;
  - conceito nunca revisado n├úo aparece como devido (s├│ entra na fila depois
    de marcado como conclu├¡do no roadmap).

### Riscos
- **Data de hoje**: todo c├ílculo recebe `agora: Date` por par├ómetro. Nunca
  `new Date()` dentro de fun├º├úo pura ÔÇö a su├¡te j├í segue essa regra.
- **SSG + estado local**: `/estudar` renderiza est├ítico e hidrata do
  localStorage; o esqueleto precisa ser um estado vazio honesto, n├úo um flash
  de "nada para revisar".
- **Escopo**: revis├úo espa├ºada sem cart├Áes ├® revis├úo de *conceito inteiro*. A
  pergunta "voc├¬ lembra do Proxy?" ├® vaga. **Casa com o Quiz** ÔÇö da├¡ a ordem
  sugerida colocar o Quiz depois: ele vira o conte├║do da revis├úo.

### Esfor├ºo
~2 sess├Áes: (a) e (b) numa, (c) na outra.

---

## 4. Quiz das armadilhas

> **Quarta.** Depende do Modo estudo para brilhar (vira o conte├║do da revis├úo),
> mas funciona sozinho como p├ígina avulsa.

### O que ├®
As **99 armadilhas** j├í escritas viram perguntas. Cada uma tem `titulo` (o erro,
em forma de r├│tulo) e `texto` (a explica├º├úo) ÔÇö material pronto para dois
formatos:

**Formato A ÔÇö "de qual padr├úo ├® esta armadilha?"** Mostra o `texto` de uma
armadilha com os nomes dos padr├Áes removidos, e oferece 4 conceitos como
alternativas. Distratores v├¬m dos `relacionados` do conceito certo, que s├úo
justamente os mais confund├¡veis.

**Formato B ÔÇö verdadeiro ou falso.** Mostra o `titulo` da armadilha afirmado
sobre um conceito (certo ou errado) e pergunta se procede.

**O Formato A ├® melhor** e n├úo exige escrever nada: o texto j├í existe, os
distratores s├úo derivados. O B exige gerar afirma├º├Áes falsas plaus├¡veis, o que
na pr├ítica vira reda├º├úo nova.

### Modelo
```ts
// shared/lib/quiz.ts ÔÇö puro, sem estado
export interface Pergunta {
  id: string;                  // `${slug}:${indice}` ÔÇö est├ível
  enunciado: string;           // texto da armadilha, com o nome do padr├úo mascarado
  correta: string;             // slug
  alternativas: string[];      // 4 slugs, embaralhados de forma determin├¡stica
  explicacao: string;          // titulo da armadilha + link para o conceito
}

export function gerarPerguntas(semente: number, quantas: number): Pergunta[];
```

Embaralhamento **determin├¡stico por semente** (nada de `Math.random()` ÔÇö
mesma regra dos workflows e dos testes). A semente pode vir do dia, para um
"quiz do dia" est├ível.

### O problema real: mascarar o nome
Muitas armadilhas citam o padr├úo no texto ("Proxy remoto sem timeout..."). A
resposta vazaria. Duas sa├¡das:
1. **Substitui├º├úo por marcador** ÔÇö trocar ocorr├¬ncias do t├¡tulo do conceito por
   "este padr├úo". Autom├ítico, mas produz frases estranhas em alguns casos.
2. **Campo opcional `enunciadoQuiz`** na armadilha, preenchido s├│ onde a
   substitui├º├úo falhar.

**Fazer as duas**: substitui├º├úo autom├ítica como padr├úo, campo de escape para os
casos ruins. Um teste lista quais armadilhas ainda vazam o nome depois da
substitui├º├úo ÔÇö e essa lista vira a fila de trabalho.

### Testes
- Nenhum enunciado cont├®m o t├¡tulo do conceito correto (o teste que gera a fila
  de trabalho acima).
- Toda pergunta tem exatamente 4 alternativas, sem repeti├º├úo, com a correta
  entre elas.
- Mesma semente ÔåÆ mesmas perguntas na mesma ordem.
- Todo slug de alternativa existe.

### Riscos
- **Qualidade dos distratores**: `relacionados` tem 48 de 82 liga├º├Áes em m├úo
  ├║nica. Para o quiz, usar a uni├úo bidirecional (se AÔåÆB, B tamb├®m serve de
  distrator de A) ÔÇö sen├úo alguns conceitos ficam sem distratores bons.
- **Sensa├º├úo de pegadinha**: se o enunciado mascarado ficar amb├¡guo, o usu├írio
  erra por m├í reda├º├úo, n├úo por desconhecimento. O teste de vazamento ajuda,
  mas exige revis├úo humana da amostra.

### Esfor├ºo
~1 sess├úo para o motor + p├ígina, mais o tempo de revisar os enunciados que a
substitui├º├úo autom├ítica estragar.

---

## 5. Ordem recomendada e por qu├¬

```
ADR  ÔåÆ  Comparador  ÔåÆ  Modo estudo  ÔåÆ  Quiz
 Ôöé          Ôöé              Ôöé            Ôöé
 Ôöé          Ôöé              Ôöé            ÔööÔöÇ vira o conte├║do da revis├úo espa├ºada
 Ôöé          Ôöé              ÔööÔöÇ precisa de modelo de dados novo; decidir antes
 Ôöé          ÔööÔöÇ conte├║do novo, sem estado, ├│timo para busca
 ÔööÔöÇ menor superf├¡cie, valor imediato, zero risco de regress├úo
```

1. **ADR** primeiro por ser autocontido: uma fun├º├úo pura, um bot├úo, nenhum
   modelo novo. Fecha um ciclo que o Construtor deixa em aberto (voc├¬ monta,
   analisaÔÇª e da├¡?).
2. **Comparador** por ser o melhor retorno de conte├║do por esfor├ºo, e por j├í
   ter o componente visual pronto.
3. **Modo estudo** depois, porque ├® o ├║nico que pede decis├úo de modelagem
   (store separada ├ù migra├º├úo) e merece a discuss├úo antes do c├│digo.
4. **Quiz** por ├║ltimo para nascer j├í acoplado ├á revis├úo espa├ºada ÔÇö sozinho ├®
   um brinquedo; dentro do modo estudo, ├® o mecanismo.

### Regras que valem para as quatro
- **Nada de `new Date()` ou `Math.random()` dentro de fun├º├úo pura** ÔÇö data e
  semente entram por par├ómetro. ├ë o que mant├®m a su├¡te determin├¡stica.
- **Nada armazenado que possa ser derivado.** O campo `roadmapNodes` j├í nos
  ensinou: duas fontes de verdade viram uma fonte errada em sil├¬ncio.
- **Chave de localStorage nova nasce versionada** (`:v1`), para migra├º├úo futura
  n├úo precisar adivinhar formato.
- **Toda feature entra com spec.** A barra de qualidade automatizada ├® o que
  permitiu dobrar o cat├ílogo sem medo.
- **Registrar na entrega** (`NOVIDADES`) e remover de `A_SEGUIR` ÔÇö os dois
  nunca coexistem, e h├í teste garantindo isso.
