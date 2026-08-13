import type { Desafio } from "@/shared/types/desafio";
import { lacuna, mcq, vf } from "./_helpers";

export const CHECKPOINTS_RESILIENCIA: Record<string, Desafio[]> = {
  "resiliencia:res-orcamento": [
    vf(
      "resiliencia:res-orcamento:vf1",
      "Se o pedido do usuário tem 2s de prazo e você chama três dependências com timeout 2s cada, pode estourar o orçamento mesmo 'com timeout em tudo'.",
      true,
      "O prazo é do pedido inteiro. Cada hop consome o que sobra — não um timeout fixo somado."
    ),
    mcq(
      "resiliencia:res-orcamento:mcq1",
      "Pedido com deadline em T+800ms. Já gastou 500ms. A próxima chamada deveria herdar cerca de:",
      "300",
      [
        { id: "300", label: "300ms (o que ainda cabe)" },
        { id: "800", label: "800ms de novo, do zero" },
        { id: "inf", label: "Sem timeout — já estamos atrasados mesmo" },
        { id: "zero", label: "0ms e falhar sempre, sem tentar" },
      ],
      "Orçamento restante = deadline − agora. Propagar deadline evita soma de timeouts."
    ),
  ],

  "resiliencia:res-degradar": [
    vf(
      "resiliencia:res-degradar:vf1",
      "Degradação graciosa: sob falha, entregar o essencial (ex.: feed sem recomendações) em vez de 500 na página inteira.",
      true,
      "Meia experiência > erro total. Corte o que for aprimoramento."
    ),
    mcq(
      "resiliencia:res-degradar:mcq1",
      "O serviço de recomendações caiu. O checkout deve:",
      "seguir",
      [
        {
          id: "seguir",
          label: "Seguir sem recomendações e deixar comprar",
        },
        {
          id: "500",
          label: "Devolver 500 em todo o site",
        },
        {
          id: "loop",
          label: "Ficar em retry infinito na home",
        },
        {
          id: "offline",
          label: "Desligar o banco principal também",
        },
      ],
      "Separe essencial de nice-to-have. Checkout não depende de carrossel."
    ),
  ],

  "resiliencia:res-atomico": [
    vf(
      "resiliencia:res-atomico:vf1",
      "`UPDATE ... WHERE versao = $esperada` (ou condição de negócio) evita lost update sem lock pessimista longo.",
      true,
      "A condição na escrita faz o banco recusar se outro já mudou — otimista e atômico."
    ),
    lacuna(
      "resiliencia:res-atomico:lac1",
      "Num update condicional típico anti lost-update, a cláusula que protege é o ",
      " com a versão/estado esperado.",
      "WHERE",
      ["WHERE", "GROUP BY", "DROP", "VACUUM"],
      "WHERE na escrita = 'só mude se ainda estiver como eu li'."
    ),
  ],

  "resiliencia:res-fila": [
    vf(
      "resiliencia:res-fila:vf1",
      "Fila como amortecedor: o produtor enfileira no pico e o worker consome no ritmo que aguenta — alivia a ponta síncrona.",
      true,
      "Você troca latência imediata por trabalho diferido. Picos deixam de derrubar o serviço síncrono."
    ),
    mcq(
      "resiliencia:res-fila:mcq1",
      "Pico de uploads. Em vez de processar thumbnail na request HTTP, o padrão resiliente é:",
      "fila",
      [
        {
          id: "fila",
          label: "Aceitar o upload, enfileirar o processamento, responder rápido",
        },
        {
          id: "sync",
          label: "Processar tudo síncrono e deixar o cliente esperar minutos",
        },
        {
          id: "drop",
          label: "Descartar uploads acima de 10 por segundo sem fila",
        },
        {
          id: "reboot",
          label: "Reiniciar o servidor a cada pico",
        },
      ],
      "Amortecer = desacoplar chegada de processamento."
    ),
  ],
};
