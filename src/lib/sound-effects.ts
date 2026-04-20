/**
 * Lightweight WebAudio click/feedback sounds.
 * Respects the "sound" preference in localStorage.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const enabled = localStorage.getItem("sound") !== "false";
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(freq: number, duration = 0.08, type: OscillatorType = "sine", volume = 0.05) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export const sounds = {
  click: () => tone(800, 0.05, "sine", 0.04),
  success: () => {
    tone(660, 0.08, "sine", 0.05);
    setTimeout(() => tone(880, 0.12, "sine", 0.05), 80);
  },
  error: () => tone(220, 0.18, "sawtooth", 0.05),
  page: () => tone(540, 0.06, "triangle", 0.04),
};
