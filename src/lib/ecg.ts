/**
 * ecg.js - Mathematical synthesis of the ECG waveform (P-Q-R-S-T waves).
 *
 * Instead of replaying a recording, we generate the signal analytically.
 * Each wave is a Gaussian "bell" placed at a given phase of the cardiac
 * cycle (0..1). Summing the five bells yields the characteristic shape of
 * cardiac depolarization. Heart rate (HR) drives the cycle length - the
 * higher the HR, the shorter one cycle lasts, so the waves "compress" on
 * the cardiomonitor screen.
 *
 * The baseline drift (respiratory wander) is modulated with a sine - in
 * line with the idea of combining trigonometric functions.
 */

// A single wave as a Gaussian curve: amplitude * exp(-((t-center)^2)/(2*width^2))
function gaussian(t: number, center: number, amplitude: number, width: number) {
  const d = t - center
  return amplitude * Math.exp(-(d * d) / (2 * width * width))
}

// Wave definitions in normalized cycle phase (0..1).
// center - position within the cycle, amp - height (arbitrary mV), width.
const WAVES = [
  { center: 0.18, amplitude: 0.12, width: 0.028 }, // P
  { center: 0.37, amplitude: -0.15, width: 0.008 }, // Q
  { center: 0.4, amplitude: 1.0, width: 0.0095 }, // R (dominant)
  { center: 0.43, amplitude: -0.28, width: 0.009 }, // S
  { center: 0.66, amplitude: 0.32, width: 0.04 }, // T
]

/**
 * ECG signal value for a given cycle phase (0..1).
 * @param {number} phase - phase within one heartbeat
 * @param {number} respPhase - respiratory phase (0..2π) for baseline drift
 */
export function ecgSample(phase: number, respPhase = 0) {
  let v = 0
  for (const w of WAVES) {
    v += gaussian(phase, w.center, w.amplitude, w.width)
  }
  // Baseline drift caused by breathing - trigonometric modulation.
  v += Math.sin(respPhase) * 0.04
  return v
}

/**
 * SpO2 plethysmograph waveform (pulse wave on the oximeter).
 * Built from two sine harmonics - a fast systolic upstroke and a slower
 * dicrotic wave. Amplitude weakens at low saturation.
 * @param {number} phase - cycle phase (0..1)
 * @param {number} spo2 - saturation 0..100
 */
export function plethSample(phase: number, spo2 = 98) {
  const a = 2 * Math.PI * phase
  const primary = Math.max(0, Math.sin(a)) ** 1.6
  const dicrotic = 0.25 * Math.max(0, Math.sin(a - 0.9)) ** 2
  const perfusion = 0.4 + 0.6 * Math.min(1, Math.max(0, (spo2 - 70) / 30))
  return (primary + dicrotic) * perfusion
}

/**
 * How many seconds one cardiac cycle lasts for a given heart rate.
 * HR [beats/min] -> period [s]. This is what "compresses" the curve at HR 140.
 */
export function beatPeriod(hr: number) {
  return 60 / Math.max(1, hr)
}
