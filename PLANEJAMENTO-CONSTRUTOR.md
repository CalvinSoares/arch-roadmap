# Construtor de Projeto v3 — Relatório, Auditoria e Plano de Expansão

> Objetivo: elevar o construtor de "funciona e ensina" para **vivo, visual e
> confiável** — fluxo legível, mais casos e avisos, validação de ordem,
> simulação com possibilidades (falhas, comparações), leituras intuitivas,
> sugestões proativas e templates revisados.

---

## 1. Estado atual (inventário)

| Área | Hoje |
|---|---|
| Camadas | 8 (ui, api, aplicacao, dominio, infra, write/read-store, fila) |
| Padrões | 13 aplicáveis, com `aplicaEm` |
| Tecnologias | 10 fichas (specs, usos, viveEm, diferença que faz) |
| Regras | ~40 (estrutura, padrão×camada, tech×padrão, tech fora do lugar) |
| Score | 3 métricas (desacoplamento, testabilidade, complexidade) + fatores |
| Templates | 4 (CRUD, Hexagonal, E-commerce CQRS, Plataforma de eventos) |
| Visões | Montar (pilha DnD) e Fluxo (trilhas + simulação) |
| Simulação | Leitura/Escrita, cache quente/frio, runner 850ms/passo, narração |
| Painel | 3 abas (Análise/Leitura/Modelos) + narração + share/limpar |

---

## 2. Auditoria — problemas reais encontrados

### A1. Validação de ORDEM quase inexistente 🔴
Só **2 regras** olham posição (`ui-grudada-na-infra`, `dominio-abaixo-da-infra`).
Buracos verificados — nada acontece quando:
- **API acima da UI** (quem entrega a interface?);
- **Domínio antes da Aplicação** (a requisição passa pelas entidades antes dos
  casos de uso — inversão do fluxo canônico);
- **Stores/fila acima do domínio** (dados ditando o negócio);
- **Fila no topo da pilha** (mensageria antes da borda);
- E não existe regra **positiva**: ordem canônica completa não é celebrada
  ("fluxo limpo ✓"), então o usuário não sabe quando acertou.

### A2. Padrão fora do lugar não gera aviso persistente 🔴
Tecnologias têm insight dinâmico genérico (`tech-fora:*`). **Padrões não**: só
`hexagonal` tem regra de lugar; os outros 12 soltos em camada atípica geram
apenas a narração transitória da última ação — que some ao próximo clique.
(Ex.: Observer na infra, Builder na UI, Saga no domínio → silêncio.)

### A3. Templates curados disparando avisos ⚠️
- **E-commerce com CQRS**: 7 camadas sem `infra`/Prometheus → dispara
  "Quem vigia essa arquitetura?" ao carregar. Template exemplar não deveria
  nascer com pendência (ou a pendência deveria ser narrada como escolha).
- **Hexagonal puro**: não tem UI — é defensável (serviço API-first), mas a
  descrição não diz isso; parece esquecimento.
- Ordem dos dados (write → read → fila) é arbitrária e não explicada em
  nenhum lugar.

### A4. Linhas de fluxo pouco visíveis 🔴 (pedido direto do usuário)
Na visão Fluxo: conectores estruturais com `opacity: 0.25`, **sem ponta de
seta**, sem direção visual, sem animação; o conector do salto atual **não
acende** durante a simulação (só os nós); no mobile não há linha nenhuma.

### A5. Simulação com poucas possibilidades 🟡
Só 2 cenários (leitura/escrita) e 1 variável (cache quente/frio). Faltam:
falhas ("e se o Redis cair?"), outros tipos de requisição (busca, upload),
controle de ritmo (passo a passo/velocidade), comparação entre configurações,
e interação com os nós durante/apos a simulação.

### A6. Leitura (score) pouco intuitiva 🟡
Números 0–100 sem âncora qualitativa (75 é bom?), sem tooltip do que cada
métrica significa, sem métricas de **resiliência** e **custo operacional**
(que as escolhas de tech afetam diretamente), e sem comparação com referência.

### A7. Motor só reage — não sugere 🟡
Todos os insights são reativos ao que já foi feito. Não há "próximo passo
sugerido" (ex.: read-store vazio → "experimente Redis aqui"), nem revisão
final sob demanda ("revise meu projeto").

---

## 3. Plano de execução (fases)

### Fase A — Correções da auditoria (fundação de confiança) ~1 sessão
1. **+7 regras de ordem**:
   - `api-acima-da-ui` (alerta) · `dominio-antes-da-aplicacao` (info) ·
     `dados-acima-do-dominio` (alerta) · `fila-no-topo` (info) ·
     `ui-fora-do-topo` (info) · `infra-fora-da-base` (info) ·
     `ordem-canonica` (sinergia: pilha na ordem usuário→infra completa).
2. **Insight genérico `padrao-fora:*`** (espelho do de techs, usando
   `aplicaEm`) — remove as regras específicas redundantes.
3. **Botão "Organizar ordem"** no canvas (aparece quando há alerta de ordem):
   reordena para a ordem canônica com 1 clique e narra o que mudou.
4. **Templates revisados**: e-commerce ganha `infra` + Prometheus; descrições
   explicitam decisões ("API-first, sem UI"); cada template ganha
   `porQue: string[]` — ao carregar, a narração explica as escolhas em 3
   bullets (em vez de só o nome).

