# DevMappa — plano de conteúdo e profundidade

> Este plano tem uma tese só: **o DevMappa cresce por dentro, não por fora.**
>
> Não há paleta nova, tema novo, assunto novo nem plataforma nova aqui. Há
> quatro eixos que aprofundam o que já existe — **79 conceitos**, **5 trilhas**, o
> Construtor, o Quiz — e que juntos atacam a única crítica que um catálogo de
> padrões sempre recebe: **parecer acadêmico.**
>
> | Eixo | O que faz |
> |---|---|
> | **A. Formatos** | Ancora a abstração no código que o dev usa toda semana |
> | **B. Lacunas** | Fecha as famílias que faltam no catálogo |
> | **C. Módulos** | Explora o Construtor, o Quiz e as trilhas, que estão subusados |
> | **D. Novos** | Postmortems, laboratório de concorrência, modo entrevista |
>
> A maior parte dos quatro eixos **já saiu**. O que resta é expansão sob demanda
> (mais duelos, mais explique-erro) — ver `A_SEGUIR` em
> `content/novidades/registro.ts`.

---

## Eixo A — Formatos de conteúdo

Os três atacam a mesma crítica, e nenhum exige motor novo.

### A1. "Onde isto aparece de verdade" — o de melhor retorno do plano

**O problema.** Ninguém acorda querendo aprender Flyweight. As pessoas
querem entender o código que já usam. Hoje o catálogo explica o padrão em
abstrato e deixa a ponte com a realidade por conta do leitor.

**A cura.** Uma seção por conceito, ligando ao código que ele já escreveu ou leu.

```ts
// shared/types/conceito.ts
/**
 * Onde o padrão já está na vida de quem lê. Não é "exemplo de uso" — é
 * reconhecimento: a biblioteca que a pessoa importa toda semana e não sabia
 * que era isto.
 */
ondeAparece?: {
  /** O nome que a pessoa reconhece: "addEventListener", "middleware do Express". */
  onde: string;
  /** Por que aquilo é este padrão — uma frase, não um parágrafo. */
  explicacao: string;
  /** Link para a doc, quando ajuda. */
  href?: string;
}[];
```

**O mapa completo dos 23 GoF**, que é a expansão que torna isto executável em vez
de uma boa intenção:

| Padrão | Onde já está |
|---|---|
| Factory Method | `document.createElement`, `React.createElement`, `Array.from` |
| Abstract Factory | Componentes por plataforma do React Native; famílias de driver de banco (conexão + cursor + transação) |
| Builder | Query builders (Knex, Prisma), `URLSearchParams`, o `Request` do fetch |
| Prototype | `Object.create`, `structuredClone`, a própria cadeia de protótipos do JS |
| Singleton | Um módulo ES importado **é** singleton; pools de conexão; `console` |
| Adapter | Wrappers de driver; camadas que traduzem uma API externa para a sua |
| Bridge | O reconciler do React separado dos renderers (DOM, Native, three) |
| Composite | A árvore do DOM; `children` do JSX; sistema de arquivos |
| Decorator | Middleware do Express, HOC do React, `@decorator` de Python/TS, pipes de stream do Node |
| Facade | `fetch` escondendo XHR/HTTP; um ORM escondendo SQL |
| Flyweight | Interning de string, `Symbol.for`, `React.memo`, atlas de sprite |
| Proxy | O objeto `Proxy` do JS — **o padrão virou palavra-chave**; a reatividade do Vue 3; lazy loading de ORM |
| Chain of Responsibility | A cadeia de middleware; o bubbling de evento do DOM |
| Command | Toda ação do Redux; filas de job; os comandos do `git`; o undo do editor |
| Interpreter | Engines de regex, template engines, parsers de query |
| Iterator | `for...of`, `Symbol.iterator`, generators, cursores de banco |
| Mediator | A store do Redux; um event bus |
| Memento | O time-travel do Redux DevTools; o undo de qualquer editor |
| Observer | `addEventListener`, RxJS, `EventEmitter` do Node, os signals de Vue/Solid |
| State | XState; o ciclo de uma Promise (pendente → resolvida/rejeitada); `readyState` do XHR |
| Strategy | O comparador de `Array.prototype.sort`; as *strategies* do Passport (o nome é literal) |
| Template Method | `beforeEach`/`it`/`afterEach` de qualquer framework de teste; hooks de ciclo de vida |
| Visitor | Plugins do Babel e regras do ESLint — os dois chamam o objeto de `visitor` |

