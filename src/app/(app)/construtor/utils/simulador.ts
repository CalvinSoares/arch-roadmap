import { camadaDef } from "@/content/construtor/blocos";
import { tecnologiaDef } from "@/content/construtor/tecnologias";
import type {
  CamadaId,
  CamadaNoProjeto,
  EstadoProjeto,
} from "@/shared/types/construtor";

export type TipoRequisicao = "leitura" | "escrita";

export interface PassoSim {
  /** nó do fluxo: "usuario" ou camadaId. */
  no: string;
  rotulo: string;
  detalhe: string;
  /** latência ilustrativa (ms); passos assíncronos não somam no total. */
  ms: number;
  assincrono?: boolean;
}

export interface ParSim {
  de: string;
  para: string;
  assincrono: boolean;
}

export interface Simulacao {
  passos: PassoSim[];
  pares: ParSim[];
  /** soma dos passos síncronos (a latência que o usuário sente). */
  totalMs: number;
  /** existe cache no read-store (habilita o toggle hit/miss). */
  temCache: boolean;
}

const CAMADAS_APP: CamadaId[] = ["ui", "api", "aplicacao", "dominio"];

const acha = (c: CamadaNoProjeto | undefined, ids: string[]) =>
  c?.tecnologias.find((t) => ids.includes(t));

const nomeTech = (id: string | undefined) =>
  id ? (tecnologiaDef(id)?.nome ?? id) : undefined;

/**
 * Monta o caminho de uma requisição pela arquitetura do usuário — com
 * narração e latências ilustrativas por salto. Função pura (testável).
 */
export function montarSimulacao(
  estado: EstadoProjeto,
  tipo: TipoRequisicao,
  cacheQuente: boolean
): Simulacao {
  const passos: PassoSim[] = [];
  const pares: ParSim[] = [];
  let anterior = "usuario";

  const temPadrao = (id: string) =>
    estado.camadas.some((c) => c.padroes.includes(id));
  const camada = (id: CamadaId) =>
    estado.camadas.find((c) => c.camadaId === id);

  const readL = camada("read-store");
  const writeL = camada("write-store");
  const infraL = camada("infra");
  const filaL = camada("fila");

  const cacheTech = acha(readL, ["redis", "memcached"]);
  const temCache = !!cacheTech;

  passos.push({
    no: "usuario",
    rotulo: "Usuário",
    detalhe:
      tipo === "leitura"
        ? "abre a tela — GET /produtos"
        : "confirma a ação — POST /pedidos",
    ms: 0,
  });

  const passo = (
    no: string,
    rotulo: string,
    detalhe: string,
    ms: number,
    assincrono = false
  ) => {
    passos.push({ no, rotulo, detalhe, ms, assincrono });
    pares.push({ de: anterior, para: no, assincrono });
    anterior = no;
  };

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
      passo(
        "aplicacao",
        def.nome,
        temPadrao("cqrs")
          ? tipo === "leitura"
            ? "CQRS: roteia para o lado de LEITURA — sem passar por regras de escrita (~1ms)"
            : "CQRS: roteia o comando para o lado de ESCRITA (~1ms)"
          : "caso de uso orquestra a operação (~2ms)",
        temPadrao("cqrs") ? 1 : 2
      );
    } else if (c.camadaId === "dominio") {
      // com CQRS, leitura não passa pelas regras de negócio
      if (tipo === "leitura" && temPadrao("cqrs")) continue;
      passo(
        "dominio",
        def.nome,
        tipo === "leitura"
          ? "regras conferem o que pode ser exibido (~1ms)"
          : "invariantes de negócio validam o comando (~1ms)",
        1
      );
    }
  }

  // ——— dados ———
  const bancoEm = (l?: CamadaNoProjeto) => acha(l, ["postgres", "mongodb"]);

  if (tipo === "leitura") {
    const elastic = acha(readL, ["elasticsearch"]);
    const bancoRead = bancoEm(readL);
    const bancoFundo = bancoEm(writeL) ?? bancoEm(infraL);
    const noBancoFundo = bancoEm(writeL) ? "write-store" : "infra";

    if (readL && cacheTech) {
      if (cacheQuente) {
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
        if (bancoFundo) {
          passo(
            noBancoFundo,
            "Banco",
            `${nomeTech(bancoFundo)} resolve a consulta (~10ms)`,
            10
          );
          passo(
            "read-store",
            "Cache",
            `resultado gravado no ${nomeTech(cacheTech)} — a próxima leitura vira HIT (~0.5ms)`,
            0.5
          );
        } else {
          passo(
            "read-store",
            "Leitura",
            "não há banco durável por trás do cache — nada para consultar no miss (veja os alertas)",
            0
          );
        }
      }
    } else if (readL && (elastic || bancoRead)) {
      passo(
        "read-store",
        "Leitura",
        elastic
          ? `${nomeTech(elastic)} consulta o índice com relevância/facetas (~15ms)`
          : `${nomeTech(bancoRead)} lê o read model desnormalizado (~8ms)`,
        elastic ? 15 : 8
      );
    } else if (bancoFundo) {
      passo(
        noBancoFundo,
        "Banco",
        `${nomeTech(bancoFundo)} resolve a consulta (~10ms)`,
        10
      );
    } else if (estado.camadas.length > 0) {
      passo(
        writeL ? "write-store" : infraL ? "infra" : anterior,
        "Dados",
        "nenhuma tecnologia de dados no projeto — a consulta não tem onde parar",
        0
      );
    }
  } else {
    // escrita
    const bancoW = bancoEm(writeL) ?? bancoEm(infraL);
    const noBanco = bancoEm(writeL) ? "write-store" : "infra";
    const esCamada = estado.camadas.find((c) =>
      c.padroes.includes("event-sourcing")
    );
    if (writeL || infraL) {
      passo(
        writeL ? "write-store" : "infra",
        "Escrita",
        esCamada
          ? `grava o EVENTO no log${bancoW ? ` (${nomeTech(bancoW)} append-only)` : ""} — o histórico é a verdade (~12ms)`
          : bancoW
            ? `${nomeTech(bancoW)} grava com transação ACID (~12ms)`
            : "persiste a mudança (nenhum banco concreto definido — veja a paleta) (~10ms)",
        bancoW ? 12 : 10
      );
      if (bancoEm(writeL) && writeL !== camada(noBanco as CamadaId)) {
        // no-op: banco já narrado acima
      }
    }
    // eventos assíncronos após a resposta
    if (filaL) {
      const broker = acha(filaL, ["kafka", "rabbitmq"]);
      passo(
        "fila",
        "Evento",
        broker
          ? `${nomeTech(broker)}: evento publicado — a resposta NÃO espera por isso`
          : "evento publicado na fila (sem broker concreto — arraste Kafka ou RabbitMQ)",
        5,
        true
      );
      if (readL) {
        passo(
          "read-store",
          "Projeção",
          `read model atualizado a partir do evento — consistência eventual${cacheTech ? ` (${nomeTech(cacheTech)} aquecido)` : ""}`,
          8,
          true
        );
      }
    }
  }

  const totalMs = passos
    .filter((p) => !p.assincrono)
    .reduce((acc, p) => acc + p.ms, 0);

  passos.push({
    no: "usuario",
    rotulo: "Resposta",
    detalhe: `o usuário recebe em ~${totalMs.toFixed(1).replace(".0", "")}ms${
      passos.some((p) => p.assincrono)
        ? " — os passos assíncronos continuam em segundo plano"
        : ""
    }`,
    ms: 0,
  });

  return { passos, pares, totalMs, temCache };
}
