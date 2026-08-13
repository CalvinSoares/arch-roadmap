import { NextResponse } from "next/server";
import { enviarLembretesDeStreak } from "@/server/email/lembretes";

/**
 * Cron diário — lembretes de streak (Resend). Mesma proteção do cron de
 * temporada: `Authorization: Bearer <CRON_SECRET>`, fail-closed sem o segredo.
 * Sem `RESEND_API_KEY`, o envio é no-op (o helper degrada), então roda sem
 * quebrar mesmo antes de o e-mail estar provisionado.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!segredo || auth !== `Bearer ${segredo}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const resultado = await enviarLembretesDeStreak();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (erro) {
    console.error("[cron] falha nos lembretes:", erro);
    return NextResponse.json({ ok: false, erro: "falha" }, { status: 500 });
  }
}