E os melhores fora do GoF, que são os que mais surpreendem:

| Conceito | Onde já está |
|---|---|
| Event Sourcing | **O `git`.** Commits são eventos; a working tree é uma projeção |
| Append-only | Os objetos do git; o log do Kafka; o WAL do Postgres |
| Idempotência | `PUT` e `DELETE` do HTTP; as chaves de idempotência do Stripe |
| Race condition | `useEffect` sem cleanup; duplo submit de formulário |
| Máquina de estados | XState; a máquina de estados do TCP |
| CQRS | Réplica de leitura + índice de busca ao lado do banco de escrita |
| Ledger | Contabilidade de partidas dobradas; o UTXO do Bitcoin |
| DIP | A injeção de dependência de Angular e NestJS |

**Testes.** Todo `ondeAparece` tem `onde` curto (≤ 40 caracteres — é um nome, não
uma frase) e `explicacao` com pelo menos 40; `href`, quando existe, é absoluto.
A cobertura é **obrigatória**: `onde-aparece.spec.ts` falha se algum conceito
ficar sem a seção.

**✅ Feito para o catálogo inteiro** (GoF e não-GoF). `shared/components/conteudo/onde-aparece.tsx`,
campo `ondeAparece` em `Conceito`, `content/onde-aparece.spec.ts` (regressão: lista vazia).

Uma correção de rota em relação ao que este documento dizia: era para ser um
**bloco** (`{ tipo: "onde-aparece" }`), para participar da trilha de leitura
numerada. Virou **campo do conceito**, porque a `conceito-view` tem **três
caminhos de render** (v3 com trilha, v1 sem trilha, e o clássico sem blocos) — e
como bloco a seção só apareceria em quem lembrasse de adicioná-la, no lugar que
lembrasse. Como campo, ela nasce nos três, sempre depois do conteúdo e antes dos
relacionados: primeiro se aprende o padrão, depois se descobre que já se convivia
com ele.

**✅ Cobertura completa.** O teste de fila virou asserção dura.

### A2. Anti-exemplo comentado

**✅ Feito nos 9 canônicos.** Bloco `anti-exemplo`, componente
`conteudo/anti-exemplo.tsx`, `content/anti-exemplos.spec.ts`.

Uma segunda correção de rota: este documento dizia para reusar o arquétipo
`antes-depois`, mudando o que cada lado significa. Não deu — por dois motivos
que só apareceram ao olhar o conteúdo real:

1. **`strategy` e `chain-of-responsibility` já usam `antes-depois`** para "sem
   padrão × com padrão". Um segundo bloco visualmente idêntico com outro sentido
   na mesma página confunde em vez de ensinar.
2. O valor do anti-exemplo está no **código errado**, e `LadoComparacao` só
   carrega uma lista de itens curtos.

O tipo novo carrega `comoSeParece` (o cheiro em uma linha), `codigo` (a
implementação ingênua, comentada), `sintomas` (`quando` × `efeito` — o que
quebra e sob qual condição) e `correcao`. Ele é o único bloco da página que foge
do acento da categoria e usa `--perigo`: ali a cor precisa dizer "isto está
errado", não "isto é um conceito estrutural".

Duas regras viraram spec: **no máximo um por conceito** (dois blocos vermelhos
competem e diluem o aviso) e **nunca antes da primeira seção** — mostrar o erro
antes da solução ensina o erro.

Os que têm anti-exemplo canônico, e portanto valem primeiro:

| Conceito | O anti-exemplo |
|---|---|
| Singleton | Virou variável global — e agora dois testes não podem rodar juntos |
| Observer | Nunca desinscreve; a lista cresce e vaza memória |
| Strategy | É `if/else` disfarçado: a "estratégia" é escolhida por um switch dentro da classe |
| Decorator | Empilhou seis camadas e ninguém sabe mais a ordem em que executam |
| Chain of Responsibility | Nenhum elo trata, e o pedido morre em silêncio |
| Factory Method | A fábrica virou um `switch` gigante que conhece todos os produtos |
| Facade | Vazou: a fachada expõe o tipo do que ela deveria esconder |
| Saga | Compensação que não é idempotente — repetir a compensação corrompe |
| Event Sourcing | Guardou o estado em vez do evento, e perdeu o motivo da mudança |

**Esforço.** ~P por conceito, e independentes. Ótimo trabalho de sessão curta
— e os nove canônicos já estão.

### A3. Refatoração passo a passo

**✅ Feito nos cinco travados:** `strategy`, `factory-method`, `decorator`,
`state`, `observer`. Bloco `refatoracao`, um diff por vez com motivo.

Escopo consciente: cinco conceitos, não o catálogo inteiro. Se os cinco não
forem lidos, a resposta veio barata — o cheiro inicial em cada um é
reconhecível (switch que cresce, `new` espalhado, flag que vira quatro,
`if (status)`, acoplamento direto).

```ts
| {
    tipo: "refatoracao";
    titulo?: string;
    /** O ponto de partida, com o cheiro visível. */
    inicio: ExemploCodigo;
    passos: {
      /** O que muda neste passo. */
      titulo: string;
      /** Por que — sem isto é só um diff. */
      motivo: string;
      depois: ExemploCodigo;
    }[];
  }
```

---

## Eixo B — As lacunas do catálogo

Os 23 GoF e o SOLID estavam completos cedo; o buraco era tudo que vem **depois**
de o sistema existir. **Esse buraco fechou.**

| Família | Conceitos | Status |
|---|---|---|
| ✅ **Resiliência** | Timeout, Retry, Circuit Breaker, Bulkhead, Rate limiting, DLQ (+ trilha) | Feito |
| ✅ **Mensageria** | Outbox, Inbox/dedup, fila × pub/sub, garantias de entrega, chave de partição, backpressure | Feito |
| ✅ **DDD tático** | Repository, Unit of Work, Value Object, Agregado, Anti-corruption layer | Feito |
| ✅ **Dados distribuídos** | Isolamento, locks, CAP, consistência eventual, sharding, réplica, 2PC, índice, **cache** | Feito |
| ✅ **Estilos** | Microsserviços, monolito modular, Clean Architecture, BFF, API Gateway, Strangler Fig | Feito |
| ✅ **Princípios** | Composição sobre herança, DRY/KISS/YAGNI, Deméter, Conway, 8 falácias | Feito |
| ✅ **Segurança de aplicação** | Autenticação (sessão/httpOnly), JWT, OAuth2, MFA, autorização/RBAC, allowlist, gestão de segredos — + Construtor, duelos, quiz | Feito |

A inconsistência Construtor↔catálogo (Redis/fila/busca sem página) também fechou:
Redis/Memcached/CDN → `cache`; Elasticsearch → `indice`; filas → conceitos de
mensageria. Spec em `sugestoes.spec.ts` impede regressão na categoria cache.
Vault → `gestao-de-segredos`; IdP/WAF entram na paleta de segurança.

### A trilha: "Sistemas que aguentam produção"

**✅ Publicada** em `/roadmaps/resiliencia`, com pré-requisitos explícitos e
toggle “só o essencial”. Liga resiliência a idempotência, saga, webhooks e
event sourcing.

Backend ganhou grafo em auth/segurança (`autenticacao` → JWT/OAuth/MFA →
`autorizacao`; segredos, allowlist, rate limiting).

### Comparações

**✅ 20 duelos** em `/comparar`. Os de ponta pronta (Factory×Abstract, CQS×CQRS,
Hexagonal×Clean, Saga×2PC, Command×Memento, CQRS×ES, Gateway×BFF,
Repository×UoW, auth×JWT, auth×authz, auth×OAuth, allowlist×rate limit, …) já
estão. O que sobra é demanda real — ver `A_SEGUIR`
(`mais-duelos`): Event Sourcing × EDA só faz sentido quando EDA tiver página.