### Fase B — Fluxo visível e vivo (pedido central) ~1 sessão
1. **Setas com ponta** (`<marker>` SVG) em todos os conectores.
2. Estruturais mais presentes (opacity ~0.45, stroke 1.5) e caminho da
   requisição com **animação de fluxo contínua** (dash-offset animado — a
   linha "anda" na direção da requisição).
3. **Conector do salto atual acende** durante a simulação (o trecho
   percorrido fica sólido; o restante aguarda).
4. **Bolinha viajante**: um ponto percorre o conector do passo atual via
   `offset-path` (fallback: só o acendimento, com `prefers-reduced-motion`).
5. **Mobile**: trilho vertical com setas entre os nós (hoje: nada).

### Fase C — Simulador com possibilidades ~1–2 sessões
1. **Cenários de falha (chaos)**: toggles "derrubar Redis / banco / fila".
   O caminho se recalcula e a narração explica o impacto:
   - Redis caído → tudo vira MISS, banco absorve, latência sobe (mostrar
     antes/depois no total);
   - Banco caído + fila presente → escrita enfileirada ("aceito, processo
     depois") vs sem fila → erro 503;
   - Fila caída → escrita ok, projeção para (consistência eventual vira
     "eventual demais" — read model congelado).
2. **Novos tipos de requisição**: `Busca (GET /busca)` (usa Elasticsearch;
   sem ele, LIKE no banco com latência alta) e `Upload (POST /arquivo)`
   (usa S3 + URL assinada; sem ele, arquivo no banco com alerta).
3. **Controles**: passo a passo manual (⏮ ⏭), velocidade (0.5×/1×/2×),
   replay do último cenário.
4. **Raio-X do nó**: clicar num nó do fluxo (a qualquer momento) abre popover
   com papel, techs, padrões e latência acumulada até ali.
5. **Comparador**: guardar o resultado da última execução e mostrar delta na
   seguinte ("com cache: 17.5ms · sem: 28ms · −37%").

### Fase D — Leituras intuitivas ~1 sessão
1. **+2 métricas**: `resiliencia` (fila? réplica? SPOF de cache/banco?) e
   `custoOperacional` (nº de peças para operar, ponderado por complexidade
   da tech — Kafka pesa mais que Memcached).
2. **Âncoras qualitativas**: badge Alto/Médio/Baixo ao lado do número +
   tooltip explicando a métrica em 1 frase.
3. **Referência do template**: ao carregar um modelo, o score dele vira
   linha-fantasma nas barras — o usuário vê se está melhorando ou piorando
   em relação ao ponto de partida.

### Fase E — Sugestões e revisão sob demanda ~1 sessão
1. **Motor de sugestões** (proativo, aba própria ou seção na Análise):
   analisa o estado e propõe o próximo passo com 1 clique para aplicar —
   ex.: read-store sem tech → "adicionar Redis"; 5+ camadas sem observabilidade
   → "adicionar Prometheus"; escrita sem fila com CQRS → "adicionar Kafka".
2. **"Revisar projeto"**: botão que gera um relatório estruturado (pontos
   fortes / riscos / próximos passos / score) — exportável via share URL e
   com visual de "code review de arquitetura".

### Fase F — Conteúdo novo ~1 sessão (subagentes)
1. **+5 tecnologias**: Réplica de leitura (Postgres), Worker de jobs
   (BullMQ/Sidekiq-like), API Gateway (Kong), gRPC (comunicação interna),
   Vault/Secrets (infra) — cada uma com ficha completa e 2–3 regras.
2. **+2 templates**: "Serviço de mídia" (CDN + S3 + upload assinado) e
   "Tempo real" (WebSocket + Redis pub/sub + fila) — já com `porQue`.
3. **+~18 regras** (lista pronta): cache-na-aplicacao (sessão ok, dado quente
   cuidado), elastic-sem-fila (reindex como?), kafka-sem-consumidor,
   postgres-em-read-e-write (mesma instância?), memcached-para-sessao
   (volátil!), duas-dbs-poliglota (justifique), prometheus-sozinho,
   rabbitmq-com-saga (retry/DLQ), s3-com-cdn (sinergia), réplica-sem-lag-
   awareness, worker-sem-fila, gateway-com-facade (sinergia), etc.

---

## 4. Ideias extras (backlog criativo, não comprometido)
- **Modo carga**: slider de req/s mostrando onde satura primeiro (cache
  absorve leituras; fila absorve picos de escrita; banco é o gargalo).
- **Chaos %**: em vez de derrubar, degradar ("Redis com 20% de erro").
- **Export do diagrama** como imagem (SVG → PNG) para docs/apresentações.
- **Modo apresentação**: fluxo em tela cheia com simulação em loop.
- **Conquistas didáticas** ("primeira arquitetura sem SPOF") — leve, opcional.
- **Custo mensal ilustrativo** (faixas $ por tech, managed) — polêmico, avaliar.

## 5. Riscos e recomendação
- **Escopo do simulador** é o maior risco (C1–C2 têm ramificações) — mitigar
  mantendo o simulador **função pura** e cobrindo com testes de tabela.
- Animações (B) devem respeitar `prefers-reduced-motion` e nunca bloquear o
  preview sem compositing (aprendizado das fases anteriores).
- **Ordem recomendada: A → B → C → D → E → F.** A e B são pequenas e atacam
  exatamente as dores citadas (confiança nas regras/ordem + linhas visíveis);
  C é o salto de valor; D/E/F consolidam.
- Testes automatizados (pendência já apontada) deveriam nascer na Fase A:
  vitest sobre regras/ordem/simulador — o motor é todo puro.
