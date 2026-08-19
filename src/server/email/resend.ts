/**
 * Envio de e-mail via API REST do Resend (sem SDK, só `fetch`).
 *
 * Degrada gracioso: sem `RESEND_API_KEY`, não envia nada e avisa uma vez no log.
 * Assim o código compila e roda em dev/CI sem tocar em e-mail de verdade, e
 * passa a enviar quando a chave estiver no ambiente.
 */

const API = "https://api.resend.com/emails";

let avisou = false;
function avisarUmaVez() {
  if (avisou) return;
  avisou = true;
  console.warn("[email] RESEND_API_KEY ausente — e-mails em no-op.");
}

export interface Email {
  to: string;
  subject: string;
  html: string;
}

/** Envia um e-mail. Retorna `true` se foi aceito pelo Resend. */
export async function enviarEmail(email: Email): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    avisarUmaVez();
    return false;
  }

  const from = process.env.EMAIL_FROM ?? "DevMappa <onboarding@resend.dev>";
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...email }),
    });
    if (!res.ok) {
      console.error("[email] Resend recusou:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[email] falha ao enviar:", erro);
    return false;
  }
}
