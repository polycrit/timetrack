let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  ctx: AudioContext,
  type: OscillatorType = "square",
  volume = 0.12,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Cheerful ascending 3-note chime — work session complete */
export function playWorkComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(523, t, 0.15, ctx);        // C5
  playTone(659, t + 0.15, 0.15, ctx); // E5
  playTone(784, t + 0.30, 0.25, ctx); // G5
}

/** Gentle 2-note attention tone — break over */
export function playBreakOver() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(440, t, 0.18, ctx, "triangle", 0.1);       // A4
  playTone(554, t + 0.2, 0.22, ctx, "triangle", 0.1); // C#5
}

/** Quick descending 2-note blip — work started */
export function playWorkStart() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(784, t, 0.08, ctx, "square", 0.09);        // G5
  playTone(523, t + 0.09, 0.12, ctx, "square", 0.09); // C5
}

/** Celebratory 4-note ascending arpeggio — countdown complete */
export function playCountdownComplete() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(523, t, 0.12, ctx);          // C5
  playTone(659, t + 0.12, 0.12, ctx);   // E5
  playTone(784, t + 0.24, 0.12, ctx);   // G5
  playTone(1047, t + 0.36, 0.3, ctx);   // C6
}

/** Single soft confirmation beep — timer stopped */
export function playTimerStop() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(660, t, 0.12, ctx, "sine", 0.08);
}

/** Soft descending tone — paused */
export function playPause() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(520, t, 0.08, ctx, "sine", 0.07);
  playTone(440, t + 0.08, 0.12, ctx, "sine", 0.07);
}

/** Soft ascending tone — resumed */
export function playResume() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(440, t, 0.08, ctx, "sine", 0.07);
  playTone(520, t + 0.08, 0.12, ctx, "sine", 0.07);
}