### Categorias e cores

Categorias novas (`resiliencia`, `dados`, …) compartilham acentos da paleta —
filtro fiel ao conteúdo, sem explodir o número de cores distinguíveis.

### Testes do eixo

- Conceitos de resiliência com armadilha de configuração (família).
- Tecnologia do Construtor não cita slug inexistente; cache → conceito `cache`.

---

## Eixo C — Melhorias nos módulos que já existem

### C1. Construtor — o ativo mais forte e o mais subexplorado

**Modo "quebre isto".** Em vez de montar, você recebe uma arquitetura pronta e
tem que achar a falha. **Inverte o motor de regras que já existe** — `avaliarRegras`
já sabe apontar o problema; aqui ele vira gabarito em vez de feedback. Zero motor
novo, e é a melhoria de maior valor por linha do repositório.

```ts
// content/construtor/desafios.ts
export interface Desafio {
  id: string;
  /** O enunciado: o que esta arquitetura deveria fazer. */
  contexto: string;
  /** O estado montado, com o defeito plantado. */
  estado: EstadoProjeto;
  /** Ids das regras que o motor dispara — o gabarito, derivado e verificado. */
  esperadas: string[];
  /** A explicação que aparece depois da tentativa. */
  veredito: string;
}
```

O teste que faz isso não apodrecer: **para todo desafio, `avaliarRegras(estado)`
devolve exatamente `esperadas`.** Se alguém mexer numa regra, o desafio que
dependia dela falha na hora, em vez de virar uma pergunta sem resposta.

**~~Templates de caso real~~ — riscado: a premissa estava errada.** Este
documento dizia "6 modelos curados" e sugeria que precisavam ser nomeados pelo
problema em vez de "exemplo 3". Conferindo o código: são **7**, e já são nomeados
pelo domínio — *Carteira digital (fintech)*, *Tempo real (chat/notificações)*,
*Serviço de mídia*, *Plataforma de eventos*, *E-commerce com CQRS*, *Hexagonal
puro*, *CRUD simples* — cada um com `descricao` e três bullets de `porQue`.
Não há o que renomear. Escrevi a melhoria sem olhar o que existia.

**✅ A duplicação de latência no simulador — corrigida.**
`content/latencias.ts` + `content/latencias.spec.ts`.

Era um defeito, não uma feature: o simulador passava o número como argumento
**e** repetia na prosa (`passo(..., "…(~15ms)", 15)`), com nada garantindo que os
dois continuassem iguais. Eram 23 menções.

O que mudou o rumo da correção: a interface **já renderiza** o `ms` de cada passo
(`fluxo-projeto.tsx:554`). Então a prosa duplicava algo que estava na mesma tela —
e a saída certa foi **tirar da prosa**, não interpolar. A narração passou a
explicar *o que* acontece; o número aparece onde sempre apareceu.

A tabela `LATENCIA` nomeia as 11 latências cujo valor **ensina** algo (a
proporção entre cache, índice e full scan é o conteúdo). Os tempos de encanamento
— TLS, validação, orquestração: 1–2ms — ficaram como literais de propósito: são
ruído de fundo, e forçá-los na tabela só encheria a escala de pontos
indistinguíveis.

Dois testes que valem: **nenhuma prosa do simulador contém número de
milissegundo** (um `grep` virado em asserção, para o defeito não voltar) e **toda
chave da tabela é usada** — chave sem uso apodrece.

⚠️ Nota de rastreabilidade: eu havia dito que esta melhoria estava no "§4.1" —
estava, mas do plano **anterior**, que foi apagado. Ao reescrever este documento
ela não foi transportada, e ficou órfã por duas rodadas.

**✅ A escala logarítmica — feita.** `/construtor/escala`, `lib/escala.ts` +
spec.

Vinte pontos numa régua só, do ciclo de CPU (0,3ns) à travessia São Paulo ↔
Singapura (250ms). Os do simulador aparecem em terracota; as referências de
hardware e rede, na cor de Dados.

