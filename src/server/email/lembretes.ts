import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/server/db";
import { users, userStats } from "@/server/db/schema";
import { deveLembrar } from "@/shared/lib/lembrete";
import { hojeDoUsuario } from "@/server/gamificacao/conceder-xp";
import { enviarEmail } from "@/server/email/resend";
import { SITE } from "@/shared/config/site";

/**
 * Lembrete diário de streak. Varre quem tem streak ativo e opt-in, decide com a
 * função pura `deveLembrar` (ciente do fuso de cada um) e envia. Banidos ficam
 * de fora. Chamado pelo cron `/api/cron/lembretes`.
 */

function corpo(nome: string | null, streak: number): string {
  const ola = nome ? `Oi, ${nome}!` : "Oi!";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2>${ola}</h2>
      <p>Seu streak está em <strong>${streak} ${streak === 1 ? "dia" : "dias"}</strong>.
      Faça uma atividade rapidinha hoje pra não perdê-lo.</p>
      <p><a href="${SITE.url}/quiz">Responder um quiz →</a></p>
      <p style="color:#888;font-size:12px">Você recebe isto porque ativou lembretes.
      Dá pra desligar no seu perfil, em Configurações.</p>
    </div>`;
}

export interface ResultadoLembretes {
  candidatos: number;
  enviados: number;
}

export async function enviarLembretesDeStreak(): Promise<ResultadoLembretes> {
  const linhas = await db
    .select({
      email: users.email,
      nome: users.name,
      tz: users.timezone,
      lembretesEmail: users.lembretesEmail,
      streakDias: userStats.streakDias,
      ultimoDiaAtivo: userStats.ultimoDiaAtivo,
    })
    .from(userStats)
    .innerJoin(users, eq(users.id, userStats.userId))
    .where(
      and(
        eq(users.lembretesEmail, true),
        eq(users.banido, false),
        isNotNull(userStats.ultimoDiaAtivo)
      )
    );

  const alvos = linhas.filter((l) =>
    deveLembrar({
      ultimoDiaAtivo: l.ultimoDiaAtivo,
      hoje: hojeDoUsuario(l.tz),
      streakDias: l.streakDias,
      lembretesEmail: l.lembretesEmail,
    })
  );

  let enviados = 0;
  for (const l of alvos) {
    const ok = await enviarEmail({
      to: l.email,
      subject: `Seu streak de ${l.streakDias} ${l.streakDias === 1 ? "dia" : "dias"} te espera`,
      html: corpo(l.nome, l.streakDias),
    });
    if (ok) enviados++;
  }

  return { candidatos: alvos.length, enviados };
}
