/**
 * Teste de carga com k6 (https://k6.io) — rotas de leitura pública.
 *
 * Rodar:  k6 run scripts/load-test.js
 *   BASE_URL=https://seu-deploy.vercel.app k6 run scripts/load-test.js
 *
 * Escopo honesto: cobre as rotas de LEITURA (home, roadmap, quiz) e o cron
 * protegido. O caminho de **award de XP** é Server Action (protocolo RSC + sessão
 * httpOnly), que o k6 não exercita bem — para carga nesse caminho, prefira um
 * fluxo Playwright autenticado ou um endpoint interno dedicado de teste. A
 * idempotência em si já tem cobertura determinística: o índice único em
 * `xp_events.origem_ref` garante o "paga uma vez" sob concorrência (ver
 * conceder-xp.ts) — carga só confirmaria o comportamento, não a corretude.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const CRON_SECRET = __ENV.CRON_SECRET || "";

export const options = {
  scenarios: {
    leitura: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 }, // sobe
        { duration: "1m", target: 20 }, // sustenta
        { duration: "20s", target: 0 }, // desce
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% de erro
    http_req_duration: ["p(95)<800"], // p95 < 800ms
  },
};

const ROTAS = ["/", "/roadmaps/backend", "/quiz", "/roadmaps"];

export default function cargaLeitura() {
  for (const rota of ROTAS) {
    const res = http.get(`${BASE}${rota}`);
    check(res, { "status 200": (r) => r.status === 200 });
    sleep(0.5);
  }

  // Cron protegido: sem o secret deve dar 401 (fail-closed); com, 200.
  if (CRON_SECRET) {
    const res = http.get(`${BASE}/api/cron/lembretes`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    check(res, { "cron autorizado 200": (r) => r.status === 200 });
  }
}
