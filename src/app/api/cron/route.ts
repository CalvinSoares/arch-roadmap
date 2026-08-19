import { NextResponse } from "next/server";
import { virarTemporada } from "@/server/gamificacao/temporada";

/**
 * Cron da plataforma: virada semanal de temporada/liga.
 *
 * Protegido por `CRON_SECRET`: o Vercel Cron envia `Authorization: Bearer
 * <CRON_SECRET>` quando a env está definida. Sem o segredo configurado, a rota
 * recusa tudo (fail-closed); um endpoint que promove/rebaixa gente não pode
 * ficar aberto. Roda no Node (toca o banco), nunca no edge.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!segredo || auth !== `Bearer ${segredo}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const resultado = await virarTemporada();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (erro) {
    console.error("[cron] falha na virada de temporada:", erro);
    return NextResponse.json(
      { ok: false, erro: "falha na virada" },
      { status: 500 }
    );
  }
}
