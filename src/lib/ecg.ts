/**
 * ecg.ts - Analytic synthesis of the monitored waveforms.
 *
 * ECG beats sum Gaussian waves placed at real millisecond offsets, so the QRS
 * keeps a constant width while diastole scales with heart rate. Each rhythm is
 * a strategy in the RHYTHMS registry (morphology + beat timing + perfusion).
 */

export type Rhythm = 'sinus' | 'af' | 'aflutter' | 'vt' | 'vf' | 'asystole' | 'pvc' | 'stemi'

// State handed to a rhythm's waveform for a single sample.
export type BeatCtx = {
  tBeat: number // seconds since the current beat onset
  rr: number // beat period (s)
  respPhase: number // respiratory phase (0..2π)
  tAbs: number // absolute elapsed seconds
  ectopic: boolean // current beat is a premature ventricular contraction
}

type Wave = { center: number; amp: number; wLeft: number; wRight: number }

// Asymmetric Gaussian bell.
function bell(t: number, w: Wave): number {
  const sigma = t < w.center ? w.wLeft : w.wRight
  const d = t - w.center
  return w.amp * Math.exp(-(d * d) / (2 * sigma * sigma))
}

// Beat period (s) for a heart rate.
export function beatPeriod(hr: number): number {
  return 60 / Math.max(1, hr)
}

// --- ECG wave primitives ---------------------------------------------------

const P_WAVE: Wave = { center: 0.1, amp: 0.15, wLeft: 0.021, wRight: 0.021 }
const QRS: Wave[] = [
  { center: 0.2, amp: -0.1, wLeft: 0.008, wRight: 0.008 },
  { center: 0.215, amp: 1.0, wLeft: 0.009, wRight: 0.009 },
  { center: 0.245, amp: -0.24, wLeft: 0.01, wRight: 0.012 },
]

const pWave = (t: number) => bell(t, P_WAVE)

function qrs(t: number): number {
  let v = 0
  for (const w of QRS) v += bell(t, w)
  return v
}

// T wave: QT scales with rate (Bazett); asymmetric (gradual up, steep down).
function tWave(t: number, rr: number): number {
  const qt = 0.4 * Math.sqrt(rr)
  const tw = 0.05 + qt * 0.04
  return bell(t, { center: 0.215 + qt * 0.5, amp: 0.22, wLeft: tw * 1.4, wRight: tw * 0.9 })
}

const respWander = (respPhase: number, amp = 0.03) => Math.sin(respPhase) * amp

// AF fibrillatory (f) waves - fine, ~300-500/min, never repeating.
const fibWaves = (t: number) =>
  (Math.sin(t * 2 * Math.PI * 6) * 0.5 +
    Math.sin(t * 2 * Math.PI * 9.5 + 1.1) * 0.35 +
    Math.sin(t * 2 * Math.PI * 4.5 + 2.3) * 0.4) *
  0.035

// Atrial-flutter sawtooth (F) waves - ~300/min.
const flutterWaves = (t: number) => (((t * 5) % 1) - 0.5) * 0.3

// Wide, monomorphic ventricular complex with a discordant T.
const vtComplex = (t: number) =>
  bell(t, { center: 0.15, amp: 1.0, wLeft: 0.05, wRight: 0.055 }) +
  bell(t, { center: 0.31, amp: -0.4, wLeft: 0.06, wRight: 0.06 })

// Chaotic ventricular fibrillation.
const vfWaves = (t: number) =>
  (Math.sin(t * 2 * Math.PI * 4.5) +
    0.7 * Math.sin(t * 2 * Math.PI * 7.3 + 1) +
    0.55 * Math.sin(t * 2 * Math.PI * 10.1 + 2) +
    0.6 * Math.sin(t * 2 * Math.PI * 3.1 + 0.5)) *
  0.28

