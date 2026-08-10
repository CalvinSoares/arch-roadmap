import { camadaDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import type {
  CamadaId,
  CamadaNoProjeto,
  EstadoProjeto,
} from "@/shared/types/construtor";

export type TipoRequisicao = "leitura" | "escrita" | "busca" | "upload";

/** Peças que o usuário pode "derrubar" para ver o impacto (chaos). */
export interface Falhas {
  cache: boolean;
  banco: boolean;
  fila: boolean;
}

export const SEM_FALHAS: Falhas = { cache: false, banco: false, fila: false };

export type ResultadoSim = "ok" | "degradado" | "erro";

export interface PassoSim {
  /** nó do fluxo: "usuario" ou camadaId. */
  no: string;
  rotulo: string;
  detalhe: string;
  /** latência ilustrativa (ms); passos assíncronos não somam no total. */
  ms: number;
  assincrono?: boolean;
  /** passo afetado por uma falha (destaque visual). */
  falha?: boolean;
}

export interface ParSim {
  de: string;
  para: string;
  assincrono: boolean;
  falha?: boolean;
}

export interface Simulacao {
  passos: PassoSim[];
  pares: ParSim[];
  /** soma dos passos síncronos (a latência que o usuário sente). */
  totalMs: number;
  resultado: ResultadoSim;
  /** o que a configuração atual revela (impacto das falhas/ausências). */
  avisos: string[];
  /** peças presentes — habilita os toggles corretos na UI. */
  disponivel: { cache: boolean; banco: boolean; fila: boolean; busca: boolean; storage: boolean };
}

const CAMADAS_APP: CamadaId[] = ["ui", "api", "aplicacao", "dominio"];

const acha = (c: CamadaNoProjeto | undefined, ids: string[]) =>
  c?.tecnologias.find((t) => ids.includes(t));

const nomeTech = (id: string | undefined) =>
  id ? (tecnologiaDef(id)?.nome ?? id) : undefined;

export const LABEL_TIPO: Record<TipoRequisicao, string> = {
  leitura: "Leitura (GET)",
  escrita: "Escrita (POST)",
  busca: "Busca (GET /busca)",
  upload: "Upload (POST /arquivo)",
};

/**
 * Monta o caminho de uma requisição pela arquitetura do usuário — com
 * narração, latências ilustrativas e impacto de falhas. Função pura.
 */
export function montarSimulacao(
  estado: EstadoProjeto,
  tipo: TipoRequisicao,
  cacheQuente: boolean,
  falhas: Falhas = SEM_FALHAS
): Simulacao {
  const passos: PassoSim[] = [];
  const pares: ParSim[] = [];
  const avisos: string[] = [];
  let anterior = "usuario";
  let resultado: ResultadoSim = "ok";

  const temPadrao = (id: string) =>
    estado.camadas.some((c) => c.padroes.includes(id));
  const camada = (id: CamadaId) =>
    estado.camadas.find((c) => c.camadaId === id);

  const readL = camada("read-store");
  const writeL = camada("write-store");
  const infraL = camada("infra");
  const filaL = camada("fila");

  const cacheTech = acha(readL, ["redis", "memcached"]);
  const buscaTech = acha(readL, ["elasticsearch"]);
  const storageTech = acha(infraL, ["s3"]);
  const bancoEm = (l?: CamadaNoProjeto) => acha(l, ["postgres", "mongodb"]);
  const bancoRead = bancoEm(readL);
  const bancoFundo = bancoEm(writeL) ?? bancoEm(infraL);
  const noBancoFundo = bancoEm(writeL) ? "write-store" : "infra";
  const brokerTech = acha(filaL, ["kafka", "rabbitmq"]);

  const disponivel = {
    cache: !!cacheTech,
    banco: !!(bancoFundo || bancoRead),
    fila: !!filaL,
    busca: !!buscaTech,
    storage: !!storageTech,
  };

  // falhas só valem para peças presentes
  const cacheCaiu = falhas.cache && disponivel.cache;
  const bancoCaiu = falhas.banco && disponivel.banco;
  const filaCaiu = falhas.fila && disponivel.fila;

  const passo = (
    no: string,
    rotulo: string,
    detalhe: string,
    ms: number,
    opts: { assincrono?: boolean; falha?: boolean } = {}
  ) => {
    passos.push({ no, rotulo, detalhe, ms, ...opts });
    pares.push({
      de: anterior,
      para: no,
      assincrono: !!opts.assincrono,
      falha: opts.falha,
    });
    anterior = no;
  };

  const pedido: Record<TipoRequisicao, string> = {
    leitura: "abre a tela — GET /produtos",
    escrita: "confirma a ação — POST /pedidos",
    busca: 'digita na busca — GET /busca?q="tênis"',
    upload: "envia um arquivo — POST /arquivo",
  };
  passos.push({ no: "usuario", rotulo: "Usuário", detalhe: pedido[tipo], ms: 0 });

  // ——— camadas de aplicação, na ordem da pilha ———
  for (const c of estado.camadas) {
    if (!CAMADAS_APP.includes(c.camadaId)) continue;
    const def = camadaDef(c.camadaId);
    if (!def) continue;

    if (c.camadaId === "ui") {
      const cdn = acha(c, ["cdn"]);
      passo(
        "ui",
        def.nome,
        cdn
          ? "assets vêm da CDN na borda; a chamada de dados segue adiante (~15ms)"
          : "browser monta a tela e dispara a chamada (~30ms de rede)",
        cdn ? 15 : 30
      );
    } else if (c.camadaId === "api") {
      const nginx = acha(c, ["nginx"]);
      passo(
        "api",
        def.nome,
        nginx
          ? "Nginx termina TLS, balanceia e encaminha (~1ms)"
          : "API recebe, autentica e valida o formato (~2ms)",
        nginx ? 1 : 2
      );
    } else if (c.camadaId === "aplicacao") {
      const leituraPura = tipo === "leitura" || tipo === "busca";
      passo(
        "aplicacao",
        def.nome,
        temPadrao("cqrs")
          ? leituraPura
            ? "CQRS: roteia para o lado de LEITURA — sem passar por regras de escrita (~1ms)"
            : "CQRS: roteia o comando para o lado de ESCRITA (~1ms)"
          : "caso de uso orquestra a operação (~2ms)",
        temPadrao("cqrs") ? 1 : 2
      );
    } else if (c.camadaId === "dominio") {
      // com CQRS, leitura/busca não passam pelas regras de negócio
      if ((tipo === "leitura" || tipo === "busca") && temPadrao("cqrs")) continue;
      passo(
        "dominio",
        def.nome,
        tipo === "escrita" || tipo === "upload"
          ? "invariantes de negócio validam o comando (~1ms)"
          : "regras conferem o que pode ser exibido (~1ms)",
        1
      );
    }
  }

  // ——— dados ———
  if (tipo === "leitura") {
    if (readL && cacheTech) {
      if (cacheCaiu) {
        passo(
          "read-store",
          "Cache fora",
          `${nomeTech(cacheTech)} indisponível — nenhuma leitura é absorvida; tudo vai ao banco`,
          0.2,
          { falha: true }
        );
        avisos.push(
          `Com ${nomeTech(cacheTech)} fora, 100% das leituras batem no banco: a latência sobe e o banco recebe a carga inteira (efeito "thundering herd" em produção).`
        );
        resultado = "degradado";
      } else if (cacheQuente) {
        passo(
          "read-store",
          "Leitura",
          `${nomeTech(cacheTech)}: HIT — resposta direto da memória (~0.5ms). O banco nem fica sabendo.`,
          0.5
        );
      } else {
        passo(
          "read-store",
          "Leitura",
          `${nomeTech(cacheTech)}: MISS — a chave não está no cache (~0.5ms)`,
          0.5
        );
      }
    }

    const precisaBanco = !cacheTech || cacheCaiu || !cacheQuente;
    if (precisaBanco) {
      if (readL && (buscaTech || bancoRead) && !cacheTech) {
        // read model dedicado sem cache
        if (bancoCaiu) {
          passo("read-store", "Leitura falhou", "read model indisponível", 0.5, { falha: true });
          resultado = "erro";
          avisos.push("Sem banco e sem cache quente, a leitura não tem de onde vir: o usuário recebe erro.");
        } else {
          passo(
            "read-store",
            "Leitura",
            `${nomeTech(bancoRead ?? buscaTech)} lê o read model desnormalizado (~8ms)`,
            8
          );
        }
      } else if (bancoFundo) {
        if (bancoCaiu) {
          passo(
            noBancoFundo,
            "Banco fora",
            `${nomeTech(bancoFundo)} não responde — a consulta falha`,
            30,
            { falha: true }
          );
          resultado = "erro";
          avisos.push(
            cacheTech
              ? `Banco fora + cache ${cacheCaiu ? "fora" : "frio"} = erro 503. Com o cache QUENTE, essa mesma leitura seria servida da memória — é isso que cache traz de resiliência.`
              : "Banco fora e nenhum cache: toda leitura falha. Um cache quente absorveria parte do tráfego durante o incidente."
          );
        } else {
          passo(
            noBancoFundo,
            "Banco",
            `${nomeTech(bancoFundo)} resolve a consulta (~10ms)`,
            10
          );
          if (cacheTech && !cacheCaiu) {
            passo(
              "read-store",
              "Cache",
              `resultado gravado no ${nomeTech(cacheTech)} — a próxima leitura vira HIT (~0.5ms)`,
              0.5
            );
          }
        }
      } else if (estado.camadas.length > 0) {
        passo(
          writeL ? "write-store" : infraL ? "infra" : anterior,
          "Dados",
          "nenhuma tecnologia de dados no projeto — a consulta não tem onde parar",
          0,
          { falha: true }
        );
        resultado = "erro";
        avisos.push("Sem banco nem cache, não existe fonte de dados: adicione PostgreSQL ou MongoDB.");
      }
    }
  } else if (tipo === "busca") {
    if (buscaTech && !bancoCaiu) {
      passo(
        "read-store",
        "Busca",
        `${nomeTech(buscaTech)}: índice invertido com relevância, facetas e typo-tolerance (~15ms)`,
        15
      );
    } else if (buscaTech && bancoCaiu) {
      passo("read-store", "Busca", `${nomeTech(buscaTech)} responde do índice — é uma projeção, sobrevive ao banco fora (~15ms)`, 15);
      resultado = "degradado";
      avisos.push("O índice de busca é derivado: continua servindo consultas mesmo com o banco fora — mas sem receber atualizações.");
    } else if (bancoFundo && !bancoCaiu) {
      passo(
        noBancoFundo,
        "Banco (LIKE)",
        `${nomeTech(bancoFundo)} faz LIKE '%termo%' — full table scan, sem relevância nem tolerância a typo (~180ms)`,
        180,
        { falha: true }
      );
      resultado = "degradado";
      avisos.push(
        "Busca no banco relacional com LIKE não escala: sem índice invertido, cada consulta varre a tabela e não há ranking. Adicione Elasticsearch no read store."
      );
    } else {
      passo(anterior, "Busca", "nenhuma tecnologia de busca nem banco disponível", 0, { falha: true });
      resultado = "erro";
    }
  } else if (tipo === "upload") {
    if (storageTech && !bancoCaiu) {
      passo(
        "infra",
        "Storage",
        `${nomeTech(storageTech)}: a API devolve URL assinada e o arquivo vai do cliente DIRETO ao bucket (~40ms de handshake)`,
        40
      );
      if (bancoFundo) {
        passo(noBancoFundo, "Metadados", `${nomeTech(bancoFundo)} guarda só o caminho/metadados (~8ms)`, 8);
      }
    } else if (bancoFundo && !bancoCaiu) {
      passo(
        noBancoFundo,
        "Banco (BLOB)",
        `arquivo gravado como BLOB no ${nomeTech(bancoFundo)} — infla o banco, encarece backup e satura a conexão (~250ms)`,
        250,
        { falha: true }
      );
      resultado = "degradado";
      avisos.push(
        "Arquivo dentro do banco é um anti-padrão comum: backups gigantes, cache inútil e transações longas. Adicione Object Storage (S3) na infra e guarde apenas o caminho."
      );
    } else {
      passo(anterior, "Upload", "nenhum storage nem banco disponível para receber o arquivo", 0, { falha: true });
      resultado = "erro";
    }
  } else {
    // ——— escrita ———
    const esCamada = estado.camadas.find((c) => c.padroes.includes("event-sourcing"));
    const noEscrita = writeL ? "write-store" : infraL ? "infra" : null;

    if (bancoCaiu) {
      if (filaL && brokerTech && !filaCaiu) {
        passo(
          "fila",
          "Aceito (202)",
          `banco fora — o comando entra na ${nomeTech(brokerTech)} e será processado quando voltar. O usuário recebe "em processamento", não erro.`,
          6,
          { falha: true }
        );
        resultado = "degradado";
        avisos.push(
          "Este é o valor da fila na resiliência: com o banco fora, a escrita é aceita e processada depois (202) em vez de falhar (503)."
        );
      } else if (noEscrita) {
        passo(noEscrita, "Escrita falhou", `${nomeTech(bancoFundo)} não responde — 503 para o usuário`, 30, {
          falha: true,
        });
        resultado = "erro";
        avisos.push(
          "Sem fila para absorver a escrita, a queda do banco vira erro imediato. Uma fila (Kafka/RabbitMQ) transformaria isso em 'aceito, processo depois'."
        );
      }
    } else if (noEscrita) {
      passo(
        noEscrita,
        "Escrita",
        esCamada
          ? `grava o EVENTO no log${bancoFundo ? ` (${nomeTech(bancoFundo)} append-only)` : ""} — o histórico é a verdade (~12ms)`
          : bancoFundo
            ? `${nomeTech(bancoFundo)} grava com transação ACID (~12ms)`
            : "persiste a mudança (nenhum banco concreto definido — veja a paleta) (~10ms)",
        bancoFundo ? 12 : 10
      );
    }

    // eventos assíncronos após a resposta
    if (filaL && resultado !== "erro") {
      if (filaCaiu) {
        passo(
          "fila",
          "Fila fora",
          `${nomeTech(brokerTech) ?? "broker"} indisponível — o evento não é publicado`,
          0,
          { assincrono: true, falha: true }
        );
        resultado = resultado === "ok" ? "degradado" : resultado;
        avisos.push(
          "Escrita concluída, mas sem evento publicado: o read model congela no estado anterior. 'Consistência eventual' vira 'eventual demais' — e a UI mostra dado velho sem ninguém perceber."
        );
      } else {
        passo(
          "fila",
          "Evento",
          brokerTech
            ? `${nomeTech(brokerTech)}: evento publicado — a resposta NÃO espera por isso`
            : "evento publicado na fila (sem broker concreto — arraste Kafka ou RabbitMQ)",
          5,
          { assincrono: true }
        );
        if (readL) {
          passo(
            "read-store",
            "Projeção",
            `read model atualizado a partir do evento — consistência eventual${
              cacheTech && !cacheCaiu ? ` (${nomeTech(cacheTech)} aquecido)` : ""
            }`,
            8,
            { assincrono: true }
          );
        }
      }
    }
  }

  const totalMs = passos
    .filter((p) => !p.assincrono)
    .reduce((acc, p) => acc + p.ms, 0);

  const fecho: Record<ResultadoSim, string> = {
    ok: `o usuário recebe em ~${totalMs.toFixed(1).replace(".0", "")}ms`,
    degradado: `o usuário recebe em ~${totalMs.toFixed(1).replace(".0", "")}ms, mas o sistema está degradado`,
    erro: "a requisição falhou — o usuário recebe erro",
  };
  passos.push({
    no: "usuario",
    rotulo: resultado === "erro" ? "Erro" : "Resposta",
    detalhe: `${fecho[resultado]}${
      passos.some((p) => p.assincrono) ? " — os passos assíncronos continuam em segundo plano" : ""
    }`,
    ms: 0,
    falha: resultado === "erro",
  });

  return { passos, pares, totalMs, resultado, avisos, disponivel };
}