O que faz a página ensinar não é o gráfico — é o **botão que troca para escala
real**. Em logarítmica, os sete pontos sub-milissegundo se espalham por 767px; em
linear, colapsam em 43px, com cinco deles no **mesmo pixel**. É o argumento de
por que "só uma leitura a mais" e "só uma chamada de rede a mais" não são a mesma
frase.

A transformação entra por parâmetro em `posicao()` justamente para as duas
conviverem, e há teste provando o colapso: em linear os sub-milissegundo ficam
dentro de 1% do eixo; em log, espalhados por mais de metade dele.

Mais o comparador — RAM contra ida e volta de região dá **1,2 milhões ×** — e a
frase que fecha: se o ciclo de CPU durasse um segundo, a ida e volta até a
Virgínia levaria mais de doze anos.

**✅ Peças de resiliência no canvas — feitas.**

Era a inconsistência ao contrário: a suíte já impedia tecnologia no canvas sem
conceito no catálogo, e aqui havia **conceito sem peça**. Entraram Timeout, Retry,
Circuit Breaker, Bulkhead, Outbox e Dead Letter Queue — 26 padrões na paleta,
eram 20.

Peça arrastável sem regra é enfeite, então entraram **nove regras**: quatro
sinergias (o par Timeout+Retry, os três degraus da borda, Bulkhead com duas
dependências, Outbox com fila) e cinco alertas — `retry-sem-timeout`,
`circuito-sem-timeout`, `retry-sem-idempotencia`, `fila-sem-dlq`,
`saga-sem-outbox`.

**O efeito colateral mais valioso:** a regressão dos templates falhou. Os cinco
modelos curados com fila **de fato** não tinham DLQ, e os dois com Saga não tinham
Outbox — a barra que exige "template nasce sem alerta" revelou que o conteúdo
curado estava incompleto, não que a regra estava errada. Os cinco foram
corrigidos.

E o teste de alcançabilidade cobrou quatro combos novos no corpus: regra que só
dispara com duas peças juntas nunca é alcançada por estados de uma peça só.

**Dois desafios novos** no "Quebre isto" (`retry-sem-rede`,
`fila-sem-rede-de-seguranca`), que a família não tinha. São 7.

**✅ "Por que não sugeriu X?" — feito.** Painel "Próximos", seção recolhível.

Exigiu um refactor: as condições viviam enterradas numa sequência de
`if (cond) out.push(...)` dentro de `sugerir()`. Virou catálogo declarativo, e
as duas perguntas passaram a sair da **mesma fonte** — `sugerir()` devolve as que
passam, `porQueNaoSugeriu()` explica as que não. A alternativa (escrever a
explicação à parte) seria uma segunda cópia da condição, e as duas divergiriam.

A spec garante que os dois lados formam **partição exata**: nenhuma sugestão nos
dois, nenhuma em nenhum. E o texto distingue "já está lá" de "falta
pré-requisito", que são coisas diferentes para quem lê.

O refactor também revelou duas sugestões que faltavam: **Timeout** (há
dependência concreta e nenhum prazo) e **Dead Letter Queue** (há fila e nenhum
desvio) — 17 no catálogo.

**✅ Comparar dois projetos — feito.** `/construtor/comparar`,
`lib/comparar-projetos.ts` + spec.

O detalhe que faz o diff ser útil em vez de enganoso: **em complexidade e custo
operacional, menor é melhor**. Sem inverter o sinal, um `-8` em complexidade
apareceria como piora quando é justamente o ganho — e há teste para isso.

Mais o diff de peças (o que entra e sai, com a camada), o diff de insights (qual
alerta a variante resolve, qual introduz, qual sinergia ganha) e um resumo em
prosa que se recusa a fingir que existe lado certo: *"Troca: melhora X e piora Y.
Não existe resposta certa aqui — existe qual dos lados importa no seu caso."*

### C2. Conceitos

**✅ "Em uma linha".** Cobertura total do catálogo; `custo.spec.ts` impede
regressão.

