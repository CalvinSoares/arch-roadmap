# Operação — backup/DR e teste de carga

Runbook enxuto para os itens operacionais da Fase 4. Não é código de app — são
procedimentos que você executa no painel dos serviços ou pela CLI.

## Backup & Disaster Recovery (Neon)

O dado de usuário mora no Neon Postgres (conteúdo continua em Git). O Neon já dá
as duas camadas de recuperação — o trabalho é **ativar e ensaiar**, não construir.

1. **Point-in-Time Restore (PITR).** No projeto Neon → *Settings → History
   retention*, suba a janela de retenção (free tier ~24h; planos pagos até 30d).
   Para restaurar: *Branches → Restore*, escolha o timestamp. Recuperação de
   "apaguei sem querer" e de corrupção lógica.
2. **Branch de segurança antes de migração.** Antes de `pnpm db:migrate` em
   produção, crie um branch do banco (*Branches → Create branch*) como snapshot
   instantâneo — se a migração der errado, você volta o endpoint pooled para o
   branch anterior.
3. **Export lógico periódico** (defesa contra "o provedor sumiu"):
   ```bash
   pg_dump "$DIRECT_URL" -Fc -f backup-$(date +%F).dump
   ```
   Guarde fora do Neon (S3/R2). Restore: `pg_restore -d "$DIRECT_URL" backup.dump`.
4. **Ensaie o restore** ao menos uma vez — backup que nunca foi restaurado é
   esperança, não plano. Restaure para um branch novo e confira as tabelas.

Nada disso precisa de mudança no app: a projeção (`user_stats`) é reconstruível do
ledger (`xp_events`), então mesmo uma restauração parcial do ledger recompõe o resto
com `reprojetarXp`.

## Teste de carga (k6)

Script em [`scripts/load-test.js`](../scripts/load-test.js). Instale o k6
(https://k6.io/docs/get-started/installation/) e rode:

```bash
# local (dev server em :3000)
k6 run scripts/load-test.js

# contra um deploy, com o cron incluído
BASE_URL=https://seu-deploy.vercel.app CRON_SECRET=xxxx k6 run scripts/load-test.js
```

Cobre as rotas de **leitura** e o cron protegido, com thresholds (p95 < 800ms,
erro < 1%). O caminho de **award de XP** é Server Action (protocolo RSC + sessão
httpOnly) e não é bem exercitado por k6 puro — para carga ali, use um fluxo
Playwright autenticado ou um endpoint interno dedicado de teste. A **corretude** da
idempotência sob concorrência já é garantida pelo índice único em
`xp_events.origem_ref` (o 2º award com a mesma chave não insere) — carga
confirmaria o comportamento, não a corretude.

## A/B da curva de XP (estado)

A curva já é **config-driven**: `COEF_CURVA` em
[`src/shared/lib/gamificacao/xp.ts`](../src/shared/lib/gamificacao/xp.ts) é o único
botão, e `xpParaNivel`/`nivelPara` aceitam um `coef` por parâmetro. Para virar um
A/B de verdade faltam duas peças (adiadas por serem prematuras sem usuários):
uma atribuição determinística de variante por usuário (ex.: hash do `userId`) que
alimente `coef`, e um sink de analytics para medir retenção por variante. Como o
nível é derivado do XP total, trocar a curva não exige migração — só recalcular.
