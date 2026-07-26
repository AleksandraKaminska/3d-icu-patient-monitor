/**
 * ecg.ts - Analytic synthesis of a lead-II ECG.
 *
 * Each beat is a sum of waves (P, Q, R, S, T) placed at fixed times *in
 * seconds* from the beat onset. The QRS keeps a roughly constant width while
 * the isoelectric diastole (TP segment) stretches or shrinks with heart rate,
 * just like a real ECG. The QT interval scales with the RR interval (Bazett).
 *
 * Waves are described as data, so other rhythms can be added later by swapping
 * the template and the RR (beat-scheduling) rule.
 */

type Wave = {
  center: number // seconds from beat onset
  amp: number // relative amplitude (R = 1.0)
  wLeft: number // gaussian sigma before the center
  wRight: number // gaussian sigma after the center (asymmetry)
}

// Asymmetric Gaussian bell - different spread on each side of the center.
function bell(t: number, w: Wave): number {
  const sigma = t < w.center ? w.wLeft : w.wRight
  const d = t - w.center
  return w.amp * Math.exp(-(d * d) / (2 * sigma * sigma))
}

export type Rhythm = 'sinus' | 'af' | 'vt'

const P_WAVE: Wave = { center: 0.1, amp: 0.15, wLeft: 0.021, wRight: 0.021 }
// Narrow QRS (lead II): Q, dominant R, S.
const QRS: Wave[] = [
  { center: 0.2, amp: -0.1, wLeft: 0.008, wRight: 0.008 },
  { center: 0.215, amp: 1.0, wLeft: 0.009, wRight: 0.009 },
  { center: 0.245, amp: -0.24, wLeft: 0.01, wRight: 0.012 },
]

function qrsComplex(tBeat: number): number {
  let v = 0
  for (const w of QRS) v += bell(tBeat, w)
  return v
}

// T wave: QT scales with rate (Bazett, QTc ~0.40 s). Asymmetric - gradual
// upstroke, steeper downstroke.
function tWave(tBeat: number, rr: number, amp = 0.22): number {
  const qt = 0.4 * Math.sqrt(rr)
  const tw = 0.05 + qt * 0.04
  return bell(tBeat, { center: 0.215 + qt * 0.5, amp, wLeft: tw * 1.4, wRight: tw * 0.9 })
}

// Atrial fibrillation: no P, fine irregular fibrillatory (f) waves on the
// baseline (~300-500/min). Driven by absolute time so it never repeats.
function fibBaseline(tAbs: number): number {
  return (
    (Math.sin(tAbs * 2 * Math.PI * 6) * 0.5 +
      Math.sin(tAbs * 2 * Math.PI * 9.5 + 1.1) * 0.35 +
      Math.sin(tAbs * 2 * Math.PI * 4.5 + 2.3) * 0.4) *
    0.035
  )
}

// Ventricular tachycardia: a single wide, monomorphic complex (no P) with a
// discordant T; at fast rates the complexes fuse into the sine-wave VT look.
function vtComplex(tBeat: number): number {
  return (
    bell(tBeat, { center: 0.15, amp: 1.0, wLeft: 0.05, wRight: 0.055 }) +
    bell(tBeat, { center: 0.31, amp: -0.4, wLeft: 0.06, wRight: 0.06 })
  )
}

/**
 * ECG amplitude at `tBeat` seconds into a beat of period `rr` seconds.
 * @param rhythm - sinus | af | vt
 * @param tBeat - seconds since the current beat onset (0..rr)
 * @param rr - beat period in seconds (= 60 / HR)
 * @param respPhase - respiratory phase (0..2π) for baseline wander
 * @param tAbs - absolute elapsed seconds (for AF fibrillatory waves)
 */
export function ecgSample(
  rhythm: Rhythm,
  tBeat: number,
  rr: number,
  respPhase = 0,
  tAbs = 0,
): number {
  if (rhythm === 'vt') return vtComplex(tBeat) + Math.sin(respPhase) * 0.02

  let v = qrsComplex(tBeat) + tWave(tBeat, rr)
  if (rhythm === 'af') v += fibBaseline(tAbs)
  else v += bell(tBeat, P_WAVE) // sinus P wave
  v += Math.sin(respPhase) * 0.03
  return v
}

// Next beat interval (seconds) for a rhythm. AF is irregularly irregular.
export function nextRR(rhythm: Rhythm, hr: number): number {
  const base = beatPeriod(hr)
  if (rhythm === 'af') return base * (0.55 + Math.random() * 1.05)
  return base
}

/**
 * SpO2 plethysmograph waveform (pulse wave on the oximeter).
 * Two sine harmonics - a fast systolic upstroke and a slower dicrotic wave.
 * Amplitude weakens at low saturation.
 * @param phase - cycle phase (0..1)
 * @param spo2 - saturation 0..100
 */
export function plethSample(phase: number, spo2 = 98): number {
  const a = 2 * Math.PI * phase
  const primary = Math.max(0, Math.sin(a)) ** 1.6
  const dicrotic = 0.25 * Math.max(0, Math.sin(a - 0.9)) ** 2
  const perfusion = 0.4 + 0.6 * Math.min(1, Math.max(0, (spo2 - 70) / 30))
  return (primary + dicrotic) * perfusion
}

/**
 * Capnography waveform (EtCO₂ vs. time). CO₂ is ~0 during inspiration, then on
 * expiration rises (phase II) to an alveolar plateau (phase III) whose height
 * tracks the EtCO₂ value, before dropping sharply at the next inspiration.
 * @param respPhase - respiratory phase (0..2π); expiration starts at π
 * @param etco2 - end-tidal CO₂ (mmHg)
 */
export function capnoSample(respPhase: number, etco2 = 40): number {
  // q: 0 at the start of expiration, wrapping 0..1 over the breath cycle.
  const q =
    ((((respPhase - Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI)
  let s: number
  if (q < 0.04)
    s = 0 // phase I - dead-space baseline
  else if (q < 0.12)
    s = ((q - 0.04) / 0.08) * 0.9 // phase II - rapid upstroke
  else if (q < 0.48)
    s = 0.9 + ((q - 0.12) / 0.36) * 0.1 // phase III - plateau
  else if (q < 0.52)
    s = 1 - (q - 0.48) / 0.04 // rapid downstroke (inspiration)
  else s = 0 // inspiration
  return s * (etco2 / 50)
}

// Beat period in seconds for a given heart rate.
export function beatPeriod(hr: number): number {
  return 60 / Math.max(1, hr)
}