**✅ Custo declarado.** Cobertura total.

### C3. Roadmaps

**✅ Pré-requisito real entre nós.** Campo `prerequisitos` + arestas `prereq` no
`useConnectorLayout`. A trilha de resiliência é o showcase; o painel lista
“O que preciso antes”. Spec em `roadmaps/prerequisitos.spec.ts` (ids válidos,
sem ciclo).

**✅ Trilha condensada.** Campo `essencial` + toggle “Só o essencial” no
`RoadmapFlow`.

### C4. Quiz

**✅ Seis formatos + placar.** Armadilha, onde aparece, duelo, anti-exemplo,
postmortem e **explique o erro** (registro à mão em `content/quiz/explique-erro.ts`).

**◐ Expandir explique-erro.** Base com 8 itens (SOLID + CQS + Deméter +
composição). Próximo: resiliência e dados — em `A_SEGUIR` (`explique-erro-mais`).

---

## Eixo D — Módulos novos

### D1. Postmortems anotados — ✅ feito

**✅ `/postmortems`** com quatro incidentes: AWS S3 2017, Cloudflare 2019,
GitLab 2017, Knight Capital 2012. Cada um cita conceitos do catálogo; spec
garante que os slugs existem. Também alimentam o formato `postmortem` do quiz.

### D2. Laboratório de concorrência — ✅ feito (como demo)

**✅** Não virou rota própria: entrou como demo do conceito
`niveis-de-isolamento` (`isolamento-playground.tsx` + `lib/isolamento.ts`).
Duas transações, níveis de isolamento, anomalias visíveis. A pergunta nasce na
página do conceito — o mesmo destino que a escala de latência teve ao sair da
sidebar.

### D3. Modo entrevista de system design — ✅ feito

**✅ `/construtor/entrevista`** — enunciados em `content/entrevistas/registro.ts`,
reuso do motor do Construtor com rubrica. Três cenários na primeira leva.

### Uma nota sobre o motor comum

O laboratório de concorrência, o ciclo de vida de um webhook e o caching HTTP têm
a mesma forma: **máquina de estados determinística, N atores, eixo de tempo,
narração passo a passo, injeção de falha.** E `construtor/utils/simulador.ts` já é
isso para uma requisição.

**Não construir a generalização por antecipação.** O laboratório já nasceu
honesto dentro do conceito; extrair motor compartilhado só se um segundo cenário
independente pedir.

---

## Ordem

```
1. "Onde isto aparece"                   A1   ✅ catálogo inteiro (79)
2. Resiliência + trilha                  B    ✅
3. Anti-exemplo nos 9 canônicos          A2   ✅
4. Repository + Outbox + garantias       B    ✅
5. Duelos de ponta pronta                B    ✅ 16 duelos
6. Modo "quebre isto"                    C1   ✅
7. Postmortems (4)                       D1   ✅
8. Em uma linha + custo                  C2   ✅ catálogo inteiro
9. Dados distribuídos + cache            B    ✅
10. Laboratório de isolamento            D2   ✅ demo no conceito
11. Refatoração passo a passo (5)        A3   ✅
12. Roadmaps como grafo + essencial      C3   ✅
13. Quiz formatos + placar               C4   ✅
14. Explique o erro                      C4   ✅ base (8); expandir sob demanda
15. Testes de UI (smoke)                 —    ✅
16. Entrevista de system design          D3   ✅
17. Mensageria / DDD / estilos / princ.  B    ✅
```

**O que ainda corre sob demanda** (não é bloqueio de produto):

- Mais duelos quando a confusão aparecer de novo (`mais-duelos`)
- Mais explique-erro em resiliência/dados (`explique-erro-mais`)

**Por que A1 primeiro.** Melhorou o catálogo inteiro sem conceito novo, e mudou
a impressão de quem chega: "ah, então eu já uso isto".

**Por que A3 foi caro.** Formato mais caro por unidade; veio depois dos baratos.

---

## Duas páginas que não se sustentaram

