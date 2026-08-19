/**
 * Feedback sonoro leve da jornada via Web Audio API (sem arquivos).
 * Mute persiste em localStorage; reduced-motion encurta o acorde de conclusão.
 */

const CHAVE_MUTE = "DevMappa:jornada-som-mudo";

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function somMudo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHAVE_MUTE) === "1";
  } catch {
    return false;
  }
}

export function definirSomMudo(mudo: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE_MUTE, mudo ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function bip(
  freq: number,
  duracaoMs: number,
  tipo: OscillatorType,
  ganho = 0.04,
  atrasoMs = 0
) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + atrasoMs / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(ganho, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duracaoMs / 1000);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duracaoMs / 1000 + 0.02);
}

export type EventoSomJornada = "acerto" | "erro" | "conclusao";

/** Toca feedback. No-op se mudo ou sem AudioContext. */
export function tocarSomJornada(
  evento: EventoSomJornada,
  opts?: { reduzir?: boolean }
) {
  if (somMudo()) return;
  const reduzir = !!opts?.reduzir;
  if (evento === "acerto") {
    bip(880, reduzir ? 70 : 90, "sine", 0.035);
    return;
  }
  if (evento === "erro") {
    bip(220, reduzir ? 90 : 120, "triangle", 0.03);
    return;
  }
  // conclusão
  if (reduzir) {
    bip(660, 100, "sine", 0.04);
    return;
  }
  bip(523.25, 90, "sine", 0.035, 0);
  bip(659.25, 90, "sine", 0.035, 90);
  bip(783.99, 140, "sine", 0.04, 180);
}