// ST-segment elevation from the J point to the T wave (STEMI tombstone).
function stElevation(t: number, rr: number): number {
  const tPeak = 0.215 + 0.4 * Math.sqrt(rr) * 0.5
  if (t < 0.25 || t > tPeak) return 0
  return 0.2 * Math.min(1, (t - 0.25) / 0.02)
}

const sinusBeat = (c: BeatCtx) =>
  qrs(c.tBeat) + tWave(c.tBeat, c.rr) + pWave(c.tBeat) + respWander(c.respPhase)

// --- Rhythm registry (strategy per rhythm) ---------------------------------

export type RhythmDef = {
  label: string
  perfusing: boolean // produces a pulse (drives the pleth)
  restingHr?: number // HR applied when selected (undefined = keep current)
  rr: (hr: number) => number // next beat interval, seconds
  wave: (c: BeatCtx) => number
}

export const RHYTHMS: Record<Rhythm, RhythmDef> = {
  sinus: { label: 'Sinus', perfusing: true, rr: beatPeriod, wave: sinusBeat },
  af: {
    label: 'Atrial fibrillation',
    perfusing: true,
    restingHr: 130,
    rr: (hr) => beatPeriod(hr) * (0.55 + Math.random() * 1.05),
    wave: (c) => qrs(c.tBeat) + tWave(c.tBeat, c.rr) + fibWaves(c.tAbs) + respWander(c.respPhase),
  },
  aflutter: {
    label: 'Atrial flutter',
    perfusing: true,
    restingHr: 150,
    rr: beatPeriod,
    wave: (c) =>
      qrs(c.tBeat) + tWave(c.tBeat, c.rr) + flutterWaves(c.tAbs) + respWander(c.respPhase),
  },
  pvc: {
    label: 'PVCs (ectopic beats)',
    perfusing: true,
    restingHr: 75,
    rr: beatPeriod,
    wave: (c) => (c.ectopic ? vtComplex(c.tBeat) : sinusBeat(c)),
  },
  vt: {
    label: 'Ventricular tachycardia',
    perfusing: true,
    restingHr: 180,
    rr: beatPeriod,
    wave: (c) => vtComplex(c.tBeat) + respWander(c.respPhase, 0.02),
  },
  vf: {
    label: 'Ventricular fibrillation',
    perfusing: false,
    rr: () => 1,
    wave: (c) => vfWaves(c.tAbs) + respWander(c.respPhase, 0.02),
  },
  asystole: {
    label: 'Asystole',
    perfusing: false,
    rr: () => 1,
    wave: (c) => Math.sin(c.tAbs * 0.6) * 0.01 + respWander(c.respPhase, 0.02),
  },
  stemi: {
    label: 'STEMI (ST elevation)',
    perfusing: true,
    restingHr: 90,
    rr: beatPeriod,
    wave: (c) => sinusBeat(c) + stElevation(c.tBeat, c.rr),
  },
}

// --- Other synthesized signals ---------------------------------------------

// SpO2 plethysmograph: two sine harmonics; amplitude weakens at low saturation.
export function plethSample(phase: number, spo2 = 98): number {
  const a = 2 * Math.PI * phase
  const primary = Math.max(0, Math.sin(a)) ** 1.6
  const dicrotic = 0.25 * Math.max(0, Math.sin(a - 0.9)) ** 2
  const perfusion = 0.4 + 0.6 * Math.min(1, Math.max(0, (spo2 - 70) / 30))
  return (primary + dicrotic) * perfusion
}

// Capnography: ~0 on inspiration, phase II upstroke to a phase III plateau
// scaled by EtCO₂, then a sharp drop at the next inspiration.
export function capnoSample(respPhase: number, etco2 = 40): number {
  const q =
    ((((respPhase - Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI)
  let s: number
  if (q < 0.04) s = 0
  else if (q < 0.12) s = ((q - 0.04) / 0.08) * 0.9
  else if (q < 0.48) s = 0.9 + ((q - 0.12) / 0.36) * 0.1
  else if (q < 0.52) s = 1 - (q - 0.48) / 0.04
  else s = 0
  return s * (etco2 / 50)
}