Feedback direto de uso, e ele estava certo nas duas. Vale registrar porque o
diagnóstico é diferente em cada caso — e porque o erro de projeto que produziu as
duas é o mesmo: **construir a partir do que já estava pronto, em vez de a partir
de uma pergunta que alguém faria.**

### `/estudar` — apagada

Não era genérica: ela **mentia**. Aberta sem progresso salvo — o estado de 100%
de quem chega pela primeira vez:

| Bloco | O que mostrava |
|---|---|
| **Revisar hoje** (o principal) | vazio |
| **Continue de onde parou** | SRP, OCP, LSP — sem nunca ter começado nada |
| **Quiz das armadilhas** | duplicata de `/quiz` |

O segundo é o grave: mostrava os primeiros itens de uma trilha e chamava de
continuação. Quem lê conclui que o site não sabe quem ele é, o que é pior que não
ter a seção.

O diagnóstico estrutural: **era um painel para um estado que ainda não existe.**
Painel sem dado é placeholder. Foi desenhado para o usuário do mês três e visto
pelo usuário do minuto zero.

O que sobreviveu, porque tem valor fora dela: o motor de revisão espaçada
(`lib/estudo.ts`, com spec) e o componente `Quiz` — que morava em
`estudar/_components/` e era importado por **dois** consumidores de fora. Um
componente compartilhado dentro do `_components/` de uma rota é o próprio smell
que o prefixo `_` deveria impedir; foi para `shared/components/conteudo/`.

### `/construtor/escala` — demovida, não apagada

Aqui a crítica é mais branda e também procede: a página tinha **quatro links de
saída, dois voltando para o Construtor**. Nada levava *até* ela a partir do
momento em que a dúvida aparece — ela existia porque eu tinha a tabela de
latências, não porque alguém chegaria ali com uma pergunta.

Respondia "qual o tamanho da diferença?" e nunca "então o que eu faço
diferente?". E ocupava lugar na sidebar ao lado de Conceitos e Roadmaps,
reivindicando importância de primeiro nível.

Virou `DemoId: "escala"` e entrou como parada da trilha de leitura do conceito
**Timeout**, entre as armadilhas e o código — que é onde a pergunta nasce. A rota
continua existindo como artefato compartilhável, só não é mais destino.

### O defeito que apareceu ao olhar

Dois dos vinte pontos da escala renderizavam **"0µs"** — L1 e L2. Rótulo que não
diz nada, na página cuja única função é dar noção de grandeza.

E a spec tinha o comentário *"senão o ciclo de CPU vira 0ms"*. Eu testei `0.0001`
— que por sorte dava "0,1µs" — e deixei passar `0.000001`. **Testar um valor da
faixa não cobre a faixa.** O teste novo percorre os vinte pontos exigindo que
nenhum vire zero.

### E uma colisão de nome que eu criei

A sidebar ficou com **"Comparar pilhas"** e **"Comparar"** lado a lado. O segundo
virou **"Duelos"**, que é o que a página é.
---

## As regras que continuam valendo

- **Nada de `new Date()` ou `Math.random()` dentro de função pura.** Data e
  semente entram por parâmetro. É o que mantém a suíte determinística
  (hoje ~1300 testes em `node` + `happy-dom`).
- **Nada armazenado que possa ser derivado.** O gabarito do "quebre isto" é
  verificado contra o motor, não transcrito.
- **Toda feature entra com spec.** A barra de qualidade automatizada é o que
  permitiu dobrar o catálogo sem medo.
- **Registrar em `NOVIDADES`, remover de `A_SEGUIR`** — há teste garantindo que os
  dois nunca contêm a mesma coisa.
- **Quando este documento ficar errado, corrigir na mesma sessão.**

---

## O que já foi feito nesta direção

- **Campo `nasceu`** nos conceitos — GoF datados com precursores reais.
- **Eixos A–D** do plano original — ver Ordem acima (itens 1–17).
- **Profundidade universal:** `ondeAparece`, `custo` e `emUmaLinha` em 100% do
  catálogo (specs duras).
- **Novidades 0.7.0 / 0.8.0** — cache+grafo nas trilhas; explique-erro, duelos
  novos e testes de UI.
